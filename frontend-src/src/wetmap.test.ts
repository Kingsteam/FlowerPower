import { describe, expect, it } from "vitest";
import type { Feature, PlanValve, PlanZone } from "./types";
import { computeWetGrid, inTrunkShadow, mmPerRun, wetColor, zoneContains } from "./wetmap";

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

  it("zählt Überlappungen doppelt", () => {
    const a = zone({ id: "a", polygon: [[0, 0], [2, 0], [2, 2], [0, 2]] });
    const b = zone({ id: "b", polygon: [[1, 0], [3, 0], [3, 2], [1, 2]] });
    const grid = computeWetGrid([a, b], valves, undefined, [], [0, 0, 3, 2], 30);
    const at = (x: number, y: number) =>
      grid.values[Math.floor(y / grid.step) * grid.cols + Math.floor(x / grid.step)];
    expect(at(0.5, 1)).toBeCloseTo(25); // nur a: 100 L / 4 m²
    expect(at(1.5, 1)).toBeCloseTo(50); // a + b
    expect(grid.max).toBeCloseTo(50);
  });

  it("Farbskala", () => {
    expect(wetColor(0)).toEqual([120, 200, 250]);
    expect(wetColor(100)).toEqual([175, 20, 105]);
    expect(wetColor(7.5)).toEqual([30, 75, 195]); // zwischen 5 und 10 mm
  });
});
