// Geometrie des Gartenplans, wie im Backend (geometry.py):
// Planpunkte in Metern, x nach Osten, y nach Süden; Winkel wie beim
// Kompass (0° = Norden/oben, im Uhrzeigersinn).

export type Point = [number, number];

export const EARTH_RADIUS_M = 6378137;
export const TILE_SIZE_PX = 256;
const HALF_WORLD = Math.PI * EARTH_RADIUS_M;

export function sectorArea(radius: number, arcDeg: number): number {
  const arc = Math.max(0, Math.min(360, arcDeg));
  return (Math.PI * radius * radius * arc) / 360;
}

export function polygonArea(points: Point[]): number {
  if (points.length < 3) return 0;
  let total = 0;
  for (let i = 0; i < points.length; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % points.length];
    total += x1 * y2 - x2 * y1;
  }
  return Math.abs(total) / 2;
}

/** Punkt auf dem Kreis um `center` in Kompassrichtung `deg`. */
export function polar(center: Point, radius: number, deg: number): Point {
  const rad = (deg * Math.PI) / 180;
  return [center[0] + Math.sin(rad) * radius, center[1] - Math.cos(rad) * radius];
}

/** Kompasswinkel von `center` nach `point` (0..360). */
export function compass(center: Point, point: Point): number {
  const deg = (Math.atan2(point[0] - center[0], -(point[1] - center[1])) * 180) / Math.PI;
  return (deg + 360) % 360;
}

export function distance(a: Point, b: Point): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

/** SVG-Pfad eines Kreissegments (bei 360° ein voller Kreis). */
export function sectorPath(center: Point, radius: number, startDeg: number, arcDeg: number): string {
  const [cx, cy] = center;
  if (arcDeg >= 360) {
    return `M ${cx - radius} ${cy} a ${radius} ${radius} 0 1 0 ${2 * radius} 0 a ${radius} ${radius} 0 1 0 ${-2 * radius} 0 Z`;
  }
  const [sx, sy] = polar(center, radius, startDeg);
  const [ex, ey] = polar(center, radius, startDeg + arcDeg);
  const large = arcDeg > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${sx} ${sy} A ${radius} ${radius} 0 ${large} 1 ${ex} ${ey} Z`;
}

export function centroid(points: Point[]): Point {
  const n = points.length || 1;
  return [points.reduce((s, p) => s + p[0], 0) / n, points.reduce((s, p) => s + p[1], 0) / n];
}

// Karte (Web-Mercator) ---------------------------------------------------------

export function metersPerPixel(latitude: number, zoom: number): number {
  return (
    (2 * Math.PI * EARTH_RADIUS_M * Math.cos((latitude * Math.PI) / 180)) /
    (TILE_SIZE_PX * 2 ** zoom)
  );
}

export function zoomForScale(latitude: number, pxPerMeter: number): number {
  return Math.log2(
    (2 * Math.PI * EARTH_RADIUS_M * Math.cos((latitude * Math.PI) / 180) * pxPerMeter) /
      TILE_SIZE_PX,
  );
}

export function latLonToPlan(lat: number, lon: number, origin: [number, number]): Point {
  const [lat0, lon0] = origin;
  const rad = Math.PI / 180;
  return [
    (lon - lon0) * rad * EARTH_RADIUS_M * Math.cos(lat0 * rad),
    -(lat - lat0) * rad * EARTH_RADIUS_M,
  ];
}

export function planToLatLon(point: Point, origin: [number, number]): [number, number] {
  const [lat0, lon0] = origin;
  const deg = 180 / Math.PI;
  return [
    lat0 - (point[1] / EARTH_RADIUS_M) * deg,
    lon0 + (point[0] / (EARTH_RADIUS_M * Math.cos(lat0 / deg))) * deg,
  ];
}

export interface Tile {
  url: string;
  key: string;
  x: number; // linke obere Ecke in Planmetern
  y: number;
  size: number; // Kantenlänge in Planmetern
}

/**
 * Kacheln, die den sichtbaren Ausschnitt (in Planmetern) abdecken.
 * Der Plan ist um den Ursprung (`origin`) lokal maßstabstreu; Mercator-Meter
 * sind dort um 1/cos(Breite) gestreckt.
 */
export function tilesFor(
  template: string,
  origin: [number, number],
  view: { x0: number; y0: number; x1: number; y1: number },
  zoom: number,
  maxTiles = 200,
): Tile[] {
  const [lat0, lon0] = origin;
  const rad = Math.PI / 180;
  const k = 1 / Math.cos(lat0 * rad);
  const mx0 = EARTH_RADIUS_M * lon0 * rad;
  const my0 = EARTH_RADIUS_M * Math.log(Math.tan(Math.PI / 4 + (lat0 * rad) / 2));
  const n = 2 ** zoom;
  const tileM = (2 * HALF_WORLD) / n;
  const toTileX = (planX: number) => (mx0 + planX * k + HALF_WORLD) / tileM;
  const toTileY = (planY: number) => (HALF_WORLD - (my0 - planY * k)) / tileM;
  const tx0 = Math.max(0, Math.floor(toTileX(view.x0)));
  const tx1 = Math.min(n - 1, Math.floor(toTileX(view.x1)));
  const ty0 = Math.max(0, Math.floor(toTileY(view.y0)));
  const ty1 = Math.min(n - 1, Math.floor(toTileY(view.y1)));
  const tiles: Tile[] = [];
  if ((tx1 - tx0 + 1) * (ty1 - ty0 + 1) > maxTiles) return tiles;
  for (let ty = ty0; ty <= ty1; ty++) {
    for (let tx = tx0; tx <= tx1; tx++) {
      const mx = tx * tileM - HALF_WORLD;
      const my = HALF_WORLD - ty * tileM;
      tiles.push({
        url: template
          .replace("{z}", String(zoom))
          .replace("{x}", String(tx))
          .replace("{y}", String(ty)),
        key: `${zoom}/${tx}/${ty}`,
        x: (mx - mx0) / k,
        y: (my0 - my) / k,
        size: tileM / k,
      });
    }
  }
  return tiles;
}

// Grundriss: Fangen, Messen, Kantenlängen ------------------------------------

/** Nächster Fangpunkt innerhalb von `tolerance` Metern (sonst `null`). */
export function snapPoint(point: Point, candidates: Point[], tolerance: number): Point | null {
  let best: Point | null = null;
  let bestDist = tolerance;
  for (const c of candidates) {
    const d = distance(point, c);
    if (d <= bestDist) {
      best = c;
      bestDist = d;
    }
  }
  return best;
}

/** Länge eines Linienzugs (geschlossen: mit der Kante zurück zum Anfang). */
export function pathLength(points: Point[], closed = false): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) total += distance(points[i - 1], points[i]);
  if (closed && points.length > 2) total += distance(points[points.length - 1], points[0]);
  return total;
}

/** Kantenlängen; bei geschlossenen Formen inklusive der letzten Kante. */
export function edgeLengths(points: Point[], closed: boolean): number[] {
  const n = closed ? points.length : points.length - 1;
  const result: number[] = [];
  for (let i = 0; i < n; i++) result.push(distance(points[i], points[(i + 1) % points.length]));
  return result;
}

/**
 * Setzt die Länge der Kante `index` (vom Punkt `index` zum nächsten). Der
 * Endpunkt wandert auf der Richtung der Kante; alle anderen bleiben.
 */
export function setEdgeLength(points: Point[], index: number, length: number): Point[] {
  const next = (index + 1) % points.length;
  const a = points[index];
  const b = points[next];
  const current = distance(a, b);
  if (!(length > 0) || current === 0) return points;
  const k = length / current;
  const moved: Point = [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
  return points.map((p, i) => (i === next ? moved : p));
}

/** Fläche um einen Schlauch (Streifen mit halber Breite r, runde Enden), wie geometry.py. */
export function hoseArea(points: Point[], radius: number): number {
  if (points.length < 2 || radius <= 0) return 0;
  return pathLength(points) * 2 * radius + Math.PI * radius * radius;
}

/** Punkt bei `fraction` (0..1) der Länge eines Linienzugs. */
export function pointAlong(points: Point[], fraction: number): Point {
  let rest = pathLength(points) * Math.max(0, Math.min(1, fraction));
  for (let i = 1; i < points.length; i++) {
    const d = distance(points[i - 1], points[i]);
    if (rest <= d && d > 0) {
      const k = rest / d;
      return [
        points[i - 1][0] + (points[i][0] - points[i - 1][0]) * k,
        points[i - 1][1] + (points[i][1] - points[i - 1][1]) * k,
      ];
    }
    rest -= d;
  }
  return points[points.length - 1];
}

/** Kürzester Abstand eines Punkts zu einer Linie aus mehreren Stücken. */
export function distanceToPolyline(p: Point, points: Point[]): number {
  let best = Number.POSITIVE_INFINITY;
  for (let i = 1; i < points.length; i++) {
    const [a, b] = [points[i - 1], points[i]];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len2 = dx * dx + dy * dy;
    const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2));
    best = Math.min(best, Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy)));
  }
  return best;
}

/** Anfasser für die Reichweite eines Schlauchs: Mitte des längsten Stücks, quer im Abstand `radius`. */
export function hoseRadiusHandle(points: Point[], radius: number): Point {
  let best = 1;
  for (let i = 2; i < points.length; i++) {
    if (distance(points[i - 1], points[i]) > distance(points[best - 1], points[best])) best = i;
  }
  const [a, b] = [points[best - 1], points[best]];
  const len = distance(a, b) || 1;
  // Quer zur Linie (nach links gedreht)
  return [(a[0] + b[0]) / 2 + ((b[1] - a[1]) / len) * radius, (a[1] + b[1]) / 2 - ((b[0] - a[0]) / len) * radius];
}

/**
 * SVG-Pfad durch die Punkte, Ecken mit Radius `radius` abgerundet (wie ein
 * verlegter Schlauch). Der Radius wird an kurzen Stücken kleiner.
 */
export function roundedPath(points: Point[], radius: number): string {
  if (points.length < 2) return "";
  const f = (n: number) => Math.round(n * 1000) / 1000;
  let d = `M${f(points[0][0])} ${f(points[0][1])}`;
  for (let i = 1; i < points.length - 1; i++) {
    const [p, c, n] = [points[i - 1], points[i], points[i + 1]];
    const l1 = distance(p, c);
    const l2 = distance(c, n);
    const r = Math.min(radius, l1 / 2, l2 / 2);
    if (r <= 0) {
      d += ` L${f(c[0])} ${f(c[1])}`;
      continue;
    }
    const a: Point = [c[0] + ((p[0] - c[0]) / l1) * r, c[1] + ((p[1] - c[1]) / l1) * r];
    const b: Point = [c[0] + ((n[0] - c[0]) / l2) * r, c[1] + ((n[1] - c[1]) / l2) * r];
    d += ` L${f(a[0])} ${f(a[1])} Q${f(c[0])} ${f(c[1])} ${f(b[0])} ${f(b[1])}`;
  }
  const last = points[points.length - 1];
  return `${d} L${f(last[0])} ${f(last[1])}`;
}

/** Nächster Punkt auf der Strecke a–b. */
export function projectOnSegment(p: Point, a: Point, b: Point): Point {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2));
  return [a[0] + t * dx, a[1] + t * dy];
}

/** Nächster Punkt auf einer der Linien (oder null, wenn keiner näher als `tolerance`). */
export function snapToLines(p: Point, lines: Point[][], tolerance: number): Point | null {
  let best: Point | null = null;
  let bestDist = tolerance;
  for (const line of lines) {
    for (let i = 1; i < line.length; i++) {
      const q = projectOnSegment(p, line[i - 1], line[i]);
      const d = distance(p, q);
      if (d <= bestDist) {
        bestDist = d;
        best = q;
      }
    }
  }
  return best;
}

/**
 * Abzweige im Leitungsnetz: Endpunkte einer Leitung, die auf einer anderen
 * Leitung liegen (T-Stück).
 */
export function junctions(lines: Point[][], tolerance = 0.05): Point[] {
  const found: Point[] = [];
  lines.forEach((line, i) => {
    for (const end of [line[0], line[line.length - 1]]) {
      if (!end) continue;
      const others = lines.filter((_, j) => j !== i);
      const q = snapToLines(end, others, tolerance);
      if (q && !found.some((f) => distance(f, end) < tolerance)) found.push(end);
    }
  });
  return found;
}

/**
 * Weg durch das Leitungsnetz von einer Quelle (Wasserhahn) zu `target`
 * (Ventil): Liste der Teilstücke. Abzweige mitten auf einer Leitung werden
 * dabei als Knoten eingefügt. Leer, wenn es keine Verbindung gibt.
 */
export function pipeRoute(lines: Point[][], sources: Point[], target: Point, tolerance = 0.3): [Point, Point][] {
  const key = (p: Point) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`;
  // Abzweige: Endpunkte, die mitten auf einer anderen Leitung liegen, dort einfügen.
  const ends = lines.flatMap((l) => [l[0], l[l.length - 1]]);
  const split = lines.map((line) => {
    const out: Point[] = [line[0]];
    for (let i = 1; i < line.length; i++) {
      const [a, b] = [line[i - 1], line[i]];
      const inner = ends
        .filter((e) => distance(projectOnSegment(e, a, b), e) < 0.05 && distance(e, a) > 0.05 && distance(e, b) > 0.05)
        .sort((p, q) => distance(a, p) - distance(a, q));
      out.push(...inner, b);
    }
    return out;
  });
  const nodes = new Map<string, Point>();
  const edges = new Map<string, Set<string>>();
  const add = (a: Point, b: Point) => {
    const [ka, kb] = [key(a), key(b)];
    nodes.set(ka, a);
    nodes.set(kb, b);
    if (!edges.has(ka)) edges.set(ka, new Set());
    if (!edges.has(kb)) edges.set(kb, new Set());
    edges.get(ka)!.add(kb);
    edges.get(kb)!.add(ka);
  };
  for (const line of split) for (let i = 1; i < line.length; i++) add(line[i - 1], line[i]);
  const near = (p: Point) => [...nodes.entries()].filter(([, n]) => distance(n, p) <= tolerance).map(([k]) => k);
  const goal = new Set(near(target));
  if (!goal.size) return [];
  const start = sources.flatMap(near);
  // Breitensuche vom Hahn zum Ventil
  const prev = new Map<string, string | null>();
  const queue: string[] = [];
  for (const s of start) {
    if (!prev.has(s)) {
      prev.set(s, null);
      queue.push(s);
    }
  }
  while (queue.length) {
    const k = queue.shift()!;
    if (goal.has(k)) {
      const route: [Point, Point][] = [];
      let cur: string | null = k;
      while (cur && prev.get(cur)) {
        const before: string = prev.get(cur)!;
        route.unshift([nodes.get(before)!, nodes.get(cur)!]);
        cur = before;
      }
      return route;
    }
    for (const n of edges.get(k) ?? []) {
      if (!prev.has(n)) {
        prev.set(n, k);
        queue.push(n);
      }
    }
  }
  return [];
}
