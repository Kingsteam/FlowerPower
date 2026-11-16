// Daten und kleine Helfer der Seite „Betrieb“, auch für die Dashboard-Karte.
// Ohne Lit und ohne Stile, damit die Karte klein bleibt.

export const DOMAIN = "irrigation_planner";

export interface QueueItem {
  zone_id: string;
  zone_name: string;
  supply: string;
  state: string;
  active: boolean;
  position: number;
  source: string;
  source_text: string;
  program_id: string | null;
  duration_s: number;
  pause_after_s: number;
  started_at: string | null;
  ends_at: string | null;
}

export interface HistoryEntry {
  at: string;
  end?: string;
  kind: "run" | "cancelled" | "program_started" | "program_skipped" | "alarm";
  zone_id?: string;
  zone_name?: string;
  source?: string;
  source_text?: string;
  planned_s?: number;
  seconds?: number;
  state?: string;
  error?: string | null;
  liters?: number | null;
  measured?: boolean;
  mm?: number | null;
  program_name?: string;
  reason?: string | null;
  severity?: string;
  message?: string;
}

export interface ZoneOperation {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  duration_mode: string;
  area_m2: number | null;
  need_mm: number;
  capacity_mm: number;
  measured: boolean;
  planned_s: number;
  planned_liters: number | null;
  reason: string;
  locked: string | null;
  last: HistoryEntry | null;
  next: { at: string; program: string } | null;
}

export interface DayInfo {
  day: string;
  et0_mm: number | null;
  rain_mm: number | null;
  liters: number;
  zones_mm: Record<string, number>;
}

export interface OperationData {
  queue: QueueItem[];
  zones: ZoneOperation[];
  days: DayInfo[];
  weather_today: { t_min: number | null; t_max: number | null; rh_mean: number | null; wind_ms: number | null; rain_mm: number | null } | null;
  weather_entity: string | null;
  automatic: boolean;
  winter_mode: boolean;
  problems: string[];
  water_saving_pct: number;
  history_count: number;
  history_last: string | null;
  programs: { id: string; name: string; next: string | null }[];
}

export function fmtDuration(seconds: number): string {
  seconds = Math.max(0, Math.round(seconds));
  if (seconds < 60) return `${seconds} s`;
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  if (min >= 60) return `${Math.floor(min / 60)} h ${min % 60} min`;
  return sec && min < 10 ? `${min}:${String(sec).padStart(2, "0")} min` : `${Math.round(seconds / 60)} min`;
}

export function fmtNumber(value: number | null | undefined, digits = 1): string {
  if (value == null) return "–";
  return value.toLocaleString("de-DE", { maximumFractionDigits: digits });
}

/** Restzeit und Fortschritt (0–1) eines laufenden Eintrags. */
export function progress(item: QueueItem, now: number): { left: number; done: number } {
  if (!item.started_at || !item.ends_at) return { left: item.duration_s, done: 0 };
  const start = Date.parse(item.started_at);
  const end = Date.parse(item.ends_at);
  const left = Math.max(0, (end - now) / 1000);
  const done = end > start ? Math.min(1, Math.max(0, (now - start) / (end - start))) : 0;
  return { left, done };
}

