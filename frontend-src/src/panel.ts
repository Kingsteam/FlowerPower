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
  pipeRoute,
  junctions,
  snapToLines,
  roundedPath,
  distanceToPolyline,
  hoseRadiusHandle,
  type Point,
  centroid,
  compass,
  distance,
  edgeLengths,
  hoseArea,
  pointAlong,
  metersPerPixel,
  pathLength,
  setEdgeLength,
  snapPoint,
  latLonToPlan,
  planToLatLon,
  polar,
  polygonArea,
  sectorArea,
  sectorPath,
  tilesFor,
  zoomForScale,
} from "./geometry";
import { FEATURE_META, MAX_LABEL_LENGTH, SOIL_COLORS, family, featureName, newFeatureId, plotArea } from "./features";
import { type Place, SEARCH_ATTRIBUTION, searchAddress } from "./geocode";
import "./operation";
import "./schedule";
import "./devices";
import { styles } from "./styles";
import { type MyPosition, fmtAccuracy, locateErrorText, locateUnavailable } from "./locate";
import {
  MOIST_STOPS,
  type Raster,
  type RasterLayer,
  WET_STOPS,
  computeRaster,
  distanceToSegment,
  drawnArea,
  inPolygon,
  mmPerRun,
  moistColor,
  runSeconds,
  wetColor,
  wetReason,
} from "./wetmap";
import { guard } from "lit/directives/guard.js";
import type {
  Feature,
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

type Tool = "select" | "sprinkler" | "bed" | "hose" | "place" | "scale" | "feature" | "measure";
type Selection = { kind: "zone" | "valve" | "sensor" | "feature"; id: string } | null;
type Drag =
  | { type: "pan"; sx: number; sy: number; cx: number; cy: number; moved: boolean }
  | { type: "new-sprinkler"; id: string }
  | { type: "move-zone"; id: string; start: Point; orig: PlanZone }
  | { type: "center" | "radius" | "start" | "end" | "hose-radius"; id: string }
  | { type: "vertex"; id: string; index: number }
  | { type: "route"; id: string; index: number }
  | { type: "marker"; kind: "valve" | "sensor"; id: string }
  | { type: "f-vertex"; id: string; index: number }
  | { type: "f-move"; id: string; start: Point; orig: Feature }
  | { type: "f-radius" | "new-tree"; id: string };
// Fangen: so nah (Bildschirmpunkte) muss ein Punkt an einer Ecke liegen.
const SNAP_PX = 10;

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
  @state() private tab: "zones" | "plan" | "background" = "zones";
  // Grundriss
  @state() private featureKind = "building";
  @state() private measurePts: Point[] = [];
  @state() private snapOn = true;
  @state() private snapHint: Point | null = null;
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
  // Adresssuche (nur beim Luftbild, aufklappbar)
  @state() private searchOpen = false;
  @state() private searchQuery = "";
  @state() private searchResults: Place[] | null = null;
  @state() private searching = false;
  @state() private searchError = "";
  @state() private searchPin: { point: Point; name: string } | null = null;
  // Orten läuft gerade (einmalige Abfrage, nichts wird gespeichert)
  @state() private locating = false;
  // Reichweite beim Zeichnen eines Schlauchs (Meter je Seite)
  @state() private hoseRadius = 0.5;
  // Ventile, deren Durchfluss hier von Hand geändert wurde
  private flowEdited = new Set<string>();

  private _hass?: Hass;
  private savedJson = "";
  private history: string[] = [];
  private drag: Drag | null = null;
  private unsub?: () => void;
  private resizer?: ResizeObserver;
  private toastTimer?: number;
  @state() private toastUndo = false;
  @state() private layersOpen = false;
  // Seite: Plan oder Übersicht; Nässekarte über dem Plan
  @state() private page: "plan" | "operation" | "overview" | "schedule" | "devices" = "plan";
  // Raster-Ansicht über dem Plan ("" = aus)
  @state() private raster: RasterLayer | "" = "";
  @state() private rasterMenu = false;
  private get wetOn(): boolean {
    return this.raster !== "";
  }
  @state() private soilOn = false;
  private rasterCache: { key: string; raster: Raster } | null = null;
  // Sichern und Wiederherstellen
  @state() private menuOpen = false;
  @state() private pendingImport: { name: string; data: unknown } | null = null;
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
      if (this.autoFit && this.plan) this.initialView();
    }
  }

  /** Erste Ansicht: das Grundstück (oder alles) bildschirmfüllend mit etwas Rand. */
  private initialView(): void {
    this.fitView();
  }

  // Daten ----------------------------------------------------------------------

  /** Die Integration lädt neu (Geräte geändert): danach den Plan frisch holen. */
  private afterReload = (): void => {
    this.unsub?.();
    this.unsub = undefined;
    setTimeout(() => void this.load(), 4000);
  };

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

  /** Neuer Stand vom Server. Nach dem Speichern bleibt „Rückgängig“ möglich. */
  private setPlan(plan: PlanData, fit: boolean, keepHistory = false): void {
    this.plan = plan;
    this.flowEdited.clear();
    this.savedJson = JSON.stringify(this.editable());
    this.dirty = false;
    if (!keepHistory) this.history = [];
    void this.loadImage();
    if (fit) this.initialView();
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
    this.remember(); // auch „Verwerfen“ lässt sich rückgängig machen
    this.plan = { ...this.plan!, ...(JSON.parse(this.savedJson) as Editable) };
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
          type: z.type,
          center: z.center,
          radius_m: z.radius_m,
          start_angle_deg: z.start_angle_deg,
          arc_deg: z.arc_deg,
          polygon: z.polygon,
          valve_route: z.valve_route ?? [],
          valve_id: z.valve_id,
          plant_type: z.plant_type,
          kc: z.kc,
          soil_type: z.soil_type,
          root_depth_m: z.root_depth_m,
        })),
        // Durchfluss nur mitschicken, wenn er hier geändert wurde (sonst
        // würde ein inzwischen neu gelernter Wert überschrieben).
        valves: plan.valves.map((v) =>
          this.flowEdited.has(v.id)
            ? { id: v.id, position: v.position, learned_flow_l_min: v.learned_flow_l_min }
            : { id: v.id, position: v.position },
        ),
        sensors: plan.sensors.map((s) => ({ id: s.id, position: s.position })),
      });
      this.setPlan(result, false, true);
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

  private showToast(text: string, isError = false, withUndo = false): void {
    this.toast = (isError ? "⚠ " : "") + text;
    this.toastUndo = withUndo;
    window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(
      () => {
        this.toast = "";
        this.toastUndo = false;
      },
      isError || withUndo ? 8000 : 3000,
    );
  }

  /** Entfernen mit Hinweis und „Rückgängig“-Knopf. */
  private removed(text: string): void {
    this.showToast(text, false, true);
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
    for (const f of g?.features ?? []) {
      pts.push(...f.points);
      if (f.kind === "tree" && f.radius_m) {
        const [x, y] = f.points[0];
        pts.push([x - f.radius_m, y - f.radius_m], [x + f.radius_m, y + f.radius_m]);
      }
    }
    if (g?.background === "image" && this.imageSize) {
      const mpp = this.imageMpp();
      pts.push([0, 0], [this.imageSize[0] * mpp, this.imageSize[1] * mpp]);
    }
    if (!pts.length) return null;
    const xs = pts.map((p) => p[0]);
    const ys = pts.map((p) => p[1]);
    return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
  }

  /** Umriss der Grundstücksgrenze(n), falls gezeichnet. */
  private plotBounds(): [number, number, number, number] | null {
    if (!this.plan) return null;
    const pts = this.features.filter((f) => f.kind === "boundary" && f.points.length >= 2).flatMap((f) => f.points);
    if (!pts.length) return null;
    const xs = pts.map((p) => p[0]);
    const ys = pts.map((p) => p[1]);
    return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
  }

  /** Einpassen: das Grundstück, wenn es eine Grenze gibt, sonst alles Gezeichnete. */
  private fitView(): void {
    const g = this.plan?.garden;
    const b = this.plotBounds() ?? this.bounds();
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
    // Etwa 5 % Rand rundum
    const scale = Math.min(this.size.w / (w * 1.1), this.size.h / (h * 1.1), 200);
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
    this.measurePts = [];
    this.hover = null;
    this.snapHint = null;
    if (tool === "feature") this.featureKind = target;
    if (tool === "hose" && target) this.hoseRadius = this.zone(target).radius_m ?? 0.5;
    if (target && (tool === "sprinkler" || tool === "bed" || tool === "hose")) {
      this.selected = { kind: "zone", id: target };
    }
  }

  // Grundriss -------------------------------------------------------------------

  private get features(): Feature[] {
    return this.plan!.garden.features;
  }

  private feature(id: string): Feature {
    return this.features.find((f) => f.id === id)!;
  }

  /** Alle Ecken und Mittelpunkte, an denen neue Punkte einrasten. */
  private snapCandidates(skip?: Point): Point[] {
    const pts: Point[] = [];
    for (const f of this.features) pts.push(...f.points);
    for (const z of this.plan!.zones) {
      pts.push(...z.polygon);
      if (z.center) pts.push(z.center);
    }
    for (const m of [...this.plan!.valves, ...this.plan!.sensors]) if (m.position) pts.push(m.position);
    pts.push(...this.draft, ...this.measurePts);
    return skip ? pts.filter((p) => p !== skip) : pts;
  }

  /** Punkt fangen (Alt-Taste: frei). Merkt den Fangpunkt für die Anzeige. */
  private snap(p: Point, event?: MouseEvent, skip?: Point): Point {
    if (!this.snapOn || event?.altKey) {
      this.snapHint = null;
      return p;
    }
    const tolerance = SNAP_PX / this.view.scale;
    let hit = snapPoint(p, this.snapCandidates(skip), tolerance);
    // Leitungen: auch mitten auf einer bestehenden Leitung einrasten (Abzweig).
    if (!hit && this.tool === "feature" && this.featureKind === "pipe") {
      hit = snapToLines(p, this.pipeLines(), tolerance);
    }
    this.snapHint = hit;
    return hit ? [hit[0], hit[1]] : p;
  }

  /**
   * Zuleitungs-Punkte, die genau bei `old` liegen (am Hahn, am Ventil oder an
   * einem Abzweig), nach `now` mitnehmen. So bleiben Leitungen angehängt.
   */
  private movePipeEnds(old: Point, now: Point, skipFeature?: string): void {
    if (old[0] === now[0] && old[1] === now[1]) return;
    for (const f of this.features) {
      if (f.kind !== "pipe" || f.id === skipFeature || f.locked) continue;
      f.points = f.points.map((q) => (distance(q, old) < 0.06 ? ([now[0], now[1]] as Point) : q));
    }
  }

  private pipeLines(): Point[][] {
    return this.features.filter((f) => f.kind === "pipe" && f.points.length >= 2).map((f) => f.points);
  }

  private finishFeature(): void {
    const kind = this.featureKind;
    const need = family(kind) === "area" ? 3 : 2;
    if (this.draft.length < need) {
      this.showToast(`${FEATURE_META[kind].label}: mindestens ${need} Punkte`, true);
      return;
    }
    this.addFeature({
      kind,
      points: this.draft.map((p) => [round(p[0]), round(p[1])]),
      soil_type: kind === "soil" ? "loam" : null,
    });
    this.cancelTool();
  }

  private addFeature(partial: Partial<Feature> & { kind: string; points: Point[] }): Feature {
    this.remember();
    const feature: Feature = {
      id: newFeatureId(this.features),
      radius_m: null,
      label: null,
      ...partial,
    };
    this.features.push(feature);
    this.selected = { kind: "feature", id: feature.id };
    this.tab = "plan";
    this.changed();
    return feature;
  }

  private deleteFeature(id: string): void {
    const feature = this.feature(id);
    this.remember();
    this.plan!.garden.features = this.features.filter((f) => f.id !== id);
    if (this.selected?.kind === "feature" && this.selected.id === id) this.selected = null;
    this.changed();
    this.removed(`${featureName(feature)} entfernt`);
  }

  private cancelTool(): void {
    this.startTool("select");
  }

  private onKey = (event: KeyboardEvent): void => {
    const target = event.composedPath()[0] as HTMLElement | undefined;
    if (target && ["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName)) return;
    if (event.key === "Escape") this.cancelTool();
    if (event.key === "Enter" && this.tool === "bed") this.finishBed();
    if (event.key === "Enter" && this.tool === "feature") this.finishFeature();
    if (event.key === "Enter" && this.tool === "hose") this.finishHose();
    if ((event.ctrlKey || event.metaKey) && event.key === "z") {
      event.preventDefault();
      this.undo();
    }
    if (event.key === "Delete" && this.selected?.kind === "zone") {
      this.clearGeometry(this.selected.id);
    }
    if (event.key === "Delete" && this.selected?.kind === "feature") {
      this.deleteFeature(this.selected.id);
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

  private finishHose(): void {
    if (this.draft.length < 2) {
      this.showToast("Ein Schlauch braucht mindestens 2 Punkte", true);
      return;
    }
    this.remember();
    const zone = this.zone(this.toolTarget);
    zone.polygon = this.draft.map((p) => [round(p[0]), round(p[1])]);
    zone.center = null;
    zone.radius_m = this.hoseRadius;
    this.selected = { kind: "zone", id: zone.id };
    this.changed();
    this.cancelTool();
  }

  private async toggleAutomatic(on: boolean): Promise<void> {
    try {
      await this._hass!.callWS({ type: `${DOMAIN}/settings/automatic`, on });
      this.showToast(on ? "Automatik an: Programme starten nach Zeitplan" : "Automatik aus: keine Starts nach Zeitplan");
    } catch (err) {
      this.showToast(this.message(err), true);
    }
  }

  private setLocked(features: Feature[], locked: boolean): void {
    this.remember();
    for (const f of features) f.locked = locked;
    this.changed();
    this.showToast(
      features.length > 1
        ? locked
          ? "Alle Grundriss-Formen gesperrt"
          : "Alle Grundriss-Formen entsperrt"
        : locked
          ? `${featureName(features[0])} gesperrt`
          : `${featureName(features[0])} entsperrt`,
    );
  }

  /** Durchfluss des Ventils (gelernt oder von Hand), für Liter und Nässekarte. */
  private renderValveFlow(zone: PlanZone) {
    const valve = this.plan!.valves.find((v) => v.id === zone.valve_id);
    if (!valve) return nothing;
    return html`<label class="field">
        <span>Durchfluss</span>
        <input type="number" min="0.1" max="500" step="0.1" placeholder="unbekannt"
          .value=${valve.learned_flow_l_min == null ? "" : String(valve.learned_flow_l_min)}
          @change=${(e: Event) => {
            const raw = (e.target as HTMLInputElement).value.trim();
            const v = raw === "" ? null : parseFloat(raw.replace(",", "."));
            if (v !== null && (!Number.isFinite(v) || v <= 0 || v > 500)) return;
            this.remember();
            valve.learned_flow_l_min = v;
            this.flowEdited.add(valve.id);
            this.changed();
          }} />
        <span class="unit">L/min</span>
      </label>
      <p class="hint small">${valve.learned_flow_l_min
        ? `${valve.name}. Mit Durchflusssensor wird der Wert bei jedem Lauf nachgeführt.`
        : `${valve.name}: noch unbekannt. Ohne Sensor hier eintragen (z. B. Eimer auslitern), sonst fehlen Liter und Nässekarte.`}</p>`;
  }

  /**
   * Art der Zone ändern. Die Zeichnung passt meist nicht mehr: Beet und
   * Schlauch behalten ihre Punkte (wenn es genug sind), sonst wird neu gezeichnet.
   */
  private setZoneType(zone: PlanZone, type: PlanZone["type"]): void {
    if (zone.type === type) return;
    this.remember();
    const points = zone.polygon;
    zone.type = type;
    if (type === "sprinkler") {
      zone.polygon = [];
      zone.radius_m = null;
    } else {
      zone.center = null;
      if (type === "hose") {
        zone.radius_m = 0.5;
      } else {
        zone.radius_m = null;
        if (points.length < 3) zone.polygon = [];
      }
    }
    this.changed();
    if (liveArea(zone) === null) {
      this.startTool(type === "sprinkler" ? "sprinkler" : type === "hose" ? "hose" : "bed", zone.id);
      this.showToast(`${zone.name}: jetzt im Plan zeichnen, dann „Speichern“`);
    } else {
      this.showToast(`${zone.name}: Art geändert. „Speichern“ nicht vergessen.`);
    }
  }

  private clearGeometry(id: string): void {
    const zone = this.zone(id);
    this.remember();
    zone.center = null;
    zone.radius_m = null;
    zone.polygon = [];
    this.changed();
    this.removed(`${zone.name}: Zeichnung entfernt`);
  }

  private onPointerDown = (event: PointerEvent): void => {
    if (event.button !== 0) return;
    const svgEl = event.currentTarget as SVGSVGElement;
    const p = this.toPlan(event);
    if (this.tool === "feature") {
      const kind = this.featureKind;
      const q = this.snap(p, event);
      const fam = family(kind);
      if (fam === "point") {
        const point: Point = [round(q[0]), round(q[1])];
        if (kind === "tree") {
          const f = this.addFeature({ kind, points: [point], radius_m: 0 });
          this.drag = { type: "new-tree", id: f.id };
          svgEl.setPointerCapture(event.pointerId);
        } else {
          this.addFeature({ kind, points: [point], label: kind === "label" ? "Beschriftung" : null });
          this.cancelTool();
          if (kind === "label") {
            void this.updateComplete.then(() =>
              (this.renderRoot.querySelector("#feature-label") as HTMLInputElement | null)?.select(),
            );
          }
        }
        return;
      }
      const near = (a: Point) => distance(q, a) * this.view.scale < 12;
      if (fam === "area" && this.draft.length >= 3 && near(this.draft[0])) this.finishFeature();
      else if (fam === "line" && this.draft.length >= 2 && near(this.draft[this.draft.length - 1])) {
        this.finishFeature();
      } else this.draft = [...this.draft, q];
      return;
    }
    if (this.tool === "measure") {
      this.measurePts = [...this.measurePts, this.snap(p, event)];
      return;
    }
    if (this.tool === "hose") {
      const q = this.snap(p, event);
      const last = this.draft[this.draft.length - 1];
      if (this.draft.length >= 2 && distance(q, last) * this.view.scale < 12) this.finishHose();
      else this.draft = [...this.draft, q];
      return;
    }
    if (this.tool === "sprinkler") {
      this.remember();
      const zone = this.zone(this.toolTarget);
      const c = this.snap(p, event);
      p[0] = c[0];
      p[1] = c[1];
      zone.center = [round(p[0]), round(p[1])];
      zone.radius_m = 0;
      this.drag = { type: "new-sprinkler", id: zone.id };
      svgEl.setPointerCapture(event.pointerId);
      this.changed();
      return;
    }
    if (this.tool === "bed") {
      const q = this.snap(p, event);
      if (this.draft.length >= 3 && distance(q, this.draft[0]) * this.view.scale < 12) {
        this.finishBed();
      } else {
        this.draft = [...this.draft, q];
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
      if (["bed", "hose", "feature", "measure", "sprinkler"].includes(this.tool)) {
        this.hover = this.snap(this.toPlan(event), event);
      }
      return;
    }
    const p = this.toPlan(event);
    if (drag.type.startsWith("f-") || drag.type === "new-tree") {
      this.moveFeature(drag, p, event);
      return;
    }
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
      const item = this.marker(drag.kind, drag.id);
      const old = item.position;
      item.position = [round(p[0]), round(p[1])];
      // Zuleitungen, die am Ventil hängen, ziehen mit.
      if (old && drag.kind === "valve") this.movePipeEnds(old, item.position);
      this.changed();
      return;
    }
    const zone = this.zone(drag.id);
    switch (drag.type) {
      case "new-sprinkler":
      case "radius":
        zone.radius_m = round(Math.max(0.1, distance(zone.center!, p)));
        break;
      case "hose-radius":
        zone.radius_m = round(Math.min(20, Math.max(0.05, distanceToPolyline(p, zone.polygon))));
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
      case "route": {
        const route = zone.valve_route ?? [];
        const q = this.snap(p, event, route[drag.index]);
        route[drag.index] = [round(q[0]), round(q[1])];
        zone.valve_route = route;
        break;
      }
      case "vertex": {
        const q = this.snap(p, event, zone.polygon[drag.index]);
        zone.polygon[drag.index] = [round(q[0]), round(q[1])];
        break;
      }
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

  private moveFeature(drag: Drag, p: Point, event: PointerEvent): void {
    if (!("id" in drag)) return;
    const f = this.feature(drag.id);
    if (!f) return;
    switch (drag.type) {
      case "new-tree":
      case "f-radius":
        f.radius_m = round(Math.max(0.1, distance(f.points[0], p)));
        break;
      case "f-vertex": {
        const old = f.points[drag.index];
        const q = this.snap(p, event, old);
        f.points[drag.index] = [round(q[0]), round(q[1])];
        // Abzweig: andere Zuleitungen, die an diesem Punkt hängen, ziehen mit.
        if (f.kind === "pipe") this.movePipeEnds(old, f.points[drag.index], f.id);
        break;
      }
      case "f-move": {
        const dx = p[0] - drag.start[0];
        const dy = p[1] - drag.start[1];
        const before = f.points.map((q) => [q[0], q[1]] as Point);
        f.points = drag.orig.points.map((q) => [round(q[0] + dx), round(q[1] + dy)]);
        // Wasserhahn verschoben: angehängte Zuleitungen ziehen mit.
        if (f.kind === "tap") this.movePipeEnds(before[0], f.points[0], f.id);
        if (f.kind === "pipe") {
          for (const [i, q] of before.entries()) this.movePipeEnds(q, f.points[i], f.id);
        }
        break;
      }
    }
    this.changed();
  }

  private onPointerUp = (): void => {
    const drag = this.drag;
    this.drag = null;
    this.snapHint = null;
    if (!drag) return;
    if (drag.type === "new-tree") {
      const f = this.feature(drag.id);
      if (!f.radius_m || f.radius_m < 0.3) f.radius_m = 1.5;
      this.cancelTool();
      this.changed();
    }
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
    const min = zone.type === "hose" ? 2 : 3;
    if (zone.polygon.length <= min) {
      this.showToast(`Mindestens ${min} Punkte`, true);
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
        // Erstes Einrichten: gleich die Adresssuche anbieten.
        this.openSearch();
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
      z.valve_route = (z.valve_route ?? []).map(shift);
    }
    for (const m of [...this.plan!.valves, ...this.plan!.sensors]) {
      if (m.position) m.position = shift(m.position);
    }
    for (const f of this.features) f.points = f.points.map(shift);
    this.view = { ...this.view, cx: 0, cy: 0 };
    if (this.searchPin) {
      this.searchPin = { ...this.searchPin, point: shift(this.searchPin.point) };
    }
    this.changed();
    this.showToast("Kartenmitte gesetzt. Zum Behalten „Speichern“ drücken.");
  }

  // Orten ---------------------------------------------------------------------------

  /** Standort einmal aus dem Browser holen (kein Dauer-Orten, nichts gespeichert). */
  private locateOnce(): Promise<MyPosition | null> {
    const why = locateUnavailable(window.isSecureContext, "geolocation" in navigator);
    if (why) {
      this.showToast(why, true);
      return Promise.resolve(null);
    }
    this.locating = true;
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.locating = false;
          resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy });
        },
        (err) => {
          this.locating = false;
          this.showToast(locateErrorText(err.code), true);
          resolve(null);
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 30000 },
      );
    });
  }

  private geoPoint(pos: MyPosition): Point | null {
    const g = this.plan?.garden;
    if (g?.background !== "map" || g.latitude == null || g.longitude == null) return null;
    return latLonToPlan(pos.latitude, pos.longitude, [g.latitude, g.longitude]);
  }

  /** Orten-Knopf: Karte zum eigenen Standort (ist noch nichts gezeichnet: Kartenmitte). */
  private async goToMe(): Promise<void> {
    if (this.locating) return;
    const pos = await this.locateOnce();
    if (!pos || !this.plan) return;
    const g = this.plan.garden;
    const scale = Math.max(this.view.scale, 1 / metersPerPixel(pos.latitude, 20));
    this.autoFit = false;
    const switched = g.background === "none";
    if (switched) {
      // Noch kein Hintergrund: gleich das Luftbild einschalten.
      this.remember();
      g.background = "map";
      g.map_provider ??= "basemap_at";
      g.map_zoom ??= 19;
    }
    const empty =
      !this.hasAnyDrawing() &&
      ![...this.plan.valves, ...this.plan.sensors].some((m) => m.position);
    if (empty || g.latitude == null || g.longitude == null) {
      if (!switched) this.remember();
      g.latitude = Math.round(pos.latitude * 1e7) / 1e7;
      g.longitude = Math.round(pos.longitude * 1e7) / 1e7;
      this.view = { cx: 0, cy: 0, scale };
      this.changed();
      this.showToast(`Kartenmitte auf deinen Standort gesetzt (${fmtAccuracy(pos.accuracy)}).`);
      return;
    }
    const p = this.geoPoint(pos)!;
    this.view = { cx: p[0], cy: p[1], scale };
    if (switched) this.changed();
    this.showToast(
      Math.hypot(p[0], p[1]) > 2000
        ? "Du bist weit weg vom Garten. Die Karte zeigt, wo du gerade bist."
        : `Karte auf deinen Standort gelegt (${fmtAccuracy(pos.accuracy)}).`,
    );
  }

  /** Ventil oder Sensor, der gerade platziert wird, an den eigenen Standort setzen. */
  private async placeAtMe(): Promise<void> {
    if (this.tool !== "place" || this.locating) return;
    const target = this.toolTarget;
    const pos = await this.locateOnce();
    const p = pos && this.geoPoint(pos);
    if (!p || this.tool !== "place" || this.toolTarget !== target) return;
    const [kind, id] = target.split(":") as ["valve" | "sensor", string];
    this.remember();
    this.marker(kind, id).position = [round(p[0]), round(p[1])];
    this.selected = { kind, id };
    this.changed();
    this.cancelTool();
    this.view = { ...this.view, cx: p[0], cy: p[1] };
    this.showToast(`An deinen Standort gesetzt (${fmtAccuracy(pos.accuracy)})`);
  }

  // Adresssuche ------------------------------------------------------------------

  private openSearch(): void {
    this.searchOpen = true;
    void this.updateComplete.then(() =>
      (this.renderRoot.querySelector("#address") as HTMLInputElement | null)?.focus(),
    );
  }

  private closeSearch(): void {
    this.searchOpen = false;
    this.searchResults = null;
    this.searchError = "";
    this.searchPin = null;
  }

  private async runSearch(): Promise<void> {
    if (this.searching) return;
    this.searching = true;
    this.searchError = "";
    try {
      const lang = (this._hass as { language?: string } | undefined)?.language ?? "de";
      this.searchResults = await searchAddress(
        (msg) => this._hass!.callWS(msg),
        this.searchQuery,
        lang,
      );
      if (!this.searchResults.length) this.searchError = "Nichts gefunden. Probiere Straße, Hausnummer und Ort.";
    } catch (err) {
      this.searchResults = null;
      this.searchError = this.message(err);
    } finally {
      this.searching = false;
    }
  }

  /**
   * Zum gefundenen Ort springen. Ist noch nichts gezeichnet, wird der Ort
   * gleich zur Kartenmitte. Sonst bleibt die Zeichnung, wo sie ist, und nur
   * die Ansicht springt.
   */
  private goToPlace(place: Place): void {
    const g = this.plan!.garden;
    // Nah genug, dass ein Grundstück den Bildschirm füllt (etwa 15 Pixel je Meter).
    const scale = 1 / metersPerPixel(place.latitude, 20.5);
    this.autoFit = false;
    const empty =
      !this.hasAnyDrawing() &&
      ![...this.plan!.valves, ...this.plan!.sensors].some((m) => m.position);
    if (empty || g.latitude == null || g.longitude == null) {
      this.remember();
      g.latitude = Math.round(place.latitude * 1e7) / 1e7;
      g.longitude = Math.round(place.longitude * 1e7) / 1e7;
      this.view = { cx: 0, cy: 0, scale };
      this.searchPin = { point: [0, 0], name: place.name };
      this.changed();
      this.showToast(`${place.name}: Kartenmitte gesetzt. Fein ausrichten mit „Mitte hier festlegen“.`);
    } else {
      const point = latLonToPlan(place.latitude, place.longitude, [g.latitude, g.longitude]);
      this.view = { cx: point[0], cy: point[1], scale };
      this.searchPin = { point, name: place.name };
      this.showToast(`${place.name} angezeigt. „Mitte hier festlegen“ übernimmt die Stelle.`);
    }
    this.searchResults = null;
  }

  private renderSearch(): TemplateResult | typeof nothing {
    if (!this.searchOpen || this.tool !== "select" || this.plan!.garden.background !== "map") {
      return nothing;
    }
    return html`
      <div class="search" @pointerdown=${(e: Event) => e.stopPropagation()}>
        <form
          @submit=${(e: Event) => {
            e.preventDefault();
            void this.runSearch();
          }}
        >
          <ha-icon icon="mdi:magnify"></ha-icon>
          <input
            id="address"
            type="search"
            placeholder="Adresse, z. B. Hauptstraße 5, Ort"
            autocomplete="street-address"
            .value=${this.searchQuery}
            @input=${(e: Event) => (this.searchQuery = (e.target as HTMLInputElement).value)}
            @keydown=${(e: KeyboardEvent) => e.key === "Escape" && this.closeSearch()}
          />
          <button class="text" type="submit" ?disabled=${this.searching}>
            ${this.searching ? "Sucht …" : "Suchen"}
          </button>
          <button class="icon small" type="button" title="Suche schließen" @click=${this.closeSearch}>
            <ha-icon icon="mdi:close"></ha-icon>
          </button>
        </form>
        ${this.searchError ? html`<p class="search-error">${this.searchError}</p>` : nothing}
        ${this.searchResults?.length
          ? html`<ul class="results">
              ${this.searchResults.map(
                (p) => html`<li>
                  <button type="button" @click=${() => this.goToPlace(p)}>
                    <ha-icon icon="mdi:map-marker"></ha-icon>
                    <span><strong>${p.name}</strong><small>${p.detail}</small></span>
                  </button>
                </li>`,
              )}
            </ul>`
          : nothing}
        <p class="search-note">${SEARCH_ATTRIBUTION}. Die Adresse geht nur an die Suche und wird nicht gespeichert.</p>
      </div>
    `;
  }

  /** Umschalter für die Kartenansicht (Luftbild, Karte, …) direkt auf dem Plan. */
  private renderRasterMenu(): TemplateResult | typeof nothing {
    if (!this.rasterMenu) return nothing;
    const entries: [RasterLayer | "", string, string][] = [
      ["", "Aus", "mdi:eye-off-outline"],
      ["planned", "Geplante Gießmenge", "mdi:water-outline"],
      ["moisture", "Bodenfeuchte jetzt", "mdi:water-percent"],
      ["after", "Bodenfeuchte nach dem Gießen", "mdi:water-check-outline"],
    ];
    return html`
      <div class="layers raster-menu" role="menu" @pointerdown=${(e: Event) => e.stopPropagation()}>
        ${entries.map(
          ([key, label, icon]) => html`<button role="menuitemradio" aria-checked=${this.raster === key ? "true" : "false"}
            class=${this.raster === key ? "active" : ""}
            @click=${() => {
              this.raster = key;
              this.rasterMenu = false;
            }}><ha-icon icon=${icon}></ha-icon>${label}</button>`,
        )}
      </div>
    `;
  }

  private renderLayers(): TemplateResult | typeof nothing {
    const g = this.plan!.garden;
    if (!this.layersOpen || g.background !== "map") return nothing;
    const entries: [string, string, string][] = Object.entries(this.plan!.providers).map(
      ([key, p]) => [key, p.short ?? p.name, p.kind === "map" ? "mdi:map-outline" : "mdi:satellite-variant"],
    );
    if (g.map_url) entries.push(["custom", "Eigene Adresse", "mdi:web"]);
    return html`
      <div class="layers" role="menu" @pointerdown=${(e: Event) => e.stopPropagation()}>
        ${entries.map(
          ([key, label, icon]) => html`<button
            role="menuitemradio"
            aria-checked=${g.map_provider === key ? "true" : "false"}
            class=${g.map_provider === key ? "active" : ""}
            @click=${() => {
              if (g.map_provider !== key) this.updateGarden({ map_provider: key });
              this.layersOpen = false;
            }}
          >
            <ha-icon icon=${icon}></ha-icon>${label}
          </button>`,
        )}
      </div>
    `;
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

  private async cancelZone(zone: PlanZone): Promise<void> {
    try {
      await this._hass!.callWS({ type: `${DOMAIN}/queue/cancel`, zone_id: zone.id });
      this.showToast(`${zone.name}: abgebrochen`);
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
      ${this.page === "operation"
        ? html`<ip-operation
            .hass=${this._hass}
            @ip-toast=${(e: CustomEvent<{ text: string; isError: boolean }>) =>
              this.showToast(e.detail.text, e.detail.isError)}
          ></ip-operation>`
        : this.page === "overview"
        ? this.renderOverview()
        : this.page === "schedule"
          ? html`<ip-schedule
              .hass=${this._hass}
              .zones=${this.plan.zones}
              @ip-toast=${(e: CustomEvent<{ text: string; isError: boolean }>) =>
                this.showToast(e.detail.text, e.detail.isError)}
            ></ip-schedule>`
          : this.page === "devices"
            ? html`<ip-devices
                .hass=${this._hass}
                @ip-toast=${(e: CustomEvent<{ text: string; isError: boolean }>) =>
                  this.showToast(e.detail.text, e.detail.isError)}
                @ip-reloaded=${this.afterReload}
              ></ip-devices>`
            : this.renderPlanPage()}
      ${this.renderToast()}
    `;
  }

  private renderPlanPage(): TemplateResult {
    return html`
      <div class="layout">
        <div class="stage">
          ${this.renderPlan()} ${this.renderOverlay()}
        </div>
        <aside class="side">
          <div class="tabs">
            <button class=${this.tab === "zones" ? "active" : ""} @click=${() => (this.tab = "zones")}>
              <ha-icon icon="mdi:sprinkler-variant"></ha-icon>Zonen
            </button>
            <button class=${this.tab === "plan" ? "active" : ""} @click=${() => (this.tab = "plan")}>
              <ha-icon icon="mdi:floor-plan"></ha-icon>Grundriss
            </button>
            <button
              class=${this.tab === "background" ? "active" : ""}
              @click=${() => (this.tab = "background")}
            >
              <ha-icon icon="mdi:image-area"></ha-icon>Hintergrund
            </button>
          </div>
          <div class="side-body">
            ${this.tab === "zones"
              ? this.renderZonesTab()
              : this.tab === "plan"
                ? this.renderPlanTab()
                : this.renderBackgroundTab()}
          </div>
        </aside>
      </div>
    `;
  }

  private renderToast(): TemplateResult | typeof nothing {
    return html`
      ${this.toast
        ? html`<div class="toast" role="status">
            <span>${this.toast}</span>
            ${this.toastUndo
              ? html`<button
                  class="text"
                  @click=${() => {
                    this.undo();
                    this.toast = "";
                    this.toastUndo = false;
                  }}
                >
                  Rückgängig
                </button>`
              : nothing}
          </div>`
        : nothing}
    `;
  }

  // Nässekarte -----------------------------------------------------------------

  private rasterData(): Raster | null {
    const plan = this.plan!;
    const b = this.bounds();
    if (!b || !this.raster) return null;
    const key = JSON.stringify([
      this.raster,
      plan.zones,
      plan.valves.map((v) => [v.id, v.learned_flow_l_min]),
      plan.garden.features.filter((f) => f.kind === "tree" || f.kind === "boundary"),
      Object.entries(this.status?.zones ?? {}).map(([id, z]) => [id, z.planned_s, z.need_mm, z.capacity_mm]),
    ]);
    if (this.rasterCache?.key !== key) {
      const raster = computeRaster(this.raster, plan.zones, plan.valves, this.status, plan.garden.features, [
        b[0] - 1,
        b[1] - 1,
        b[2] + 1,
        b[3] + 1,
      ]);
      this.rasterCache = { key, raster };
    }
    return this.rasterCache.raster;
  }

  /** Kachelraster (jede Kachel ein Rechteck mit kleiner Fuge, damit es wie Kacheln aussieht). */
  private renderRaster() {
    const raster = this.rasterData();
    if (!raster) return nothing;
    const layer = this.raster;
    return guard([this.rasterCache?.key], () => {
      const s = raster.step;
      const gap = s * 0.08;
      return svg`<g class="raster">${raster.cells.map((c) => {
        let fill: string;
        if (c.kind === "none") fill = "rgba(150,150,150,0.18)";
        else if (c.kind === "unknown") fill = "url(#wet-hatch)";
        else {
          const [r, g, b] = layer === "planned" ? wetColor(c.v) : moistColor(c.v);
          fill = `rgba(${r},${g},${b},0.78)`;
        }
        return svg`<rect x=${c.x + gap / 2} y=${c.y + gap / 2} width=${s - gap} height=${s - gap} fill=${fill}></rect>`;
      })}</g>`;
    });
  }

  /** Messwerte der Sensoren neben dem Symbol (Bodenfeuchte farbig). */
  private renderSensorValues(px: number) {
    const values = this.status?.sensors ?? {};
    return this.plan!.sensors.map((s) => {
      const v = values[s.id];
      if (!s.position || !v || typeof v.value !== "number") return nothing;
      let cls = "";
      if (s.kind === "soil_moisture") {
        const span = v.field_capacity_pct - v.wilting_point_pct;
        const rel = span > 0 ? (v.value - v.wilting_point_pct) / span : 0.5;
        cls = rel < 0.35 ? "dry" : rel > 0.85 ? "wet" : "ok";
      }
      const text = `${Math.round(v.value * 10) / 10}${v.unit ? ` ${v.unit}` : ""}`;
      return svg`<text class="sensor-value ${cls}" x=${s.position[0]} y=${s.position[1]} dy=${24 * px}
        font-size=${12 * px} stroke-width=${3 * px}>${text}</text>`;
    });
  }

  private soilName(key: string | null | undefined): string {
    return (key && this.plan!.catalog.soils[key]?.name) || "unbekannt";
  }

  /** Bodenart einer Fläche im Grundriss, in der die Zone liegt. */
  private soilFromPlan(zone: PlanZone): string | null {
    const anchor = this.zoneAnchor(zone);
    if (!anchor) return null;
    const area = this.features.find((f) => f.kind === "soil" && f.points.length >= 3 && inPolygon(anchor, f.points));
    return area?.soil_type ?? null;
  }

  private renderSoilLegend(): TemplateResult {
    const used = new Set([
      ...this.plan!.zones.map((z) => z.soil_type ?? "loam"),
      ...this.features.filter((f) => f.kind === "soil").map((f) => f.soil_type ?? "loam"),
    ]);
    return html`<div class="wet-legend">
      <strong>Bodenart</strong>
      ${Object.entries(this.plan!.catalog.soils)
        .filter(([k]) => used.has(k))
        .map(
          ([k, s]) => html`<div class="soil-row"><span class="swatch" style="background:${SOIL_COLORS[k]}"></span>${s.name}
            <small>${s.awc_mm_per_m} mm/m</small></div>`,
        )}
      <small>Zahl: Wasser, das der Boden je Meter Tiefe speichern kann. Sandiger Boden braucht öfter, aber weniger Wasser.</small>
    </div>`;
  }

  /** Pflanzen, Wasserbedarf und Boden einer Zone. */
  private renderPlantSoil(zone: PlanZone): TemplateResult {
    const cat = this.plan!.catalog;
    const plant = zone.plant_type ? cat.plants[zone.plant_type] : undefined;
    const levelOf = (kc: number) => cat.needs.find((n) => kc <= levelLimit(n.key)) ?? cat.needs[cat.needs.length - 1];
    const level = levelOf(zone.kc);
    const fromPlan = this.soilFromPlan(zone);
    const set = (fn: () => void) => {
      this.remember();
      fn();
      this.changed();
    };
    return html`
      <details class="plant" open>
        <summary>Pflanzen und Boden</summary>
        <label class="field wide">
          <span>Was wächst hier?</span>
          <select @change=${(e: Event) => {
            const key = (e.target as HTMLSelectElement).value;
            set(() => {
              zone.plant_type = key || null;
              if (key) zone.kc = cat.plants[key].kc;
              zone.root_depth_m = null; // Wurzeltiefe der Pflanzenart
            });
          }}>
            <option value="" ?selected=${!zone.plant_type}>(keine Angabe)</option>
            ${Object.entries(cat.plants)
              .sort((a, b) => a[1].name.localeCompare(b[1].name, "de"))
              .map(([k, p]) => html`<option value=${k} ?selected=${k === zone.plant_type}>${p.name}</option>`)}
          </select>
        </label>
        <div class="field wide">
          <span>Wasserbedarf</span>
          <div class="levels" role="radiogroup">
            ${cat.needs.map(
              (n) => html`<button role="radio" aria-checked=${n.key === level.key ? "true" : "false"}
                class=${n.key === level.key ? "active" : ""} title=${`Pflanzenfaktor ${n.kc}`}
                @click=${() => set(() => (zone.kc = n.kc))}>${n.name}</button>`,
            )}
          </div>
          <small class="hint">
            Pflanzenfaktor ${zone.kc.toLocaleString("de-DE")}${plant && plant.kc !== zone.kc
              ? html` (für ${plant.name} üblich: ${plant.kc.toLocaleString("de-DE")})`
              : nothing}
          </small>
        </div>
        <label class="field wide">
          <span>Boden</span>
          <select @change=${(e: Event) => {
            const key = (e.target as HTMLSelectElement).value;
            set(() => (zone.soil_type = key || null));
          }}>
            <option value="" ?selected=${!zone.soil_type}>unbekannt (gilt als Lehm)</option>
            ${Object.entries(cat.soils).map(
              ([k, s]) => html`<option value=${k} ?selected=${k === zone.soil_type}>${s.name}</option>`,
            )}
          </select>
        </label>
        ${fromPlan && fromPlan !== zone.soil_type
          ? html`<button class="text small" @click=${() => set(() => (zone.soil_type = fromPlan))}>
              <ha-icon icon="mdi:layers-triple-outline"></ha-icon>Boden aus dem Plan übernehmen: ${this.soilName(fromPlan)}
            </button>`
          : nothing}
        <p class="hint small">Gilt für die berechnete Gießdauer. Mehr Einstellungen (Wurzeltiefe, Effizienz) unter Einstellungen → Integration → Konfigurieren.</p>
      </details>
    `;
  }

  private renderWetLegend(): TemplateResult {
    const layer = this.raster;
    const missing = this.plan!.zones
      .filter((z) => z.enabled && drawnArea(z) !== null)
      .map((z) => ({ z, why: wetReason(z, this.plan!.valves, this.status) }))
      .filter((m): m is { z: PlanZone; why: string } => m.why !== null);
    const gradient = (stops: [number, [number, number, number]][]) =>
      stops.map(([, [r, g, b]], i) => `rgb(${r},${g},${b}) ${(i / (stops.length - 1)) * 100}%`).join(", ");
    const planned = layer === "planned";
    const top = WET_STOPS[WET_STOPS.length - 1][0];
    return html`<div class="wet-legend">
      <strong>${planned ? "Geplante Gießmenge (nächster Durchgang)" : layer === "after" ? "Bodenfeuchte nach dem nächsten Gießen" : "Bodenfeuchte jetzt"}</strong>
      <div class="bar" style="background: linear-gradient(to right, ${gradient(planned ? WET_STOPS : MOIST_STOPS)})"></div>
      ${planned
        ? html`<div class="ticks">${WET_STOPS.map(([mm]) => html`<span>${mm}${mm === top ? "+" : ""}</span>`)}<em>mm</em></div>`
        : html`<div class="ticks"><span>trocken</span><span>halb</span><span>voll</span><span>zu nass</span></div>`}
      <small class="keys"><span class="swatch none"></span>nicht bewässert <span class="hatch"></span>ohne Wert</small>
      ${missing.length
        ? html`<div class="wet-missing">
            <small><strong>Ohne Wert:</strong> ${missing.map((m) => `${m.z.name} (${m.why})`).join(", ")}</small>
            ${missing.some((m) => m.why === "Durchfluss unbekannt")
              ? html`<small>Den Durchfluss lernt die Integration bei einem Lauf von mindestens 1 Minute mit Durchflusssensor.
                  Ohne Sensor: bei der Zone unter „Ventil“ den Durchfluss von Hand eintragen (z. B. Eimer auslitern).</small>`
              : nothing}
          </div>`
        : nothing}
      <details class="howto">
        <summary>Wie wird das berechnet?</summary>
        ${planned
          ? html`<small>Liter = geplante Dauer × Durchfluss des Ventils, verteilt auf die Fläche der Zone (1 L auf 1 m² = 1 mm).
              Die geplante Dauer kommt aus der Zone: von Hand, aus einer Entität oder berechnet aus dem Bedarf (bei keinem Bedarf 0).
              Wo sich Zonen überschneiden, zählen beide; hinter dicken Baumstämmen bleibt es beim Sprinkler trocken.</small>`
          : html`<small>Wasserhaushalt nach FAO-56 („Wasserkonto“ je Zone): Jeden Tag wird aus Temperatur, Luftfeuchte und Wind die
              Verdunstung (ET0) berechnet, mal Pflanzenfaktor. Das zieht Wasser vom Konto ab; wirksamer Regen und Gießen füllen es auf.
              „Voll“ ist die nutzbare Feldkapazität im Wurzelraum (je nach Boden und Wurzeltiefe), „trocken“ heißt aufgebraucht.
              Ein Bodenfeuchtesensor ersetzt die Schätzung. Ohne Wetterquelle bleibt der Boden rechnerisch voll.
              ${layer === "after" ? "„Nach dem Gießen“ rechnet die geplante Gießmenge dazu, davon kommt beim Sprinkler etwa 75 %, beim Tropfschlauch 90 % im Boden an." : ""}</small>`}
      </details>
    </div>`;
  }

  // Übersicht ------------------------------------------------------------------

  private renderOverview(): TemplateResult {
    const plan = this.plan!;
    const zones = plan.zones;
    const valveOf = (z: PlanZone) => plan.valves.find((v) => v.id === z.valve_id);
    const rows = zones.map((z) => {
      const drawn = drawnArea(z);
      const area = drawn ?? z.area_m2;
      const flow = valveOf(z)?.learned_flow_l_min ?? null;
      const seconds = runSeconds(z, this.status);
      const liters = flow && seconds ? (seconds / 60) * flow : null;
      return { z, drawn, area, flow, seconds, liters, mm: mmPerRun(z, plan.valves, this.status) };
    });
    const active = rows.filter((r) => r.z.enabled);
    const total = active.reduce((s, r) => s + (r.area ?? 0), 0);
    const liters = active.reduce((s, r) => s + (r.liters ?? 0), 0);
    const overlap = zones.reduce((s, z) => s + z.overlap_m2, 0) / 2;
    const plot = plotArea(plan.garden.features);
    const byType = (["sprinkler", "drip", "hose"] as const).map((type) => {
      const list = active.filter((r) => r.z.type === type);
      return { type, count: list.length, area: list.reduce((s, r) => s + (r.area ?? 0), 0) };
    });
    const TYPE: Record<string, [string, string]> = {
      sprinkler: ["Sprinkler", "mdi:sprinkler-variant"],
      drip: ["Tropfschlauch", "mdi:water-outline"],
      hose: ["Gießschlauch", "mdi:pipe"],
    };
    const hints: string[] = [];
    for (const r of rows) {
      if (!r.z.enabled) continue;
      if (r.drawn === null && !r.z.area_m2) hints.push(`${r.z.name}: weder gezeichnet noch Fläche von Hand`);
      else if (r.drawn === null) hints.push(`${r.z.name}: noch nicht gezeichnet (Fläche von Hand)`);
      if (!r.z.valve_id) hints.push(`${r.z.name}: kein Ventil zugeordnet`);
      else if (!r.flow) hints.push(`${r.z.name}: Durchfluss noch nicht gelernt (nach dem ersten Lauf)`);
    }
    const valveRows = plan.valves
      .map((v) => {
        const mine = active.filter((r) => r.z.valve_id === v.id);
        const area = mine.reduce((s, r) => s + (r.area ?? 0), 0);
        const rate = v.learned_flow_l_min && area ? (v.learned_flow_l_min * 60) / area : null;
        return { v, mine, area, rate };
      })
      .filter((r) => r.mine.length);
    const num = (v: number | null, digits = 0) =>
      v == null ? "–" : v.toLocaleString("de-DE", { maximumFractionDigits: digits });
    return html`
      <div class="overview">
        <section class="tiles">
          <div class="tile"><span>Bewässerte Fläche</span><strong>${fmtArea(total)}</strong>
            <small>${active.length} aktive Zonen</small></div>
          ${plot
            ? html`<div class="tile"><span>Grundstück</span><strong>${fmtArea(plot)}</strong>
                <small>davon ${Math.round((total / plot) * 100)} % bewässert</small></div>`
            : nothing}
          <div class="tile"><span>Gezeichnet</span><strong>${rows.filter((r) => r.drawn !== null).length} von ${zones.length}</strong>
            <small>Zonen im Plan</small></div>
          <div class="tile"><span>Wasser pro Durchgang</span><strong>${num(liters)} L</strong>
            <small>alle aktiven Zonen einmal</small></div>
          <div class="tile ${overlap > 0.5 ? "warn" : ""}"><span>Überschneidungen</span><strong>${fmtArea(overlap)}</strong>
            <small>werden doppelt gegossen</small></div>
        </section>
        <section class="types">
          ${byType.map(
            (t) => html`<div class="type">
              <ha-icon icon=${TYPE[t.type][1]}></ha-icon>
              <span>${TYPE[t.type][0]}</span>
              <strong>${fmtArea(t.area)}</strong>
              <small>${t.count} Zone${t.count === 1 ? "" : "n"}</small>
            </div>`,
          )}
        </section>
        ${hints.length
          ? html`<section class="card"><h3>Noch offen</h3><ul class="hints">${hints.map((h) => html`<li>${h}</li>`)}</ul></section>`
          : nothing}
        <section class="card">
          <h3>Zonen</h3>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Zone</th><th>Art</th><th>Ventil</th><th class="n">Fläche</th><th class="n">Dauer</th>
                <th class="n">Liter</th><th class="n">mm</th><th class="n">Bedarf</th></tr></thead>
              <tbody>
                ${rows.map(
                  (r, i) => html`<tr class=${r.z.enabled ? "" : "off"}>
                    <td><span class="dot" style="--zone:${this.zoneColor(i)}"></span>${r.z.name}</td>
                    <td>${TYPE[r.z.type]?.[0] ?? r.z.type}</td>
                    <td>${valveOf(r.z)?.name ?? "–"}</td>
                    <td class="n">${r.area ? fmtArea(r.area) : "–"}${r.drawn === null && r.area ? html`<sup title="von Hand">*</sup>` : nothing}</td>
                    <td class="n">${r.seconds ? fmtDuration(r.seconds) : "–"}</td>
                    <td class="n">${num(r.liters)}</td>
                    <td class="n">${num(r.mm, 1)}</td>
                    <td class="n">${this.status?.zones[r.z.id] ? `${num(this.status.zones[r.z.id].need_mm, 1)} mm` : "–"}</td>
                  </tr>`,
                )}
              </tbody>
            </table>
          </div>
          <p class="hint small">Dauer: geplant, sonst von Hand. Liter und mm je Durchgang aus dem gelernten Durchfluss. * = Fläche von Hand.</p>
        </section>
        <section class="card">
          <h3>Ventile</h3>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Ventil</th><th>Zonen</th><th class="n">Fläche</th><th class="n">Durchfluss</th><th class="n">Regenrate</th></tr></thead>
              <tbody>
                ${valveRows.map(
                  (r) => html`<tr>
                    <td>${r.v.name}</td>
                    <td>${r.mine.map((m) => m.z.name).join(", ")}</td>
                    <td class="n">${fmtArea(r.area)}</td>
                    <td class="n">${r.v.learned_flow_l_min ? `${num(r.v.learned_flow_l_min, 1)} L/min` : "–"}</td>
                    <td class="n">${r.rate ? `${num(r.rate, 1)} mm/h` : "–"}</td>
                  </tr>`,
                )}
              </tbody>
            </table>
          </div>
          <p class="hint small">Regenrate: so viele Millimeter pro Stunde kommen auf der Fläche an. Über etwa 15 mm/h kann Wasser auf schwerem Boden ablaufen; dann hilft „Abwechselnd“ mit Einziehzeit.</p>
        </section>
      </div>
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
        <img class="logo" src="/irrigation_planner_static/logo.png" alt="" width="32" height="32" />
        <div class="title">Bewässerung</div>
        ${this.plan
          ? html`<nav class="pages">
              <button class=${this.page === "plan" ? "active" : ""} title="Plan" @click=${() => (this.page = "plan")}>
                <ha-icon icon="mdi:map-outline"></ha-icon><span class="label">Plan</span>
              </button>
              <button class=${this.page === "operation" ? "active" : ""} title="Betrieb" @click=${() => (this.page = "operation")}>
                <ha-icon icon="mdi:play-circle-outline"></ha-icon><span class="label">Betrieb</span>
              </button>
              <button class=${this.page === "overview" ? "active" : ""} title="Flächen" @click=${() => (this.page = "overview")}>
                <ha-icon icon="mdi:chart-box-outline"></ha-icon><span class="label">Flächen</span>
              </button>
              <button class=${this.page === "schedule" ? "active" : ""} title="Zeitplan" @click=${() => (this.page = "schedule")}>
                <ha-icon icon="mdi:calendar-clock"></ha-icon><span class="label">Zeitplan</span>
              </button>
              <button class=${this.page === "devices" ? "active" : ""} title="Geräte" @click=${() => (this.page = "devices")}>
                <ha-icon icon="mdi:valve"></ha-icon><span class="label">Geräte</span>
              </button>
            </nav>`
          : nothing}
        ${s
          ? html`<div class="chips">
              ${s.winter_mode
                ? html`<span class="chip winter"><ha-icon icon="mdi:snowflake"></ha-icon>Winterpause</span>`
                : html`<button class="chip toggle ${s.automatic ? "on" : ""}" role="switch"
                    aria-checked=${s.automatic ? "true" : "false"}
                    title=${s.automatic
                      ? "Programme starten nach Zeitplan. Klicken: Automatik aus (was läuft, läuft zu Ende)"
                      : "Programme starten nicht von selbst. Klicken: Automatik ein"}
                    @click=${() => this.toggleAutomatic(!s.automatic)}
                    ><ha-icon icon=${s.automatic ? "mdi:calendar-check" : "mdi:calendar-remove"}></ha-icon
                    >${s.automatic ? "Automatik an" : "Automatik aus"}</button
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
              ${this.page === "plan" || this.page === "overview" || this.dirty
                ? html`<button class="icon" title="Rückgängig (Strg+Z)" ?disabled=${!this.history.length} @click=${this.undo}>
                      <ha-icon icon="mdi:undo"></ha-icon>
                    </button>
                    <button class="text" ?disabled=${!this.dirty || this.saving} @click=${this.discard}>Verwerfen</button>
                    <button class="primary" ?disabled=${!this.dirty || this.saving} @click=${this.save}>
                      <ha-icon icon="mdi:content-save"></ha-icon>${this.saving ? "Speichert …" : "Speichern"}
                    </button>`
                : nothing}
              <div class="menu-wrap">
                <button class="icon" title="Sichern und Wiederherstellen" @click=${() => (this.menuOpen = !this.menuOpen)}>
                  <ha-icon icon="mdi:dots-vertical"></ha-icon>
                </button>
                ${this.menuOpen
                  ? html`<div class="popup-menu" role="menu">
                      <button role="menuitem" @click=${this.exportPlan}>
                        <ha-icon icon="mdi:download"></ha-icon>Sicherung herunterladen
                      </button>
                      <label class="menu-item" role="menuitem">
                        <ha-icon icon="mdi:upload"></ha-icon>Sicherung einspielen …
                        <input type="file" accept="application/json,.json" @change=${this.pickImport} />
                      </label>
                    </div>`
                  : nothing}
              </div>
            `
          : nothing}
      </header>
      ${this.renderImportDialog()}
    `;
  }

  // Sichern und Wiederherstellen -------------------------------------------------

  private async exportPlan(): Promise<void> {
    this.menuOpen = false;
    try {
      const data = await this._hass!.callWS<unknown>({ type: `${DOMAIN}/export` });
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bewaesserung-sicherung-${new Date().toISOString().slice(0, 10)}.json`;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      this.showToast(
        this.dirty
          ? "Sicherung heruntergeladen (ohne die noch nicht gespeicherten Änderungen)"
          : "Sicherung heruntergeladen",
      );
    } catch (err) {
      this.showToast(`Sicherung fehlgeschlagen: ${this.message(err)}`, true);
    }
  }

  private async pickImport(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = "";
    this.menuOpen = false;
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      this.pendingImport = { name: file.name, data };
    } catch {
      this.showToast("Die Datei ist keine gültige Sicherung (kein JSON)", true);
    }
  }

  private async runImport(mode: "drawing" | "all"): Promise<void> {
    const pending = this.pendingImport;
    if (!pending) return;
    this.pendingImport = null;
    try {
      const result = await this._hass!.callWS<{ reloaded: boolean; notes: string[] }>({
        type: `${DOMAIN}/import`,
        mode,
        data: pending.data,
      });
      const notes = result.notes.length ? ` ${result.notes.join(" ")}` : "";
      if (result.reloaded) {
        this.showToast(`Sicherung eingespielt, wird neu geladen …${notes}`);
        // Die Integration lädt neu; danach den Plan frisch holen.
        this.unsub?.();
        this.unsub = undefined;
        setTimeout(() => void this.load(), 4000);
      } else {
        this.showToast(`Zeichnung übernommen.${notes}`);
        await this.load();
      }
    } catch (err) {
      this.showToast(`Nicht eingespielt: ${this.message(err)}`, true);
    }
  }

  private renderImportDialog(): TemplateResult | typeof nothing {
    if (!this.pendingImport) return nothing;
    const exported = (this.pendingImport.data as { exported_at?: string })?.exported_at;
    return html`
      <div class="dialog-backdrop" @click=${() => (this.pendingImport = null)}>
        <div class="dialog" role="dialog" aria-modal="true" @click=${(e: Event) => e.stopPropagation()}>
          <h2>Sicherung einspielen</h2>
          <p>
            <strong>${this.pendingImport.name}</strong>${exported
              ? html`<br /><small>erstellt am ${new Date(exported).toLocaleString("de-DE")}</small>`
              : nothing}
          </p>
          ${this.dirty
            ? html`<p class="note warn">Nicht gespeicherte Änderungen gehen dabei verloren.</p>`
            : nothing}
          <button class="choice" @click=${() => this.runImport("drawing")}>
            <ha-icon icon="mdi:draw"></ha-icon>
            <span
              ><strong>Nur die Zeichnung</strong
              ><small>Hintergrund, Grundriss, Formen der Zonen, Positionen von Ventilen und Sensoren.
                Ventile, Programme und Einstellungen bleiben, wie sie sind.</small></span
            >
          </button>
          <button class="choice" @click=${() => this.runImport("all")}>
            <ha-icon icon="mdi:backup-restore"></ha-icon>
            <span
              ><strong>Alles ersetzen</strong
              ><small>Auch Zonen, Ventile, Programme und Einstellungen. Die Integration wird dabei neu
                geladen; laufende Bewässerung wird beendet und alle Ventile werden geschlossen.</small></span
            >
          </button>
          <div class="actions">
            <span class="spacer"></span>
            <button class="text" @click=${() => (this.pendingImport = null)}>Abbrechen</button>
          </div>
        </div>
      </div>
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
        class="plan ${this.wetOn ? "wet" : ""}"
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
          if (this.tool === "hose") {
            e.preventDefault();
            this.draft = this.draft.slice(0, -1);
            this.finishHose();
          }
          if (this.tool === "feature" && family(this.featureKind) !== "point") {
            e.preventDefault();
            this.draft = this.draft.slice(0, -1);
            this.finishFeature();
          }
        }}
      >
        <defs>
          <pattern id="wet-hatch" patternUnits="userSpaceOnUse" width=${8 * px} height=${8 * px} patternTransform="rotate(45)">
            <rect width=${8 * px} height=${8 * px} fill="rgba(120,120,120,0.12)"></rect>
            <line x1="0" y1="0" x2="0" y2=${8 * px} stroke="rgba(90,90,90,0.55)" stroke-width=${2 * px}></line>
          </pattern>
        </defs>
        <g transform=${transform}>
          ${this.renderBackground(px)}
          <g class="features">${this.renderFeatures(px)}</g>
          <g class="junctions">${junctions(this.pipeLines()).map(
            (j) => svg`<circle cx=${j[0]} cy=${j[1]} r=${4.5 * px}><title>Abzweig (T-Stück)</title></circle>`,
          )}</g>
          ${this.wetOn ? this.renderRaster() : nothing}
          ${this.plan!.zones.map((z, i) => this.renderZone(z, i, px))}
          ${this.renderSelectedHandles(px)} ${this.renderFeatureHandles(px)}
          ${this.renderDraft(px)} ${this.renderScaleDraft(px)} ${this.renderMeasure(px)}
          ${this.renderValveLinks(px)} ${this.renderFlow(px)}
          ${this.plan!.valves.map((v) => this.renderMarker("valve", v, px))}
          ${this.plan!.sensors.map((s) => this.renderMarker("sensor", s, px))}
          ${this.wetOn ? this.renderSensorValues(px) : nothing}
          ${this.renderSnapHint(px)}
          ${this.searchPin && this.plan!.garden.background === "map"
            ? svg`<g class="pin" transform="translate(${this.searchPin.point[0]} ${this.searchPin.point[1]}) scale(${px})">
                <path d="M0 0 C-3 -9 -11 -13 -11 -22 A11 11 0 1 1 11 -22 C11 -13 3 -9 0 0 Z"></path>
                <circle cx="0" cy="-22" r="4"></circle>
                <title>${this.searchPin.name}</title>
              </g>`
            : nothing}
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
        const layer = (list: typeof tiles) =>
          list.map(
            (t) =>
              svg`<image href=${t.url} x=${t.x - pad} y=${t.y - pad} width=${t.size + 2 * pad} height=${t.size + 2 * pad} preserveAspectRatio="none" crossorigin="anonymous"></image>`,
          );
        parts.push(...layer(tiles));
        // Beschriftung (Straßennamen, Hausnummern) über dem Luftbild
        if (provider?.overlay && g.map_provider !== "custom") {
          parts.push(...layer(tilesFor(provider.overlay, [g.latitude, g.longitude], box, zoom)));
        }
      }
    } else if (g.background === "image" && this.imageUrl && this.imageSize) {
      const mpp = this.imageMpp();
      parts.push(
        svg`<image href=${this.imageUrl} x="0" y="0" width=${this.imageSize[0] * mpp} height=${this.imageSize[1] * mpp} preserveAspectRatio="none"></image>`,
      );
    }
    // Deckkraft: zum Abpausen das Luftbild oder Bild abblenden.
    const result = [svg`<g class="bg" opacity=${g.background_opacity ?? 1}>${parts}</g>`];
    const faded = (g.background_opacity ?? 1) < 0.35;
    if (g.background !== "map" || faded) {
      result.push(this.renderGrid(box, px, g.background === "image" && !faded));
    }
    return result;
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
    const noWet = this.wetOn && zone.enabled ? wetReason(zone, this.plan!.valves, this.status) : null;
    const cls = `zone ${st} ${selected ? "selected" : ""} ${zone.enabled ? "" : "disabled"} ${noWet ? "nowet" : ""}`;
    let shape;
    let label: Point | null = null;
    if (zone.type === "sprinkler" && zone.center && zone.radius_m) {
      shape = svg`<path d=${sectorPath(zone.center, zone.radius_m, zone.start_angle_deg, zone.arc_deg)}></path>`;
      label = zone.arc_deg >= 360 ? zone.center : polar(zone.center, zone.radius_m * 0.55, zone.start_angle_deg + zone.arc_deg / 2);
    } else if (zone.type === "hose" && zone.polygon.length >= 2 && zone.radius_m) {
      shape = this.hoseShape(zone.id, zone.polygon, zone.radius_m, px);
      label = this.zoneAnchor(zone);
    } else if (zone.type === "drip" && zone.polygon.length >= 3) {
      shape = svg`<polygon points=${zone.polygon.map((p) => p.join(",")).join(" ")}></polygon>`;
      label = centroid(zone.polygon);
    }
    if (!shape) return nothing;
    const area = liveArea(zone);
    const soilColor = this.soilOn ? SOIL_COLORS[zone.soil_type ?? "loam"] : "";
    return svg`
      <g class=${cls} style="--zone:${soilColor || color}"
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
              <tspan x=${label[0]} dy=${15 * px} class="sub">${noWet
                ? `kein Wert: ${noWet}`
                : `${fmtArea(area)}${STATE_LABEL[st] ? ` · ${STATE_LABEL[st]}` : ""}`}</tspan>
            </text>`
          : nothing}
      </g>`;
  }

  /**
   * Schlauch: kräftige Linie, darum die Reichweite als Umriss (gleicher
   * Abstand zur Linie, runde Enden) mit leichter Füllung.
   */
  private hoseShape(id: string, points: Point[], radius: number, px: number, cls = "") {
    const pts = points.map((p) => p.join(",")).join(" ");
    const border = 2 * px;
    const mask = `hose-mask-${id}`;
    return svg`<g class="hose ${cls}">
      <mask id=${mask} maskUnits="userSpaceOnUse" x="-100000" y="-100000" width="200000" height="200000">
        <rect x="-100000" y="-100000" width="200000" height="200000" fill="white"></rect>
        <polyline points=${pts} fill="none" stroke="black" stroke-width=${2 * radius}
          stroke-linecap="round" stroke-linejoin="round"></polyline>
      </mask>
      <polyline class="hose-band" points=${pts} stroke-width=${2 * radius} style="--band:${2 * radius}"></polyline>
      <polyline class="hose-reach" points=${pts} stroke-width=${2 * radius + 2 * border} mask="url(#${mask})"></polyline>
      <polyline class="hose-line" points=${pts}></polyline>
      ${points.map((p, i) => (i === 0 || i === points.length - 1 ? svg`<circle class="hose-end" cx=${p[0]} cy=${p[1]} r=${3.5 * px}></circle>` : nothing))}
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
    const minPts = zone.type === "hose" ? 2 : 3;
    if (zone.type !== "sprinkler" && zone.polygon.length >= minPts) {
      const pts = zone.polygon;
      const segments = zone.type === "hose" ? pts.slice(0, -1) : pts;
      const reach =
        zone.type === "hose" && zone.radius_m
          ? (() => {
              const h = hoseRadiusHandle(pts, zone.radius_m);
              const foot = hoseRadiusHandle(pts, 0);
              return [
                svg`<line class="guide" x1=${foot[0]} y1=${foot[1]} x2=${h[0]} y2=${h[1]}></line>`,
                handle(h, { type: "hose-radius", id: zone.id }, "radius", "Reichweite ändern"),
              ];
            })()
          : [];
      return [
        ...reach,
        ...segments.map((p, i) => {
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

  private renderFeatures(px: number) {
    // Flächen unten, Linien darüber, Punkte (Hahn, Baum, Beschriftung) oben,
    // damit man den Hahn auch dort anfassen kann, wo eine Zuleitung beginnt.
    const order = { area: 0, line: 1, point: 2 } as const;
    const sorted = [...this.features].sort((a, b) => order[family(a.kind)] - order[family(b.kind)]);
    return sorted.map((f) => {
      const sel = this.selected?.kind === "feature" && this.selected.id === f.id;
      const fam = family(f.kind);
      const down = (e: PointerEvent) => {
        if (this.tool !== "select") return;
        this.selected = { kind: "feature", id: f.id };
        this.tab = "plan";
        this.startDrag(e, { type: "f-move", id: f.id, start: this.toPlan(e), orig: structuredClone(f) });
      };
      const cls = `feature ${f.kind} ${sel ? "selected" : ""} ${f.locked ? "locked" : ""}`;
      if (fam === "area") {
        const c = centroid(f.points);
        const soil = f.kind === "soil" ? SOIL_COLORS[f.soil_type ?? ""] ?? "#a9825a" : "";
        return svg`<polygon class=${cls} points=${f.points.map((p) => p.join(",")).join(" ")}
          style=${soil ? `fill:${soil}44;stroke:${soil}` : ""}
          @pointerdown=${down}><title>${featureName(f)}${f.kind === "soil" ? `: ${this.soilName(f.soil_type)}` : ""}</title></polygon>
          ${f.label
            ? svg`<text class="feature-name" x=${c[0]} y=${c[1]} dy=${4 * px} font-size=${12 * px}
                stroke-width=${3 * px}>${f.label}</text>`
            : nothing}`;
      }
      if (fam === "line") {
        const plot = f.kind === "boundary" && f.points.length >= 3 ? centroid(f.points) : null;
        return svg`<g class=${cls} @pointerdown=${down}>
          <polyline class="hit" points=${f.points.map((p) => p.join(",")).join(" ")} stroke-width=${12 * px}></polyline>
          <polyline points=${f.points.map((p) => p.join(",")).join(" ")}></polyline>
          <title>${featureName(f)}${plot ? `: ${fmtArea(polygonArea(f.points))}` : ""}</title></g>
          ${plot && sel
            ? svg`<text class="feature-name plot" x=${plot[0]} y=${plot[1]} font-size=${13 * px} stroke-width=${3 * px}>
                Grundstück ${fmtArea(polygonArea(f.points))}</text>`
            : nothing}`;
      }
      const [x, y] = f.points[0];
      if (f.kind === "tree") {
        return svg`<g class=${cls} @pointerdown=${down}>
          <circle cx=${x} cy=${y} r=${f.radius_m ?? 1}></circle>
          <circle class="trunk" cx=${x} cy=${y} r=${Math.max(3 * px, (f.trunk_m ?? 0) / 2)}></circle>
          <title>${featureName(f)}</title></g>`;
      }
      if (f.kind === "label") {
        return svg`<text class=${cls} x=${x} y=${y} font-size=${14 * px} stroke-width=${3 * px}
          @pointerdown=${down}>${f.label}</text>`;
      }
      const flowing = this.waterFlowing();
      return svg`<g class="${cls} ${flowing ? "open" : ""}" @pointerdown=${down}>
        <circle cx=${x} cy=${y} r=${8 * px}></circle>
        <text x=${x} y=${y} dy=${4 * px} font-size=${11 * px}>H</text>
        ${flowing
          ? svg`<path class="drip" d=${`M${x} ${y + 10 * px} q${-3 * px} ${4 * px} 0 ${6 * px} q${3 * px} ${-2 * px} 0 ${-6 * px} Z`}></path>`
          : nothing}
        <title>${featureName(f)}: ${flowing ? "Wasser fließt" : "zu"}</title></g>`;
    });
  }

  private renderFeatureHandles(px: number) {
    if (this.tool !== "select" || this.selected?.kind !== "feature") return nothing;
    const f = this.feature(this.selected.id);
    if (!f || f.locked) return nothing;
    const r = 7 * px;
    const fam = family(f.kind);
    if (fam === "point") {
      if (f.kind !== "tree") return nothing;
      const [x, y] = f.points[0];
      const rp = polar(f.points[0], f.radius_m ?? 1, 135);
      return svg`
        <circle class="handle center" cx=${x} cy=${y} r=${r}
          @pointerdown=${(e: PointerEvent) => this.startDrag(e, { type: "f-move", id: f.id, start: this.toPlan(e), orig: structuredClone(f) })}></circle>
        <circle class="handle" cx=${rp[0]} cy=${rp[1]} r=${r}
          @pointerdown=${(e: PointerEvent) => this.startDrag(e, { type: "f-radius", id: f.id })}><title>Kronengröße</title></circle>`;
    }
    const pts = f.points;
    const closed = fam === "area";
    const mids = (closed ? pts : pts.slice(0, -1)).map((p, i) => {
      const q = pts[(i + 1) % pts.length];
      const m: Point = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
      return svg`<circle class="handle mid" cx=${m[0]} cy=${m[1]} r=${r * 0.7}
        @pointerdown=${(e: PointerEvent) => this.insertFeatureVertex(e, f, i)}><title>Ziehen: neuen Punkt einfügen</title></circle>`;
    });
    return [
      ...mids,
      ...pts.map(
        (p, i) => svg`<circle class="handle" cx=${p[0]} cy=${p[1]} r=${r}
          @pointerdown=${(e: PointerEvent) => this.startDrag(e, { type: "f-vertex", id: f.id, index: i })}
          @contextmenu=${(e: MouseEvent) => this.removeFeatureVertex(e, f, i)}
          @dblclick=${(e: MouseEvent) => this.removeFeatureVertex(e, f, i)}><title>Ziehen: verschieben · Doppelklick: löschen</title></circle>`,
      ),
    ];
  }

  private insertFeatureVertex(event: PointerEvent, f: Feature, index: number): void {
    if (this.tool !== "select") return;
    event.stopPropagation();
    this.remember();
    const a = f.points[index];
    const b = f.points[(index + 1) % f.points.length];
    f.points.splice(index + 1, 0, [round((a[0] + b[0]) / 2), round((a[1] + b[1]) / 2)]);
    this.changed();
    const svgEl = this.renderRoot.querySelector("svg.plan") as SVGSVGElement;
    svgEl.setPointerCapture(event.pointerId);
    this.drag = { type: "f-vertex", id: f.id, index: index + 1 };
  }

  private removeFeatureVertex(event: MouseEvent, f: Feature, index: number): void {
    event.preventDefault();
    event.stopPropagation();
    const min = family(f.kind) === "area" ? 3 : 2;
    if (f.points.length <= min) {
      this.showToast(`${FEATURE_META[f.kind].label}: mindestens ${min} Punkte`, true);
      return;
    }
    this.remember();
    f.points.splice(index, 1);
    this.changed();
  }

  /** Messwerkzeug: Strecken mit Längen und Summe. */
  private renderMeasure(px: number) {
    if (this.tool !== "measure" || !this.measurePts.length) return nothing;
    const pts = this.hover ? [...this.measurePts, this.hover] : this.measurePts;
    const labels = pts.slice(1).map((q, i) => {
      const p = pts[i];
      if (distance(p, q) < 0.01) return nothing;
      const m: Point = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
      return svg`<text class="measure-label" x=${m[0]} y=${m[1]} dy=${-6 * px} font-size=${13 * px}
        stroke-width=${3 * px}>${fmtLength(distance(p, q))}</text>`;
    });
    return svg`<g class="measure">
      <polyline points=${pts.map((p) => p.join(",")).join(" ")}></polyline>
      ${this.measurePts.map((p) => svg`<circle cx=${p[0]} cy=${p[1]} r=${4 * px}></circle>`)}
      ${labels}
    </g>`;
  }

  /** Mittelpunkt einer gezeichneten Zone (für Beschriftung und Verbindungslinie). */
  private zoneAnchor(zone: PlanZone): Point | null {
    if (zone.type === "sprinkler") return zone.center && zone.radius_m ? zone.center : null;
    if (zone.type === "hose") return zone.polygon.length >= 2 ? pointAlong(zone.polygon, 0.5) : null;
    return zone.polygon.length >= 3 ? centroid(zone.polygon) : null;
  }

  /** Gestrichelte Linie von jeder Zone zu ihrem Ventil (wenn beide im Plan sind). */
  /**
   * Animation beim Gießen: Wasser fließt vom Hahn durch die Zuleitungen zum
   * offenen Ventil; Sprinkler zeigen Wellen. Nur Anzeige, aus dem Zustand.
   */
  private renderFlow(px: number) {
    const running = this.plan!.zones.filter((z) => this.status?.zones[z.id]?.state === "running");
    if (!running.length) return nothing;
    const taps = this.features.filter((f) => f.kind === "tap").map((f) => f.points[0]);
    const lines = this.pipeLines();
    return svg`<g class="flow">
      ${running.map((zone) => {
        const valve = this.plan!.valves.find((v) => v.id === zone.valve_id);
        const route = valve?.position && taps.length ? pipeRoute(lines, taps, valve.position) : [];
        const spray =
          zone.type === "sprinkler" && zone.center && zone.radius_m
            ? [0, 1].map(
                (i) => svg`<path class="spray" style=${`transform-origin:${zone.center![0]}px ${zone.center![1]}px;animation-delay:${i * 0.8}s`}
                  d=${sectorPath(zone.center!, zone.radius_m!, zone.start_angle_deg, zone.arc_deg)}></path>`,
              )
            : nothing;
        return svg`
          ${route.map(([a, b]) => svg`<line class="pipe-active" x1=${a[0]} y1=${a[1]} x2=${b[0]} y2=${b[1]}></line>`)}
          ${route.map(([a, b]) => svg`<line class="water" x1=${a[0]} y1=${a[1]} x2=${b[0]} y2=${b[1]}
            stroke-dasharray=${`${3 * px} ${7 * px}`} style=${`--period:${10 * px}px`}></line>`)}
          ${valve?.position ? svg`<circle class="valve-open" cx=${valve.position[0]} cy=${valve.position[1]} r=${11 * px}></circle>` : nothing}
          ${spray}`;
      })}
    </g>`;
  }

  /**
   * Leitung vom Ventil zur Zone: durch die Zwischenpunkte, Ecken abgerundet.
   * Ist die Zone ausgewählt, lassen sich Punkte einfügen (Ziehen an der
   * Mitte eines Stücks), verschieben und löschen (Doppelklick).
   */
  private renderValveLinks(px: number) {
    return this.plan!.zones.map((zone, index) => {
      const valve = this.plan!.valves.find((v) => v.id === zone.valve_id);
      const to = this.zoneAnchor(zone);
      if (!valve?.position || !to) return nothing;
      const zoneSelected = this.selected?.kind === "zone" && this.selected.id === zone.id;
      const selected = zoneSelected || (this.selected?.kind === "valve" && this.selected.id === valve.id);
      const editable = selected && this.tool === "select";
      const route = zone.valve_route ?? [];
      const pts: Point[] = [valve.position, ...route, to];
      const flowing = this.status?.zones[zone.id]?.state === "running";
      const path = svg`<path class="valve-link ${selected ? "selected" : ""} ${flowing ? "flowing" : ""}" style="--zone:${this.zoneColor(index)};--period:${10 * px}px"
        d=${roundedPath(pts, Math.max(0.4, 16 * px))} stroke-dasharray=${`${6 * px} ${4 * px}`}></path>`;
      if (!editable) return path;
      const r = 7 * px;
      const d = roundedPath(pts, Math.max(0.4, 16 * px));
      return svg`${path}
        <path class="link-hit" d=${d} stroke-width=${14 * px}
          @pointerdown=${(e: PointerEvent) => this.grabLink(e, zone, pts)}>
          <title>Linie ziehen: Knick einfügen</title></path>
        ${pts.slice(0, -1).map((p, i) => {
          const q = pts[i + 1];
          const m: Point = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
          return svg`<circle class="handle mid link" cx=${m[0]} cy=${m[1]} r=${r * 0.7}
            @pointerdown=${(e: PointerEvent) => this.insertRoutePoint(e, zone, i, m)}>
            <title>Ziehen: Knick in der Leitung einfügen</title></circle>`;
        })}
        ${route.map(
          (p, i) => svg`<circle class="handle link" cx=${p[0]} cy=${p[1]} r=${r}
            @pointerdown=${(e: PointerEvent) => this.startDrag(e, { type: "route", id: zone.id, index: i })}
            @dblclick=${(e: MouseEvent) => this.removeRoutePoint(e, zone, i)}
            @contextmenu=${(e: MouseEvent) => this.removeRoutePoint(e, zone, i)}>
            <title>Ziehen: verschieben · Doppelklick: löschen</title></circle>`,
        )}`;
    });
  }

  /** Leitung irgendwo anfassen: dort entsteht ein Knick, der gleich mitgezogen wird. */
  private grabLink(event: PointerEvent, zone: PlanZone, pts: Point[]): void {
    if (this.tool !== "select" || event.button !== 0) return;
    const p = this.toPlan(event);
    let best = 0;
    let bestDist = Number.POSITIVE_INFINITY;
    for (let i = 0; i < pts.length - 1; i++) {
      const dist = distanceToSegment(p, pts[i], pts[i + 1]);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    }
    this.selected = { kind: "zone", id: zone.id };
    this.insertRoutePoint(event, zone, best, p);
  }

  private insertRoutePoint(event: PointerEvent, zone: PlanZone, index: number, at: Point): void {
    if (this.tool !== "select") return;
    event.stopPropagation();
    this.remember();
    const route = [...(zone.valve_route ?? [])];
    route.splice(index, 0, [round(at[0]), round(at[1])]);
    zone.valve_route = route;
    this.changed();
    const svgEl = this.renderRoot.querySelector("svg.plan") as SVGSVGElement;
    svgEl.setPointerCapture(event.pointerId);
    this.drag = { type: "route", id: zone.id, index };
  }

  private removeRoutePoint(event: MouseEvent, zone: PlanZone, index: number): void {
    event.preventDefault();
    event.stopPropagation();
    this.remember();
    zone.valve_route = (zone.valve_route ?? []).filter((_, i) => i !== index);
    this.changed();
  }

  private renderSnapHint(px: number) {
    if (!this.snapHint) return nothing;
    return svg`<circle class="snap-hint" cx=${this.snapHint[0]} cy=${this.snapHint[1]} r=${9 * px}></circle>`;
  }

  private renderDraft(px: number) {
    if (this.tool === "feature" && this.draft.length) {
      const pts = this.hover ? [...this.draft, this.hover] : this.draft;
      const closed = family(this.featureKind) === "area";
      return svg`
        <g class="draft feature-draft ${this.featureKind}">
          <polyline points=${[...pts, ...(closed && pts.length > 2 ? [pts[0]] : [])].map((p) => p.join(",")).join(" ")}></polyline>
          ${this.draft.map((p, i) => svg`<circle cx=${p[0]} cy=${p[1]} r=${(i === 0 ? 7 : 5) * px}></circle>`)}
        </g>`;
    }
    if (this.tool === "hose" && this.draft.length) {
      const pts = this.hover ? [...this.draft, this.hover] : this.draft;
      return svg`<g class="draft">
        ${pts.length >= 2 ? svg`<g class="zone" style="--zone:#1e88e5">${this.hoseShape("draft", pts, this.hoseRadius, px)}</g>` : nothing}
        <polyline points=${pts.map((p) => p.join(",")).join(" ")} style="fill:none"></polyline>
        ${this.draft.map((p) => svg`<circle cx=${p[0]} cy=${p[1]} r=${5 * px}></circle>`)}
      </g>`;
    }
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
    const letter = SENSOR_LETTER[(item as PlanSensor).kind] ?? "S";
    const r = 11 * px;
    const open = kind === "valve" && this.valveOpen(item.id);
    if (kind === "valve") {
      // Ventil-Symbol: zwei Dreiecke; der Griff steht quer (zu) oder längs (offen).
      const s = 6 * px;
      return svg`
        <g class="marker valve ${selected ? "selected" : ""} ${open ? "open" : ""}"
          @pointerdown=${(e: PointerEvent) => {
            if (this.tool !== "select") return;
            this.selected = { kind, id: item.id };
            this.tab = "zones";
            this.startDrag(e, { type: "marker", kind, id: item.id });
          }}>
          <rect x=${x - r} y=${y - r} width=${2 * r} height=${2 * r} rx=${4 * px}></rect>
          <path class="bowtie" d=${`M${x - s} ${y - s * 0.7} L${x + s} ${y + s * 0.7} L${x + s} ${y - s * 0.7} L${x - s} ${y + s * 0.7} Z`}></path>
          ${open
            ? svg`<line class="handle-bar" x1=${x - s} y1=${y - s * 1.25} x2=${x + s} y2=${y - s * 1.25}></line>`
            : svg`<line class="handle-bar" x1=${x} y1=${y} x2=${x} y2=${y - s * 1.45}></line>`}
          <title>${item.name}: ${open ? "offen" : "zu"}</title>
        </g>`;
    }
    return svg`
      <g class="marker ${kind} ${selected ? "selected" : ""}"
        @pointerdown=${(e: PointerEvent) => {
          if (this.tool !== "select") return;
          this.selected = { kind, id: item.id };
          this.tab = "zones";
          this.startDrag(e, { type: "marker", kind, id: item.id });
        }}>
        <circle cx=${x} cy=${y} r=${r}></circle>
        <text x=${x} y=${y} font-size=${12 * px} dy=${4.2 * px}>${letter}</text>
        <title>${item.name}</title>
      </g>`;
  }

  private valveOpen(valveId: string): boolean {
    return this.plan!.zones.some((z) => z.valve_id === valveId && this.status?.zones[z.id]?.state === "running");
  }

  private waterFlowing(): boolean {
    return Object.values(this.status?.zones ?? {}).some((z) => z.state === "running");
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
        <button class="icon" title="Grundstück zeigen (ohne Grenze: alles)" @click=${this.fitView}><ha-icon icon="mdi:fit-to-screen-outline"></ha-icon></button>
        <button class="icon ${this.wetOn ? "on" : ""}" title="Wasser-Ansichten: Gießmenge und Bodenfeuchte als Raster"
          @click=${() => (this.rasterMenu = !this.rasterMenu)}>
          <ha-icon icon="mdi:water-percent"></ha-icon>
        </button>
        <button class="icon ${this.soilOn ? "on" : ""}" title="Bodenansicht: Zonen nach Bodenart"
          @click=${() => (this.soilOn = !this.soilOn)}>
          <ha-icon icon="mdi:layers-triple-outline"></ha-icon>
        </button>
        <button class="icon ${this.tool === "measure" ? "on" : ""}" title="Abstand messen"
          @click=${() => (this.tool === "measure" ? this.cancelTool() : this.startTool("measure"))}>
          <ha-icon icon="mdi:tape-measure"></ha-icon>
        </button>
        ${g.background === "map"
          ? html`<button class="icon ${this.layersOpen ? "on" : ""}" title="Kartenansicht wechseln"
              @click=${() => (this.layersOpen = !this.layersOpen)}>
              <ha-icon icon="mdi:layers-outline"></ha-icon>
            </button>`
          : nothing}
        ${g.background === "map"
          ? html`<button class="icon ${this.searchOpen ? "on" : ""}" title="Adresse suchen"
              @click=${() => (this.searchOpen ? this.closeSearch() : this.openSearch())}>
              <ha-icon icon="mdi:magnify"></ha-icon>
            </button>`
          : nothing}
        ${g.background !== "image"
          ? html`<button class="icon ${this.locating ? "on" : ""}" title="Orten: Karte zu meinem Standort"
              ?disabled=${this.locating} @click=${this.goToMe}>
              <ha-icon icon=${this.locating ? "mdi:crosshairs-question" : "mdi:crosshairs-gps"}></ha-icon>
            </button>`
          : nothing}
      </div>
      ${banner} ${this.renderSearch()} ${this.renderLayers()} ${this.renderRasterMenu()}
      <div class="compass" style="transform: rotate(${g.background === "image" ? -g.north_deg : 0}deg)" title="Norden">
        <svg viewBox="-12 -12 24 24"><path d="M0 -10 L4 2 L0 0 L-4 2 Z" class="n"></path><path d="M0 10 L4 2 L0 0 L-4 2 Z" class="s"></path></svg>
        <span>N</span>
      </div>
      <div class="scalebar"><div style="width:${bar.px}px"></div><span>${bar.label}</span></div>
      ${this.wetOn ? this.renderWetLegend() : nothing}
      ${this.soilOn && !this.wetOn ? this.renderSoilLegend() : nothing}
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
    return this.features.length > 0 || this.plan!.zones.some((z) => liveArea(z) !== null);
  }

  private toolBanner() {
    if (this.tool === "select") return nothing;
    let text = "";
    let actions: TemplateResult | typeof nothing = nothing;
    const name = this.toolTarget ? this.zoneOrMarkerName(this.toolTarget) : "";
    if (this.tool === "sprinkler") text = `${name}: Am Sprinkler drücken und bis zum Rand ziehen.`;
    if (this.tool === "hose") {
      text = `${name}: Den Verlauf des Schlauchs als Linie anklicken, Doppelklick beendet.`;
      actions = html`<label class="inline">Reichweite
          <input type="number" min="0.05" max="20" step="0.05" .value=${String(this.hoseRadius)}
            @input=${(e: Event) => {
              const v = Number((e.target as HTMLInputElement).value);
              if (v > 0) this.hoseRadius = Math.min(20, v);
            }} /> m</label>
        <button class="text" ?disabled=${this.draft.length < 2} @click=${this.finishHose}>Fertig</button>`;
    }
    if (this.tool === "bed") {
      text = `${name}: Ecken anklicken, zum Schließen den ersten Punkt.`;
      actions = html`<button class="text" ?disabled=${this.draft.length < 3} @click=${this.finishBed}>Fertig</button>`;
    }
    if (this.tool === "place") {
      const geo = this.plan!.garden.background === "map";
      text = `${name}: Auf die Stelle im Plan klicken${geo ? " oder an deinen Standort setzen" : ""}.`;
      if (geo) {
        actions = html`<button class="text" ?disabled=${this.locating} @click=${this.placeAtMe}><ha-icon icon="mdi:crosshairs-gps"></ha-icon>Mein Standort</button>`;
      }
    }
    if (this.tool === "feature") {
      const meta = FEATURE_META[this.featureKind];
      const fam = meta.family;
      text =
        fam === "area"
          ? `${meta.label}: Ecken anklicken, zum Schließen den ersten Punkt.`
          : fam === "line"
            ? `${meta.label}: Punkte anklicken, Doppelklick beendet.`
            : this.featureKind === "tree"
              ? `${meta.label}: In die Mitte drücken und bis zum Kronenrand ziehen.`
              : `${meta.label}: Auf die Stelle klicken.`;
      if (fam !== "point") {
        actions = html`<button
          class="text"
          ?disabled=${this.draft.length < (fam === "area" ? 3 : 2)}
          @click=${this.finishFeature}
        >
          Fertig
        </button>`;
      }
    }
    if (this.tool === "measure") {
      const total = pathLength(this.measurePts);
      text =
        this.measurePts.length < 2
          ? "Messen: Punkte anklicken. Alt-Taste: ohne Einrasten."
          : `Gemessen: ${fmtLength(total)}${this.measurePts.length > 2 ? " (Summe)" : ""}`;
      if (this.measurePts.length) {
        actions = html`<button class="text" @click=${() => (this.measurePts = [])}>Neu</button>`;
      }
    }
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
          <ha-icon icon=${isSprinkler ? "mdi:sprinkler-variant" : zone.type === "hose" ? "mdi:pipe" : "mdi:water-outline"}></ha-icon>
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
    const drawTool: Tool = isSprinkler ? "sprinkler" : zone.type === "hose" ? "hose" : "bed";
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
    const TYPES: [PlanZone["type"], string, string][] = [
      ["sprinkler", "Sprinkler", "mdi:sprinkler-variant"],
      ["drip", "Beet / Tropfschlauch", "mdi:water-outline"],
      ["hose", "Gießschlauch", "mdi:pipe"],
    ];
    return html`
      <div class="inspector">
        <div class="field wide">
          <span>Art</span>
          <div class="levels" role="radiogroup">
            ${TYPES.map(
              ([type, label, icon]) => html`<button role="radio" aria-checked=${zone.type === type ? "true" : "false"}
                class=${zone.type === type ? "active" : ""} @click=${() => this.setZoneType(zone, type)}>
                <ha-icon icon=${icon}></ha-icon>${label}</button>`,
            )}
          </div>
          <small class="hint">${zone.type === "hose"
            ? "Eine Linie, darum die Reichweite (Radius)."
            : zone.type === "sprinkler"
              ? "Kreis oder Kreisausschnitt um den Sprinkler."
              : "Eine Fläche aus Ecken."}</small>
        </div>
        <label class="field wide">
          <span>Ventil</span>
          <select
            @change=${(e: Event) => {
              const value = (e.target as HTMLSelectElement).value;
              this.remember();
              zone.valve_id = value || null;
              for (const v of this.plan!.valves) {
                v.zone_ids = v.zone_ids.filter((id) => id !== zone.id);
                if (v.id === zone.valve_id) v.zone_ids.push(zone.id);
              }
              this.changed();
            }}
          >
            <option value="" ?selected=${!zone.valve_id}>kein Ventil</option>
            ${this.plan!.valves.map(
              (v) => html`<option value=${v.id} ?selected=${zone.valve_id === v.id}>
                ${v.name}${v.zone_ids.some((id) => id !== zone.id) ? " (auch andere Zonen)" : ""}
              </option>`,
            )}
          </select>
        </label>
        ${this.renderValveFlow(zone)}
        ${this.renderPlantSoil(zone)}
        ${!this.plan!.valves.find((v) => v.id === zone.valve_id)?.position && zone.valve_id
          ? html`<p class="hint small">Setze das Ventil im Plan (unten „Platzieren“), dann siehst du die Verbindung.</p>`
          : zone.valve_id
            ? html`<p class="hint small">
                Leitung zum Ventil: die Linie im Plan anfassen und ziehen, dort entsteht ein Knick
                (Doppelklick auf einen Knick löscht ihn). Die Ecken werden rund.
                ${zone.valve_route?.length
                  ? html`<button class="text" @click=${() => {
                      this.remember();
                      zone.valve_route = [];
                      this.changed();
                    }}><ha-icon icon="mdi:vector-line"></ha-icon>Leitung wieder gerade</button>`
                  : nothing}
              </p>`
            : nothing}
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
        ${zone.type === "hose" && drawn
          ? html`<div class="fields">
                ${num("Reichweite (Radius)", zone.radius_m, "m", (v) => (zone.radius_m = Math.min(20, Math.max(0.05, v))), 0.05)}
              </div>
              <p class="hint small">Schlauch ${fmtLength(pathLength(zone.polygon))} lang. Bewässert wird alles bis
                ${fmtLength(zone.radius_m ?? 0)} um die Linie: ${fmtArea(liveArea(zone))}.
                Reichweite auch am runden Anfasser im Plan ziehen.</p>
              ${this.renderEdges(zone.polygon, false, (pts) => (zone.polygon = pts))}`
          : nothing}
        ${zone.type === "drip" && drawn
          ? this.renderEdges(zone.polygon, true, (pts) => (zone.polygon = pts))
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
          ${st && (st.state === "running" || st.state === "queued")
            ? html`<button class="text danger" title=${st.state === "running" ? "Gießen abbrechen, das Ventil schließt" : "Aus der Warteschlange nehmen"}
                @click=${() => this.cancelZone(zone)}>
                <ha-icon icon="mdi:stop"></ha-icon>${st.state === "running" ? "Gießen abbrechen" : "Herausnehmen"}
              </button>`
            : html`<button class="text" title="In die Warteschlange einreihen" ?disabled=${this.status?.winter_mode}
                @click=${() => this.waterNow(zone)}>
                <ha-icon icon="mdi:watering-can"></ha-icon>Jetzt gießen
              </button>`}
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
                this.removed(`${item.name}: vom Plan genommen`);
              }}><ha-icon icon="mdi:close"></ha-icon></button>`
            : nothing}
        </div>
      </li>
    `;
  }

  /** Regler für die Deckkraft des Luftbilds oder Bilds (zum Abpausen). */
  private renderOpacity(): TemplateResult | typeof nothing {
    const g = this.plan!.garden;
    if (g.background === "none") return nothing;
    const value = Math.round((g.background_opacity ?? 1) * 100);
    return html`
      <label class="slider">
        <span>${g.background === "map" ? "Luftbild" : "Bild"} sichtbar</span>
        <input
          id="opacity"
          type="range"
          min="0"
          max="100"
          step="5"
          .value=${String(value)}
          @pointerdown=${() => this.remember()}
          @keydown=${() => this.remember()}
          @input=${(e: Event) => {
            this.plan!.garden.background_opacity = Number((e.target as HTMLInputElement).value) / 100;
            this.changed();
          }}
        />
        <output>${value} %</output>
      </label>
    `;
  }

  /** Kantenlängen ansehen und als Zahl eintippen (genauer als das Luftbild). */
  private renderEdges(points: Point[], closed: boolean, apply: (pts: Point[]) => void): TemplateResult {
    const lengths = edgeLengths(points, closed);
    return html`
      <details class="edges">
        <summary>Seitenlängen (${lengths.length})</summary>
        <div class="edge-list">
          ${lengths.map(
            (len, i) => html`<label class="field">
              <span>Seite ${i + 1}</span>
              <input
                type="number"
                step="0.05"
                min="0.05"
                .value=${len.toFixed(2)}
                @change=${(e: Event) => {
                  const v = parseFloat((e.target as HTMLInputElement).value.replace(",", "."));
                  if (!(v > 0)) return;
                  this.remember();
                  apply(setEdgeLength(points, i, v).map((p) => [round(p[0]), round(p[1])] as Point));
                  this.changed();
                }}
              />
              <span class="unit">m</span>
            </label>`,
          )}
        </div>
        <p class="hint small">Eine Länge ändern verschiebt den Endpunkt dieser Seite.</p>
      </details>
    `;
  }

  private renderPlanTab(): TemplateResult {
    const sel = this.selected?.kind === "feature" ? this.feature(this.selected.id) : null;
    const tool = (kind: string) => {
      const meta = FEATURE_META[kind];
      const active = this.tool === "feature" && this.featureKind === kind;
      return html`<button
        class="tool ${active ? "active" : ""}"
        title=${meta.label}
        @click=${() => (active ? this.cancelTool() : this.startTool("feature", kind))}
      >
        <ha-icon icon=${meta.icon}></ha-icon><span>${meta.label}</span>
      </button>`;
    };
    return html`
      <p class="hint small">
        Pause Haus, Wege, Zäune und Bäume vom Luftbild ab. Dann kannst du das Luftbild abblenden und
        bleibst in jeder Zoomstufe scharf. Der Grundriss dient nur zur Orientierung.
      </p>
      ${this.renderOpacity()}
      <h3>Flächen</h3>
      <div class="palette">${["building", "paving", "water", "area", "soil"].map(tool)}</div>
      <h3>Linien</h3>
      <div class="palette">${["fence", "hedge", "boundary", "pipe"].map(tool)}</div>
      <p class="hint small">Zuleitung vom Wasserhahn zu den Ventilen: am Hahn beginnen, Punkte setzen, am Ventil enden.
        Eine neue Zuleitung, die auf einer bestehenden beginnt, wird ein Abzweig (Punkt im Plan).</p>
      <h3>Punkte</h3>
      <div class="palette">${["tree", "tap", "label"].map(tool)}</div>
      <label class="check">
        <input type="checkbox" .checked=${this.snapOn} @change=${(e: Event) => (this.snapOn = (e.target as HTMLInputElement).checked)} />
        An Ecken einrasten <small>(Alt-Taste: kurz aus)</small>
      </label>
      ${this.features.length
        ? html`<div class="list-head">
              <h3>Im Plan (${this.features.length})</h3>
              <span class="spacer"></span>
              ${this.features.some((f) => !f.locked)
                ? html`<button class="text" @click=${() => this.setLocked(this.features, true)}>
                    <ha-icon icon="mdi:lock"></ha-icon>Alle sperren</button>`
                : html`<button class="text" @click=${() => this.setLocked(this.features, false)}>
                    <ha-icon icon="mdi:lock-open-variant-outline"></ha-icon>Alle entsperren</button>`}
            </div>
            <p class="hint small">Gesperrte Formen lassen sich im Plan nicht anfassen oder verschieben; Klicks gehen zum Plan darunter.
              Bearbeiten: hier in der Liste auswählen und entsperren.</p>
            <ul class="list compact">
              ${this.features.map((f) => this.renderFeatureItem(f, sel?.id === f.id))}
            </ul>`
        : nothing}
    `;
  }

  private renderFeatureItem(f: Feature, open: boolean): TemplateResult {
    const meta = FEATURE_META[f.kind];
    const fam = meta?.family ?? "area";
    const info =
      fam === "area"
        ? fmtArea(polygonArea(f.points))
        : fam === "line"
          ? f.kind === "boundary" && f.points.length >= 3
            ? `${fmtArea(polygonArea(f.points))} · ${fmtLength(pathLength(f.points, true))} Umfang`
            : fmtLength(pathLength(f.points))
          : f.kind === "tree"
            ? `Ø ${fmtLength(2 * (f.radius_m ?? 0))}`
            : "";
    const sameFamily = Object.entries(FEATURE_META).filter(([, m]) => m.family === fam);
    return html`
      <li class="item ${open ? "open" : ""}">
        <div class="row" @click=${() => (this.selected = open ? null : { kind: "feature", id: f.id })}>
          <ha-icon icon=${meta?.icon ?? "mdi:shape-outline"}></ha-icon>
          <span class="name">${featureName(f)}</span>
          <span class="meta">${info}</span>
          <button class="icon small lock ${f.locked ? "on" : ""}"
            title=${f.locked ? "Gesperrt: im Plan nicht verschiebbar. Klicken zum Entsperren" : "Sperren: im Plan nicht mehr verschiebbar"}
            @click=${(e: Event) => {
              e.stopPropagation();
              this.setLocked([f], !f.locked);
            }}>
            <ha-icon icon=${f.locked ? "mdi:lock" : "mdi:lock-open-variant-outline"}></ha-icon>
          </button>
        </div>
        ${open
          ? html`<div class="inspector">
              ${f.kind !== "label" && sameFamily.length > 1
                ? html`<label class="field wide">
                    <span>Art</span>
                    <select
                      .value=${f.kind}
                      @change=${(e: Event) => {
                        this.remember();
                        f.kind = (e.target as HTMLSelectElement).value;
                        if (f.kind === "soil" && !f.soil_type) f.soil_type = "loam";
                        this.changed();
                      }}
                    >
                      ${sameFamily.map(([k, m]) => html`<option value=${k} ?selected=${k === f.kind}>${m.label}</option>`)}
                    </select>
                  </label>`
                : nothing}
              <label class="field wide">
                <span>${f.kind === "label" ? "Text" : "Name (optional)"}</span>
                <input
                  id=${f.kind === "label" ? "feature-label" : "feature-name"}
                  type="text"
                  maxlength=${MAX_LABEL_LENGTH}
                  .value=${f.label ?? ""}
                  @change=${(e: Event) => {
                    const v = (e.target as HTMLInputElement).value.trim();
                    if (f.kind === "label" && !v) return;
                    this.remember();
                    f.label = v || null;
                    this.changed();
                  }}
                />
              </label>
              ${f.kind === "soil"
                ? html`<label class="field wide">
                    <span>Bodenart</span>
                    <select
                      @change=${(e: Event) => {
                        this.remember();
                        f.soil_type = (e.target as HTMLSelectElement).value;
                        this.changed();
                      }}
                    >
                      ${Object.entries(this.plan!.catalog.soils).map(
                        ([k, s]) => html`<option value=${k} ?selected=${k === f.soil_type}>${s.name}</option>`,
                      )}
                    </select>
                  </label>
                  <p class="hint small">Zonen in dieser Fläche können den Boden mit einem Klick übernehmen.</p>`
                : nothing}
              ${f.kind === "tree"
                ? html`<label class="field wide">
                    <span>Kronendurchmesser</span>
                    <input
                      type="number"
                      step="0.1"
                      min="0.2"
                      .value=${(2 * (f.radius_m ?? 0)).toFixed(1)}
                      @change=${(e: Event) => {
                        const v = parseFloat((e.target as HTMLInputElement).value);
                        if (!(v > 0)) return;
                        this.remember();
                        f.radius_m = round(v / 2);
                        this.changed();
                      }}
                    />
                    <span class="unit">m</span>
                  </label>
                  <label class="field wide">
                    <span>Stammdurchmesser (0 = unbekannt)</span>
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      .value=${(f.trunk_m ?? 0).toFixed(2)}
                      @change=${(e: Event) => {
                        const v = parseFloat((e.target as HTMLInputElement).value);
                        if (!(v >= 0)) return;
                        this.remember();
                        f.trunk_m = v > 0 ? Math.min(round(v), 2 * (f.radius_m ?? 0)) : null;
                        this.changed();
                      }}
                    />
                    <span class="unit">m</span>
                  </label>
                  <p class="hint small">Ein dicker Stamm hält den Strahl eines Sprinklers auf. Die Nässekarte zeigt dahinter einen Wasserschatten.</p>`
                : nothing}
              ${fam !== "point"
                ? this.renderEdges(f.points, fam === "area", (pts) => (f.points = pts))
                : nothing}
              <div class="actions">
                <span class="spacer"></span>
                <button class="text danger" @click=${() => this.deleteFeature(f.id)}>
                  <ha-icon icon="mdi:delete-outline"></ha-icon>Entfernen
                </button>
              </div>
            </div>`
          : nothing}
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
      ${this.renderOpacity()}
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
      ${g.map_provider?.startsWith("basemap_at")
        ? html`<p class="note">Von basemap.at, nur in Österreich. Lizenz CC BY 4.0.</p>`
        : nothing}
      ${g.map_provider === "osm"
        ? html`<p class="note">
            OpenStreetMap-Karte, weltweit. Bitte nur gelegentlich nutzen (Regeln der OpenStreetMap-Kacheln).
          </p>`
        : nothing}
      <p class="hint small">Schneller umschalten: Ebenen-Knopf links auf der Karte.</p>
      ${g.map_provider === "custom"
        ? html`<label class="field wide">
              <span>Adresse mit {z}, {x}, {y}</span>
              <input type="url" placeholder="https://…/{z}/{x}/{y}.jpg" .value=${g.map_url ?? ""}
                @change=${(e: Event) => this.updateGarden({ map_url: (e.target as HTMLInputElement).value.trim() })} />
            </label>`
        : nothing}
      <h3>Ausschnitt</h3>
      <p class="hint small">
        Such deine Adresse oder verschiebe die Karte, bis dein Garten in der Mitte liegt, und lege dort
        die Kartenmitte fest. Deine Zeichnung wandert mit. Gespeichert werden nur Mitte und Zoom, keine
        Bilder.
      </p>
      <div class="actions">
        <button class="text" @click=${this.openSearch}><ha-icon icon="mdi:magnify"></ha-icon>Adresse suchen</button>
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
  if (zone.type === "hose") {
    return zone.polygon.length >= 2 && zone.radius_m ? hoseArea(zone.polygon, zone.radius_m) : null;
  }
  return zone.polygon.length >= 3 ? polygonArea(zone.polygon) : null;
}

function fmtLength(meters: number): string {
  if (meters < 1) return `${Math.round(meters * 100)} cm`;
  return `${meters.toLocaleString("de-DE", { maximumFractionDigits: 2 })} m`;
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

/** Obergrenze des Pflanzenfaktors je Bedarfsstufe (wie catalog.NEED_LEVELS). */
function levelLimit(key: string): number {
  return { very_low: 0.45, low: 0.7, medium: 0.95, high: 1.08 }[key] ?? 9;
}
