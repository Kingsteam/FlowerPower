// Grundriss-Formen: Arten, Beschriftung, Symbole (wie model.py FEATURE_*).

import type { Point } from "./geometry";

export type FeatureFamily = "area" | "line" | "point";

export interface FeatureMeta {
  label: string;
  icon: string;
  family: FeatureFamily;
}

export const FEATURE_META: Record<string, FeatureMeta> = {
  building: { label: "Gebäude", icon: "mdi:home-outline", family: "area" },
  paving: { label: "Terrasse / Weg", icon: "mdi:texture-box", family: "area" },
  water: { label: "Teich / Pool", icon: "mdi:waves", family: "area" },
  area: { label: "Sonstige Fläche", icon: "mdi:vector-square", family: "area" },
  soil: { label: "Bodenfläche", icon: "mdi:layers-triple-outline", family: "area" },
  fence: { label: "Zaun", icon: "mdi:fence", family: "line" },
  hedge: { label: "Hecke", icon: "mdi:leaf", family: "line" },
  boundary: { label: "Grundstücksgrenze", icon: "mdi:vector-polyline", family: "line" },
  pipe: { label: "Leitung", icon: "mdi:pipe", family: "line" },
  tree: { label: "Baum / Strauch", icon: "mdi:tree-outline", family: "point" },
  label: { label: "Beschriftung", icon: "mdi:format-text", family: "point" },
  tap: { label: "Wasserhahn", icon: "mdi:water-pump", family: "point" },
};

export const MAX_LABEL_LENGTH = 60;

export interface Feature {
  id: string;
  kind: string;
  points: Point[];
  radius_m: number | null;
  label: string | null;
  trunk_m?: number | null;
  soil_type?: string | null;
}

export function family(kind: string): FeatureFamily {
  return FEATURE_META[kind]?.family ?? "area";
}

export function featureName(f: Feature): string {
  if (f.kind === "label" && f.label) return f.label;
  return f.label || FEATURE_META[f.kind]?.label || f.kind;
}

/** Neue, im Plan eindeutige ID. */
export function newFeatureId(existing: Feature[]): string {
  const used = new Set(existing.map((f) => f.id));
  let n = existing.length + 1;
  while (used.has(`f${n}`)) n++;
  return `f${n}`;
}

// Farben der Bodenarten (von hell = sandig bis dunkel = tonig).
export const SOIL_COLORS: Record<string, string> = {
  sand: "#e9d8a6",
  loamy_sand: "#dcc28c",
  sandy_loam: "#c9a46c",
  loam: "#a9825a",
  silt_loam: "#c4a27a",
  clay_loam: "#8e6a4f",
  clay: "#6f5443",
};
