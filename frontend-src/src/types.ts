// Daten, wie sie die WebSocket-Schnittstelle liefert (websocket_api.py).
import type { Point } from "./geometry";

export interface Garden {
  background: "none" | "image" | "map";
  background_image: string | null;
  scale_points: [Point, Point] | null;
  scale_distance_m: number | null;
  north_deg: number;
  latitude: number | null;
  longitude: number | null;
  map_zoom: number | null;
  map_provider: string | null;
  map_url: string | null;
}

export interface PlanZone {
  id: string;
  name: string;
  type: "sprinkler" | "drip";
  center: Point | null;
  radius_m: number | null;
  start_angle_deg: number;
  arc_deg: number;
  polygon: Point[];
  area_m2: number | null;
  drawn_area_m2: number | null;
  effective_area_m2: number | null;
  overlap_m2: number;
  plant_type: string | null;
  valve_id: string | null;
  duration_mode: string;
  duration_s: number | null;
  enabled: boolean;
}

export interface PlanValve {
  id: string;
  name: string;
  position: Point | null;
  zone_ids: string[];
  safety_level: string;
}

export interface PlanSensor {
  id: string;
  name: string;
  kind: string;
  position: Point | null;
  zone_ids: string[];
}

export interface Provider {
  name: string;
  short?: string;
  kind?: "photo" | "map";
  url: string;
  overlay?: string;
  attribution: string;
  max_zoom: number;
}

export interface PlanData {
  garden: Garden;
  home: { latitude: number; longitude: number };
  providers: Record<string, Provider>;
  zones: PlanZone[];
  valves: PlanValve[];
  sensors: PlanSensor[];
}

export interface ZoneStatus {
  state: "idle" | "running" | "queued" | "locked";
  ends_at: string | null;
  need_mm: number;
  planned_s: number;
  reason: string;
  locked_reason: string | null;
}

export interface Status {
  zones: Record<string, ZoneStatus>;
  winter_mode: boolean;
  automatic: boolean;
  problems: string[];
}

/** Der Teil des `hass`-Objekts von Home Assistant, den das Panel nutzt. */
export interface Hass {
  callWS<T>(msg: Record<string, unknown>): Promise<T>;
  callService(domain: string, service: string, data: Record<string, unknown>): Promise<unknown>;
  fetchWithAuth(path: string, init?: RequestInit): Promise<Response>;
  connection: {
    subscribeMessage<T>(
      callback: (msg: T) => void,
      msg: Record<string, unknown>,
    ): Promise<() => void>;
  };
}
