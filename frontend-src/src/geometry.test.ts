import { describe, expect, it } from "vitest";
import {
  compass,
  latLonToPlan,
  metersPerPixel,
  planToLatLon,
  polar,
  polygonArea,
  sectorArea,
  tilesFor,
  zoomForScale,
} from "./geometry";

describe("Flächen", () => {
  it("Kreissegment und Polygon", () => {
    expect(sectorArea(2, 90)).toBeCloseTo(Math.PI);
    expect(polygonArea([[0, 0], [4, 0], [4, 3], [0, 3]])).toBeCloseTo(12);
  });
});

describe("Kompass", () => {
  it("0° ist oben, 90° rechts", () => {
    const [x, y] = polar([0, 0], 1, 90);
    expect(x).toBeCloseTo(1);
    expect(y).toBeCloseTo(0);
    expect(polar([0, 0], 1, 0)[1]).toBeCloseTo(-1);
    expect(compass([0, 0], [0, 1])).toBeCloseTo(180);
    expect(compass([0, 0], [-1, 0])).toBeCloseTo(270);
  });
});

describe("Karte", () => {
  it("Maßstab wie im Backend", () => {
    expect(metersPerPixel(0, 0)).toBeCloseTo(156543.03, 1);
    const zoom = zoomForScale(48, 1 / metersPerPixel(48, 19.3));
    expect(zoom).toBeCloseTo(19.3);
  });

  it("Umrechnung hin und zurück", () => {
    const origin: [number, number] = [48, 15];
    const p = latLonToPlan(48.0001, 15.0002, origin);
    const [lat, lon] = planToLatLon(p, origin);
    expect(lat).toBeCloseTo(48.0001, 9);
    expect(lon).toBeCloseTo(15.0002, 9);
  });

  it("Kacheln decken den Ursprung ab und sind so groß wie der Maßstab", () => {
    const tiles = tilesFor("t/{z}/{y}/{x}", [48, 15], { x0: -1, y0: -1, x1: 1, y1: 1 }, 19);
    expect(tiles.length).toBeGreaterThan(0);
    const hit = tiles.find((t) => t.x <= 0 && t.x + t.size >= 0 && t.y <= 0 && t.y + t.size >= 0);
    expect(hit).toBeDefined();
    expect(tiles[0].size).toBeCloseTo(256 * metersPerPixel(48, 19), 1);
    expect(tiles[0].url).toMatch(/^t\/19\/\d+\/\d+$/);
  });
});
