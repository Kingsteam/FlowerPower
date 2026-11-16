// Panel „Bewässerung“: Plan-Editor für den Bewässerungsplaner.
//
// Zeichnet den Garten in Metern über einem Luftbild, einem eigenen Bild
// oder einem Raster. Gespeichert werden nur Hintergrund und Geometrie
// (WebSocket `irrigation_planner/plan/save`); alles andere wird weiter in
// den Einstellungen der Integration eingerichtet. Das Panel öffnet nie
// selbst ein Ventil: „Jetzt gießen“ ruft den Dienst `run_zone` auf, der
// nur in die Warteschlange einreiht.

import { LitElement, html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import {
  type Point,
  centroid,
  compass,
  distance,
  metersPerPixel,
  planToLatLon,
  polar,
  polygonArea,
  sectorArea,
  sectorPath,
  tilesFor,
  zoomForScale,
} from "./geometry";
import { styles } from "./styles";
import type {
  Garden,
  Hass,
  PlanData,
  PlanSensor,
  PlanValve,
  PlanZone,
  Status,
} from "./types";

const DOMAIN = "irrigation_planner";
const COLORS = [
  "#2e7d32", "#1565c0", "#ef6c00", "#6a1b9a", "#00838f",
  "#c62828", "#827717", "#4527a0", "#ad1457", "#37474f",
];
const SENSOR_LETTER: Record<string, string> = {
  soil_moisture: "B",
  rain_mm: "R",
  rain_binary: "R",
  water_meter: "W",
};
const SENSOR_LABEL: Record<string, string> = {
  soil_moisture: "Bodenfeuchte",
  rain_mm: "Regenmenge",
  rain_binary: "Regensensor",
  water_meter: "Wasserzähler",
};
const STATE_LABEL: Record<string, string> = {
  idle: "",
  running: "läuft",
  queued: "wartet",
  locked: "gesperrt",
};
const DEFAULT_IMAGE_MPP = 0.05;

type Tool = "select" | "sprinkler" | "bed" | "place" | "scale";
type Selection = { kind: "zone" | "valve" | "sensor"; id: string } | null;
type Drag =
  | { type: "pan"; sx: number; sy: number; cx: number; cy: number; moved: boolean }
  | { type: "new-sprinkler"; id: string }
  | { type: "move-zone"; id: string; start: Point; orig: PlanZone }
  | { type: "center" | "radius" | "start" | "end"; id: string }
  | { type: "vertex"; id: string; index: number }
  | { type: "marker"; kind: "valve" | "sensor"; id: string };

interface Editable {
  garden: Garden;
  zones: PlanZone[];
  valves: PlanValve[];
  sensors: PlanSensor[];
}

@customElement("irrigation-planner-panel")
export class IrrigationPlannerPanel extends LitElement {
  static styles = styles;

  @property({ type: Boolean, reflect: true }) narrow = false;

  @state() private plan?: PlanData;
  @state() private status?: Status;
  @state() private error = "";
  @state() private toast = "";
  @state() private tab: "zones" | "background" = "zones";
  @state() private tool: Tool = "select";
  @state() private toolTarget = "";
  @state() private selected: Selection = null;
  @state() private draft: Point[] = [];
  @state() private scaleDraft: Point[] = [];
  @state() private scaleInput = "";
  @state() private view = { cx: 0, cy: 0, scale: 25 };
  @state() private size = { w: 800, h: 600 };
  @state() private imageUrl = "";
  @state() private imageSize: [number, number] | null = null;
  @state() private saving = false;
  @state() private dirty = false;

  private _hass?: Hass;
  private savedJson = "";
  private history: string[] = [];
  private drag: Drag | null = null;
  private unsub?: () => void;
  private resizer?: ResizeObserver;
  private toastTimer?: number;
  private autoFit = true;

  // `hass` ändert sich bei jedem Zustandswechsel im Haus; das Panel braucht
  // davon nur die Verbindung und löst darum kein neues Zeichnen aus.
  set hass(hass: Hass) {
    const first = !this._hass;
    this._hass = hass;
    if (first) void this.load();
  }
  get hass(): Hass | undefined {
    return this._hass;
  }

  connectedCallback(): void {
    super.connectedCallback();
    window.addEventListener("keydown", this.onKey);
    if (this._hass && this.plan) void this.subscribe();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener("keydown", this.onKey);
    this.unsub?.();
    this.unsub = undefined;
    this.resizer?.disconnect();
  }

  protected firstUpdated(_changed: PropertyValues): void {
    this.resizer = new ResizeObserver(() => this.measure());
    this.resizer.observe(this);
  }

  protected updated(): void {
    const stage = this.renderRoot.querySelector(".stage");
    if (stage && !(stage as HTMLElement).dataset.observed) {
      (stage as HTMLElement).dataset.observed = "1";
      this.resizer?.observe(stage);
      this.measure();
    }
  }

  private measure(): void {
    const stage = this.renderRoot.querySelector(".stage") as HTMLElement | null;
    if (!stage) return;
    const { width, height } = stage.getBoundingClientRect();
    if (width && height && (width !== this.size.w || height !== this.size.h)) {
      this.size = { w: width, h: height };
      // Solange niemand verschoben oder gezoomt hat: neu einpassen.
      if (this.autoFit && this.plan) this.fitView();
    }
  }

  // Daten ----------------------------------------------------------------------

  private async load(): Promise<void> {
    try {
      const plan = await this._hass!.callWS<PlanData>({ type: `${DOMAIN}/plan/get` });
      this.setPlan(plan, true);
      await this.subscribe();
    } catch (err) {
      this.error = this.message(err);
    }
  }

  private async subscribe(): Promise<void> {
    if (this.unsub || !this._hass) return;
    this.unsub = await this._hass.connection.subscribeMessage<Status>(
      (status) => (this.status = status),
      { type: `${DOMAIN}/plan/subscribe` },
    );
  }

  private setPlan(plan: PlanData, fit: boolean): void {
    this.plan = plan;
    this.savedJson = JSON.stringify(this.editable());
    this.dirty = false;
    this.history = [];
    void this.loadImage();
    if (fit) this.fitView();
  }

  private editable(): Editable {
    const p = this.plan!;
    return { garden: p.garden, zones: p.zones, valves: p.valves, sensors: p.sensors };
  }

  /** Vor jeder Änderung: Stand merken (für „Rückgängig“). */
  private remember(): void {
    this.history.push(JSON.stringify(this.editable()));
    if (this.history.length > 100) this.history.shift();
  }

  private changed(): void {
    this.plan = { ...this.plan! };
    this.dirty = JSON.stringify(this.editable()) !== this.savedJson;
  }

  private undo(): void {
    const last = this.history.pop();
    if (!last) return;
    this.plan = { ...this.plan!, ...(JSON.parse(last) as Editable) };
    this.dirty = JSON.stringify(this.editable()) !== this.savedJson;
    void this.loadImage();
  }

  private discard(): void {
    if (!this.dirty) return;
    this.plan = { ...this.plan!, ...(JSON.parse(this.savedJson) as Editable) };
    this.history = [];
    this.dirty = false;
    this.cancelTool();
    void this.loadImage();
  }

  private async save(): Promise<void> {
    const plan = this.plan!;
    const garden = { ...plan.garden };
    if (garden.background === "map" && garden.latitude != null) {
      garden.map_zoom = Math.round(zoomForScale(garden.latitude, this.view.scale) * 100) / 100;
    }
    this.saving = true;
    try {
      const result = await this._hass!.callWS<PlanData>({
        type: `${DOMAIN}/plan/save`,
        garden,
        zones: plan.zones.map((z) => ({
          id: z.id,
          center: z.center,
          radius_m: z.radius_m,
          start_angle_deg: z.start_angle_deg,
          arc_deg: z.arc_deg,
          polygon: z.polygon,
        })),
        valves: plan.valves.map((v) => ({ id: v.id, position: v.position })),
        sensors: plan.sensors.map((s) => ({ id: s.id, position: s.position })),
      });
      this.setPlan(result, false);
      this.showToast("Plan gespeichert");
    } catch (err) {
      this.showToast(`Nicht gespeichert: ${this.message(err)}`, true);
    } finally {
      this.saving = false;
    }
  }

  private message(err: unknown): string {
    if (err && typeof err === "object" && "message" in err) return String(err.message);
    return String(err);
  }

  private showToast(text: string, isError = false): void {
    this.toast = (isError ? "⚠ " : "") + text;
    window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => (this.toast = ""), isError ? 8000 : 3000);
  }

  // Hintergrundbild ------------------------------------------------------------

  private loadedImage = "";

  private async loadImage(): Promise<void> {
    const name = this.plan?.garden.background_image;
    if (!name || name === this.loadedImage) return;
    try {
      const resp = await this._hass!.fetchWithAuth(`/api/${DOMAIN}/image/${name}`);
      if (!resp.ok) throw new Error(`Bild nicht gefunden (${resp.status})`);
      const url = URL.createObjectURL(await resp.blob());
      const img = new Image();
      img.src = url;
      await img.decode();
      if (this.imageUrl) URL.revokeObjectURL(this.imageUrl);
      this.imageUrl = url;
      this.imageSize = [img.naturalWidth, img.naturalHeight];
      this.loadedImage = name;
    } catch (err) {
      this.showToast(this.message(err), true);
    }
  }

  private async upload(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    try {
      const resp = await this._hass!.fetchWithAuth(`/api/${DOMAIN}/image`, {
        method: "POST",
        body: form,
      });
      const body = await resp.json();
      if (!resp.ok) throw new Error(body.message ?? resp.statusText);
      this.remember();
      Object.assign(this.plan!.garden, {
        background: "image",
        background_image: body.name,
        scale_points: null,
        scale_distance_m: null,
      });
      this.changed();
      await this.loadImage();
      this.fitView();
      this.startTool("scale");
      this.showToast("Bild geladen. Jetzt den Maßstab setzen.");
    } catch (err) {
      this.showToast(`Hochladen fehlgeschlagen: ${this.message(err)}`, true);
    }
  }

  /** Meter je Bildpunkt des hochgeladenen Bilds. */
  private imageMpp(): number {
    const g = this.plan!.garden;
    if (g.scale_points && g.scale_distance_m) {
      const px = distance(g.scale_points[0], g.scale_points[1]);
      if (px > 0) return g.scale_distance_m / px;
    }
    return DEFAULT_IMAGE_MPP;
  }

  // Ansicht --------------------------------------------------------------------

  private toScreen(p: Point): Point {
    const { cx, cy, scale } = this.view;
    return [(p[0] - cx) * scale + this.size.w / 2, (p[1] - cy) * scale + this.size.h / 2];
  }

  private toPlan(event: PointerEvent | WheelEvent | MouseEvent): Point {
    const svgEl = this.renderRoot.querySelector("svg.plan") as SVGSVGElement;
    const rect = svgEl.getBoundingClientRect();
    const { cx, cy, scale } = this.view;
    return [
      (event.clientX - rect.left - this.size.w / 2) / scale + cx,
      (event.clientY - rect.top - this.size.h / 2) / scale + cy,
    ];
  }

  private bounds(): [number, number, number, number] | null {
    const pts: Point[] = [];
    for (const z of this.plan?.zones ?? []) {
      if (z.type === "sprinkler" && z.center && z.radius_m) {
        pts.push([z.center[0] - z.radius_m, z.center[1] - z.radius_m]);
        pts.push([z.center[0] + z.radius_m, z.center[1] + z.radius_m]);
      }
      if (z.type !== "sprinkler") pts.push(...z.polygon);
    }
    for (const m of [...(this.plan?.valves ?? []), ...(this.plan?.sensors ?? [])]) {
      if (m.position) pts.push(m.position);
    }
    const g = this.plan?.garden;
    if (g?.background === "image" && this.imageSize) {
      const mpp = this.imageMpp();
      pts.push([0, 0], [this.imageSize[0] * mpp, this.imageSize[1] * mpp]);
    }
    if (!pts.length) return null;
    const xs = pts.map((p) => p[0]);
    const ys = pts.map((p) => p[1]);
    return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
  }

  private fitView(): void {
    const g = this.plan?.garden;
    const b = this.bounds();
    if (g?.background === "map" && g.latitude != null && !b) {
      const zoom = g.map_zoom ?? 19;
      this.view = { cx: 0, cy: 0, scale: 1 / metersPerPixel(g.latitude, zoom) };
      return;
    }
    if (!b) {
      this.view = { cx: 0, cy: 0, scale: 25 };
      return;
    }
    const [x0, y0, x1, y1] = b;
    const w = Math.max(x1 - x0, 4);
    const h = Math.max(y1 - y0, 4);
    const scale = Math.min(this.size.w / (w * 1.15), this.size.h / (h * 1.15), 200);
    this.view = { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, scale: Math.max(scale, 0.5) };
  }

  private zoomBy(factor: number, at?: Point, screen?: Point): void {
    this.autoFit = false;
    const { cx, cy, scale } = this.view;
    const next = Math.min(Math.max(scale * factor, 0.5), 400);
    if (!at || !screen) {
      this.view = { cx, cy, scale: next };
      return;
    }
    this.view = {
      cx: at[0] - (screen[0] - this.size.w / 2) / next,
      cy: at[1] - (screen[1] - this.size.h / 2) / next,
      scale: next,
    };
  }

  private onWheel = (event: WheelEvent): void => {
    event.preventDefault();
    const svgEl = event.currentTarget as SVGSVGElement;
    const rect = svgEl.getBoundingClientRect();
    const factor = Math.exp(-event.deltaY * (event.ctrlKey ? 0.01 : 0.0015));
    this.zoomBy(factor, this.toPlan(event), [event.clientX - rect.left, event.clientY - rect.top]);
  };

  // Werkzeuge ------------------------------------------------------------------

  private startTool(tool: Tool, target = ""): void {
    this.tool = tool;
    this.toolTarget = target;
    this.draft = [];
    this.scaleDraft = [];
    this.scaleInput = "";
    if (target && tool !== "place") this.selected = { kind: "zone", id: target };
  }

  private cancelTool(): void {
    this.startTool("select");
  }

  private onKey = (event: KeyboardEvent): void => {
    const target = event.composedPath()[0] as HTMLElement | undefined;
    if (target && ["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName)) return;
    if (event.key === "Escape") this.cancelTool();
    if (event.key === "Enter" && this.tool === "bed") this.finishBed();
    if ((event.ctrlKey || event.metaKey) && event.key === "z") {
      event.preventDefault();
      this.undo();
    }
    if (event.key === "Delete" && this.selected?.kind === "zone") {
      this.clearGeometry(this.selected.id);
    }
  };

  private zone(id: string): PlanZone {
    return this.plan!.zones.find((z) => z.id === id)!;
  }

  private finishBed(): void {
    if (this.draft.length < 3) {
      this.showToast("Ein Beet braucht mindestens 3 Punkte", true);
      return;
    }
    this.remember();
    this.zone(this.toolTarget).polygon = this.draft.map((p) => [round(p[0]), round(p[1])]);
    this.selected = { kind: "zone", id: this.toolTarget };
    this.changed();
    this.cancelTool();
  }

  private clearGeometry(id: string): void {
    const zone = this.zone(id);
    this.remember();
    zone.center = null;
    zone.radius_m = null;
    zone.polygon = [];
    this.changed();
  }

  private onPointerDown = (event: PointerEvent): void => {
    if (event.button !== 0) return;
    const svgEl = event.currentTarget as SVGSVGElement;
    const p = this.toPlan(event);
    if (this.tool === "sprinkler") {
      this.remember();
      const zone = this.zone(this.toolTarget);
      zone.center = [round(p[0]), round(p[1])];
      zone.radius_m = 0;
      this.drag = { type: "new-sprinkler", id: zone.id };
      svgEl.setPointerCapture(event.pointerId);
      this.changed();
      return;
    }
    if (this.tool === "bed") {
      if (this.draft.length >= 3 && distance(p, this.draft[0]) * this.view.scale < 12) {
        this.finishBed();
      } else {
        this.draft = [...this.draft, p];
      }
      return;
    }
    if (this.tool === "place") {
      const [kind, id] = this.toolTarget.split(":") as ["valve" | "sensor", string];
      this.remember();
      const item = this.marker(kind, id);
      item.position = [round(p[0]), round(p[1])];
      this.selected = { kind, id };
      this.changed();
      this.cancelTool();
      return;
    }
    if (this.tool === "scale") {
      const mpp = this.imageMpp();
      const next = [...this.scaleDraft, [p[0] / mpp, p[1] / mpp] as Point];
      this.scaleDraft = next.slice(-2);
      return;
    }
    this.drag = {
      type: "pan",
      sx: event.clientX,
      sy: event.clientY,
      cx: this.view.cx,
      cy: this.view.cy,
      moved: false,
    };
    svgEl.setPointerCapture(event.pointerId);
  };

  private startDrag(event: PointerEvent, drag: Drag): void {
    if (this.tool !== "select" || event.button !== 0) return;
    event.stopPropagation();
    const svgEl = this.renderRoot.querySelector("svg.plan") as SVGSVGElement;
    svgEl.setPointerCapture(event.pointerId);
    this.remember();
    this.drag = drag;
  }

  private onPointerMove = (event: PointerEvent): void => {
    const drag = this.drag;
    if (!drag) {
      if (this.tool === "bed" && this.draft.length) this.hover = this.toPlan(event);
      return;
    }
    const p = this.toPlan(event);
    if (drag.type === "pan") {
      const dx = event.clientX - drag.sx;
      const dy = event.clientY - drag.sy;
      if (Math.abs(dx) + Math.abs(dy) > 3) {
        drag.moved = true;
        this.autoFit = false;
      }
      this.view = {
        ...this.view,
        cx: drag.cx - dx / this.view.scale,
        cy: drag.cy - dy / this.view.scale,
      };
      return;
    }
    if (drag.type === "marker") {
      this.marker(drag.kind, drag.id).position = [round(p[0]), round(p[1])];
      this.changed();
      return;
    }
    const zone = this.zone(drag.id);
    switch (drag.type) {
      case "new-sprinkler":
      case "radius":
        zone.radius_m = round(Math.max(0.1, distance(zone.center!, p)));
        break;
      case "center":
        zone.center = [round(p[0]), round(p[1])];
        break;
      case "start": {
        const end = zone.start_angle_deg + zone.arc_deg;
        const start = snapAngle(compass(zone.center!, p));
        let arc = (((end - start) % 360) + 360) % 360;
        if (arc < 5) arc = 360;
        zone.start_angle_deg = start;
        zone.arc_deg = arc;
        break;
      }
      case "end": {
        const end = snapAngle(compass(zone.center!, p));
        let arc = (((end - zone.start_angle_deg) % 360) + 360) % 360;
        if (arc < 5) arc = 360;
        zone.arc_deg = arc;
        break;
      }
      case "vertex":
        zone.polygon[drag.index] = [round(p[0]), round(p[1])];
        break;
      case "move-zone": {
        const dx = p[0] - drag.start[0];
        const dy = p[1] - drag.start[1];
        if (zone.type === "sprinkler" && drag.orig.center) {
          zone.center = [round(drag.orig.center[0] + dx), round(drag.orig.center[1] + dy)];
        } else {
          zone.polygon = drag.orig.polygon.map((q) => [round(q[0] + dx), round(q[1] + dy)]);
        }
        break;
      }
    }
    this.changed();
  };

  @state() private hover: Point | null = null;

  private onPointerUp = (): void => {
    const drag = this.drag;
    this.drag = null;
    if (!drag) return;
    if (drag.type === "pan") {
      if (!drag.moved) this.selected = null;
      return;
    }
    if (drag.type === "new-sprinkler") {
      const zone = this.zone(drag.id);
      if (!zone.radius_m || zone.radius_m < 0.3) zone.radius_m = 3;
      if (!zone.arc_deg) zone.arc_deg = 360;
      this.selected = { kind: "zone", id: zone.id };
      this.cancelTool();
      this.changed();
    }
    // Nichts geändert? Dann auch keinen Rückgängig-Schritt behalten.
    if (this.history[this.history.length - 1] === JSON.stringify(this.editable())) {
      this.history.pop();
    }
  };

  private insertVertex(event: PointerEvent, zone: PlanZone, index: number): void {
    if (this.tool !== "select") return;
    event.stopPropagation();
    this.remember();
    const a = zone.polygon[index];
    const b = zone.polygon[(index + 1) % zone.polygon.length];
    zone.polygon.splice(index + 1, 0, [round((a[0] + b[0]) / 2), round((a[1] + b[1]) / 2)]);
    this.changed();
    const svgEl = this.renderRoot.querySelector("svg.plan") as SVGSVGElement;
    svgEl.setPointerCapture(event.pointerId);
    this.drag = { type: "vertex", id: zone.id, index: index + 1 };
  }

  private removeVertex(event: MouseEvent, zone: PlanZone, index: number): void {
    event.preventDefault();
    event.stopPropagation();
    if (zone.polygon.length <= 3) {
      this.showToast("Ein Beet braucht mindestens 3 Punkte", true);
      return;
    }
    this.remember();
    zone.polygon.splice(index, 1);
    this.changed();
  }

  private marker(kind: "valve" | "sensor", id: string): PlanValve | PlanSensor {
    const list = kind === "valve" ? this.plan!.valves : this.plan!.sensors;
    return list.find((m) => m.id === id)!;
  }

  // Hintergrund ----------------------------------------------------------------

  private setBackground(kind: Garden["background"]): void {
    const g = this.plan!.garden;
    if (g.background === kind) return;
    this.remember();
    g.background = kind;
    if (kind === "map") {
      if (g.latitude == null || g.longitude == null) {
        g.latitude = this.plan!.home.latitude;
        g.longitude = this.plan!.home.longitude;
      }
      g.map_provider ??= "basemap_at";
      g.map_zoom ??= 19;
      if (!this.bounds()) this.fitView();
    }
    this.changed();
  }

  private updateGarden(patch: Partial<Garden>): void {
    this.remember();
    Object.assign(this.plan!.garden, patch);
    this.changed();
  }

  /**
   * Kartenmitte auf die Mitte der Ansicht legen. Die Zeichnung wird
   * mitverschoben, damit sie auf dem Luftbild an derselben Stelle bleibt.
   */
  private recenterMap(): void {
    const g = this.plan!.garden;
    if (g.latitude == null || g.longitude == null) return;
    const { cx, cy } = this.view;
    this.remember();
    [g.latitude, g.longitude] = planToLatLon([cx, cy], [g.latitude, g.longitude]).map(
      (v) => Math.round(v * 1e7) / 1e7,
    ) as [number, number];
    const shift = (p: Point): Point => [round(p[0] - cx), round(p[1] - cy)];
    for (const z of this.plan!.zones) {
      if (z.center) z.center = shift(z.center);
      z.polygon = z.polygon.map(shift);
    }
    for (const m of [...this.plan!.valves, ...this.plan!.sensors]) {
      if (m.position) m.position = shift(m.position);
    }
    this.view = { ...this.view, cx: 0, cy: 0 };
    this.changed();
    this.showToast("Kartenmitte gesetzt");
  }

  private moveToHome(): void {
    const g = this.plan!.garden;
    const home = this.plan!.home;
    this.remember();
    g.latitude = home.latitude;
    g.longitude = home.longitude;
    this.view = { ...this.view, cx: 0, cy: 0 };
    this.changed();
  }

  private applyScale(): void {
    const meters = parseFloat(this.scaleInput.replace(",", "."));
    if (this.scaleDraft.length < 2 || !(meters > 0)) {
      this.showToast("Zwei Punkte wählen und den echten Abstand in Metern eingeben", true);
      return;
    }
    if (distance(this.scaleDraft[0], this.scaleDraft[1]) < 2) {
      this.showToast("Die beiden Punkte liegen zu nah beieinander", true);
      return;
    }
    const round1 = (p: Point): Point => [Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10];
    this.updateGarden({
      scale_points: [round1(this.scaleDraft[0]), round1(this.scaleDraft[1])],
      scale_distance_m: meters,
    });
    this.cancelTool();
    this.fitView();
    this.showToast("Maßstab gesetzt");
  }

  // Gießen ---------------------------------------------------------------------

  private async waterNow(zone: PlanZone): Promise<void> {
    const planned = this.status?.zones[zone.id]?.planned_s || zone.duration_s || 0;
    if (!planned) {
      this.showToast("Keine Gießdauer: kein Bedarf und keine Dauer von Hand", true);
      return;
    }
    try {
      await this._hass!.callService(DOMAIN, "run_zone", { zone_id: zone.id, duration: planned });
      this.showToast(`${zone.name}: ${fmtDuration(planned)} eingereiht`);
    } catch (err) {
      this.showToast(this.message(err), true);
    }
  }

  // Darstellung ----------------------------------------------------------------

  protected render(): TemplateResult {
    if (this.error) {
      return html`${this.renderHeader()}
        <div class="empty">
          <ha-icon icon="mdi:alert-circle-outline"></ha-icon>
          <p>${this.error}</p>
          <p class="hint">Ist der Bewässerungsplaner eingerichtet?</p>
        </div>`;
    }
    if (!this.plan) {
      return html`${this.renderHeader()}<div class="empty"><div class="spinner"></div></div>`;
    }
    return html`
      ${this.renderHeader()}
      <div class="layout">
        <div class="stage">
          ${this.renderPlan()} ${this.renderOverlay()}
        </div>
        <aside class="side">
          <div class="tabs">
            <button class=${this.tab === "zones" ? "active" : ""} @click=${() => (this.tab = "zones")}>
              <ha-icon icon="mdi:sprinkler-variant"></ha-icon>Zonen
            </button>
            <button
              class=${this.tab === "background" ? "active" : ""}
              @click=${() => (this.tab = "background")}
            >
              <ha-icon icon="mdi:image-area"></ha-icon>Hintergrund
            </button>
          </div>
          <div class="side-body">
            ${this.tab === "zones" ? this.renderZonesTab() : this.renderBackgroundTab()}
          </div>
        </aside>
      </div>
      ${this.toast ? html`<div class="toast">${this.toast}</div>` : nothing}
    `;
  }

  private renderHeader(): TemplateResult {
    const s = this.status;
    return html`
      <header>
        <button
          class="icon menu"
          title="Menü"
          @click=${() =>
            this.dispatchEvent(new Event("hass-toggle-menu", { bubbles: true, composed: true }))}
        >
          <ha-icon icon="mdi:menu"></ha-icon>
        </button>
        <div class="title">Bewässerung</div>
        ${s
          ? html`<div class="chips">
              ${s.winter_mode
                ? html`<span class="chip winter"><ha-icon icon="mdi:snowflake"></ha-icon>Winterpause</span>`
                : html`<span class="chip ${s.automatic ? "on" : ""}"
                    ><ha-icon icon=${s.automatic ? "mdi:calendar-check" : "mdi:calendar-remove"}></ha-icon
                    >${s.automatic ? "Automatik an" : "Automatik aus"}</span
                  >`}
              ${s.problems.length
                ? html`<span class="chip alarm" title=${s.problems.join("\n")}
                    ><ha-icon icon="mdi:alert"></ha-icon>${s.problems.length} Problem${s.problems.length > 1
                      ? "e"
                      : ""}</span
                  >`
                : nothing}
            </div>`
          : nothing}
        <div class="spacer"></div>
        ${this.plan
          ? html`
              <button class="icon" title="Rückgängig (Strg+Z)" ?disabled=${!this.history.length} @click=${this.undo}>
                <ha-icon icon="mdi:undo"></ha-icon>
              </button>
              <button class="text" ?disabled=${!this.dirty || this.saving} @click=${this.discard}>Verwerfen</button>
              <button class="primary" ?disabled=${!this.dirty || this.saving} @click=${this.save}>
                <ha-icon icon="mdi:content-save"></ha-icon>${this.saving ? "Speichert …" : "Speichern"}
              </button>
            `
          : nothing}
      </header>
    `;
  }

  private renderPlan(): TemplateResult {
    const { w, h } = this.size;
    const { cx, cy, scale } = this.view;
    const transform = `translate(${w / 2} ${h / 2}) scale(${scale}) translate(${-cx} ${-cy})`;
    const px = 1 / scale; // ein Bildschirmpunkt in Metern
    const cursor =
      this.tool === "select" ? (this.drag?.type === "pan" ? "grabbing" : "grab") : "crosshair";
    return html`
      <svg
        class="plan"
        width=${w}
        height=${h}
        style="cursor:${cursor}"
        @pointerdown=${this.onPointerDown}
        @pointermove=${this.onPointerMove}
        @pointerup=${this.onPointerUp}
        @pointercancel=${this.onPointerUp}
        @wheel=${this.onWheel}
        @dblclick=${(e: MouseEvent) => {
          if (this.tool === "bed") {
            e.preventDefault();
            this.draft = this.draft.slice(0, -1);
            this.finishBed();
          }
        }}
      >
        <g transform=${transform}>
          ${this.renderBackground(px)}
          ${this.plan!.zones.map((z, i) => this.renderZone(z, i, px))}
          ${this.renderSelectedHandles(px)} ${this.renderDraft(px)} ${this.renderScaleDraft(px)}
          ${this.plan!.valves.map((v) => this.renderMarker("valve", v, px))}
          ${this.plan!.sensors.map((s) => this.renderMarker("sensor", s, px))}
        </g>
      </svg>
    `;
  }

  private visibleBox() {
    const { cx, cy, scale } = this.view;
    const hw = this.size.w / 2 / scale;
    const hh = this.size.h / 2 / scale;
    return { x0: cx - hw, y0: cy - hh, x1: cx + hw, y1: cy + hh };
  }

  private renderBackground(px: number) {
    const g = this.plan!.garden;
    const box = this.visibleBox();
    const parts = [];
    if (g.background === "map" && g.latitude != null && g.longitude != null) {
      const template = this.tileTemplate();
      if (template) {
        const provider = this.plan!.providers[g.map_provider ?? ""];
        const maxZoom = provider?.max_zoom ?? 20;
        const zoom = Math.max(
          1,
          Math.min(maxZoom, Math.round(zoomForScale(g.latitude, this.view.scale * (window.devicePixelRatio > 1 ? 1.4 : 1)))),
        );
        const tiles = tilesFor(template, [g.latitude, g.longitude], box, zoom);
        parts.push(svg`<rect x=${box.x0} y=${box.y0} width=${box.x1 - box.x0} height=${box.y1 - box.y0} class="map-fill"></rect>`);
        // Kacheln leicht überlappen lassen, sonst sieht man feine Fugen.
        const pad = px * 0.5;
        for (const t of tiles) {
          parts.push(
            svg`<image href=${t.url} x=${t.x - pad} y=${t.y - pad} width=${t.size + 2 * pad} height=${t.size + 2 * pad} preserveAspectRatio="none" crossorigin="anonymous"></image>`,
          );
        }
      }
    } else if (g.background === "image" && this.imageUrl && this.imageSize) {
      const mpp = this.imageMpp();
      parts.push(
        svg`<image href=${this.imageUrl} x="0" y="0" width=${this.imageSize[0] * mpp} height=${this.imageSize[1] * mpp} preserveAspectRatio="none"></image>`,
      );
    }
    if (g.background !== "map") parts.push(this.renderGrid(box, px, g.background === "image"));
    return parts;
  }

  private renderGrid(box: { x0: number; y0: number; x1: number; y1: number }, px: number, faint: boolean) {
    const step = niceStep(40 * px);
    const lines = [];
    const major = step * 5;
    for (let x = Math.floor(box.x0 / step) * step; x <= box.x1; x += step) {
      const isMajor = Math.abs(x / major - Math.round(x / major)) < 1e-6;
      lines.push(svg`<line x1=${x} y1=${box.y0} x2=${x} y2=${box.y1} class=${isMajor ? "grid major" : "grid"}></line>`);
    }
    for (let y = Math.floor(box.y0 / step) * step; y <= box.y1; y += step) {
      const isMajor = Math.abs(y / major - Math.round(y / major)) < 1e-6;
      lines.push(svg`<line x1=${box.x0} y1=${y} x2=${box.x1} y2=${y} class=${isMajor ? "grid major" : "grid"}></line>`);
    }
    return svg`<g class=${faint ? "grid-layer faint" : "grid-layer"}>${lines}</g>`;
  }

  private tileTemplate(): string {
    const g = this.plan!.garden;
    if (g.map_provider === "custom") return g.map_url ?? "";
    return this.plan!.providers[g.map_provider ?? ""]?.url ?? "";
  }

  private zoneColor(index: number): string {
    return COLORS[index % COLORS.length];
  }

  private renderZone(zone: PlanZone, index: number, px: number) {
    const color = this.zoneColor(index);
    const st = this.status?.zones[zone.id]?.state ?? "idle";
    const selected = this.selected?.kind === "zone" && this.selected.id === zone.id;
    const cls = `zone ${st} ${selected ? "selected" : ""} ${zone.enabled ? "" : "disabled"}`;
    let shape;
    let label: Point | null = null;
    if (zone.type === "sprinkler" && zone.center && zone.radius_m) {
      shape = svg`<path d=${sectorPath(zone.center, zone.radius_m, zone.start_angle_deg, zone.arc_deg)}></path>`;
      label = zone.arc_deg >= 360 ? zone.center : polar(zone.center, zone.radius_m * 0.55, zone.start_angle_deg + zone.arc_deg / 2);
    } else if (zone.type !== "sprinkler" && zone.polygon.length >= 3) {
      shape = svg`<polygon points=${zone.polygon.map((p) => p.join(",")).join(" ")}></polygon>`;
      label = centroid(zone.polygon);
    }
    if (!shape) return nothing;
    const area = liveArea(zone);
    return svg`
      <g class=${cls} style="--zone:${color}"
        @pointerdown=${(e: PointerEvent) => {
          if (this.tool !== "select") return;
          this.selected = { kind: "zone", id: zone.id };
          this.tab = "zones";
          this.startDrag(e, { type: "move-zone", id: zone.id, start: this.toPlan(e), orig: structuredClone(zone) });
        }}>
        ${shape}
        ${label
          ? svg`<text x=${label[0]} y=${label[1]} font-size=${13 * px} stroke-width=${3 * px} class="label">
              <tspan x=${label[0]} dy="0">${zone.name}</tspan>
              <tspan x=${label[0]} dy=${15 * px} class="sub">${fmtArea(area)}${STATE_LABEL[st] ? ` · ${STATE_LABEL[st]}` : ""}</tspan>
            </text>`
          : nothing}
      </g>`;
  }

  private renderSelectedHandles(px: number) {
    if (this.tool !== "select" || this.selected?.kind !== "zone") return nothing;
    const zone = this.zone(this.selected.id);
    const r = 7 * px;
    const handle = (p: Point, drag: Drag, cls = "", title = "") =>
      svg`<circle class="handle ${cls}" cx=${p[0]} cy=${p[1]} r=${r}
        @pointerdown=${(e: PointerEvent) => this.startDrag(e, drag)}><title>${title}</title></circle>`;
    if (zone.type === "sprinkler" && zone.center && zone.radius_m) {
      const c = zone.center;
      const full = zone.arc_deg >= 360;
      const mid = full ? zone.start_angle_deg + 135 : zone.start_angle_deg + zone.arc_deg / 2;
      const parts = [
        svg`<line class="guide" x1=${c[0]} y1=${c[1]} x2=${polar(c, zone.radius_m, zone.start_angle_deg)[0]} y2=${polar(c, zone.radius_m, zone.start_angle_deg)[1]}></line>`,
        handle(c, { type: "center", id: zone.id }, "center", "Mittelpunkt verschieben"),
        handle(polar(c, zone.radius_m, mid), { type: "radius", id: zone.id }, "radius", "Reichweite ändern"),
        handle(polar(c, zone.radius_m, zone.start_angle_deg), { type: "start", id: zone.id }, "angle", "Anfang des Bogens"),
      ];
      if (!full) {
        parts.push(
          handle(polar(c, zone.radius_m, zone.start_angle_deg + zone.arc_deg), { type: "end", id: zone.id }, "angle", "Ende des Bogens"),
        );
      } else {
        // Bei vollem Kreis liegt das Ende auf dem Anfang; ein zweiter
        // Anfasser daneben öffnet den Bogen.
        parts.push(
          handle(polar(c, zone.radius_m * 0.8, zone.start_angle_deg + 20), { type: "end", id: zone.id }, "angle small", "Bogen öffnen"),
        );
      }
      return parts;
    }
    if (zone.type !== "sprinkler" && zone.polygon.length >= 3) {
      const pts = zone.polygon;
      return [
        ...pts.map((p, i) => {
          const q = pts[(i + 1) % pts.length];
          const m: Point = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
          return svg`<circle class="handle mid" cx=${m[0]} cy=${m[1]} r=${r * 0.7}
            @pointerdown=${(e: PointerEvent) => this.insertVertex(e, zone, i)}><title>Ziehen: neuen Punkt einfügen</title></circle>`;
        }),
        ...pts.map(
          (p, i) => svg`<circle class="handle" cx=${p[0]} cy=${p[1]} r=${r}
            @pointerdown=${(e: PointerEvent) => this.startDrag(e, { type: "vertex", id: zone.id, index: i })}
            @contextmenu=${(e: MouseEvent) => this.removeVertex(e, zone, i)}
            @dblclick=${(e: MouseEvent) => this.removeVertex(e, zone, i)}><title>Ziehen: verschieben · Doppelklick: löschen</title></circle>`,
        ),
      ];
    }
    return nothing;
  }

  private renderDraft(px: number) {
    if (this.tool !== "bed" || !this.draft.length) return nothing;
    const pts = this.hover ? [...this.draft, this.hover] : this.draft;
    const index = this.plan!.zones.findIndex((z) => z.id === this.toolTarget);
    return svg`
      <g class="draft" style="--zone:${this.zoneColor(index)}">
        <polyline points=${pts.map((p) => p.join(",")).join(" ")}></polyline>
        ${this.draft.map(
          (p, i) => svg`<circle cx=${p[0]} cy=${p[1]} r=${(i === 0 ? 8 : 5) * px} class=${i === 0 ? "first" : ""}></circle>`,
        )}
      </g>`;
  }

  private renderScaleDraft(px: number) {
    if (this.tool !== "scale") return nothing;
    const mpp = this.imageMpp();
    const pts = this.scaleDraft.map((p) => [p[0] * mpp, p[1] * mpp] as Point);
    return svg`<g class="scale-draft">
      ${pts.length === 2 ? svg`<line x1=${pts[0][0]} y1=${pts[0][1]} x2=${pts[1][0]} y2=${pts[1][1]}></line>` : nothing}
      ${pts.map((p) => svg`<circle cx=${p[0]} cy=${p[1]} r=${6 * px}></circle>`)}
    </g>`;
  }

  private renderMarker(kind: "valve" | "sensor", item: PlanValve | PlanSensor, px: number) {
    if (!item.position) return nothing;
    const [x, y] = item.position;
    const selected = this.selected?.kind === kind && this.selected.id === item.id;
    const letter = kind === "valve" ? "V" : SENSOR_LETTER[(item as PlanSensor).kind] ?? "S";
    const r = 11 * px;
    return svg`
      <g class="marker ${kind} ${selected ? "selected" : ""}"
        @pointerdown=${(e: PointerEvent) => {
          if (this.tool !== "select") return;
          this.selected = { kind, id: item.id };
          this.tab = "zones";
          this.startDrag(e, { type: "marker", kind, id: item.id });
        }}>
        ${kind === "valve"
          ? svg`<rect x=${x - r} y=${y - r} width=${2 * r} height=${2 * r} rx=${4 * px}></rect>`
          : svg`<circle cx=${x} cy=${y} r=${r}></circle>`}
        <text x=${x} y=${y} font-size=${12 * px} dy=${4.2 * px}>${letter}</text>
        <title>${item.name}</title>
      </g>`;
  }

  private renderOverlay(): TemplateResult {
    const g = this.plan!.garden;
    const banner = this.toolBanner();
    const bar = scaleBar(this.view.scale);
    const provider = g.background === "map" ? this.plan!.providers[g.map_provider ?? ""] : undefined;
    return html`
      <div class="tools">
        <button class="icon" title="Vergrößern" @click=${() => this.zoomBy(1.4)}><ha-icon icon="mdi:plus"></ha-icon></button>
        <button class="icon" title="Verkleinern" @click=${() => this.zoomBy(1 / 1.4)}><ha-icon icon="mdi:minus"></ha-icon></button>
        <button class="icon" title="Alles zeigen" @click=${this.fitView}><ha-icon icon="mdi:fit-to-screen-outline"></ha-icon></button>
      </div>
      ${banner}
      <div class="compass" style="transform: rotate(${g.background === "image" ? -g.north_deg : 0}deg)" title="Norden">
        <svg viewBox="-12 -12 24 24"><path d="M0 -10 L4 2 L0 0 L-4 2 Z" class="n"></path><path d="M0 10 L4 2 L0 0 L-4 2 Z" class="s"></path></svg>
        <span>N</span>
      </div>
      <div class="scalebar"><div style="width:${bar.px}px"></div><span>${bar.label}</span></div>
      ${g.background === "map"
        ? html`<div class="attribution">${provider?.attribution ?? "Eigener Kartendienst"}</div>`
        : nothing}
      ${!this.hasAnyDrawing() && this.tool === "select"
        ? html`<div class="welcome">
            <ha-icon icon="mdi:draw"></ha-icon>
            <div>
              <strong>Noch nichts gezeichnet.</strong><br />
              Wähle rechts einen Hintergrund und dann bei einer Zone „Zeichnen“.
            </div>
          </div>`
        : nothing}
    `;
  }

  private hasAnyDrawing(): boolean {
    return this.plan!.zones.some((z) => liveArea(z) !== null);
  }

  private toolBanner() {
    if (this.tool === "select") return nothing;
    let text = "";
    let actions: TemplateResult | typeof nothing = nothing;
    const name = this.toolTarget ? this.zoneOrMarkerName(this.toolTarget) : "";
    if (this.tool === "sprinkler") text = `${name}: Am Sprinkler drücken und bis zum Rand ziehen.`;
    if (this.tool === "bed") {
      text = `${name}: Ecken anklicken, zum Schließen den ersten Punkt.`;
      actions = html`<button class="text" ?disabled=${this.draft.length < 3} @click=${this.finishBed}>Fertig</button>`;
    }
    if (this.tool === "place") text = `${name}: Auf die Stelle im Plan klicken.`;
    if (this.tool === "scale") {
      text =
        this.scaleDraft.length < 2
          ? "Maßstab: Zwei Punkte im Bild anklicken, deren Abstand du kennst (z. B. die Ecken der Terrasse)."
          : "Abstand eingeben:";
      if (this.scaleDraft.length === 2) {
        actions = html`<input
            class="small"
            type="text"
            inputmode="decimal"
            placeholder="Meter"
            .value=${this.scaleInput}
            @input=${(e: Event) => (this.scaleInput = (e.target as HTMLInputElement).value)}
            @keydown=${(e: KeyboardEvent) => e.key === "Enter" && this.applyScale()}
          /><span>m</span>
          <button class="text" @click=${this.applyScale}>Übernehmen</button>`;
      }
    }
    return html`<div class="banner">
      <span>${text}</span>${actions}
      <button class="text" @click=${this.cancelTool}>Abbrechen</button>
    </div>`;
  }

  private zoneOrMarkerName(target: string): string {
    if (target.includes(":")) {
      const [kind, id] = target.split(":") as ["valve" | "sensor", string];
      return this.marker(kind, id)?.name ?? "";
    }
    return this.zone(target)?.name ?? "";
  }

  // Seitenleiste ---------------------------------------------------------------

  private renderZonesTab(): TemplateResult {
    const plan = this.plan!;
    if (!plan.zones.length) {
      return html`<p class="hint">
        Noch keine Zonen. Zonen und Ventile legst du unter Einstellungen → Geräte & Dienste →
        Bewässerungsplaner → Konfigurieren an.
      </p>`;
    }
    const sel = this.selected;
    return html`
      <ul class="list">
        ${plan.zones.map((z, i) => this.renderZoneItem(z, i, sel?.kind === "zone" && sel.id === z.id))}
      </ul>
      ${plan.valves.length || plan.sensors.length
        ? html`<h3>Ventile und Sensoren</h3>
            <ul class="list compact">
              ${plan.valves.map((v) => this.renderMarkerItem("valve", v))}
              ${plan.sensors.map((s) => this.renderMarkerItem("sensor", s))}
            </ul>`
        : nothing}
      <p class="hint small">
        Ziehen verschiebt die Ansicht, das Mausrad zoomt. Gezeichnete Flächen ersetzen die Fläche
        von Hand bei der Berechnung. Namen, Pflanzen und Ventile änderst du in den Einstellungen der
        Integration.
      </p>
    `;
  }

  private renderZoneItem(zone: PlanZone, index: number, open: boolean): TemplateResult {
    const st = this.status?.zones[zone.id];
    const area = liveArea(zone);
    const drawn = area !== null;
    const isSprinkler = zone.type === "sprinkler";
    return html`
      <li class="item ${open ? "open" : ""}" style="--zone:${this.zoneColor(index)}">
        <div class="row" @click=${() => {
          this.selected = open ? null : { kind: "zone", id: zone.id };
        }}>
          <span class="dot"></span>
          <ha-icon icon=${isSprinkler ? "mdi:sprinkler-variant" : "mdi:water-outline"}></ha-icon>
          <span class="name">${zone.name}</span>
          ${st && st.state !== "idle" ? html`<span class="badge ${st.state}">${STATE_LABEL[st.state]}</span>` : nothing}
          <span class="meta">${drawn ? fmtArea(area) : html`<em>nicht gezeichnet</em>`}</span>
        </div>
        ${open ? this.renderInspector(zone, st) : nothing}
      </li>
    `;
  }

  private renderInspector(zone: PlanZone, st: Status["zones"][string] | undefined): TemplateResult {
    const isSprinkler = zone.type === "sprinkler";
    const area = liveArea(zone);
    const drawn = area !== null;
    const drawTool: Tool = isSprinkler ? "sprinkler" : "bed";
    const num = (label: string, value: number | null, unit: string, set: (v: number) => void, step = 0.1) =>
      html`<label class="field">
        <span>${label}</span>
        <input type="number" step=${step} .value=${value == null ? "" : String(value)}
          @change=${(e: Event) => {
            const v = parseFloat((e.target as HTMLInputElement).value);
            if (!Number.isFinite(v)) return;
            this.remember();
            set(v);
            this.changed();
          }} />
        <span class="unit">${unit}</span>
      </label>`;
    return html`
      <div class="inspector">
        <dl>
          <dt>Fläche gezeichnet</dt>
          <dd>${drawn ? fmtArea(area) : "–"}</dd>
          <dt>Fläche von Hand</dt>
          <dd>${zone.area_m2 ? fmtArea(zone.area_m2) : "–"}</dd>
          ${zone.overlap_m2 > 0.05
            ? html`<dt>Überschneidung</dt><dd class="warn">${fmtArea(zone.overlap_m2)} mit anderen Zonen</dd>`
            : nothing}
          ${st
            ? html`<dt>Bedarf</dt><dd>${st.need_mm.toFixed(1)} mm</dd>
                <dt>Geplant</dt><dd>${st.planned_s ? fmtDuration(st.planned_s) : "nicht gießen"}
                  <span class="reason">(${st.reason})</span></dd>`
            : nothing}
          ${st?.locked_reason ? html`<dt>Gesperrt</dt><dd class="warn">${st.locked_reason}</dd>` : nothing}
        </dl>
        ${isSprinkler && drawn
          ? html`<div class="fields">
              ${num("Reichweite", zone.radius_m, "m", (v) => (zone.radius_m = Math.max(0.1, v)))}
              ${num("Richtung", zone.start_angle_deg, "°", (v) => (zone.start_angle_deg = ((v % 360) + 360) % 360), 5)}
              ${num("Bogen", zone.arc_deg, "°", (v) => (zone.arc_deg = Math.min(360, Math.max(1, v))), 5)}
            </div>
            <p class="hint small">Richtung: Anfang des Bogens, 0° = Norden (oben), 90° = Osten.</p>`
          : nothing}
        <div class="actions">
          <button class="text" @click=${() => this.startTool(drawTool, zone.id)}>
            <ha-icon icon=${drawn ? "mdi:pencil" : "mdi:draw"}></ha-icon>${drawn ? "Neu zeichnen" : "Zeichnen"}
          </button>
          ${drawn
            ? html`<button class="text danger" @click=${() => this.clearGeometry(zone.id)}>
                <ha-icon icon="mdi:eraser"></ha-icon>Entfernen
              </button>`
            : nothing}
          <span class="spacer"></span>
          <button class="text" title="In die Warteschlange einreihen" ?disabled=${this.status?.winter_mode}
            @click=${() => this.waterNow(zone)}>
            <ha-icon icon="mdi:watering-can"></ha-icon>Jetzt gießen
          </button>
        </div>
      </div>
    `;
  }

  private renderMarkerItem(kind: "valve" | "sensor", item: PlanValve | PlanSensor): TemplateResult {
    const selected = this.selected?.kind === kind && this.selected.id === item.id;
    const sub =
      kind === "valve"
        ? (item as PlanValve).safety_level === "device"
          ? "schließt selbst"
          : "nur Home Assistant"
        : SENSOR_LABEL[(item as PlanSensor).kind] ?? "";
    return html`
      <li class="item ${selected ? "open" : ""}">
        <div class="row" @click=${() => (this.selected = { kind, id: item.id })}>
          <span class="marker-icon ${kind}">${kind === "valve" ? "V" : SENSOR_LETTER[(item as PlanSensor).kind] ?? "S"}</span>
          <span class="name">${item.name}<small>${sub}</small></span>
          <button class="text small" @click=${(e: Event) => {
            e.stopPropagation();
            this.startTool("place", `${kind}:${item.id}`);
          }}>${item.position ? "Versetzen" : "Platzieren"}</button>
          ${item.position
            ? html`<button class="icon small" title="Vom Plan nehmen" @click=${(e: Event) => {
                e.stopPropagation();
                this.remember();
                item.position = null;
                this.changed();
              }}><ha-icon icon="mdi:close"></ha-icon></button>`
            : nothing}
        </div>
      </li>
    `;
  }

  private renderBackgroundTab(): TemplateResult {
    const g = this.plan!.garden;
    const providers = this.plan!.providers;
    const option = (kind: Garden["background"], icon: string, title: string, text: string) => html`
      <button class="choice ${g.background === kind ? "active" : ""}" @click=${() => this.setBackground(kind)}>
        <ha-icon icon=${icon}></ha-icon>
        <span><strong>${title}</strong><small>${text}</small></span>
      </button>`;
    return html`
      <div class="choices">
        ${option("map", "mdi:satellite-variant", "Luftbild", "Kartendienst, live im Browser geladen")}
        ${option("image", "mdi:image-outline", "Eigenes Bild", "Foto, Skizze oder Screenshot")}
        ${option("none", "mdi:grid", "Raster", "Leeres Raster in Metern")}
      </div>
      ${g.background === "map" ? this.renderMapSettings(g, providers) : nothing}
      ${g.background === "image" ? this.renderImageSettings(g) : nothing}
    `;
  }

  private renderMapSettings(g: Garden, providers: PlanData["providers"]): TemplateResult {
    return html`
      <h3>Kartendienst</h3>
      <select
        .value=${g.map_provider ?? "basemap_at"}
        @change=${(e: Event) => this.updateGarden({ map_provider: (e.target as HTMLSelectElement).value })}
      >
        ${Object.entries(providers).map(
          ([key, p]) => html`<option value=${key} ?selected=${g.map_provider === key}>${p.name}</option>`,
        )}
        <option value="custom" ?selected=${g.map_provider === "custom"}>Eigene Adresse …</option>
      </select>
      ${g.map_provider === "esri"
        ? html`<p class="note warn">
            Esri erlaubt die Nutzung nur nach seinen Nutzungsbedingungen. Für den privaten Garten ist das
            meist in Ordnung; prüfe es bitte selbst.
          </p>`
        : nothing}
      ${g.map_provider === "basemap_at"
        ? html`<p class="note">Orthofoto von basemap.at, nur in Österreich. Lizenz CC BY 4.0.</p>`
        : nothing}
      ${g.map_provider === "custom"
        ? html`<label class="field wide">
              <span>Adresse mit {z}, {x}, {y}</span>
              <input type="url" placeholder="https://…/{z}/{x}/{y}.jpg" .value=${g.map_url ?? ""}
                @change=${(e: Event) => this.updateGarden({ map_url: (e.target as HTMLInputElement).value.trim() })} />
            </label>`
        : nothing}
      <h3>Ausschnitt</h3>
      <p class="hint small">
        Verschiebe die Karte, bis dein Garten in der Mitte liegt, und lege dort die Kartenmitte fest.
        Deine Zeichnung wandert mit. Gespeichert werden nur Mitte und Zoom, keine Bilder.
      </p>
      <div class="actions">
        <button class="text" @click=${this.recenterMap}><ha-icon icon="mdi:crosshairs-gps"></ha-icon>Mitte hier festlegen</button>
        <button class="text" @click=${this.moveToHome}><ha-icon icon="mdi:home-map-marker"></ha-icon>Zum Zuhause</button>
      </div>
      <p class="hint small">„Zum Zuhause“ nimmt den Standort aus den Einstellungen von Home Assistant.</p>
    `;
  }

  private renderImageSettings(g: Garden): TemplateResult {
    const scaled = !!(g.scale_points && g.scale_distance_m);
    return html`
      <h3>Bild</h3>
      <label class="upload">
        <input type="file" accept="image/png,image/jpeg,image/webp" @change=${this.upload} />
        <ha-icon icon="mdi:upload"></ha-icon>${g.background_image ? "Anderes Bild hochladen" : "Bild hochladen"}
      </label>
      <p class="hint small">PNG, JPEG oder WebP, höchstens 15 MB.</p>
      ${g.background_image
        ? html`
            <h3>Maßstab</h3>
            <p class=${scaled ? "note" : "note warn"}>
              ${scaled
                ? html`Gesetzt: ${g.scale_distance_m} m zwischen zwei Punkten (${(this.imageMpp() * 100).toFixed(1)} cm je Bildpunkt).`
                : "Noch kein Maßstab. Ohne ihn stimmen die Flächen nicht, und der Plan lässt sich nicht speichern."}
            </p>
            <button class="text" @click=${() => this.startTool("scale")}>
              <ha-icon icon="mdi:ruler"></ha-icon>${scaled ? "Maßstab neu setzen" : "Maßstab setzen"}
            </button>
            <h3>Norden</h3>
            <label class="field">
              <span>Norden im Bild</span>
              <input type="number" step="5" .value=${String(g.north_deg)}
                @change=${(e: Event) => this.updateGarden({ north_deg: parseFloat((e.target as HTMLInputElement).value) || 0 })} />
              <span class="unit">°</span>
            </label>
            <p class="hint small">0° = Norden ist oben im Bild. Nur für die Kompassanzeige.</p>
          `
        : nothing}
    `;
  }
}

// Hilfen ------------------------------------------------------------------------

function round(v: number): number {
  return Math.round(v * 100) / 100;
}

function snapAngle(deg: number): number {
  return (Math.round(deg / 5) * 5) % 360;
}

function liveArea(zone: PlanZone): number | null {
  if (zone.type === "sprinkler") {
    return zone.center && zone.radius_m ? sectorArea(zone.radius_m, zone.arc_deg) : null;
  }
  return zone.polygon.length >= 3 ? polygonArea(zone.polygon) : null;
}

function fmtArea(area: number | null): string {
  if (area == null) return "–";
  return `${area.toLocaleString("de-DE", { maximumFractionDigits: area < 10 ? 1 : 0 })} m²`;
}

function fmtDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} s`;
  const min = Math.round(seconds / 60);
  return min >= 60 ? `${Math.floor(min / 60)} h ${min % 60} min` : `${min} min`;
}

function niceStep(raw: number): number {
  const power = 10 ** Math.floor(Math.log10(raw));
  for (const m of [1, 2, 5, 10]) if (m * power >= raw) return m * power;
  return 10 * power;
}

function scaleBar(pxPerMeter: number): { px: number; label: string } {
  const meters = niceStep(110 / pxPerMeter);
  const label = meters >= 1000 ? `${meters / 1000} km` : meters >= 1 ? `${meters} m` : `${meters * 100} cm`;
  return { px: meters * pxPerMeter, label };
}

declare global {
  interface HTMLElementTagNameMap {
    "irrigation-planner-panel": IrrigationPlannerPanel;
  }
}
