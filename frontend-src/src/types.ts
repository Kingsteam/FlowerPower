// Daten, wie sie die WebSocket-Schnittstelle liefert (websocket_api.py).
import type { Feature } from "./features";
import type { Point } from "./geometry";

export type { Feature };

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
  background_opacity: number;
  features: Feature[];
}

export interface PlanZone {
  id: string;
  name: string;
  type: "sprinkler" | "drip" | "hose";
  center: Point | null;
  radius_m: number | null;
  start_angle_deg: number;
  arc_deg: number;
  polygon: Point[];
  valve_route?: Point[];
  area_m2: number | null;
  drawn_area_m2: number | null;
  effective_area_m2: number | null;
  overlap_m2: number;
  plant_type: string | null;
  kc: number;
  soil_type: string | null;
  root_depth_m: number | null;
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
  learned_flow_l_min: number | null;
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

export interface Catalog {
  plants: Record<string, { name: string; kc: number; root_depth_m: number; need: string }>;
  soils: Record<string, { name: string; awc_mm_per_m: number }>;
  needs: { key: string; name: string; kc: number }[];
}

export interface PlanData {
  catalog: Catalog;
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
  capacity_mm?: number;
  efficiency?: number;
  planned_s: number;
  reason: string;
  locked_reason: string | null;
}

export interface SensorValue {
  value: number | string;
  unit: string | null;
  field_capacity_pct: number;
  wilting_point_pct: number;
}

export interface Status {
  zones: Record<string, ZoneStatus>;
  sensors?: Record<string, SensorValue>;
  winter_mode: boolean;
  automatic: boolean;
  problems: string[];
}

/** Der Teil des `hass`-Objekts von Home Assistant, den das Panel nutzt. */
export interface Hass {
  config?: { time_zone?: string };
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
