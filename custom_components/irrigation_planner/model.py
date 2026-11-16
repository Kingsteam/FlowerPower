"""Datenmodell des Bewässerungsplaners (Konzept, Abschnitt 4).

Datenklassen und die Prüfung, ob alle Bezüge zusammenpassen. Die Umwandlung
in gespeicherte Daten und zurück steht in ``serialize.py``.

Bezüge auf Home-Assistant-Geräte und -Entitäten laufen IMMER über die
Geräte-ID (``device_id``) und die eindeutige ID der Entität (``EntityRef``),
nie über die ``entity_id``. So machen Umbenennungen nichts kaputt.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date
from enum import StrEnum
import math
from typing import Any, Final

from .const import DEFAULT_MAX_OPEN_VALVES
from .drivers.base import Capability, SafetyLevel

type Point = tuple[float, float]
"""Punkt auf dem Gartenplan in Metern (x nach Osten, y nach Süden)."""


@dataclass(slots=True, frozen=True, kw_only=True)
class EntityRef:
    """Stabiler Verweis auf eine Entität im Entitätsregister.

    Die ``unique_id`` ist nur zusammen mit Domain und Plattform eindeutig.
    """

    domain: str
    platform: str
    unique_id: str


# Sonnenereignisse für den Zeitplan (statt einer Uhrzeit).
SUN_EVENTS: Final = ("sunrise", "sunset")
MAX_SUN_OFFSET_MIN: Final = 360


class BackgroundType(StrEnum):
    """Was unter dem Plan liegt."""

    NONE = "none"  # leeres Raster
    IMAGE = "image"  # hochgeladenes Bild mit Maßstab
    MAP = "map"  # Luftbild eines Kartendienstes


class ZoneType(StrEnum):
    """Art einer Zone."""

    SPRINKLER = "sprinkler"  # Kreissegment
    DRIP = "drip"  # Polygon (Tropfschlauch-Beet)
    HOSE = "hose"  # Linie mit Radius (Gieß-/Perlschlauch): Punkte + radius_m


class DurationMode(StrEnum):
    """Woher die Gießdauer einer Zone kommt."""

    MANUAL = "manual"  # von Hand eingestellt (Zone.duration_s)
    CALCULATED = "calculated"  # aus dem Wasserhaushalt (Phase 2)
    ENTITY = "entity"  # aus einer Entität in Sekunden, z. B. Smart Irrigation


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

    background: BackgroundType = BackgroundType.NONE
    # Hochgeladenes Bild (Dateiname) und Maßstab: zwei Punkte im Bild (Pixel)
    # und ihr echter Abstand in Metern. Die linke obere Ecke ist (0, 0).
    background_image: str | None = None
    scale_points: tuple[Point, Point] | None = None
    scale_distance_m: float | None = None
    north_deg: float = 0.0
    # Luftbild: Kartenmitte (= Ursprung des Plans), Zoomstufe, Dienst.
    latitude: float | None = None
    longitude: float | None = None
    map_zoom: float | None = None
    map_provider: str | None = None
    map_url: str | None = None  # nur für eigenen Dienst ({z}, {x}, {y})
    # Deckkraft des Hintergrunds (0 = aus, 1 = voll), z. B. zum Abpausen.
    background_opacity: float = 1.0
    # Grundriss: abgepauste Formen (Haus, Weg, Zaun, Baum, …), nur zur
    # Orientierung; für die Berechnung zählen allein die Zonen.
    features: list[Feature] = field(default_factory=list)


# Arten von Grundriss-Formen und wie viele Punkte sie brauchen.
FEATURE_AREAS: Final = ("building", "paving", "water", "area")
FEATURE_LINES: Final = ("fence", "hedge", "boundary", "pipe")
FEATURE_POINTS: Final = ("tree", "label", "tap")
FEATURE_KINDS: Final = (*FEATURE_AREAS, *FEATURE_LINES, *FEATURE_POINTS)
MAX_FEATURES: Final = 500
MAX_LABEL_LENGTH: Final = 60


@dataclass(slots=True, kw_only=True)
class Feature:
    """Eine Form im Grundriss.

    Flächen und Linien haben ``points``; Baum, Beschriftung und Wasserhahn
    haben genau einen Punkt. Ein Baum hat dazu einen Kronenradius.
    """

    id: str
    kind: str
    points: list[Point] = field(default_factory=list)
    radius_m: float | None = None
    label: str | None = None


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
    # Gießdauer von Hand (Dauer-Art MANUAL; sonst Rückfallwert).
    duration_s: int | None = None
    duration_mode: DurationMode = DurationMode.MANUAL
    # Entität mit der Dauer in Sekunden (Dauer-Art ENTITY).
    duration_entity: EntityRef | None = None
    # Fläche in m² (bis zum Plan-Editor von Hand, danach aus der Zeichnung).
    area_m2: float | None = None
    # Anteil des Wassers, der bei den Pflanzen ankommt (None = nach Zonenart).
    efficiency: float | None = None
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
    # Position auf dem Plan (Orientierungshilfe).
    position: Point | None = None


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
    # Zeitplan: entweder Startzeit oder "fertig bis". Jeweils eine Uhrzeit
    # (HH:MM:SS) oder ein Sonnenereignis ("sunrise"/"sunset") mit Versatz
    # in Minuten (negativ = vorher), z. B. fertig 60 min vor Sonnenaufgang.
    start_time: str | None = None
    finish_by: str | None = None
    sun_offset_min: int = 0
    weekdays: list[int] = field(default_factory=list)  # 0 = Montag
    interval_days: int | None = None
    skip_on_rain: bool = True
    skip_on_frost: bool = True
    skip_on_wind: bool = False
    enabled: bool = True
    # Datum des letzten automatischen oder manuellen Starts (ISO, für „alle N Tage“).
    last_run: str | None = None


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
    # Bodenfeuchte: Messwert bei voll (Feldkapazität) und bei leer
    # (Welkepunkt), in %. Daraus wird das Defizit geschätzt.
    field_capacity_pct: float = 35.0
    wilting_point_pct: float = 12.0


@dataclass(slots=True, kw_only=True)
class Settings:
    """Globale Schalter."""

    automatic: bool = True  # Zeitpläne aktiv
    winter_mode: bool = False  # Winterpause
    # Winterpause automatisch nach Datum (MM-TT), z. B. "11-01" bis "03-31".
    winter_start: str | None = None
    winter_end: str | None = None
    # Geräte, die die Winterpause deaktiviert hat (nur diese werden wieder aktiviert).
    winter_disabled_devices: list[str] = field(default_factory=list)


@dataclass(slots=True, kw_only=True)
class GardenModel:
    """Das gesamte gespeicherte Modell."""

    settings: Settings = field(default_factory=Settings)
    garden: Garden = field(default_factory=Garden)
    zones: list[Zone] = field(default_factory=list)
    valves: list[Valve] = field(default_factory=list)
    water_supplies: list[WaterSupply] = field(default_factory=list)
    programs: list[Program] = field(default_factory=list)
    sensors: list[Sensor] = field(default_factory=list)

    def _validate_garden(self) -> None:
        _check_garden(self.garden)

    def validate(self) -> None:
        """Prüft, ob IDs eindeutig sind und alle Bezüge existieren.

        Löst ``ValueError`` mit einer verständlichen Meldung aus.
        """
        for label, value in (
            ("Winterpause ab", self.settings.winter_start),
            ("Winterpause bis", self.settings.winter_end),
        ):
            if value is not None:
                _check_month_day(label, value)
        self._validate_garden()
        zone_ids = _unique_ids("Zone", self.zones)
        valve_ids = _unique_ids("Ventil", self.valves)
        supply_ids = _unique_ids("Wasserversorgung", self.water_supplies)
        _unique_ids("Programm", self.programs)
        _unique_ids("Sensor", self.sensors)

        for zone in self.zones:
            _check_ref(f"Zone {zone.id}", "Ventil", zone.valve_id, valve_ids)
            if zone.max_duration_s is not None and zone.max_duration_s < 1:
                raise ValueError(f"Zone {zone.id}: Höchstdauer muss positiv sein")
            if zone.duration_s is not None and zone.duration_s < 1:
                raise ValueError(f"Zone {zone.id}: Dauer muss positiv sein")
            if zone.radius_m is not None and zone.radius_m <= 0:
                raise ValueError(f"Zone {zone.id}: Radius muss positiv sein")
            if not 0 < zone.arc_deg <= 360:
                raise ValueError(
                    f"Zone {zone.id}: Öffnungswinkel liegt über 0 bis 360°"
                )
            if zone.type is ZoneType.HOSE:
                if 0 < len(zone.polygon) < 2:
                    raise ValueError(
                        f"Zone {zone.id}: Ein Schlauch braucht mindestens 2 Punkte"
                    )
                if zone.polygon and not zone.radius_m:
                    raise ValueError(
                        f"Zone {zone.id}: Beim Schlauch fehlt die Breite (Radius)"
                    )
            elif 0 < len(zone.polygon) < 3:
                raise ValueError(
                    f"Zone {zone.id}: Ein Beet braucht mindestens 3 Punkte"
                )
            if zone.area_m2 is not None and zone.area_m2 <= 0:
                raise ValueError(f"Zone {zone.id}: Fläche muss positiv sein")
            if zone.efficiency is not None and not 0 < zone.efficiency <= 1:
                raise ValueError(f"Zone {zone.id}: Effizienz liegt zwischen 0 und 1")
            if zone.duration_mode is DurationMode.CALCULATED and not (
                zone.area_m2 or zone.polygon or (zone.center and zone.radius_m)
            ):
                raise ValueError(
                    f"Zone {zone.id}: Für die berechnete Dauer fehlt die Fläche"
                )
            if (
                zone.duration_mode is DurationMode.ENTITY
                and zone.duration_entity is None
            ):
                raise ValueError(
                    f"Zone {zone.id}: Für die Dauer aus einer Entität fehlt die Entität"
                )
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
            if any(day not in range(7) for day in program.weekdays):
                raise ValueError(f"Programm {program.id}: Wochentage sind 0 bis 6")
            if program.interval_days is not None and program.interval_days < 1:
                raise ValueError(f"Programm {program.id}: Intervall muss positiv sein")
            for label, value in (
                ("Startzeit", program.start_time),
                ("Fertig bis", program.finish_by),
            ):
                if value is not None and value not in SUN_EVENTS:
                    _check_time(f"Programm {program.id}: {label}", value)
            if abs(program.sun_offset_min) > MAX_SUN_OFFSET_MIN:
                raise ValueError(
                    f"Programm {program.id}: Versatz zur Sonne höchstens "
                    f"{MAX_SUN_OFFSET_MIN // 60} Stunden"
                )
        for sensor in self.sensors:
            for zone_id in sensor.zone_ids:
                _check_ref(f"Sensor {sensor.id}", "Zone", zone_id, zone_ids)
            if sensor.field_capacity_pct <= sensor.wilting_point_pct:
                raise ValueError(
                    f"Sensor {sensor.id}: Feldkapazität muss über dem Welkepunkt liegen"
                )


def _check_garden(garden: Garden) -> None:
    if garden.background is BackgroundType.MAP:
        if (
            garden.latitude is None
            or garden.longitude is None
            or garden.map_zoom is None
        ):
            raise ValueError("Luftbild: Kartenmitte und Zoom fehlen")
        if not garden.map_provider:
            raise ValueError("Luftbild: Kartendienst fehlt")
        if garden.map_provider == "custom" and not (
            garden.map_url
            and garden.map_url.startswith("https://")
            and all(p in garden.map_url for p in ("{z}", "{x}", "{y}"))
        ):
            raise ValueError(
                "Luftbild: Eigene Adresse muss mit https:// beginnen und {z}, {x}, {y} enthalten"
            )
    if garden.background is BackgroundType.IMAGE:
        if not garden.background_image:
            raise ValueError("Bild: Datei fehlt")
        if garden.scale_points is None or not garden.scale_distance_m:
            raise ValueError("Bild: Maßstab fehlt (zwei Punkte und ihr Abstand)")
        (x1, y1), (x2, y2) = garden.scale_points
        if garden.scale_distance_m <= 0 or (x1, y1) == (x2, y2):
            raise ValueError("Bild: Maßstab ungültig")
    if not 0 <= garden.background_opacity <= 1:
        raise ValueError("Deckkraft des Hintergrunds liegt zwischen 0 und 1")
    _check_features(garden.features)


def _check_features(features: list[Feature]) -> None:
    if len(features) > MAX_FEATURES:
        raise ValueError(f"Grundriss: höchstens {MAX_FEATURES} Formen")
    _unique_ids("Form", features)
    for feature in features:
        name = f"Form {feature.id}"
        if feature.kind not in FEATURE_KINDS:
            raise ValueError(f"{name}: unbekannte Art {feature.kind!r}")
        if any(not math.isfinite(c) for p in feature.points for c in p):
            raise ValueError(f"{name}: ungültige Koordinate")
        need = (
            3
            if feature.kind in FEATURE_AREAS
            else 2
            if feature.kind in FEATURE_LINES
            else 1
        )
        if feature.kind in FEATURE_POINTS:
            if len(feature.points) != 1:
                raise ValueError(f"{name}: braucht genau einen Punkt")
        elif len(feature.points) < need:
            raise ValueError(f"{name}: braucht mindestens {need} Punkte")
        if feature.kind == "tree" and not (feature.radius_m and feature.radius_m > 0):
            raise ValueError(f"{name}: Kronenradius muss positiv sein")
        if feature.kind == "label" and not (feature.label or "").strip():
            raise ValueError(f"{name}: Beschriftung fehlt")
        if feature.label is not None and len(feature.label) > MAX_LABEL_LENGTH:
            raise ValueError(
                f"{name}: Beschriftung höchstens {MAX_LABEL_LENGTH} Zeichen"
            )


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


def _check_time(owner: str, value: str) -> None:
    parts = value.split(":")
    try:
        hour, minute = int(parts[0]), int(parts[1])
        second = int(parts[2]) if len(parts) > 2 else 0
    except ValueError, IndexError:
        raise ValueError(f"{owner}: {value!r} ist keine Uhrzeit (HH:MM)") from None
    if not (0 <= hour < 24 and 0 <= minute < 60 and 0 <= second < 60) or len(parts) > 3:
        raise ValueError(f"{owner}: {value!r} ist keine Uhrzeit (HH:MM)")


def _check_month_day(owner: str, value: str) -> None:
    try:
        month, day = (int(x) for x in value.split("-"))
        date(2024, month, day)  # Schaltjahr, damit 02-29 gültig ist
    except ValueError:
        raise ValueError(f"{owner}: {value!r} ist kein Datum (MM-TT)") from None
