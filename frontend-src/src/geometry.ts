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
