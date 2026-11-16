// Nässekarte: Wie viel Wasser kommt pro Lauf wo an (Millimeter)?
//
// Je Zone: Liter pro Lauf = geplante Dauer × gelernter Durchfluss; verteilt
// auf die Fläche der Zone ergibt das Millimeter. Wo sich Zonen überlappen,
// zählen beide. Ein Baumstamm wirft beim Sprinkler einen „Wasserschatten“.
// Das ist eine Schätzung: Sprinkler verteilen in Wirklichkeit nie ganz
// gleichmäßig.

import { type Point, compass, distance, hoseArea, polygonArea, sectorArea } from "./geometry";
import type { Feature, PlanValve, PlanZone, Status } from "./types";

export interface WetGrid {
  x0: number;
  y0: number;
  step: number;
  cols: number;
  rows: number;
  values: Float32Array; // mm je Zelle, NaN = nicht bewässert
  max: number;
}

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

/** Sekunden eines Laufs: geplant, sonst die Dauer von Hand. */
export function runSeconds(zone: PlanZone, status?: Status): number {
  return status?.zones[zone.id]?.planned_s || zone.duration_s || 0;
}

/** Millimeter pro Lauf auf der Fläche der Zone (null: Durchfluss oder Fläche fehlt). */
export function mmPerRun(zone: PlanZone, valves: PlanValve[], status?: Status): number | null {
  const flow = valves.find((v) => v.id === zone.valve_id)?.learned_flow_l_min;
  const area = drawnArea(zone) ?? zone.area_m2;
  const seconds = runSeconds(zone, status);
  if (!flow || !area || !seconds) return null;
  return ((seconds / 60) * flow) / area;
}

export function computeWetGrid(
  zones: PlanZone[],
  valves: PlanValve[],
  status: Status | undefined,
  features: Feature[],
  bounds: [number, number, number, number],
  maxCells = 160,
): WetGrid {
  const [bx0, by0, bx1, by1] = bounds;
  const step = Math.max(0.05, Math.max(bx1 - bx0, by1 - by0) / maxCells);
  const cols = Math.max(1, Math.ceil((bx1 - bx0) / step));
  const rows = Math.max(1, Math.ceil((by1 - by0) / step));
  const values = new Float32Array(cols * rows).fill(Number.NaN);
  const trees = features.filter((f) => f.kind === "tree" && (f.trunk_m ?? 0) > 0);
  const active = zones
    .filter((z) => z.enabled && drawnArea(z) !== null)
    .map((z) => ({ zone: z, mm: mmPerRun(z, valves, status) }))
    .filter((z): z is { zone: PlanZone; mm: number } => z.mm !== null);
  let max = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const p: Point = [bx0 + (c + 0.5) * step, by0 + (r + 0.5) * step];
      let sum = 0;
      let hit = false;
      for (const { zone, mm } of active) {
        if (!zoneContains(zone, p)) continue;
        if (zone.type === "sprinkler" && zone.center && inTrunkShadow(p, zone.center, trees)) continue;
        sum += mm;
        hit = true;
      }
      if (hit) {
        values[r * cols + c] = sum;
        max = Math.max(max, sum);
      }
    }
  }
  return { x0: bx0, y0: by0, step, cols, rows, values, max };
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

/** Raster als Bild (Daten-URL) für das SVG. */
export function gridImage(grid: WetGrid): string {
  const canvas = document.createElement("canvas");
  canvas.width = grid.cols;
  canvas.height = grid.rows;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  const img = ctx.createImageData(grid.cols, grid.rows);
  for (let i = 0; i < grid.values.length; i++) {
    const v = grid.values[i];
    if (Number.isNaN(v)) continue;
    const [r, g, b] = wetColor(v);
    img.data.set([r, g, b, 230], i * 4);
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL();
}
