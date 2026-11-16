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

import { edgeLengths, pathLength, setEdgeLength, snapPoint } from "./geometry";

describe("Grundriss", () => {
  it("fängt den nächsten Punkt in Reichweite", () => {
    const c: [number, number][] = [[0, 0], [1, 0], [5, 5]];
    expect(snapPoint([0.9, 0.1], c, 0.3)).toEqual([1, 0]);
    expect(snapPoint([3, 3], c, 0.3)).toBeNull();
  });

  it("misst Linien und Flächen", () => {
    const square: [number, number][] = [[0, 0], [4, 0], [4, 3], [0, 3]];
    expect(pathLength(square)).toBeCloseTo(11);
    expect(pathLength(square, true)).toBeCloseTo(14);
    expect(edgeLengths(square, true)).toEqual([4, 3, 4, 3]);
    expect(edgeLengths(square, false)).toEqual([4, 3, 4]);
  });

  it("setzt eine Kantenlänge, ohne die Richtung zu ändern", () => {
    const pts: [number, number][] = [[0, 0], [3, 4], [0, 8]];
    const moved = setEdgeLength(pts, 0, 10);
    expect(moved[1][0]).toBeCloseTo(6);
    expect(moved[1][1]).toBeCloseTo(8);
    expect(moved[0]).toEqual([0, 0]);
    expect(moved[2]).toEqual([0, 8]);
    // letzte Kante einer geschlossenen Form verschiebt den ersten Punkt
    const closed = setEdgeLength(pts, 2, 4);
    expect(closed[0][1]).toBeCloseTo(4);
    expect(setEdgeLength(pts, 0, 0)).toBe(pts);
  });
});

import { hoseArea, pointAlong } from "./geometry";

describe("Gießschlauch", () => {
  it("Fläche wie im Backend", () => {
    expect(hoseArea([[0, 0], [10, 0]], 0.5)).toBeCloseTo(10 + Math.PI * 0.25);
    expect(hoseArea([[0, 0]], 0.5)).toBe(0);
    expect(pointAlong([[0, 0], [10, 0], [10, 10]], 0.5)).toEqual([10, 0]);
    expect(pointAlong([[0, 0], [4, 0]], 0.25)).toEqual([1, 0]);
  });
});

describe("Schlauch-Reichweite", () => {
  it("misst den Abstand zur Linie", async () => {
    const { distanceToPolyline } = await import("./geometry");
    const line: [number, number][] = [[0, 0], [10, 0], [10, 10]];
    expect(distanceToPolyline([5, 2], line)).toBeCloseTo(2);
    expect(distanceToPolyline([12, 5], line)).toBeCloseTo(2);
    expect(distanceToPolyline([-3, 4], line)).toBeCloseTo(5);
  });

  it("setzt den Anfasser quer zur Linie", async () => {
    const { distanceToPolyline, hoseRadiusHandle } = await import("./geometry");
    const line: [number, number][] = [[0, 0], [2, 0], [2, 10]];
    const h = hoseRadiusHandle(line, 1.5);
    expect(distanceToPolyline(h, line)).toBeCloseTo(1.5);
    expect(h[1]).toBeCloseTo(5); // Mitte des längsten Stücks
  });
});

describe("Leitung mit runden Ecken", () => {
  it("rundet Ecken ab und bleibt bei geraden Linien gerade", async () => {
    const { roundedPath } = await import("./geometry");
    expect(roundedPath([[0, 0], [10, 0]], 1)).toBe("M0 0 L10 0");
    expect(roundedPath([[0, 0], [10, 0], [10, 10]], 1)).toBe("M0 0 L9 0 Q10 0 10 1 L10 10");
    // kurzes Stück: Radius höchstens die halbe Länge
    expect(roundedPath([[0, 0], [1, 0], [1, 10]], 2)).toBe("M0 0 L0.5 0 Q1 0 1 0.5 L1 10");
  });
});

describe("Grundstück", () => {
  it("rechnet die Fläche innerhalb der Grenze", async () => {
    const { plotArea } = await import("./features");
    expect(plotArea([])).toBeNull();
    expect(plotArea([{ kind: "boundary", points: [[0, 0], [20, 0]] }])).toBeNull();
    // offen gezeichnet, wird gedacht geschlossen: 20 × 30 m
    expect(plotArea([{ kind: "boundary", points: [[0, 0], [20, 0], [20, 30], [0, 30]] }])).toBeCloseTo(600);
    expect(plotArea([{ kind: "fence", points: [[0, 0], [20, 0], [20, 30]] }])).toBeNull();
  });
});
