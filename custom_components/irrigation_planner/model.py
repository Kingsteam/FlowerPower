"""Datenmodell des Bewässerungsplaners (Konzept, Abschnitt 4).

Nur Datenklassen, noch ohne Logik und ohne (De-)Serialisierung.

Bezüge auf Home-Assistant-Geräte und -Entitäten laufen IMMER über die
Geräte-ID (``device_id``) und die eindeutige ID der Entität (``EntityRef``),
nie über die ``entity_id``. So machen Umbenennungen nichts kaputt.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import StrEnum

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
