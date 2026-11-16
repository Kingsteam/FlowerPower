import { describe, expect, it } from "vitest";
import { fmtAccuracy, locateErrorText, locateUnavailable } from "./locate";

describe("Orten", () => {
  it("braucht https und einen Browser mit Ortung", () => {
    expect(locateUnavailable(true, true)).toBeNull();
    expect(locateUnavailable(false, true)).toContain("https");
    expect(locateUnavailable(true, false)).toContain("nicht orten");
  });

  it("erklärt Fehler", () => {
    expect(locateErrorText(1)).toContain("nicht erlaubt");
    expect(locateErrorText(3)).toContain("Zeit");
    expect(locateErrorText(2)).toContain("nicht verfügbar");
  });

  it("zeigt die Genauigkeit", () => {
    expect(fmtAccuracy(4.4)).toBe("± 4 m");
    expect(fmtAccuracy(1500)).toBe("± 1,5 km");
  });
});
