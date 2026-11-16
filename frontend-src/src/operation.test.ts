import { describe, expect, it } from "vitest";
import { describeEntry, fmtDuration, progress, roundedBar } from "./operation";

describe("Betrieb", () => {
  it("rechnet Restzeit und Fortschritt", () => {
    const item = {
      zone_id: "z1", zone_name: "Rasen", supply: "", state: "running", active: true, position: 0,
      source: "manual", source_text: "von Hand", program_id: null, duration_s: 600, pause_after_s: 0,
      started_at: "2026-06-01T05:00:00Z", ends_at: "2026-06-01T05:10:00Z",
    };
    const p = progress(item, Date.parse("2026-06-01T05:02:30Z"));
    expect(p.left).toBe(450);
    expect(p.done).toBeCloseTo(0.25);
    expect(progress({ ...item, started_at: null, ends_at: null }, 0)).toEqual({ left: 600, done: 0 });
  });

  it("schreibt Dauern lesbar", () => {
    expect(fmtDuration(45)).toBe("45 s");
    expect(fmtDuration(150)).toBe("2:30 min");
    expect(fmtDuration(900)).toBe("15 min");
    expect(fmtDuration(3900)).toBe("1 h 5 min");
  });

  it("beschreibt Einträge im Verlauf", () => {
    const run = describeEntry({
      at: "", kind: "run", zone_name: "Beet", state: "skipped", seconds: 120, planned_s: 600,
      liters: 12.5, measured: true, mm: 3.1, source_text: "Programm Morgens",
    });
    expect(run.title).toBe("Beet: abgebrochen");
    expect(run.detail).toBe("2 min von 10 min · 12,5 L (gemessen) · 3,1 mm · Programm Morgens");
    expect(run.tone).toBe("warn");
    expect(describeEntry({ at: "", kind: "program_skipped", program_name: "Abends", reason: "Regen" }).detail).toBe("Regen");
  });

  it("zeichnet Balken mit runden oberen Ecken", () => {
    expect(roundedBar(0, 0, 10, 0)).toBe("");
    expect(roundedBar(0, 10, 10, 20)).toBe("M0 30V14Q0 10 4 10H6Q10 10 10 14V30Z");
  });
});
