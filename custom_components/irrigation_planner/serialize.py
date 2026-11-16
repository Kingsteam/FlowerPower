"""Umwandlung zwischen Datenmodell und gespeicherten Daten (JSON).

Bewusst ausgeschrieben statt generisch: So ist für jedes Feld sichtbar, wie
es gespeichert wird, und fehlende Felder bekommen den Standardwert aus
``model.py``. Unbekannte Felder werden ignoriert.
"""

from __future__ import annotations

from typing import Any

from .drivers.base import Capability, SafetyLevel
from .model import (
    EntityRef,
    Garden,
    GardenModel,
    Point,
    Program,
    ProgramMode,
    Pump,
    Sensor,
    SensorKind,
    Valve,
    ValveRole,
    WaterSupply,
    Zone,
    ZoneType,
)

type Data = dict[str, Any]


# Hilfsfunktionen ------------------------------------------------------------


def _point_out(point: Point | None) -> list[float] | None:
    return None if point is None else [point[0], point[1]]


def _point_in(raw: Any) -> Point | None:
    if raw is None:
        return None
    x, y = raw
    return (float(x), float(y))


def _ref_out(ref: EntityRef | None) -> Data | None:
    if ref is None:
        return None
    return {"domain": ref.domain, "platform": ref.platform, "unique_id": ref.unique_id}


def _ref_in(raw: Data | None) -> EntityRef | None:
    if raw is None:
        return None
    return EntityRef(
        domain=raw["domain"], platform=raw["platform"], unique_id=raw["unique_id"]
    )


def _opt(raw: Data, key: str, default: Any) -> Any:
    """Wert oder Standard, wenn der Schlüssel fehlt."""
    return raw.get(key, default)


# Garten ---------------------------------------------------------------------


def garden_to_dict(garden: Garden) -> Data:
    """Garten → dict."""
    return {
        "background_image": garden.background_image,
        "scale_points": None
        if garden.scale_points is None
        else [_point_out(p) for p in garden.scale_points],
        "scale_distance_m": garden.scale_distance_m,
        "north_deg": garden.north_deg,
        "latitude": garden.latitude,
        "longitude": garden.longitude,
    }


def garden_from_dict(raw: Data) -> Garden:
    """Wandelt dict in Garten um."""
    points = raw.get("scale_points")
    return Garden(
        background_image=raw.get("background_image"),
        scale_points=None
        if points is None
        else (_point_in(points[0]), _point_in(points[1])),  # type: ignore[arg-type]
        scale_distance_m=raw.get("scale_distance_m"),
        north_deg=float(_opt(raw, "north_deg", 0.0)),
        latitude=raw.get("latitude"),
        longitude=raw.get("longitude"),
    )


# Zone -----------------------------------------------------------------------


def zone_to_dict(zone: Zone) -> Data:
    """Zone → dict."""
    return {
        "id": zone.id,
        "name": zone.name,
        "type": zone.type.value,
        "center": _point_out(zone.center),
        "radius_m": zone.radius_m,
        "start_angle_deg": zone.start_angle_deg,
        "arc_deg": zone.arc_deg,
        "polygon": [_point_out(p) for p in zone.polygon],
        "plant_type": zone.plant_type,
        "kc": zone.kc,
        "soil_type": zone.soil_type,
        "root_depth_m": zone.root_depth_m,
        "valve_id": zone.valve_id,
        "priority": zone.priority,
        "max_duration_s": zone.max_duration_s,
        "cycle_soak": zone.cycle_soak,
        "enabled": zone.enabled,
    }


def zone_from_dict(raw: Data) -> Zone:
    """Wandelt dict in Zone um."""
    return Zone(
        id=raw["id"],
        name=raw["name"],
        type=ZoneType(raw["type"]),
        center=_point_in(raw.get("center")),
        radius_m=raw.get("radius_m"),
        start_angle_deg=float(_opt(raw, "start_angle_deg", 0.0)),
        arc_deg=float(_opt(raw, "arc_deg", 360.0)),
        polygon=[_point_in(p) for p in _opt(raw, "polygon", [])],  # type: ignore[misc]
        plant_type=raw.get("plant_type"),
        kc=float(_opt(raw, "kc", 1.0)),
        soil_type=raw.get("soil_type"),
        root_depth_m=raw.get("root_depth_m"),
        valve_id=raw.get("valve_id"),
        priority=int(_opt(raw, "priority", 0)),
        max_duration_s=raw.get("max_duration_s"),
        cycle_soak=bool(_opt(raw, "cycle_soak", False)),
        enabled=bool(_opt(raw, "enabled", True)),
    )


# Ventil ---------------------------------------------------------------------


def valve_to_dict(valve: Valve) -> Data:
    """Ventil → dict."""
    return {
        "id": valve.id,
        "name": valve.name,
        "device_id": valve.device_id,
        "driver": valve.driver,
        "profile": valve.profile,
        "driver_options": dict(valve.driver_options),
        "entities": {role.value: _ref_out(ref) for role, ref in valve.entities.items()},
        "capabilities": sorted(c.value for c in valve.capabilities),
        "safety_level": valve.safety_level.value,
        "zone_ids": list(valve.zone_ids),
        "water_supply_id": valve.water_supply_id,
        "learned_flow_l_min": valve.learned_flow_l_min,
    }


def valve_from_dict(raw: Data) -> Valve:
    """Wandelt dict in Ventil um."""
    return Valve(
        id=raw["id"],
        name=raw["name"],
        device_id=raw["device_id"],
        driver=raw["driver"],
        profile=raw.get("profile"),
        driver_options=dict(_opt(raw, "driver_options", {})),
        entities={
            ValveRole(role): _ref_in(ref)  # type: ignore[misc]
            for role, ref in _opt(raw, "entities", {}).items()
        },
        capabilities=frozenset(Capability(c) for c in _opt(raw, "capabilities", [])),
        safety_level=SafetyLevel(_opt(raw, "safety_level", SafetyLevel.HA_ONLY)),
        zone_ids=list(_opt(raw, "zone_ids", [])),
        water_supply_id=raw.get("water_supply_id"),
        learned_flow_l_min=raw.get("learned_flow_l_min"),
    )


# Wasserversorgung -----------------------------------------------------------


def supply_to_dict(supply: WaterSupply) -> Data:
    """Wasserversorgung → dict."""
    pump = supply.pump
    return {
        "id": supply.id,
        "name": supply.name,
        "valve_ids": list(supply.valve_ids),
        "max_open_valves": supply.max_open_valves,
        "max_total_flow_l_min": supply.max_total_flow_l_min,
        "water_meter": _ref_out(supply.water_meter),
        "pump": None
        if pump is None
        else {
            "switch": _ref_out(pump.switch),
            "device_id": pump.device_id,
            "pre_run_s": pump.pre_run_s,
            "post_run_s": pump.post_run_s,
        },
    }


def supply_from_dict(raw: Data) -> WaterSupply:
    """Wandelt dict in Wasserversorgung um.

    Fehlt ``max_open_valves``, gilt der sichere Standard (1) aus ``model.py``.
    """
    pump = raw.get("pump")
    kwargs: Data = {}
    if "max_open_valves" in raw:
        kwargs["max_open_valves"] = int(raw["max_open_valves"])
    return WaterSupply(
        id=raw["id"],
        name=raw["name"],
        valve_ids=list(_opt(raw, "valve_ids", [])),
        max_total_flow_l_min=raw.get("max_total_flow_l_min"),
        water_meter=_ref_in(raw.get("water_meter")),
        pump=None
        if pump is None
        else Pump(
            switch=_ref_in(pump["switch"]),  # type: ignore[arg-type]
            device_id=pump.get("device_id"),
            pre_run_s=int(_opt(pump, "pre_run_s", 0)),
            post_run_s=int(_opt(pump, "post_run_s", 0)),
        ),
        **kwargs,
    )


# Programm -------------------------------------------------------------------


def program_to_dict(program: Program) -> Data:
    """Programm → dict."""
    return {
        "id": program.id,
        "name": program.name,
        "zone_ids": list(program.zone_ids),
        "mode": program.mode.value,
        "pause_between_s": program.pause_between_s,
        "cycle_s": program.cycle_s,
        "soak_s": program.soak_s,
        "start_time": program.start_time,
        "finish_by": program.finish_by,
        "weekdays": list(program.weekdays),
        "interval_days": program.interval_days,
        "skip_on_rain": program.skip_on_rain,
        "skip_on_frost": program.skip_on_frost,
        "skip_on_wind": program.skip_on_wind,
        "enabled": program.enabled,
    }


def program_from_dict(raw: Data) -> Program:
    """Wandelt dict in Programm um."""
    return Program(
        id=raw["id"],
        name=raw["name"],
        zone_ids=list(_opt(raw, "zone_ids", [])),
        mode=ProgramMode(_opt(raw, "mode", ProgramMode.SEQUENCE)),
        pause_between_s=int(_opt(raw, "pause_between_s", 20)),
        cycle_s=raw.get("cycle_s"),
        soak_s=raw.get("soak_s"),
        start_time=raw.get("start_time"),
        finish_by=raw.get("finish_by"),
        weekdays=list(_opt(raw, "weekdays", [])),
        interval_days=raw.get("interval_days"),
        skip_on_rain=bool(_opt(raw, "skip_on_rain", True)),
        skip_on_frost=bool(_opt(raw, "skip_on_frost", True)),
        skip_on_wind=bool(_opt(raw, "skip_on_wind", False)),
        enabled=bool(_opt(raw, "enabled", True)),
    )


# Sensor ---------------------------------------------------------------------


def sensor_to_dict(sensor: Sensor) -> Data:
    """Sensor → dict."""
    return {
        "id": sensor.id,
        "name": sensor.name,
        "kind": sensor.kind.value,
        "entity": _ref_out(sensor.entity),
        "device_id": sensor.device_id,
        "position": _point_out(sensor.position),
        "zone_ids": list(sensor.zone_ids),
    }


def sensor_from_dict(raw: Data) -> Sensor:
    """Wandelt dict in Sensor um."""
    return Sensor(
        id=raw["id"],
        name=raw["name"],
        kind=SensorKind(raw["kind"]),
        entity=_ref_in(raw["entity"]),  # type: ignore[arg-type]
        device_id=raw.get("device_id"),
        position=_point_in(raw.get("position")),
        zone_ids=list(_opt(raw, "zone_ids", [])),
    )


# Gesamtmodell ---------------------------------------------------------------


def model_to_dict(model: GardenModel) -> Data:
    """Gesamtmodell → dict (so wird es gespeichert)."""
    return {
        "garden": garden_to_dict(model.garden),
        "zones": [zone_to_dict(z) for z in model.zones],
        "valves": [valve_to_dict(v) for v in model.valves],
        "water_supplies": [supply_to_dict(s) for s in model.water_supplies],
        "programs": [program_to_dict(p) for p in model.programs],
        "sensors": [sensor_to_dict(s) for s in model.sensors],
    }


def model_from_dict(raw: Data) -> GardenModel:
    """Wandelt dict in Gesamtmodell um und prüft dabei alle Bezüge (``ValueError``)."""
    model = GardenModel(
        garden=garden_from_dict(_opt(raw, "garden", {}) or {}),
        zones=[zone_from_dict(z) for z in _opt(raw, "zones", [])],
        valves=[valve_from_dict(v) for v in _opt(raw, "valves", [])],
        water_supplies=[supply_from_dict(s) for s in _opt(raw, "water_supplies", [])],
        programs=[program_from_dict(p) for p in _opt(raw, "programs", [])],
        sensors=[sensor_from_dict(s) for s in _opt(raw, "sensors", [])],
    )
    model.validate()
    return model
