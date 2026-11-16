// Orten: eigener Standort (GPS des Handys oder Ortung des Browsers) im Plan.
//
// Der Standort bleibt im Browser: Er wird weder gespeichert noch an Home
// Assistant geschickt. Browser erlauben das Orten nur über https (oder
// localhost), z. B. über die Home-Assistant-App oder Nabu Casa.

export interface MyPosition {
  latitude: number;
  longitude: number;
  accuracy: number; // Meter
}

/** Warum Orten hier nicht geht (oder null, wenn es gehen sollte). */
export function locateUnavailable(secure: boolean, hasGeolocation: boolean): string | null {
  if (!hasGeolocation) return "Dieser Browser kann nicht orten.";
  if (!secure) {
    return "Orten geht nur, wenn Home Assistant über https geöffnet ist (z. B. in der App oder über Nabu Casa).";
  }
  return null;
}

/** Meldung zu einem Fehler der Ortung (GeolocationPositionError.code). */
export function locateErrorText(code: number): string {
  if (code === 1) return "Orten nicht erlaubt. Bitte in den Browser-Einstellungen den Standort erlauben.";
  if (code === 3) return "Kein Standort gefunden (Zeit abgelaufen). Am besten im Freien noch einmal versuchen.";
  return "Standort nicht verfügbar.";
}

/** Genauigkeit für die Anzeige, z. B. „± 4 m“. */
export function fmtAccuracy(meters: number): string {
  return meters >= 1000 ? `± ${(meters / 1000).toFixed(1).replace(".", ",")} km` : `± ${Math.round(meters)} m`;
}
