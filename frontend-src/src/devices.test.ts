import { describe, expect, it } from "vitest";
import { type DeviceEntity, draftFromSuggestion, roleCandidates, safetyText } from "./devices";

const entities: DeviceEntity[] = [
  { entity_id: "switch.ventil", name: "Ventil", domain: "switch", device_class: null, unit: null, state: "off" },
  { entity_id: "sensor.flow", name: "Durchfluss", domain: "sensor", device_class: "volume_flow_rate", unit: "L/min", state: "0" },
  { entity_id: "sensor.akku", name: "Batterie", domain: "sensor", device_class: "battery", unit: "%", state: "90" },
  { entity_id: "binary_sensor.leck", name: "Leck", domain: "binary_sensor", device_class: null, unit: null, state: "off" },
];

describe("Geräte", () => {
  it("bietet je Rolle nur passende Entitäten an", () => {
    expect(roleCandidates(entities, "valve").map((e) => e.entity_id)).toEqual(["switch.ventil"]);
    expect(roleCandidates(entities, "battery").map((e) => e.entity_id)).toEqual(["sensor.akku"]);
    expect(roleCandidates(entities, "status").map((e) => e.entity_id)).toContain("binary_sensor.leck");
    expect(roleCandidates(entities, "flow").map((e) => e.entity_id)).not.toContain("switch.ventil");
  });

  it("füllt den Entwurf aus dem Vorschlag und vermeidet doppelte Namen", () => {
    const d = draftFromSuggestion(
      "dev1",
      {
        name: "Ventil Beet",
        driver: "zigbee2mqtt",
        profile: "sonoff_swv",
        profile_name: "SONOFF SWV (Zigbee2MQTT)",
        entities: { valve: "switch.ventil", flow: "sensor.flow" },
        driver_options: { friendly_name: "Ventil Beet", base_topic: "zigbee2mqtt" },
        device_entities: entities,
      },
      [{ id: "w1" }],
      ["Ventil Beet"],
    );
    expect(d.name).toBe("Ventil Beet 2");
    expect(d.water_supply_id).toBe("w1");
    expect(d.entities.flow).toBe("sensor.flow");
    expect(d.detected).toBe("SONOFF SWV (Zigbee2MQTT)");
    expect(d.valve_id).toBeNull();
  });

  it("beschreibt die Sicherheit", () => {
    expect(safetyText({ driver: "zigbee2mqtt", safety_level: "device", device_timer: true }).level).toBe("ok");
    expect(safetyText({ driver: "ha_switch", safety_level: "ha_only", device_timer: false }).text).toContain(
      "Nur Home Assistant",
    );
  });
});
