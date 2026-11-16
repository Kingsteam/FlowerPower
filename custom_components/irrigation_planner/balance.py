"""Wasserhaushalt im Betrieb: Wetter sammeln, täglich fortschreiben, verbuchen.

- Alle ``SAMPLE_INTERVAL_S`` Sekunden werden Temperatur, Luftfeuchte und Wind
  von der Wetter-Entität notiert, dazu der Regen eines Regensensors (Sensor
  der Art ``rain_mm`` ohne Zonenzuordnung = gilt für alle Zonen).
- Beim ersten Messwert eines neuen Tages (spätestens kurz nach Mitternacht)
  wird der Vortag abgeschlossen: ET0 aus dem Tageswetter, je Zone
  Defizit += ET0 * Kc - wirksamer Regen, gedeckelt durch die nutzbare
  Feldkapazität. Fehlt das Tageswetter (z. B. Home Assistant war aus), bleibt
  das Defizit unverändert.
- Nach jedem Lauf wird die gelieferte Menge verbucht (Sekunden *
  gelernter Durchfluss → Liter → mm über Fläche und Effizienz).
- Ein Bodenfeuchtesensor ersetzt die Schätzung durch den Messwert.
- In der Winterpause ruht die Rechnung; beim Ende der Pause wird auf 0
  gesetzt.

Die Bilanz liegt in einem eigenen Speicher (``.storage/irrigation_planner.balance``),
getrennt von den Einstellungen.
"""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta
from typing import Any, Final

from homeassistant.const import (
    ATTR_UNIT_OF_MEASUREMENT,
    STATE_UNAVAILABLE,
    STATE_UNKNOWN,
    UnitOfSpeed,
    UnitOfTemperature,
)
from homeassistant.core import CALLBACK_TYPE, HomeAssistant, callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.event import (
    async_track_time_change,
    async_track_time_interval,
)
from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util
from homeassistant.util.unit_conversion import SpeedConverter, TemperatureConverter

from .const import DOMAIN, LOGGER, MIN_NEED_MM
from .drivers.ha import resolve_entity_id
from .geometry import zone_area
from .model import DurationMode, GardenModel, Sensor, SensorKind, Zone, ZoneType
from .scheduler import IrrigationScheduler, Run
from .store import IrrigationPlannerStore
from .water_balance import (
    DEFAULT_ROOT_DEPTH_M,
    EFFICIENCY_DRIP,
    EFFICIENCY_SPRINKLER,
    PLANTS,
    DayWeather,
    duration_for,
    effective_rain,
    et0_for_day,
    liters_for,
    mm_delivered,
    total_available_water,
    update_deficit,
)

BALANCE_STORAGE_KEY: Final = f"{DOMAIN}.balance"
BALANCE_STORAGE_VERSION: Final = 1
SAMPLE_INTERVAL_S: Final = 600
HISTORY_DAYS: Final = 14


# Zonen-Kennwerte -------------------------------------------------------------


def zone_kc(zone: Zone) -> float:
    """Pflanzenfaktor der Zone."""
    return zone.kc


def zone_root_depth(zone: Zone) -> float:
    """Wurzeltiefe: eingestellt, sonst nach Pflanzenart, sonst Standard."""
    if zone.root_depth_m:
        return zone.root_depth_m
    if zone.plant_type in PLANTS:
        return PLANTS[zone.plant_type][1]
    return DEFAULT_ROOT_DEPTH_M


def zone_taw(zone: Zone) -> float:
    """Nutzbare Feldkapazität im Wurzelraum (mm)."""
    return total_available_water(zone.soil_type, zone_root_depth(zone))


def zone_efficiency(zone: Zone) -> float:
    """Effizienz: eingestellt, sonst nach Zonenart."""
    if zone.efficiency:
        return zone.efficiency
    # Gießschlauch gibt wie Tropfschlauch nah am Boden ab.
    return EFFICIENCY_SPRINKLER if zone.type is ZoneType.SPRINKLER else EFFICIENCY_DRIP


# Tageswetter -----------------------------------------------------------------


@dataclass(slots=True)
class DayAggregate:
    """Gesammeltes Wetter eines Tages (wird bei jedem Messwert ergänzt)."""

    day: str  # ISO-Datum
    t_min: float | None = None
    t_max: float | None = None
    rh_sum: float = 0.0
    rh_count: int = 0
    wind_sum: float = 0.0  # m/s
    wind_count: int = 0
    rain_mm: float = 0.0
    rain_last: float | None = None  # letzter Zählerstand (Summen-Sensoren)

    def add_temperature(self, celsius: float) -> None:
        """Neue Temperatur."""
        self.t_min = celsius if self.t_min is None else min(self.t_min, celsius)
        self.t_max = celsius if self.t_max is None else max(self.t_max, celsius)

    def weather(self) -> DayWeather | None:
        """Tageswetter für die Rechnung (``None`` ohne Temperatur)."""
        if self.t_min is None or self.t_max is None:
            return None
        return DayWeather(
            t_min=self.t_min,
            t_max=self.t_max,
            rh_mean=self.rh_sum / self.rh_count if self.rh_count else None,
            wind_ms=self.wind_sum / self.wind_count if self.wind_count else None,
            rain_mm=self.rain_mm,
        )

    def as_dict(self) -> dict[str, Any]:
        """Zum Speichern."""
        return {
            "day": self.day,
            "t_min": self.t_min,
            "t_max": self.t_max,
            "rh_sum": self.rh_sum,
            "rh_count": self.rh_count,
            "wind_sum": self.wind_sum,
            "wind_count": self.wind_count,
            "rain_mm": self.rain_mm,
            "rain_last": self.rain_last,
        }

    @classmethod
    def from_dict(cls, raw: dict[str, Any]) -> DayAggregate:
        """Aus dem Speicher."""
        return cls(**{k: raw[k] for k in cls.__slots__ if k in raw})  # type: ignore[attr-defined]


@dataclass(slots=True)
class DayResult:
    """Ergebnis eines abgeschlossenen Tages."""

    day: str
    et0_mm: float
    rain_mm: float


@dataclass(slots=True)
class ZoneBalance:
    """Wasserhaushalt einer Zone."""

    deficit_mm: float = 0.0
    measured: bool = False  # aus einem Bodenfeuchtesensor
    last_irrigation_mm: float = 0.0


@dataclass(slots=True)
class Planned:
    """Geplante Gießdauer einer Zone und woher sie kommt."""

    seconds: int  # 0 = nicht gießen
    reason: str
    need_mm: float | None = None
    liters: float | None = None


@dataclass(slots=True)
class _State:
    zones: dict[str, ZoneBalance] = field(default_factory=dict)
    today: DayAggregate | None = None
    history: list[DayResult] = field(default_factory=list)


# Verwaltung ------------------------------------------------------------------


class BalanceManager:
    """Führt den Wasserhaushalt aller Zonen."""

    def __init__(
        self,
        hass: HomeAssistant,
        store: IrrigationPlannerStore,
        scheduler: IrrigationScheduler,
        *,
        weather_entity: str | None,
    ) -> None:
        """Merkt sich, woher Wetter und Läufe kommen."""
        self.hass = hass
        self.store = store
        self.scheduler = scheduler
        self.weather_entity = weather_entity
        self._storage: Store[dict[str, Any]] = Store(
            hass, BALANCE_STORAGE_VERSION, BALANCE_STORAGE_KEY
        )
        self._state = _State()
        self._unsubs: list[CALLBACK_TYPE] = []
        self._listeners: list[Callable[[], None]] = []

    @property
    def model(self) -> GardenModel:
        """Aktuelles Modell."""
        return self.store.model

    @property
    def history(self) -> list[DayResult]:
        """Abgeschlossene Tage, neueste zuletzt."""
        return list(self._state.history)

    # Laden, Speichern, Start --------------------------------------------------

    async def async_load(self) -> None:
        """Lädt die Bilanz (fehlt sie, beginnt jede Zone bei 0)."""
        raw = await self._storage.async_load() or {}
        state = _State()
        for zone_id, data in (raw.get("zones") or {}).items():
            state.zones[zone_id] = ZoneBalance(
                deficit_mm=float(data.get("deficit_mm", 0.0)),
                measured=bool(data.get("measured", False)),
                last_irrigation_mm=float(data.get("last_irrigation_mm", 0.0)),
            )
        if raw.get("today"):
            state.today = DayAggregate.from_dict(raw["today"])
        state.history = [
            DayResult(h["day"], float(h["et0_mm"]), float(h["rain_mm"]))
            for h in raw.get("history", [])
        ]
        self._state = state

    def _data(self) -> dict[str, Any]:
        state = self._state
        return {
            "zones": {
                zone_id: {
                    "deficit_mm": round(b.deficit_mm, 3),
                    "measured": b.measured,
                    "last_irrigation_mm": round(b.last_irrigation_mm, 3),
                }
                for zone_id, b in state.zones.items()
            },
            "today": state.today.as_dict() if state.today else None,
            "history": [
                {
                    "day": h.day,
                    "et0_mm": round(h.et0_mm, 3),
                    "rain_mm": round(h.rain_mm, 3),
                }
                for h in state.history
            ],
        }

    @callback
    def _schedule_save(self) -> None:
        self._storage.async_delay_save(self._data, 10)

    @callback
    def async_start(self) -> None:
        """Startet Messen, Tagesabschluss und Verbuchen."""
        self._unsubs.append(
            async_track_time_interval(
                self.hass, self._on_sample, timedelta(seconds=SAMPLE_INTERVAL_S)
            )
        )
        # Kurz nach Mitternacht abschließen, auch wenn gerade kein Messwert fällig ist.
        self._unsubs.append(
            async_track_time_change(
                self.hass, self._on_sample, hour=0, minute=0, second=30
            )
        )
        self._unsubs.append(self.scheduler.async_add_run_listener(self._on_run))
        self._sample(dt_util.now())

    async def async_stop(self) -> None:
        """Hält an und speichert sofort."""
        for unsub in self._unsubs:
            unsub()
        self._unsubs.clear()
        await self._storage.async_save(self._data())

    @callback
    def async_add_listener(self, update: Callable[[], None]) -> CALLBACK_TYPE:
        """Meldet sich für Änderungen an."""
        self._listeners.append(update)
        return lambda: self._listeners.remove(update)

    @callback
    def async_notify(self) -> None:
        """Informiert alle Angemeldeten."""
        for update in list(self._listeners):
            update()

    _notify = async_notify

    # Abfragen -----------------------------------------------------------------

    def balance(self, zone_id: str) -> ZoneBalance:
        """Bilanz einer Zone (legt sie bei Bedarf an)."""
        return self._state.zones.setdefault(zone_id, ZoneBalance())

    def deficit_mm(self, zone: Zone) -> float:
        """Aktuelles Defizit; mit Bodenfeuchtesensor aus dem Messwert."""
        measured = self._soil_deficit(zone)
        if measured is not None:
            return measured
        return self.balance(zone.id).deficit_mm

    def planned(self, zone: Zone) -> Planned:
        """Geplante Dauer nach der Dauer-Art der Zone."""
        if zone.duration_mode is DurationMode.ENTITY:
            seconds = self._entity_seconds(zone)
            if seconds is None:
                return self._manual(zone, "Entität ohne Wert, Dauer von Hand")
            return Planned(seconds, "aus Entität")
        if zone.duration_mode is DurationMode.CALCULATED:
            return self._calculated(zone)
        return self._manual(zone, "von Hand")

    @staticmethod
    def _manual(zone: Zone, reason: str) -> Planned:
        return Planned(zone.duration_s or 0, reason)

    def _calculated(self, zone: Zone) -> Planned:
        need = self.deficit_mm(zone)
        if need < MIN_NEED_MM:
            return Planned(0, "kein Bedarf", need_mm=need)
        valve = next((v for v in self.model.valves if v.id == zone.valve_id), None)
        flow = valve.learned_flow_l_min if valve else None
        area = zone_area(zone)
        if not flow or not area:
            planned = self._manual(zone, "noch kein Durchfluss gelernt, Dauer von Hand")
            planned.need_mm = need
            return planned
        liters = liters_for(need, area, zone_efficiency(zone))
        return Planned(
            duration_for(liters, flow), "berechnet", need_mm=need, liters=liters
        )

    def _entity_seconds(self, zone: Zone) -> int | None:
        if zone.duration_entity is None:
            return None
        entity_id = resolve_entity_id(self.hass, zone.duration_entity)
        value = self._number(entity_id)
        if value is None:
            return None
        state = self.hass.states.get(entity_id)  # type: ignore[arg-type]
        unit = state.attributes.get(ATTR_UNIT_OF_MEASUREMENT, "s") if state else "s"
        factor = {"min": 60, "h": 3600}.get(unit, 1)
        return max(0, round(value * factor))

    def _soil_sensor(self, zone: Zone) -> Sensor | None:
        return next(
            (
                s
                for s in self.model.sensors
                if s.kind is SensorKind.SOIL_MOISTURE and zone.id in s.zone_ids
            ),
            None,
        )

    def _soil_deficit(self, zone: Zone) -> float | None:
        sensor = self._soil_sensor(zone)
        if sensor is None:
            return None
        value = self._number(resolve_entity_id(self.hass, sensor.entity))
        if value is None:
            return None
        taw = zone_taw(zone)
        span = sensor.field_capacity_pct - sensor.wilting_point_pct
        fraction = (sensor.field_capacity_pct - value) / span
        return min(max(fraction, 0.0), 1.0) * taw

    # Messen -------------------------------------------------------------------

    def _number(self, entity_id: str | None) -> float | None:
        state = None if entity_id is None else self.hass.states.get(entity_id)
        if state is None or state.state in (STATE_UNAVAILABLE, STATE_UNKNOWN):
            return None
        try:
            return float(state.state)
        except ValueError:
            return None

    @callback
    def _on_sample(self, now: datetime) -> None:
        self._sample(now)

    @callback
    def _sample(self, now: datetime) -> None:
        """Notiert einen Messwert; schließt bei Datumswechsel den Vortag ab."""
        today = dt_util.as_local(now).date().isoformat()
        aggregate = self._state.today
        if aggregate is not None and aggregate.day != today:
            self._close_day(aggregate)
            aggregate = None
        if aggregate is None:
            aggregate = DayAggregate(day=today)
            self._state.today = aggregate
        self._sample_weather(aggregate)
        self._sample_rain(aggregate)
        self._schedule_save()

    def _sample_weather(self, aggregate: DayAggregate) -> None:
        if not self.weather_entity:
            return
        state = self.hass.states.get(self.weather_entity)
        if state is None or state.state in (STATE_UNAVAILABLE, STATE_UNKNOWN):
            return
        attrs = state.attributes
        try:
            if isinstance(temp := attrs.get("temperature"), (int, float)):
                unit = attrs.get("temperature_unit", UnitOfTemperature.CELSIUS)
                aggregate.add_temperature(
                    TemperatureConverter.convert(temp, unit, UnitOfTemperature.CELSIUS)
                )
            if isinstance(humidity := attrs.get("humidity"), (int, float)):
                aggregate.rh_sum += float(humidity)
                aggregate.rh_count += 1
            if isinstance(wind := attrs.get("wind_speed"), (int, float)):
                unit = attrs.get("wind_speed_unit", UnitOfSpeed.KILOMETERS_PER_HOUR)
                aggregate.wind_sum += SpeedConverter.convert(
                    wind, unit, UnitOfSpeed.METERS_PER_SECOND
                )
                aggregate.wind_count += 1
        except HomeAssistantError as err:
            LOGGER.debug("Wetterwerte nicht lesbar: %s", err)

    def _rain_sensor(self) -> Sensor | None:
        return next(
            (
                s
                for s in self.model.sensors
                if s.kind is SensorKind.RAIN_MM and not s.zone_ids
            ),
            None,
        )

    def _sample_rain(self, aggregate: DayAggregate) -> None:
        """Regen des Tages.

        Summen-Sensoren (state_class total/total_increasing) werden über die
        Zunahme gezählt, Rücksetzer erkannt. Sonst gilt der Wert als
        „Regen heute“ und der Tageshöchstwert zählt.
        """
        sensor = self._rain_sensor()
        if sensor is None:
            return
        entity_id = resolve_entity_id(self.hass, sensor.entity)
        value = self._number(entity_id)
        if value is None:
            return
        state = self.hass.states.get(entity_id)  # type: ignore[arg-type]
        unit = state.attributes.get(ATTR_UNIT_OF_MEASUREMENT, "mm") if state else "mm"
        if unit in ("in", "inch"):
            value *= 25.4
        state_class = state.attributes.get("state_class") if state else None
        if state_class in ("total", "total_increasing"):
            if aggregate.rain_last is not None:
                delta = value - aggregate.rain_last
                aggregate.rain_mm += value if delta < 0 else delta
            aggregate.rain_last = value
        else:
            aggregate.rain_mm = max(aggregate.rain_mm, value)

    # Tagesabschluss ------------------------------------------------------------

    def _location(self) -> tuple[float, float]:
        garden = self.model.garden
        latitude = (
            garden.latitude
            if garden.latitude is not None
            else self.hass.config.latitude
        )
        return latitude, float(self.hass.config.elevation or 0)

    @callback
    def _close_day(self, aggregate: DayAggregate) -> None:
        """Schreibt den Wasserhaushalt um einen Tag fort."""
        weather = aggregate.weather()
        if weather is None:
            LOGGER.info("Tag %s ohne Wetterdaten, Bilanz unverändert", aggregate.day)
            return
        if self.model.settings.winter_mode:
            LOGGER.debug("Winterpause: Tag %s wird nicht gerechnet", aggregate.day)
            return
        day = date.fromisoformat(aggregate.day)
        latitude, elevation = self._location()
        et0 = et0_for_day(weather, latitude, day.timetuple().tm_yday, elevation)
        for zone in self.model.zones:
            balance = self.balance(zone.id)
            measured = self._soil_deficit(zone)
            if measured is not None:
                balance.deficit_mm = measured
                balance.measured = True
                continue
            balance.measured = False
            balance.deficit_mm = update_deficit(
                balance.deficit_mm, et0 * zone_kc(zone), weather.rain_mm, zone_taw(zone)
            )
        self._state.history.append(DayResult(aggregate.day, et0, weather.rain_mm))
        self._state.history = self._state.history[-HISTORY_DAYS:]
        LOGGER.info(
            "Wasserhaushalt %s: ET0 %.1f mm, Regen %.1f mm (wirksam %.1f mm)",
            aggregate.day,
            et0,
            weather.rain_mm,
            effective_rain(weather.rain_mm),
        )
        self._schedule_save()
        self._notify()

    # Verbuchen -----------------------------------------------------------------

    @callback
    def _on_run(self, run: Run, seconds: float) -> None:
        zone = next((z for z in self.model.zones if z.id == run.zone_id), None)
        area = zone_area(zone) if zone else None
        if zone is None or not area or seconds <= 0:
            return
        valve = next((v for v in self.model.valves if v.id == run.valve_id), None)
        flow = valve.learned_flow_l_min if valve else None
        if not flow:
            LOGGER.debug("Zone %s: kein gelernter Durchfluss, nicht verbucht", zone.id)
            return
        liters = flow * seconds / 60
        mm = mm_delivered(liters, area, zone_efficiency(zone))
        balance = self.balance(zone.id)
        balance.deficit_mm = max(0.0, balance.deficit_mm - mm)
        balance.last_irrigation_mm = mm
        LOGGER.debug("Zone %s: %.1f L = %.1f mm verbucht", zone.id, liters, mm)
        self._schedule_save()
        self._notify()

    # Zurücksetzen --------------------------------------------------------------

    @callback
    def async_reset(self, zone_id: str | None = None) -> None:
        """Setzt das Defizit einer oder aller Zonen auf 0."""
        for zone in self.model.zones:
            if zone_id is None or zone.id == zone_id:
                self._state.zones[zone.id] = ZoneBalance()
        self._schedule_save()
        self._notify()

    @callback
    def async_close_day_now(self) -> None:
        """Schließt den laufenden Tag sofort ab (zum Testen und „neu berechnen“)."""
        if self._state.today is not None:
            self._close_day(self._state.today)
            self._state.today = DayAggregate(day=self._state.today.day)
