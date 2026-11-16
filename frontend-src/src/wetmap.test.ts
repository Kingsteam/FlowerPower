import { describe, expect, it } from "vitest";
import type { Feature, PlanValve, PlanZone } from "./types";
import { computeRaster, inTrunkShadow, mmPerRun, moistColor, rasterStep, wetColor, wetReason, zoneContains } from "./wetmap";

function zone(extra: Partial<PlanZone>): PlanZone {
  return {
    id: "z",
    name: "Z",
    type: "drip",
    center: null,
    radius_m: null,
    start_angle_deg: 0,
    arc_deg: 360,
    polygon: [],
    area_m2: null,
    drawn_area_m2: null,
    effective_area_m2: null,
    overlap_m2: 0,
    plant_type: null,
    kc: 1,
    soil_type: null,
    root_depth_m: null,
    valve_id: "v",
    duration_mode: "manual",
    duration_s: 600,
    enabled: true,
    ...extra,
  };
}
const valves: PlanValve[] = [
  { id: "v", name: "V", position: null, zone_ids: ["z"], safety_level: "device", learned_flow_l_min: 10 },
];

describe("Nässekarte", () => {
  it("rechnet Millimeter pro Lauf", () => {
    // 10 min × 10 L/min = 100 L auf 20 m² = 5 mm
    const bed = zone({ polygon: [[0, 0], [5, 0], [5, 4], [0, 4]] });
    expect(mmPerRun(bed, valves)).toBeCloseTo(5);
    expect(mmPerRun({ ...bed, valve_id: null }, valves)).toBeNull();
  });

  it("erkennt Punkte in Schlauch und Sektor", () => {
    const hose = zone({ type: "hose", polygon: [[0, 0], [10, 0]], radius_m: 0.5 });
    expect(zoneContains(hose, [5, 0.4])).toBe(true);
    expect(zoneContains(hose, [5, 0.6])).toBe(false);
    const half = zone({ type: "sprinkler", center: [0, 0], radius_m: 5, start_angle_deg: 90, arc_deg: 180 });
    expect(zoneContains(half, [0, 3])).toBe(true); // Süden
    expect(zoneContains(half, [0, -3])).toBe(false); // Norden
  });

  it("Baumstamm wirft Wasserschatten", () => {
    const tree: Feature = { id: "t", kind: "tree", points: [[0, -3]], radius_m: 2, label: null, trunk_m: 0.8 };
    expect(inTrunkShadow([0, -5], [0, 0], [tree])).toBe(true); // direkt dahinter
    expect(inTrunkShadow([0, -2], [0, 0], [tree])).toBe(false); // davor
    expect(inTrunkShadow([3, -5], [0, 0], [tree])).toBe(false); // daneben
  });

  it("zählt Überlappungen doppelt (Raster)", () => {
    const a = zone({ id: "a", polygon: [[0, 0], [2, 0], [2, 2], [0, 2]] });
    const b = zone({ id: "b", polygon: [[1, 0], [3, 0], [3, 2], [1, 2]] });
    const raster = computeRaster("planned", [a, b], valves, undefined, [], [0, 0, 3, 2], 100);
    expect(raster.step).toBe(0.25);
    const at = (x: number, y: number) => raster.cells.find((c) => c.x <= x && x < c.x + raster.step && c.y <= y && y < c.y + raster.step);
    expect(at(0.5, 1)?.v).toBeCloseTo(25); // nur a: 100 L / 4 m²
    expect(at(1.5, 1)?.v).toBeCloseTo(50); // a + b
  });

  it("deckt mit Grenze das ganze Grundstück ab und rechnet die Bodenfeuchte", () => {
    const bed = zone({ id: "z", polygon: [[0, 0], [4, 0], [4, 4], [0, 4]] });
    const plot = { id: "g", kind: "boundary", points: [[0, 0], [8, 0], [8, 4], [0, 4]] as [number, number][], radius_m: null, label: null };
    const status = {
      zones: { z: { state: "idle" as const, ends_at: null, need_mm: 20, capacity_mm: 80, planned_s: 600, reason: "", locked_reason: null } },
      winter_mode: false,
      automatic: true,
      problems: [],
    };
    const now = computeRaster("moisture", [bed], valves, status, [plot], [0, 0, 4, 4], 200);
    expect(now.cells.filter((c) => c.kind === "none").length).toBeGreaterThan(0); // Rest des Grundstücks
    expect(now.cells.find((c) => c.kind === "value")?.v).toBeCloseTo(0.75);
    // 600 s × 10 L/min = 100 L auf 16 m² = 6,25 mm; 80 mm Kapazität
    const after = computeRaster("after", [bed], valves, status, [plot], [0, 0, 4, 4], 200);
    expect(after.cells.find((c) => c.kind === "value")?.v).toBeCloseTo(0.75 + 6.25 / 80);
  });

  it("wählt runde Kachelgrößen", () => {
    expect(rasterStep(30, 20, 6000)).toBe(0.5);
    expect(rasterStep(200, 100, 6000)).toBe(2);
    expect(moistColor(0)).toEqual([166, 97, 26]);
  });

  it("nennt den Grund, wenn ein Wert fehlt", () => {
    const bed = zone({ polygon: [[0, 0], [5, 0], [5, 4], [0, 4]] });
    expect(wetReason(bed, valves)).toBeNull();
    expect(wetReason({ ...bed, valve_id: null }, valves)).toBe("kein Ventil");
    expect(wetReason(bed, [{ ...valves[0], learned_flow_l_min: null }])).toBe("Durchfluss unbekannt");
    expect(wetReason({ ...bed, duration_s: null }, valves)).toBe("keine Gießdauer");
  });

  it("Farbskala", () => {
    expect(wetColor(0)).toEqual([120, 200, 250]);
    expect(wetColor(100)).toEqual([175, 20, 105]);
    expect(wetColor(7.5)).toEqual([30, 75, 195]); // zwischen 5 und 10 mm
  });
});
