"""Datenmodell des Bewässerungsplaners (Konzept, Abschnitt 4).

Datenklassen und die Prüfung, ob alle Bezüge zusammenpassen. Die Umwandlung
in gespeicherte Daten und zurück steht in ``serialize.py``.

Bezüge auf Home-Assistant-Geräte und -Entitäten laufen IMMER über die
Geräte-ID (``device_id``) und die eindeutige ID der Entität (``EntityRef``),
nie über die ``entity_id``. So machen Umbenennungen nichts kaputt.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import StrEnum
from typing import Any

from .const import DEFAULT_MAX_OPEN_VALVES
from .drivers.base import Capability, SafetyLevel

type Point = tuple[float, float]
"""Punkt auf dem Gartenplan in Pixeln des Hintergrundbilds."""


@dataclass(slots=True, frozen=True, kw_only=True)
class EntityRef:
    """Stabiler Verweis auf eine Entität im Entitätsregister.

    Die ``unique_id`` ist nur zusammen mit Domain und Plattform eindeutig.
    """

    domain: str
    platform: str
    unique_id: str


class ZoneType(StrEnum):
    """Art einer Zone."""

    SPRINKLER = "sprinkler"  # Kreissegment
    DRIP = "drip"  # Polygon (Tropfschlauch-Beet)


class ValveRole(StrEnum):
    """Rollen der Entitäten eines Ventils (Konzept, Abschnitt 3a)."""

    VALVE = "valve"
    FLOW = "flow"
    VOLUME = "volume"
    STATUS = "status"
    BATTERY = "battery"


class ProgramMode(StrEnum):
    """Ablaufmodus eines Programms (Konzept, Abschnitt 6a)."""

    SEQUENCE = "sequence"  # Zone für Zone komplett
    CYCLE_SOAK = "cycle_soak"  # abwechselnd in kurzen Gießphasen
    PRIORITY = "priority"  # höchster Bedarf zuerst


class SensorKind(StrEnum):
    """Art eines Sensors."""

    RAIN_BINARY = "rain_binary"
    RAIN_MM = "rain_mm"
    SOIL_MOISTURE = "soil_moisture"
    WATER_METER = "water_meter"


@dataclass(slots=True, kw_only=True)
class Garden:
    """Der Gartenplan."""

    background_image: str | None = None
    # Maßstab: zwei Punkte im Bild und ihr echter Abstand in Metern.
    scale_points: tuple[Point, Point] | None = None
    scale_distance_m: float | None = None
    north_deg: float = 0.0
    latitude: float | None = None
    longitude: float | None = None


@dataclass(slots=True, kw_only=True)
class Zone:
    """Eine Bewässerungszone."""

    id: str
    name: str
    type: ZoneType
    # Sprinkler (Kreissegment)
    center: Point | None = None
    radius_m: float | None = None
    start_angle_deg: float = 0.0
    arc_deg: float = 360.0
    # Tropfbereich (Polygon)
    polygon: list[Point] = field(default_factory=list)
    # Pflanzen und Boden
    plant_type: str | None = None
    kc: float = 1.0
    soil_type: str | None = None
    root_depth_m: float | None = None
    # Steuerung
    valve_id: str | None = None
    priority: int = 0
    max_duration_s: int | None = None
    cycle_soak: bool = False
    enabled: bool = True


@dataclass(slots=True, kw_only=True)
class Valve:
    """Ein Ventil und die Entitäten, die zu ihm gehören."""

    id: str
    name: str
    device_id: str
    driver: str
    profile: str | None = None
    # Einstellungen für den Treiber, z. B. MQTT-Name oder Dienst (JSON-fähig).
    driver_options: dict[str, Any] = field(default_factory=dict)
    entities: dict[ValveRole, EntityRef] = field(default_factory=dict)
    capabilities: frozenset[Capability] = frozenset()
    safety_level: SafetyLevel = SafetyLevel.HA_ONLY
    zone_ids: list[str] = field(default_factory=list)
    water_supply_id: str | None = None
    learned_flow_l_min: float | None = None


@dataclass(slots=True, kw_only=True)
class Pump:
    """Optionale Pumpe einer Wasserversorgung (in Phase 1 ohne Bedeutung)."""

    switch: EntityRef
    device_id: str | None = None
    pre_run_s: int = 0
    post_run_s: int = 0


@dataclass(slots=True, kw_only=True)
class WaterSupply:
    """Eine Wasserversorgung, z. B. „Hauswasserleitung Garten“."""

    id: str
    name: str
    valve_ids: list[str] = field(default_factory=list)
    # Wie viele Ventile gleichzeitig offen sein dürfen. Standard 1.
    max_open_valves: int = DEFAULT_MAX_OPEN_VALVES
    max_total_flow_l_min: float | None = None
    water_meter: EntityRef | None = None
    pump: Pump | None = None

    def __post_init__(self) -> None:
        """Prüft die Grenzen."""
        if self.max_open_valves < 1:
            raise ValueError("max_open_valves muss mindestens 1 sein")


@dataclass(slots=True, kw_only=True)
class Program:
    """Eine benannte Abfolge von Zonen mit Zeitplan."""

    id: str
    name: str
    zone_ids: list[str] = field(default_factory=list)
    mode: ProgramMode = ProgramMode.SEQUENCE
    pause_between_s: int = 20
    cycle_s: int | None = None
    soak_s: int | None = None
    # Zeitplan: entweder Startzeit oder "fertig bis" (HH:MM:SS).
    start_time: str | None = None
    finish_by: str | None = None
    weekdays: list[int] = field(default_factory=list)  # 0 = Montag
    interval_days: int | None = None
    skip_on_rain: bool = True
    skip_on_frost: bool = True
    skip_on_wind: bool = False
    enabled: bool = True


@dataclass(slots=True, kw_only=True)
class Sensor:
    """Ein Regen-, Bodenfeuchte- oder Wasserzähler-Sensor."""

    id: str
    name: str
    kind: SensorKind
    entity: EntityRef
    device_id: str | None = None
    position: Point | None = None
    zone_ids: list[str] = field(default_factory=list)


@dataclass(slots=True, kw_only=True)
class GardenModel:
    """Das gesamte gespeicherte Modell."""

    garden: Garden = field(default_factory=Garden)
    zones: list[Zone] = field(default_factory=list)
    valves: list[Valve] = field(default_factory=list)
    water_supplies: list[WaterSupply] = field(default_factory=list)
    programs: list[Program] = field(default_factory=list)
    sensors: list[Sensor] = field(default_factory=list)

    def validate(self) -> None:
        """Prüft, ob IDs eindeutig sind und alle Bezüge existieren.

        Löst ``ValueError`` mit einer verständlichen Meldung aus.
        """
        zone_ids = _unique_ids("Zone", self.zones)
        valve_ids = _unique_ids("Ventil", self.valves)
        supply_ids = _unique_ids("Wasserversorgung", self.water_supplies)
        _unique_ids("Programm", self.programs)
        _unique_ids("Sensor", self.sensors)

        for zone in self.zones:
            _check_ref(f"Zone {zone.id}", "Ventil", zone.valve_id, valve_ids)
            if zone.max_duration_s is not None and zone.max_duration_s < 1:
                raise ValueError(f"Zone {zone.id}: Höchstdauer muss positiv sein")
        for valve in self.valves:
            for zone_id in valve.zone_ids:
                _check_ref(f"Ventil {valve.id}", "Zone", zone_id, zone_ids)
            _check_ref(
                f"Ventil {valve.id}",
                "Wasserversorgung",
                valve.water_supply_id,
                supply_ids,
            )
        owner: dict[str, str] = {}
        for supply in self.water_supplies:
            for valve_id in supply.valve_ids:
                _check_ref(
                    f"Wasserversorgung {supply.id}", "Ventil", valve_id, valve_ids
                )
                if valve_id in owner:
                    raise ValueError(
                        f"Ventil {valve_id} hängt an zwei Wasserversorgungen "
                        f"({owner[valve_id]} und {supply.id})"
                    )
                owner[valve_id] = supply.id
        for valve in self.valves:
            listed_in = owner.get(valve.id)
            if (
                listed_in is not None
                and valve.water_supply_id is not None
                and valve.water_supply_id != listed_in
            ):
                raise ValueError(
                    f"Ventil {valve.id} steht in Wasserversorgung {listed_in}, "
                    f"verweist aber auf {valve.water_supply_id}"
                )
        for program in self.programs:
            for zone_id in program.zone_ids:
                _check_ref(f"Programm {program.id}", "Zone", zone_id, zone_ids)
        for sensor in self.sensors:
            for zone_id in sensor.zone_ids:
                _check_ref(f"Sensor {sensor.id}", "Zone", zone_id, zone_ids)


def _unique_ids(kind: str, items: list[Any]) -> set[str]:
    ids: set[str] = set()
    for item in items:
        if not item.id:
            raise ValueError(f"{kind} ohne ID")
        if item.id in ids:
            raise ValueError(f"{kind}-ID {item.id} kommt doppelt vor")
        ids.add(item.id)
    return ids


def _check_ref(owner: str, kind: str, ref: str | None, known: set[str]) -> None:
    if ref is not None and ref not in known:
        raise ValueError(f"{owner} verweist auf unbekannte(s) {kind} {ref}")
