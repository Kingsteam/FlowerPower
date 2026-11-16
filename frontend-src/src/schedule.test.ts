import { describe, expect, it } from "vitest";
import { type ProgramInfo, describeSchedule, scheduleKind, zoned } from "./schedule";

const base = {
  start_time: null,
  finish_by: null,
  sun_offset_min: 0,
  weekdays: [],
  interval_days: null,
} as unknown as ProgramInfo;

describe("Zeitplan in Worten", () => {
  it("Sonne mit Versatz", () => {
    const p = { ...base, finish_by: "sunrise", sun_offset_min: -60, weekdays: [0, 2, 4] };
    expect(scheduleKind(p)).toBe("finish_sun");
    expect(describeSchedule(p, null)).toBe("fertig 1 h vor Sonnenaufgang, Mo Mi Fr");
  });

  it("Uhrzeit und Intervall", () => {
    const p = { ...base, start_time: "21:30:00", interval_days: 3 };
    expect(describeSchedule(p, null)).toBe("Start 21:30 Uhr, alle 3 Tage");
    expect(describeSchedule({ ...base, start_time: "sunset", sun_offset_min: 30 }, null)).toBe(
      "Start 30 min nach Sonnenuntergang, täglich",
    );
    expect(describeSchedule(base, "07:00:00")).toBe("fertig bis Ende des Zeitfensters (07:00 Uhr), täglich");
  });
});

describe("Zeitzone", () => {
  it("rechnet in der Zeitzone von Home Assistant", () => {
    const t = zoned("2026-06-01T19:00:00+00:00", "Europe/Vienna");
    expect(t).toEqual({ day: "2026-06-01", minutes: 21 * 60, time: "21:00" });
    expect(zoned("2026-06-01T23:30:00+00:00", "Europe/Vienna").day).toBe("2026-06-02");
  });
});
