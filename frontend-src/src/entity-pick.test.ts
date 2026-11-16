import { describe, expect, it } from "vitest";
import { entityOptions, searchOptions } from "./entity-pick";

const states = {
  "sensor.garten_temp": { state: "12.5", attributes: { friendly_name: "Garten Temperatur", unit_of_measurement: "°C", device_class: "temperature" } },
  "sensor.wohnzimmer": { state: "21", attributes: { friendly_name: "Wohnzimmer", unit_of_measurement: "°C" } },
  "sensor.strom": { state: "300", attributes: { friendly_name: "Strom", unit_of_measurement: "W", device_class: "power" } },
  "switch.pumpe": { state: "off", attributes: { friendly_name: "Pumpe" } },
  "sensor.irrigation_planner_status": { state: "ok", attributes: { friendly_name: "Status" } },
};

describe("Entitäten-Auswahl", () => {
  it("zeigt passende zuerst und nur die gewünschten Domains", () => {
    const opts = entityOptions(states, { domains: ["sensor"], deviceClasses: ["temperature"], units: ["°C"] });
    expect(opts.map((o) => o.entity_id)).toEqual(["sensor.garten_temp", "sensor.wohnzimmer", "sensor.strom"]);
    expect(opts.map((o) => o.match)).toEqual([true, true, false]);
  });

  it("sucht in Name und Entität, alle Wörter müssen passen", () => {
    const opts = entityOptions(states, { domains: ["sensor"] });
    expect(searchOptions(opts, "garten temp").map((o) => o.entity_id)).toEqual(["sensor.garten_temp"]);
    expect(searchOptions(opts, "STROM")).toHaveLength(1);
    expect(searchOptions(opts, "")).toHaveLength(3);
  });
});
