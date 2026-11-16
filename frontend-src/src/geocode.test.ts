import { describe, expect, it } from "vitest";
import { searchAddress } from "./geocode";

describe("Adresssuche", () => {
  it("fragt Home Assistant und gibt die Orte zurück", async () => {
    const sent: Record<string, unknown>[] = [];
    const callWS = (async (msg: Record<string, unknown>) => {
      sent.push(msg);
      return { places: [{ name: "Hauptplatz", detail: "Musterstadt", latitude: 48.1, longitude: 16.2 }] };
    }) as <T>(msg: Record<string, unknown>) => Promise<T>;
    const places = await searchAddress(callWS, "  Hauptplatz 1 ");
    expect(sent).toEqual([{ type: "irrigation_planner/geocode", query: "Hauptplatz 1", language: "de" }]);
    expect(places[0].latitude).toBe(48.1);
  });

  it("verlangt mindestens 3 Zeichen", async () => {
    const callWS = (async () => ({ places: [] })) as <T>(msg: Record<string, unknown>) => Promise<T>;
    await expect(searchAddress(callWS, "ab")).rejects.toThrow("3 Zeichen");
  });
});
