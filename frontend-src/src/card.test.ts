import { describe, expect, it } from "vitest";
import { cardZones, zoneLine } from "./card";
import type { QueueItem, ZoneOperation } from "./operation-data";

const zone = (extra: Partial<ZoneOperation> = {}): ZoneOperation => ({
  id: "zone_1",
  name: "Rasen",
  type: "sprinkler",
  enabled: true,
  duration_mode: "calculated",
  area_m2: 48,
  need_mm: 10,
  capacity_mm: 40,
  measured: false,
  planned_s: 900,
  planned_liters: 120,
  reason: "berechnet",
  locked: null,
  last: null,
  next: { at: "2026-06-02T04:00:00Z", program: "Morgens" },
  ...extra,
});

describe("Dashboard-Karte", () => {
  it("filtert Zonen nach ID oder Name", () => {
    const zones = [zone(), zone({ id: "zone_2", name: "Beet" })];
    expect(cardZones(zones).length).toBe(2);
    expect(cardZones(zones, ["beet"]).map((z) => z.id)).toEqual(["zone_2"]);
    expect(cardZones(zones, ["zone_1"]).map((z) => z.name)).toEqual(["Rasen"]);
  });

  it("beschreibt den Zustand einer Zone", () => {
    const when = () => "morgen 06:00";
    expect(zoneLine(zone(), undefined, 0, when)).toBe("morgen 06:00, 15 min");
    expect(zoneLine(zone({ planned_s: 0 }), undefined, 0, when)).toBe("morgen 06:00, kein Bedarf");
    expect(zoneLine(zone({ locked: "Leck" }), undefined, 0, when)).toBe("gesperrt: Leck");
    const running: QueueItem = {
      zone_id: "zone_1", zone_name: "Rasen", supply: "", state: "running", active: true, position: 0,
      source: "manual", source_text: "", program_id: null, duration_s: 600, pause_after_s: 0,
      started_at: "2026-06-01T05:00:00Z", ends_at: "2026-06-01T05:10:00Z",
    };
    expect(zoneLine(zone(), running, Date.parse("2026-06-01T05:05:00Z"), when)).toBe("gießt, noch 5 min");
    expect(zoneLine(zone(), { ...running, state: "queued", active: false }, 0, when)).toBe("wartet, 10 min");
  });
});
