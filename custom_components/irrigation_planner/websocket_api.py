"""WebSocket-Schnittstelle für das Panel (Plan-Editor).

Befehle:

- ``irrigation_planner/plan/get``: Plan, Zonen, Ventile, Sensoren und die
  Kartendienste zum Zeichnen.
- ``irrigation_planner/plan/save`` (nur Admin): speichert **nur** den
  Hintergrund und die Geometrie (Mittelpunkt, Radius, Winkel, Polygon,
  Positionen). Alles andere wird weiter im Options-Flow eingerichtet.
  Gespeichert wird erst, wenn das ganze Modell gültig ist.
- ``irrigation_planner/plan/subscribe``: Zustand je Zone (läuft, wartet,
  gesperrt, Bedarf, geplante Dauer), bei jeder Änderung neu.
- ``irrigation_planner/geocode`` (nur Admin): Adresssuche über Nominatim
  (siehe ``geocode.py``).

Keiner dieser Befehle öffnet ein Ventil; gegossen wird weiter nur über die
Warteschlange (Dienst ``run_zone``).
"""

from __future__ import annotations

import contextlib
import copy
import math
from typing import TYPE_CHECKING, Any

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback
import voluptuous as vol

from .backup import ws_export, ws_import
from .catalog import catalog
from .const import DOMAIN, MAP_PROVIDER_CUSTOM, MAP_PROVIDERS
from .drivers.ha import resolve_entity_id
from .geocode import GeocodeError, async_search
from .geometry import geometry_area, overlaps, zone_area
from .model import GardenModel, Point, ZoneType
from .operation_api import ALL_COMMANDS as OPERATION_COMMANDS
from .schedule_api import ALL_COMMANDS as SCHEDULE_COMMANDS
from .scheduler import RunState
from .serialize import garden_from_dict, garden_to_dict

if TYPE_CHECKING:
    from . import IrrigationPlannerData


def _number(value: Any) -> float:
    number = float(value)
    if not math.isfinite(number):
        raise vol.Invalid("Zahl erwartet")
    return number


POINT = vol.All(vol.ExactSequence([_number, _number]), lambda p: (p[0], p[1]))
OPT_POINT = vol.Any(None, POINT)

ZONE_GEOMETRY = vol.Schema(
    {
        vol.Required("id"): str,
        # Art der Zone (Sprinkler, Tropf/Beet, Gießschlauch)
        vol.Optional("type"): vol.In([t.value for t in ZoneType]),
        vol.Optional("center"): OPT_POINT,
        vol.Optional("radius_m"): vol.Any(None, _number),
        vol.Optional("start_angle_deg"): _number,
        vol.Optional("arc_deg"): _number,
        vol.Optional("polygon"): [POINT],
        # Zuordnung zum Ventil (None = keins)
        vol.Optional("valve_id"): vol.Any(None, str),
        # Pflanzen und Boden (Prüfung der Werte in GardenModel.validate)
        vol.Optional("plant_type"): vol.Any(None, str),
        vol.Optional("kc"): _number,
        vol.Optional("soil_type"): vol.Any(None, str),
        vol.Optional("root_depth_m"): vol.Any(None, _number),
    }
)
PLANT_KEYS = ("plant_type", "kc", "soil_type", "root_depth_m")
POSITION = vol.Schema({vol.Required("id"): str, vol.Required("position"): OPT_POINT})


@callback
def async_register(hass: HomeAssistant) -> None:
    """Meldet die Befehle an (einmal)."""
    websocket_api.async_register_command(hass, ws_plan_get)
    websocket_api.async_register_command(hass, ws_plan_save)
    websocket_api.async_register_command(hass, ws_plan_subscribe)
    websocket_api.async_register_command(hass, ws_geocode)
    websocket_api.async_register_command(hass, ws_export)
    websocket_api.async_register_command(hass, ws_import)
    for command in (*SCHEDULE_COMMANDS, *OPERATION_COMMANDS):
        websocket_api.async_register_command(hass, command)


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/geocode",
        vol.Required("query"): vol.All(str, vol.Length(max=200)),
        vol.Optional("language", default="de"): vol.All(str, vol.Length(max=10)),
    }
)
@websocket_api.require_admin
@websocket_api.async_response
async def ws_geocode(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict
) -> None:
    """Adresse suchen (für das Ausrichten des Luftbilds)."""
    try:
        places = await async_search(hass, msg["query"], msg["language"])
    except GeocodeError as err:
        connection.send_error(msg["id"], "geocode_failed", str(err))
        return
    connection.send_result(msg["id"], {"places": places})


def _data(hass: HomeAssistant) -> IrrigationPlannerData | None:
    entries = hass.config_entries.async_loaded_entries(DOMAIN)
    return entries[0].runtime_data if entries else None


def _point(point: Point | None) -> list[float] | None:
    return None if point is None else [point[0], point[1]]


def plan_payload(hass: HomeAssistant, data: IrrigationPlannerData) -> dict[str, Any]:
    """Alles, was der Plan-Editor zum Zeichnen braucht."""
    model = data.store.model
    overlap = overlaps(model.zones)
    return {
        "garden": garden_to_dict(model.garden),
        "home": {
            "latitude": hass.config.latitude,
            "longitude": hass.config.longitude,
        },
        "catalog": catalog(),
        "providers": {key: dict(provider) for key, provider in MAP_PROVIDERS.items()},
        "zones": [
            {
                "id": z.id,
                "name": z.name,
                "type": z.type.value,
                "center": _point(z.center),
                "radius_m": z.radius_m,
                "start_angle_deg": z.start_angle_deg,
                "arc_deg": z.arc_deg,
                "polygon": [_point(p) for p in z.polygon],
                "area_m2": z.area_m2,
                "drawn_area_m2": geometry_area(z),
                "effective_area_m2": zone_area(z),
                "overlap_m2": overlap.get(z.id, 0.0),
                "plant_type": z.plant_type,
                "kc": z.kc,
                "soil_type": z.soil_type,
                "root_depth_m": z.root_depth_m,
                "valve_id": z.valve_id,
                "duration_mode": z.duration_mode.value,
                "duration_s": z.duration_s,
                "enabled": z.enabled,
            }
            for z in model.zones
        ],
        "valves": [
            {
                "id": v.id,
                "name": v.name,
                "position": _point(v.position),
                "zone_ids": list(v.zone_ids),
                "learned_flow_l_min": v.learned_flow_l_min,
                "safety_level": v.safety_level.value,
            }
            for v in model.valves
        ],
        "sensors": [
            {
                "id": s.id,
                "name": s.name,
                "kind": s.kind.value,
                "position": _point(s.position),
                "zone_ids": list(s.zone_ids),
            }
            for s in model.sensors
        ],
    }


def _sensor_values(data: IrrigationPlannerData) -> dict[str, Any]:
    """Aktuelle Messwerte der Sensoren (für die Nässekarte)."""
    hass = data.balance.hass
    values: dict[str, Any] = {}
    for sensor in data.store.model.sensors:
        entity_id = resolve_entity_id(hass, sensor.entity)
        state = hass.states.get(entity_id) if entity_id else None
        if state is None or state.state in ("unknown", "unavailable"):
            continue
        try:
            value: float | str = float(state.state)
        except ValueError:
            value = state.state
        values[sensor.id] = {
            "value": value,
            "unit": state.attributes.get("unit_of_measurement"),
            "field_capacity_pct": sensor.field_capacity_pct,
            "wilting_point_pct": sensor.wilting_point_pct,
        }
    return values


def status_payload(data: IrrigationPlannerData) -> dict[str, Any]:
    """Zustand je Zone für die Einfärbung im Plan."""
    runs = data.scheduler.runs()
    zones: dict[str, Any] = {}
    for zone in data.store.model.zones:
        run = next((r for r in runs if r.zone_id == zone.id), None)
        state = "idle"
        if zone.id in data.scheduler.locked_zones:
            state = "locked"
        elif run is not None:
            state = "running" if run.state is RunState.RUNNING else "queued"
        planned = data.balance.planned(zone)
        zones[zone.id] = {
            "state": state,
            "ends_at": run.ends_at.isoformat() if run and run.ends_at else None,
            "need_mm": round(data.balance.deficit_mm(zone), 1),
            "planned_s": planned.seconds,
            "reason": planned.reason,
            "locked_reason": data.scheduler.locked_zones.get(zone.id),
        }
    return {
        "zones": zones,
        "sensors": _sensor_values(data),
        "winter_mode": data.store.model.settings.winter_mode,
        "automatic": data.store.model.settings.automatic,
        "problems": data.problems,
    }


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/plan/get"})
@callback
def ws_plan_get(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict
) -> None:
    """Plan lesen."""
    data = _data(hass)
    if data is None:
        connection.send_error(msg["id"], "not_loaded", "Nicht eingerichtet")
        return
    connection.send_result(msg["id"], plan_payload(hass, data))


def _sync_valve_zones(model: GardenModel) -> None:
    """Ventil → Zonen passend zu Zone → Ventil halten (Reihenfolge bleibt)."""
    for valve in model.valves:
        mine = [z.id for z in model.zones if z.valve_id == valve.id]
        valve.zone_ids = [z for z in valve.zone_ids if z in mine] + [
            z for z in mine if z not in valve.zone_ids
        ]


def _apply_garden(model: GardenModel, raw: dict[str, Any]) -> None:
    garden = garden_from_dict({**garden_to_dict(model.garden), **raw})
    if garden.map_provider and garden.map_provider not in (
        *MAP_PROVIDERS,
        MAP_PROVIDER_CUSTOM,
    ):
        raise ValueError("Luftbild: unbekannter Kartendienst")
    model.garden = garden


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/plan/save",
        vol.Optional("garden"): dict,
        vol.Optional("zones", default=[]): [ZONE_GEOMETRY],
        vol.Optional("valves", default=[]): [POSITION],
        vol.Optional("sensors", default=[]): [POSITION],
    }
)
@websocket_api.require_admin
@websocket_api.async_response
async def ws_plan_save(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict
) -> None:
    """Hintergrund und Geometrie speichern (nach Prüfung des ganzen Modells)."""
    data = _data(hass)
    if data is None:
        connection.send_error(msg["id"], "not_loaded", "Nicht eingerichtet")
        return
    model = copy.deepcopy(data.store.model)
    zones = {z.id: z for z in model.zones}
    valves = {v.id: v for v in model.valves}
    sensors = {s.id: s for s in model.sensors}
    try:
        if "garden" in msg:
            _apply_garden(model, msg["garden"])
        for raw in msg["zones"]:
            zone = zones.get(raw["id"])
            if zone is None:
                raise ValueError(f"Zone {raw['id']} gibt es nicht")
            if "type" in raw:
                zone.type = ZoneType(raw["type"])
            for key in ("center", "radius_m", "start_angle_deg", "arc_deg"):
                if key in raw:
                    setattr(zone, key, raw[key])
            if "polygon" in raw:
                zone.polygon = list(raw["polygon"])
            if "valve_id" in raw:
                zone.valve_id = raw["valve_id"]
            for key in PLANT_KEYS:
                if key in raw:
                    setattr(zone, key, raw[key])
        _sync_valve_zones(model)
        for items, raws, what in (
            (valves, msg["valves"], "Ventil"),
            (sensors, msg["sensors"], "Sensor"),
        ):
            for raw in raws:
                item = items.get(raw["id"])
                if item is None:
                    raise ValueError(f"{what} {raw['id']} gibt es nicht")
                item.position = raw["position"]
        model.validate()
    except (ValueError, TypeError, KeyError) as err:
        connection.send_error(msg["id"], "invalid", str(err))
        return
    data.store.model.garden = model.garden
    for zone in data.store.model.zones:
        new = zones[zone.id]
        zone.type = new.type
        zone.center, zone.radius_m = new.center, new.radius_m
        zone.start_angle_deg, zone.arc_deg = new.start_angle_deg, new.arc_deg
        zone.polygon = new.polygon
        zone.valve_id = new.valve_id
        for key in PLANT_KEYS:
            setattr(zone, key, getattr(new, key))
    for valve in data.store.model.valves:
        valve.position = valves[valve.id].position
        valve.zone_ids = list(valves[valve.id].zone_ids)
    for sensor in data.store.model.sensors:
        sensor.position = sensors[sensor.id].position
    await data.store.async_save()
    data.async_model_changed()
    data.balance.async_notify()
    connection.send_result(msg["id"], plan_payload(hass, data))


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/plan/subscribe"})
@callback
def ws_plan_subscribe(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict
) -> None:
    """Zustand der Zonen abonnieren."""
    data = _data(hass)
    if data is None:
        connection.send_error(msg["id"], "not_loaded", "Nicht eingerichtet")
        return

    @callback
    def send() -> None:
        connection.send_message(
            websocket_api.event_message(msg["id"], status_payload(data))
        )

    removers = [
        data.scheduler.async_add_listener(send),
        data.balance.async_add_listener(send),
    ]

    @callback
    def unsubscribe() -> None:
        for remove in removers:
            with contextlib.suppress(ValueError):  # schon abgemeldet
                remove()

    connection.subscriptions[msg["id"]] = unsubscribe
    connection.send_result(msg["id"])
    send()
