// Nässekarte: Wie viel Wasser kommt pro Lauf wo an (Millimeter)?
//
// Je Zone: Liter pro Lauf = geplante Dauer × gelernter Durchfluss; verteilt
// auf die Fläche der Zone ergibt das Millimeter. Wo sich Zonen überlappen,
// zählen beide. Ein Baumstamm wirft beim Sprinkler einen „Wasserschatten“.
// Das ist eine Schätzung: Sprinkler verteilen in Wirklichkeit nie ganz
// gleichmäßig.

import { type Point, compass, distance, hoseArea, polygonArea, sectorArea } from "./geometry";
import type { Feature, PlanValve, PlanZone, Status } from "./types";


export function inSector(p: Point, c: Point, r: number, start: number, arc: number): boolean {
  if (distance(p, c) > r) return false;
  if (arc >= 360) return true;
  const angle = (((compass(c, p) - start) % 360) + 360) % 360;
  return angle <= arc;
}

export function inPolygon(p: Point, poly: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

export function distanceToSegment(p: Point, a: Point, b: Point): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2));
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}

export function zoneContains(zone: PlanZone, p: Point): boolean {
  if (zone.type === "sprinkler") {
    return !!(zone.center && zone.radius_m) && inSector(p, zone.center, zone.radius_m, zone.start_angle_deg, zone.arc_deg);
  }
  if (zone.type === "hose") {
    const r = zone.radius_m ?? 0;
    for (let i = 1; i < zone.polygon.length; i++) {
      if (distanceToSegment(p, zone.polygon[i - 1], zone.polygon[i]) <= r) return true;
    }
    return false;
  }
  return zone.polygon.length >= 3 && inPolygon(p, zone.polygon);
}

export function drawnArea(zone: PlanZone): number | null {
  if (zone.type === "sprinkler") return zone.center && zone.radius_m ? sectorArea(zone.radius_m, zone.arc_deg) : null;
  if (zone.type === "hose") {
    return zone.polygon.length >= 2 && zone.radius_m ? hoseArea(zone.polygon, zone.radius_m) : null;
  }
  return zone.polygon.length >= 3 ? polygonArea(zone.polygon) : null;
}

/** Liegt `p` vom Sprinkler `c` aus gesehen hinter einem Baumstamm? */
export function inTrunkShadow(p: Point, c: Point, trees: Feature[]): boolean {
  const dp = distance(c, p);
  for (const tree of trees) {
    const t = tree.points[0];
    const rt = (tree.trunk_m ?? 0) / 2;
    const dt = distance(c, t);
    if (rt <= 0 || dt <= rt || dp <= dt) continue;
    const half = (Math.asin(Math.min(1, rt / dt)) * 180) / Math.PI;
    const diff = Math.abs(((compass(c, p) - compass(c, t) + 540) % 360) - 180);
    if (diff <= half) return true;
  }
  return false;
}

/**
 * Sekunden des nächsten geplanten Laufs: so, wie die Integration plant
 * (berechnet: 0 bei keinem Bedarf). Ohne Zustand die Dauer von Hand.
 */
export function runSeconds(zone: PlanZone, status?: Status): number {
  const planned = status?.zones[zone.id]?.planned_s;
  return planned ?? zone.duration_s ?? 0;
}

/** Millimeter pro Lauf auf der Fläche der Zone (null: Durchfluss oder Fläche fehlt). */
export function mmPerRun(zone: PlanZone, valves: PlanValve[], status?: Status): number | null {
  const flow = valves.find((v) => v.id === zone.valve_id)?.learned_flow_l_min;
  const area = drawnArea(zone) ?? zone.area_m2;
  const seconds = runSeconds(zone, status);
  if (!flow || !area) return null;
  if (!seconds) return status?.zones[zone.id]?.planned_s === 0 ? 0 : null;
  return ((seconds / 60) * flow) / area;
}

/** Warum eine Zone in der Nässekarte keinen Wert hat (null = sie hat einen). */
export function wetReason(zone: PlanZone, valves: PlanValve[], status?: Status): string | null {
  if (!zone.valve_id) return "kein Ventil";
  if (!valves.find((v) => v.id === zone.valve_id)?.learned_flow_l_min) return "Durchfluss unbekannt";
  if (!(drawnArea(zone) ?? zone.area_m2)) return "keine Fläche";
  if (!runSeconds(zone, status) && status?.zones[zone.id]?.planned_s === undefined) return "keine Gießdauer";
  return null;
}

// Farben: kräftiges Hellblau (wenig) über Blau zu Violett (sehr viel). Skala in mm.
// Bewusst satt und fast deckend, damit die Karte auch über dem Luftbild gut lesbar ist.
export const WET_STOPS: [number, [number, number, number]][] = [
  [0, [120, 200, 250]],
  [2, [50, 160, 240]],
  [5, [25, 105, 220]],
  [10, [35, 45, 170]],
  [20, [115, 25, 150]],
  [30, [175, 20, 105]],
];

export function wetColor(mm: number): [number, number, number] {
  if (mm <= WET_STOPS[0][0]) return WET_STOPS[0][1];
  for (let i = 1; i < WET_STOPS.length; i++) {
    const [m1, c1] = WET_STOPS[i];
    const [m0, c0] = WET_STOPS[i - 1];
    if (mm <= m1) {
      const k = (mm - m0) / (m1 - m0);
      return [0, 1, 2].map((j) => Math.round(c0[j] + (c1[j] - c0[j]) * k)) as [number, number, number];
    }
  }
  return WET_STOPS[WET_STOPS.length - 1][1];
}

// Raster über das ganze Grundstück ---------------------------------------------

export type RasterLayer = "planned" | "moisture" | "after";

export interface RasterCell {
  x: number; // linke obere Ecke in Planmetern
  y: number;
  /** "value": Wert in v; "none": nicht bewässert; "unknown": bewässert, aber ohne Wert */
  kind: "value" | "none" | "unknown";
  v: number;
}

export interface Raster {
  step: number;
  cells: RasterCell[];
  max: number;
}

/** Kachelgröße so wählen, dass höchstens `maxCells` Kacheln entstehen (runde Werte). */
export function rasterStep(width: number, height: number, maxCells: number): number {
  for (const step of [0.25, 0.5, 1, 2, 5, 10, 20]) {
    if (Math.ceil(width / step) * Math.ceil(height / step) <= maxCells) return step;
  }
  return 50;
}

/** Füllstand des Bodens (1 = Feldkapazität erreicht, 0 = nutzbares Wasser aufgebraucht). */
export function zoneFill(zone: PlanZone, status?: Status): number | null {
  const s = status?.zones[zone.id];
  if (!s || !s.capacity_mm) return null;
  return Math.max(0, 1 - s.need_mm / s.capacity_mm);
}

/**
 * Kachelraster: geplante Gießmenge (mm), Bodenfeuchte jetzt oder nach dem
 * nächsten geplanten Gießen (Füllstand). Ist eine Grundstücksgrenze
 * gezeichnet, deckt das Raster genau das Grundstück ab.
 */
export function computeRaster(
  layer: RasterLayer,
  zones: PlanZone[],
  valves: PlanValve[],
  status: Status | undefined,
  features: Feature[],
  bounds: [number, number, number, number],
  maxCells = 6000,
): Raster {
  const plots = features.filter((f) => f.kind === "boundary" && f.points.length >= 3);
  let [bx0, by0, bx1, by1] = bounds;
  if (plots.length) {
    const pts = plots.flatMap((f) => f.points);
    bx0 = Math.min(...pts.map((p) => p[0]));
    by0 = Math.min(...pts.map((p) => p[1]));
    bx1 = Math.max(...pts.map((p) => p[0]));
    by1 = Math.max(...pts.map((p) => p[1]));
  }
  const step = rasterStep(bx1 - bx0, by1 - by0, maxCells);
  const x0 = Math.floor(bx0 / step) * step;
  const y0 = Math.floor(by0 / step) * step;
  const trees = features.filter((f) => f.kind === "tree" && (f.trunk_m ?? 0) > 0);
  const active = zones
    .filter((z) => z.enabled && drawnArea(z) !== null)
    .map((z) => ({
      zone: z,
      mm: mmPerRun(z, valves, status),
      fill: zoneFill(z, status),
      cap: status?.zones[z.id]?.capacity_mm ?? null,
      // Anteil, der im Boden ankommt (Sprinkler verlieren mehr durch Verdunstung)
      eff: status?.zones[z.id]?.efficiency ?? (z.type === "sprinkler" ? 0.75 : 0.9),
    }));
  const cells: RasterCell[] = [];
  let max = 0;
  for (let y = y0; y < by1; y += step) {
    for (let x = x0; x < bx1; x += step) {
      const p: Point = [x + step / 2, y + step / 2];
      if (plots.length && !plots.some((f) => inPolygon(p, f.points))) continue;
      const here = active.filter(
        ({ zone }) =>
          zoneContains(zone, p) && !(zone.type === "sprinkler" && zone.center && inTrunkShadow(p, zone.center, trees)),
      );
      if (!here.length) {
        if (plots.length) cells.push({ x, y, kind: "none", v: 0 });
        continue;
      }
      let v: number | null = null;
      if (layer === "planned") {
        v = here.some((h) => h.mm === null) ? null : here.reduce((s, h) => s + (h.mm ?? 0), 0);
      } else {
        if (here.some((h) => h.fill === null || (layer === "after" && h.mm === null))) {
          v = null;
        } else {
          const fill = here.reduce((s, h) => s + (h.fill ?? 0), 0) / here.length;
          const cap = here.reduce((s, h) => s + (h.cap ?? 0), 0) / here.length;
          const added = layer === "after" ? here.reduce((s, h) => s + (h.mm ?? 0) * h.eff, 0) : 0;
          v = fill + (cap > 0 ? added / cap : 0);
        }
      }
      if (v === null) {
        cells.push({ x, y, kind: "unknown", v: 0 });
      } else {
        cells.push({ x, y, kind: "value", v });
        max = Math.max(max, v);
      }
    }
  }
  return { step, cells, max };
}

// Bodenfeuchte: trocken (braun) über neutral zu feucht (blau), darüber zu nass (violett).
export const MOIST_STOPS: [number, [number, number, number]][] = [
  [0, [166, 97, 26]],
  [0.5, [236, 226, 198]],
  [1, [42, 120, 214]],
  [1.25, [110, 40, 160]],
];

function interpolate(stops: [number, [number, number, number]][], value: number): [number, number, number] {
  if (value <= stops[0][0]) return stops[0][1];
  for (let i = 1; i < stops.length; i++) {
    const [m1, c1] = stops[i];
    const [m0, c0] = stops[i - 1];
    if (value <= m1) {
      const k = (value - m0) / (m1 - m0);
      return [0, 1, 2].map((j) => Math.round(c0[j] + (c1[j] - c0[j]) * k)) as [number, number, number];
    }
  }
  return stops[stops.length - 1][1];
}

export function moistColor(fill: number): [number, number, number] {
  return interpolate(MOIST_STOPS, fill);
}
