// Adresssuche für das Luftbild.
//
// Das Panel fragt Home Assistant (WebSocket `irrigation_planner/geocode`),
// Home Assistant fragt Nominatim (OpenStreetMap) mit eigener Kennung, nur
// auf Knopfdruck. Gespeichert wird die Adresse nirgends.

export const SEARCH_ATTRIBUTION = "Suche: © OpenStreetMap-Mitwirkende";

export interface Place {
  name: string;
  detail: string;
  latitude: number;
  longitude: number;
}

type CallWS = <T>(msg: Record<string, unknown>) => Promise<T>;

export async function searchAddress(callWS: CallWS, query: string, language = "de"): Promise<Place[]> {
  if (query.trim().length < 3) throw new Error("Bitte mindestens 3 Zeichen eingeben");
  const result = await callWS<{ places: Place[] }>({
    type: "irrigation_planner/geocode",
    query: query.trim(),
    language,
  });
  return result.places ?? [];
}
