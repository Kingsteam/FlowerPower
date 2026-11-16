"""WebSocket-Befehle für die Seite „Geräte“ im Panel (nur Admin).

Dasselbe wie der Ventil-Assistent im Options-Flow, aber als Tabelle:

- ``irrigation_planner/devices/get``: Ventile, Sensoren, Wasserversorgungen,
  Zonen, Treiber, Profile und die Geräte in Home Assistant, die als Ventil
  in Frage kommen (haben eine ``switch``- oder ``valve``-Entität).
- ``irrigation_planner/devices/suggest``: Vorschlag für ein Gerät (Profil,
  Treiber, Entitäten je Rolle, MQTT-Name) und alle Entitäten des Geräts.
- ``.../devices/save_valve``, ``.../devices/delete_valve``,
  ``.../devices/save_sensor``, ``.../devices/delete_sensor``: prüfen das
  ganze Modell, speichern und laden neu (darum nur, solange nichts gegossen
  wird).
- ``.../devices/test_valve``: Testlauf 10 bis 60 s über die Warteschlange
  (``scheduler.async_hardware_test``), nur auf Knopfdruck. Das Ergebnis
  (schließt das Gerät selbst? Durchfluss?) wird beim Ventil gespeichert.

Kein anderer Befehl öffnet ein Ventil.
"""

from __future__ import annotations

import copy
from typing import TYPE_CHECKING, Any, Final

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant
from homeassistant.helpers import (
    area_registry as ar,
    device_registry as dr,
    entity_registry as er,
)
from homeassistant.util import slugify
import voluptuous as vol

from .const import (
    CONF_WEATHER_ENTITY,
    CONF_WINDOW_END,
    CONF_WINDOW_START,
    DOMAIN,
    HARDWARE_TEST_MAX_S,
    HARDWARE_TEST_MIN_S,
)
from .discovery import suggest
from .drivers.base import Capability, SafetyLevel
from .drivers.registry import DRIVERS, create_driver
from .model import (
    EntityRef,
    GardenModel,
    Sensor,
    SensorKind,
    Valve,
    ValveRole,
    WaterSupply,
    Zone,
    ZoneType,
)
from .panel import async_reload_keep_panel
from .profiles import find_profile
from .scheduler import HardwareTestResult, QueueError
from .serialize import model_from_dict, model_to_dict
from .watchdog import Watchdog

if TYPE_CHECKING:
    from . import IrrigationPlannerConfigEntry

NEW: Final = "__new__"
TIMER_DRIVERS: Final = ("zigbee2mqtt", "service_call")
VALVE_DOMAINS: Final = ("switch", "valve")
SENSOR_KINDS: Final = (
    SensorKind.SOIL_MOISTURE,
    SensorKind.RAIN_MM,
    SensorKind.TEMPERATURE,
    SensorKind.HUMIDITY,
    SensorKind.WIND_SPEED,
)
TIME = vol.Match(r"^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$")
DATE = vol.Any(None, "", vol.Match(r"^\d{2}-\d{2}$"))
BUSY: Final = "Bitte warten, bis die Bewässerung fertig ist"


def _entry(hass: HomeAssistant) -> IrrigationPlannerConfigEntry | None:
    entries = hass.config_entries.async_loaded_entries(DOMAIN)
    return entries[0] if entries else None


def _busy(entry: IrrigationPlannerConfigEntry) -> bool:
    scheduler = entry.runtime_data.scheduler
    return bool(scheduler.runs()) or any(
        s.test_running for s in scheduler.supplies.values()
    )


def _unique_id(name: str, taken: set[str]) -> str:
    base = slugify(name) or "eintrag"
    candidate, n = base, 2
    while candidate in taken:
        candidate, n = f"{base}_{n}", n + 1
    return candidate


def _taken(model: GardenModel) -> set[str]:
    return {
        x.id
        for x in (
            *model.zones,
            *model.valves,
            *model.programs,
            *model.water_supplies,
            *model.sensors,
        )
    }


def _entity_id(hass: HomeAssistant, ref: EntityRef | None) -> str | None:
    if ref is None:
        return None
    return er.async_get(hass).async_get_entity_id(
        ref.domain, ref.platform, ref.unique_id
    )


def _ref(hass: HomeAssistant, entity_id: str) -> EntityRef:
    entry = er.async_get(hass).async_get(entity_id)
    if entry is None:
        raise ValueError(
            f"{entity_id} hat keine eindeutige ID und kann nicht verwendet werden"
        )
    return EntityRef(
        domain=entry.domain, platform=entry.platform, unique_id=entry.unique_id
    )


def _device_name(device: dr.DeviceEntry | None) -> str | None:
    if device is None:
        return None
    return device.name_by_user or device.name


def _state(hass: HomeAssistant, entity_id: str | None) -> str | None:
    if entity_id is None:
        return None
    state = hass.states.get(entity_id)
    return None if state is None else state.state


def _entity_info(hass: HomeAssistant, entry: er.RegistryEntry) -> dict[str, Any]:
    state = hass.states.get(entry.entity_id)
    name = entry.name or entry.original_name
    if state is not None:
        name = state.attributes.get("friendly_name", name)
    return {
        "entity_id": entry.entity_id,
        "name": name or entry.entity_id,
        "domain": entry.domain,
        "device_class": entry.device_class or entry.original_device_class,
        "unit": entry.unit_of_measurement,
        "state": None if state is None else state.state,
    }


def devices_payload(
    hass: HomeAssistant, entry: IrrigationPlannerConfigEntry
) -> dict[str, Any]:
    """Alles für die Seite „Geräte“."""
    data = entry.runtime_data
    model = data.store.model
    devices = dr.async_get(hass)
    entities = er.async_get(hass)
    areas = ar.async_get(hass)
    used: dict[str, str] = {}

    valves = []
    for valve in model.valves:
        roles = {
            role.value: _entity_id(hass, ref) for role, ref in valve.entities.items()
        }
        device = devices.async_get(valve.device_id)
        if device is None and (switch := roles.get(ValveRole.VALVE.value)):
            # Gespeicherte Geräte-ID passt nicht (mehr): Gerät der Schalt-Entität
            entity = entities.async_get(switch)
            if entity is not None and entity.device_id:
                device = devices.async_get(entity.device_id)
        if device is not None:
            used.setdefault(device.id, valve.id)
        valves.append(
            {
                "id": valve.id,
                "name": valve.name,
                "device_id": device.id if device else valve.device_id,
                "device_name": _device_name(device),
                "manufacturer": device.manufacturer if device else None,
                "model": (device.model or device.model_id) if device else None,
                "driver": valve.driver,
                "profile": valve.profile,
                "driver_options": dict(valve.driver_options),
                "entities": roles,
                "state": _state(hass, roles.get(ValveRole.VALVE.value)),
                "flow_now": _state(hass, roles.get(ValveRole.FLOW.value)),
                "battery": _state(hass, roles.get(ValveRole.BATTERY.value)),
                "safety_level": valve.safety_level.value,
                "device_timer": Capability.DEVICE_TIMER in valve.capabilities,
                "zone_ids": [z.id for z in model.zones if z.valve_id == valve.id],
                "water_supply_id": valve.water_supply_id,
                "learned_flow_l_min": valve.learned_flow_l_min,
            }
        )

    sensors = [
        {
            "id": sensor.id,
            "name": sensor.name,
            "kind": sensor.kind.value,
            "entity_id": (entity_id := _entity_id(hass, sensor.entity)),
            "state": _state(hass, entity_id),
            "zone_ids": list(sensor.zone_ids),
            "field_capacity_pct": sensor.field_capacity_pct,
            "wilting_point_pct": sensor.wilting_point_pct,
        }
        for sensor in model.sensors
    ]

    candidates = []
    for device in devices.devices:
        if device.disabled_by is not None:
            continue
        device_entities = [
            e
            for e in er.async_entries_for_device(entities, device.id)
            if e.disabled_by is None
        ]
        if not any(e.domain in VALVE_DOMAINS for e in device_entities):
            continue
        if any(e.platform == DOMAIN for e in device_entities):
            continue  # eigene Schalter (Automatik, Zonen) sind keine Ventile
        profile = find_profile(
            data.profiles, device.manufacturer, device.model, device.model_id
        )
        area = areas.async_get_area(device.area_id) if device.area_id else None
        candidates.append(
            {
                "device_id": device.id,
                "name": _device_name(device) or device.id,
                "manufacturer": device.manufacturer,
                "model": device.model or device.model_id,
                "area": area.name if area else None,
                "profile": profile.name if profile else None,
                "used_by": used.get(device.id),
            }
        )
    candidates.sort(key=lambda c: (c["used_by"] is not None, c["name"].lower()))

    return {
        "valves": valves,
        "sensors": sensors,
        "supplies": [
            {
                "id": s.id,
                "name": s.name,
                "valve_ids": list(s.valve_ids),
                "max_open_valves": s.max_open_valves,
            }
            for s in model.water_supplies
        ],
        "zones": [
            {"id": z.id, "name": z.name, "valve_id": z.valve_id} for z in model.zones
        ],
        "drivers": sorted(DRIVERS),
        "profiles": [
            {"id": p.id, "name": p.name, "driver": p.driver}
            for p in data.profiles.values()
        ],
        "candidates": candidates,
        "settings": {
            "weather_entity": entry.data.get(CONF_WEATHER_ENTITY),
            "window_start": entry.data.get(CONF_WINDOW_START),
            "window_end": entry.data.get(CONF_WINDOW_END),
            "winter_start": model.settings.winter_start,
            "winter_end": model.settings.winter_end,
            "winter_mode": model.settings.winter_mode,
        },
        "busy": _busy(entry),
        "test_min_s": HARDWARE_TEST_MIN_S,
        "test_max_s": HARDWARE_TEST_MAX_S,
    }


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/devices/get"})
@websocket_api.require_admin
@websocket_api.async_response
async def ws_devices_get(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict
) -> None:
    """Ventile, Sensoren und Geräte."""
    if (entry := _entry(hass)) is None:
        connection.send_error(msg["id"], "not_loaded", "Nicht eingerichtet")
        return
    connection.send_result(msg["id"], devices_payload(hass, entry))


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/devices/suggest",
        vol.Required("device_id"): str,
    }
)
@websocket_api.require_admin
@websocket_api.async_response
async def ws_devices_suggest(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict
) -> None:
    """Vorschlag für ein Gerät und seine Entitäten (nur lesen)."""
    if (entry := _entry(hass)) is None:
        connection.send_error(msg["id"], "not_loaded", "Nicht eingerichtet")
        return
    try:
        found = suggest(hass, msg["device_id"], entry.runtime_data.profiles)
    except ValueError as err:
        connection.send_error(msg["id"], "not_found", str(err))
        return
    driver_options: dict[str, Any] = {}
    if found.driver == "zigbee2mqtt":
        driver_options = {
            "friendly_name": found.friendly_name or found.name,
            "base_topic": "zigbee2mqtt",
        }
    elif found.driver == "service_call":
        driver_options = {
            "open_service": "",
            "open_data": {"duration": "{duration}"},
            "duration_unit": "s",
            "device_timer": False,
        }
    device_entities = [
        _entity_info(hass, e)
        for e in er.async_entries_for_device(er.async_get(hass), msg["device_id"])
        if e.disabled_by is None
    ]
    connection.send_result(
        msg["id"],
        {
            "name": found.name,
            "driver": found.driver,
            "profile": found.profile.id if found.profile else None,
            "profile_name": found.profile.name if found.profile else None,
            "entities": {role.value: e for role, e in found.entities.items()},
            "driver_options": driver_options,
            "device_entities": device_entities,
        },
    )


DRIVER_OPTIONS = vol.Schema(
    {
        vol.Optional("friendly_name"): vol.All(str, vol.Length(max=200)),
        vol.Optional("base_topic"): vol.All(str, vol.Length(max=200)),
        vol.Optional("open_service"): vol.All(str, vol.Length(max=200)),
        vol.Optional("open_data"): dict,
        vol.Optional("close_service"): vol.All(str, vol.Length(max=200)),
        vol.Optional("close_data"): dict,
        vol.Optional("duration_unit"): vol.In(["s", "min"]),
        vol.Optional("device_timer"): bool,
    }
)


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/devices/save_valve",
        vol.Optional("valve_id"): vol.Any(None, str),
        vol.Required("name"): vol.All(str, vol.Length(min=1, max=60)),
        vol.Required("device_id"): str,
        vol.Required("driver"): vol.In(sorted(DRIVERS)),
        vol.Optional("profile"): vol.Any(None, str),
        vol.Required("entities"): {
            vol.In([r.value for r in ValveRole]): vol.Any(None, str)
        },
        vol.Optional("driver_options", default={}): DRIVER_OPTIONS,
        vol.Required("water_supply_id"): str,
        vol.Optional("new_supply_name"): vol.All(str, vol.Length(max=60)),
        vol.Optional("zone_ids", default=[]): [str],
        vol.Optional("new_zone_name"): vol.Any(None, vol.All(str, vol.Length(max=60))),
        vol.Optional("new_zone_minutes"): vol.Any(
            None, vol.All(vol.Coerce(float), vol.Range(min=0, max=120))
        ),
    }
)
@websocket_api.require_admin
@websocket_api.async_response
async def ws_devices_save_valve(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict
) -> None:
    """Ventil anlegen oder ändern. Lädt danach neu."""
    if (entry := _entry(hass)) is None:
        connection.send_error(msg["id"], "not_loaded", "Nicht eingerichtet")
        return
    if _busy(entry):
        connection.send_error(msg["id"], "busy", BUSY)
        return
    data = entry.runtime_data
    draft = model_from_dict(model_to_dict(data.store.model))
    try:
        valve_id = _apply_valve(hass, draft, msg)
        draft.validate()
        valve = next(v for v in draft.valves if v.id == valve_id)
        valve.safety_level = create_driver(hass, valve, data.profiles).safety_level
    except ValueError as err:
        connection.send_error(msg["id"], "invalid", str(err))
        return
    data.store.model = draft
    await data.store.async_save()
    async_reload_keep_panel(hass, entry.entry_id)
    connection.send_result(msg["id"], {"id": valve_id, "reloaded": True})


def _apply_valve(hass: HomeAssistant, model: GardenModel, msg: dict) -> str:
    """Übernimmt die Eingaben ins Modell; gibt die ID des Ventils zurück."""
    taken = _taken(model)
    old: Valve | None = None
    if msg.get("valve_id"):
        old = next((v for v in model.valves if v.id == msg["valve_id"]), None)
        if old is None:
            raise ValueError(f"Ventil {msg['valve_id']} gibt es nicht")
    if not msg["entities"].get(ValveRole.VALVE.value):
        raise ValueError("Bitte die Entität zum Schalten wählen")
    refs = {
        ValveRole(role): _ref(hass, entity_id)
        for role, entity_id in msg["entities"].items()
        if entity_id
    }
    profile = msg.get("profile") or None
    if old is None:
        valve = Valve(
            id=_unique_id(msg["name"], taken), name=msg["name"], device_id="", driver=""
        )
        taken.add(valve.id)
        model.valves.append(valve)
    else:
        valve = old
        if valve.driver != msg["driver"] or valve.entities.get(
            ValveRole.VALVE
        ) != refs.get(ValveRole.VALVE):
            # Anderer Schalter oder Treiber: alter Testlauf gilt nicht mehr.
            valve.capabilities = frozenset()
            valve.learned_flow_l_min = None
    valve.name = msg["name"]
    valve.device_id = msg["device_id"]
    valve.driver = msg["driver"]
    valve.profile = profile
    valve.entities = refs
    options = {
        k: v for k, v in msg.get("driver_options", {}).items() if v not in (None, "")
    }
    if valve.driver not in TIMER_DRIVERS:
        options = {}
    elif valve.driver == "zigbee2mqtt":
        options.pop("device_timer", None)
        # Ergebnis eines früheren Testlaufs behalten
        if old is not None and "device_timer" in old.driver_options:
            options["device_timer"] = old.driver_options["device_timer"]
    valve.driver_options = options

    # Wasserversorgung
    supply_id = msg["water_supply_id"]
    if supply_id == NEW:
        name = (msg.get("new_supply_name") or "").strip() or "Hauswasser"
        supply_id = _unique_id(name, taken)
        taken.add(supply_id)
        model.water_supplies.append(WaterSupply(id=supply_id, name=name))
    elif not any(s.id == supply_id for s in model.water_supplies):
        raise ValueError(f"Wasserversorgung {supply_id} gibt es nicht")
    for supply in model.water_supplies:
        if valve.id in supply.valve_ids and supply.id != supply_id:
            supply.valve_ids.remove(valve.id)
        if supply.id == supply_id and valve.id not in supply.valve_ids:
            supply.valve_ids.append(valve.id)
    valve.water_supply_id = supply_id

    # Zonen: genau die gewählten hängen an diesem Ventil
    wanted = list(dict.fromkeys(msg.get("zone_ids", [])))
    zones = {z.id: z for z in model.zones}
    for zone_id in wanted:
        if zone_id not in zones:
            raise ValueError(f"Zone {zone_id} gibt es nicht")
    for zone in model.zones:
        if zone.id in wanted and zone.valve_id != valve.id:
            for other in model.valves:
                if zone.id in other.zone_ids:
                    other.zone_ids.remove(zone.id)
            zone.valve_id = valve.id
        elif zone.id not in wanted and zone.valve_id == valve.id:
            zone.valve_id = None
    valve.zone_ids = wanted
    if zone_name := (msg.get("new_zone_name") or "").strip():
        minutes = msg.get("new_zone_minutes") or 0
        zone = Zone(
            id=_unique_id(zone_name, taken),
            name=zone_name,
            type=ZoneType.DRIP,
            valve_id=valve.id,
            duration_s=round(float(minutes) * 60) or None,
        )
        taken.add(zone.id)
        model.zones.append(zone)
        valve.zone_ids.append(zone.id)
    return valve.id


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/devices/delete_valve",
        vol.Required("valve_id"): str,
    }
)
@websocket_api.require_admin
@websocket_api.async_response
async def ws_devices_delete_valve(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict
) -> None:
    """Ventil löschen (Zonen bleiben, ohne Ventil). Lädt danach neu."""
    if (entry := _entry(hass)) is None:
        connection.send_error(msg["id"], "not_loaded", "Nicht eingerichtet")
        return
    if _busy(entry):
        connection.send_error(msg["id"], "busy", BUSY)
        return
    data = entry.runtime_data
    model = data.store.model
    valve_id = msg["valve_id"]
    if not any(v.id == valve_id for v in model.valves):
        connection.send_error(
            msg["id"], "not_found", f"Ventil {valve_id} gibt es nicht"
        )
        return
    model.valves = [v for v in model.valves if v.id != valve_id]
    for zone in model.zones:
        if zone.valve_id == valve_id:
            zone.valve_id = None
    for supply in model.water_supplies:
        supply.valve_ids = [v for v in supply.valve_ids if v != valve_id]
    await data.store.async_save()
    async_reload_keep_panel(hass, entry.entry_id)
    connection.send_result(msg["id"], {"reloaded": True})


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/devices/save_sensor",
        vol.Optional("sensor_id"): vol.Any(None, str),
        vol.Required("name"): vol.All(str, vol.Length(min=1, max=60)),
        vol.Required("kind"): vol.In([k.value for k in SENSOR_KINDS]),
        vol.Required("entity_id"): str,
        vol.Optional("zone_ids", default=[]): [str],
        vol.Optional("field_capacity_pct", default=35): vol.All(
            vol.Coerce(float), vol.Range(min=1, max=100)
        ),
        vol.Optional("wilting_point_pct", default=12): vol.All(
            vol.Coerce(float), vol.Range(min=0, max=99)
        ),
    }
)
@websocket_api.require_admin
@websocket_api.async_response
async def ws_devices_save_sensor(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict
) -> None:
    """Regen- oder Bodenfeuchtesensor anlegen oder ändern. Lädt danach neu."""
    if (entry := _entry(hass)) is None:
        connection.send_error(msg["id"], "not_loaded", "Nicht eingerichtet")
        return
    if _busy(entry):
        connection.send_error(msg["id"], "busy", BUSY)
        return
    data = entry.runtime_data
    draft = model_from_dict(model_to_dict(data.store.model))
    try:
        ref = _ref(hass, msg["entity_id"])
        if msg["field_capacity_pct"] <= msg["wilting_point_pct"]:
            raise ValueError("„Voll“ muss größer sein als „leer“")
        registry_entry = er.async_get(hass).async_get(msg["entity_id"])
        if msg.get("sensor_id"):
            sensor = next((s for s in draft.sensors if s.id == msg["sensor_id"]), None)
            if sensor is None:
                raise ValueError(f"Sensor {msg['sensor_id']} gibt es nicht")
        else:
            sensor = Sensor(
                id=_unique_id(msg["name"], _taken(draft)),
                name=msg["name"],
                kind=SensorKind(msg["kind"]),
                entity=ref,
            )
            draft.sensors.append(sensor)
        sensor.name = msg["name"]
        sensor.kind = SensorKind(msg["kind"])
        sensor.entity = ref
        sensor.device_id = registry_entry.device_id if registry_entry else None
        sensor.zone_ids = list(dict.fromkeys(msg["zone_ids"]))
        sensor.field_capacity_pct = msg["field_capacity_pct"]
        sensor.wilting_point_pct = msg["wilting_point_pct"]
        draft.validate()
    except ValueError as err:
        connection.send_error(msg["id"], "invalid", str(err))
        return
    data.store.model = draft
    await data.store.async_save()
    async_reload_keep_panel(hass, entry.entry_id)
    connection.send_result(msg["id"], {"id": sensor.id, "reloaded": True})


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/devices/delete_sensor",
        vol.Required("sensor_id"): str,
    }
)
@websocket_api.require_admin
@websocket_api.async_response
async def ws_devices_delete_sensor(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict
) -> None:
    """Sensor entfernen. Lädt danach neu."""
    if (entry := _entry(hass)) is None:
        connection.send_error(msg["id"], "not_loaded", "Nicht eingerichtet")
        return
    if _busy(entry):
        connection.send_error(msg["id"], "busy", BUSY)
        return
    data = entry.runtime_data
    before = len(data.store.model.sensors)
    data.store.model.sensors = [
        s for s in data.store.model.sensors if s.id != msg["sensor_id"]
    ]
    if len(data.store.model.sensors) == before:
        connection.send_error(
            msg["id"], "not_found", f"Sensor {msg['sensor_id']} gibt es nicht"
        )
        return
    await data.store.async_save()
    async_reload_keep_panel(hass, entry.entry_id)
    connection.send_result(msg["id"], {"reloaded": True})


def _full_time(value: str) -> str:
    return value if value.count(":") == 2 else f"{value}:00"


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/devices/save_settings",
        vol.Optional("weather_entity"): vol.Any(None, "", vol.Match(r"^weather\.\w+$")),
        vol.Required("window_start"): TIME,
        vol.Required("window_end"): TIME,
        vol.Optional("winter_start"): DATE,
        vol.Optional("winter_end"): DATE,
    }
)
@websocket_api.require_admin
@websocket_api.async_response
async def ws_devices_save_settings(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict
) -> None:
    """Wetterquelle, Zeitfenster, Winterpause nach Datum. Lädt danach neu."""
    if (entry := _entry(hass)) is None:
        connection.send_error(msg["id"], "not_loaded", "Nicht eingerichtet")
        return
    if _busy(entry):
        connection.send_error(msg["id"], "busy", BUSY)
        return
    start = _full_time(msg["window_start"])
    end = _full_time(msg["window_end"])
    if start == end:
        connection.send_error(
            msg["id"], "invalid", "Das Zeitfenster braucht verschiedene Uhrzeiten"
        )
        return
    data = entry.runtime_data
    draft = model_from_dict(model_to_dict(data.store.model))
    draft.settings.winter_start = msg.get("winter_start") or None
    draft.settings.winter_end = msg.get("winter_end") or None
    try:
        draft.validate()
    except ValueError as err:
        connection.send_error(msg["id"], "invalid", str(err))
        return
    data.store.model = draft
    await data.store.async_save()
    new = {**entry.data, CONF_WINDOW_START: start, CONF_WINDOW_END: end}
    new.pop(CONF_WEATHER_ENTITY, None)
    if msg.get("weather_entity"):
        new[CONF_WEATHER_ENTITY] = msg["weather_entity"]
    hass.config_entries.async_update_entry(entry, data=new)
    async_reload_keep_panel(hass, entry.entry_id)
    connection.send_result(msg["id"], {"reloaded": True})


def _outcome(result: HardwareTestResult) -> tuple[str, str]:
    """(Stufe, Text) zum Ergebnis eines Testlaufs."""
    if not result.opened:
        return "error", f"Das Ventil hat nicht geöffnet: {result.error}"
    if not result.closed_ok:
        return "error", "Das Ventil ist NICHT zu! Bitte sofort von Hand prüfen."
    if result.device_closed:
        return "ok", "Das Gerät schließt selbst. Sehr gut."
    if result.device_closed is False:
        return (
            "warn",
            "Das Gerät hat NICHT selbst geschlossen; Home Assistant hat "
            "geschlossen. Nur Home Assistant überwacht die Zeit.",
        )
    return "warn", "Nur Home Assistant überwacht die Zeit (Treiber ohne Gerätetimer)."


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/devices/test_valve",
        vol.Required("valve_id"): str,
        vol.Optional("seconds", default=HARDWARE_TEST_MIN_S): vol.All(
            vol.Coerce(int), vol.Range(min=HARDWARE_TEST_MIN_S, max=HARDWARE_TEST_MAX_S)
        ),
    }
)
@websocket_api.require_admin
@websocket_api.async_response
async def ws_devices_test_valve(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict
) -> None:
    """Testlauf mit 10 bis 60 s. Antwortet erst, wenn das Ventil wieder zu ist."""
    if (entry := _entry(hass)) is None:
        connection.send_error(msg["id"], "not_loaded", "Nicht eingerichtet")
        return
    data = entry.runtime_data
    saved = next((v for v in data.store.model.valves if v.id == msg["valve_id"]), None)
    if saved is None:
        connection.send_error(
            msg["id"], "not_found", f"Ventil {msg['valve_id']} gibt es nicht"
        )
        return
    if data.scheduler.runs():
        connection.send_error(msg["id"], "busy", BUSY)
        return
    test_valve = copy.deepcopy(saved)
    if test_valve.driver in TIMER_DRIVERS:
        # Für den Test Gerätetimer annehmen: Home Assistant schließt dann erst
        # nach Ablauf plus Reserve, und man sieht, ob das Gerät es selbst tut.
        test_valve.driver_options["device_timer"] = True
    try:
        driver = create_driver(hass, test_valve, data.profiles)
    except ValueError as err:
        connection.send_error(msg["id"], "invalid", str(err))
        return
    watchdog = Watchdog(hass, data.store, data.scheduler, {test_valve.id: driver})
    # Hintergrundaufgabe: Der Test wartet auf die Uhr.
    task = hass.async_create_background_task(
        data.scheduler.async_hardware_test(
            driver,
            test_valve.water_supply_id,
            msg["seconds"],
            lambda: watchdog.flow_l_min(test_valve.id),
        ),
        "irrigation_planner Testlauf (Panel)",
    )
    try:
        result = await task
    except QueueError as err:
        connection.send_error(msg["id"], "busy", str(err))
        return

    if result.opened and result.closed_ok:
        # Ergebnis beim Ventil merken (wie im Assistenten)
        valve = next((v for v in data.store.model.valves if v.id == saved.id), None)
        if valve is not None:
            if valve.driver in TIMER_DRIVERS:
                valve.driver_options["device_timer"] = bool(result.device_closed)
            caps = set(valve.capabilities) - {Capability.DEVICE_TIMER}
            if result.device_closed:
                caps.add(Capability.DEVICE_TIMER)
            valve.capabilities = frozenset(caps)
            valve.safety_level = (
                SafetyLevel.DEVICE if result.device_closed else SafetyLevel.HA_ONLY
            )
            if result.flow_l_min and valve.learned_flow_l_min is None:
                valve.learned_flow_l_min = round(result.flow_l_min, 2)
            await data.store.async_save()
            if not _busy(entry):
                async_reload_keep_panel(hass, entry.entry_id)
    level, text = _outcome(result)
    connection.send_result(
        msg["id"],
        {
            "level": level,
            "text": text,
            "opened": result.opened,
            "device_closed": result.device_closed,
            "closed_ok": result.closed_ok,
            "flow_l_min": result.flow_l_min,
            "seconds": msg["seconds"],
        },
    )


ALL_COMMANDS: Final = (
    ws_devices_get,
    ws_devices_suggest,
    ws_devices_save_valve,
    ws_devices_delete_valve,
    ws_devices_save_sensor,
    ws_devices_delete_sensor,
    ws_devices_test_valve,
    ws_devices_save_settings,
)
