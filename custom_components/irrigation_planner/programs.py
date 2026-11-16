"""Programme: Ablaufplan und Zeitplan (Konzept, Abschnitt 6a).

Ein Programm wird in einen festen Plan aus Schritten übersetzt (Zone, Dauer,
Pause danach) und als Ganzes in die Warteschlange gestellt. Die Regel „ein
Ventil gleichzeitig“ setzt weiterhin die Warteschlange durch.

Ablaufmodi:

- **Nacheinander:** Zone für Zone, dazwischen die Pause.
- **Abwechselnd** (Cycle & Soak): Jede Zone gießt reihum in Phasen von
  ``cycle_s``, bis sie ihre Gesamtdauer hat. Zwischen zwei Phasen derselben
  Zone liegen mindestens ``soak_s`` Sekunden (Wasser zieht ein); reicht die
  Zeit der anderen Zonen nicht, wird die Pause verlängert.
- **Nach Priorität:** Nacheinander, höchste Priorität zuerst.

Zeitplan: Startzeit **oder** „fertig bis“ (Start wird aus der Gesamtdauer
zurückgerechnet), Wochentage **oder** „alle N Tage“. Ohne beides gilt
„fertig bis“ = Ende des Zeitfensters aus der Einrichtung. Automatisch
gestartet wird nur, wenn „Automatik“ an und keine Winterpause ist.
"""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from typing import TYPE_CHECKING, Any

from homeassistant.const import UnitOfSpeed, UnitOfTemperature
from homeassistant.core import CALLBACK_TYPE, HomeAssistant, callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.event import async_track_time_change
from homeassistant.helpers.sun import get_astral_event_date
from homeassistant.util import dt as dt_util
from homeassistant.util.unit_conversion import SpeedConverter, TemperatureConverter

from .const import (
    CYCLE_DEFAULT_S,
    EVENT_PROGRAM_SKIPPED,
    EVENT_PROGRAM_STARTED,
    FORECAST_RAIN_SKIP_MM,
    FROST_THRESHOLD_C,
    LOGGER,
    RAIN_CONDITIONS,
    WIND_THRESHOLD_KMH,
)
from .model import SUN_EVENTS, GardenModel, Program, ProgramMode, Zone
from .scheduler import IrrigationScheduler, QueueError
from .store import IrrigationPlannerStore

if TYPE_CHECKING:
    from .balance import BalanceManager


@dataclass(frozen=True, slots=True)
class Step:
    """Ein Schritt des Plans."""

    zone_id: str
    duration_s: int
    pause_after_s: int = 0


# Ablaufplan -------------------------------------------------------------------


type DurationOf = Callable[[Zone], int]
type NeedOf = Callable[[Zone], float]


def _manual_duration(zone: Zone) -> int:
    return zone.duration_s or 0


def _zones_of(
    model: GardenModel,
    program: Program,
    duration_of: DurationOf,
    need_of: NeedOf | None,
) -> list[tuple[Zone, int]]:
    """Zonen des Programms, die gießen sollen (aktiv, mit Ventil und Dauer > 0)."""
    by_id = {z.id: z for z in model.zones}
    zones = []
    for zone_id in program.zone_ids:
        zone = by_id.get(zone_id)
        if zone is None or not zone.enabled or zone.valve_id is None:
            continue
        duration = duration_of(zone)
        if duration <= 0:
            LOGGER.debug("Programm %s: Zone %s ohne Dauer/Bedarf", program.id, zone_id)
            continue
        if zone.max_duration_s:
            duration = min(duration, zone.max_duration_s)
        zones.append((zone, duration))
    if program.mode is ProgramMode.PRIORITY:
        # Höchste Priorität zuerst, bei Gleichstand der größte Bedarf.
        zones.sort(
            key=lambda zd: (-zd[0].priority, -(need_of(zd[0]) if need_of else 0))
        )
    return zones


def build_plan(
    model: GardenModel,
    program: Program,
    duration_of: DurationOf = _manual_duration,
    need_of: NeedOf | None = None,
) -> list[Step]:
    """Übersetzt ein Programm in Schritte.

    ``duration_of`` liefert die Dauer je Zone (Standard: von Hand); Zonen mit
    0 entfallen. ``need_of`` sortiert „Nach Priorität“ bei Gleichstand.
    """
    zones = _zones_of(model, program, duration_of, need_of)
    pause = max(0, program.pause_between_s)
    if program.mode is not ProgramMode.CYCLE_SOAK:
        steps = [Step(z.id, d, pause) for z, d in zones]
    else:
        steps = _cycle_soak(zones, program, pause)
    if steps:
        steps[-1] = Step(steps[-1].zone_id, steps[-1].duration_s, 0)
    return steps


def _cycle_soak(
    zones: list[tuple[Zone, int]], program: Program, pause: int
) -> list[Step]:
    cycle = max(1, program.cycle_s or CYCLE_DEFAULT_S)
    soak = max(0, program.soak_s or 0)
    remaining = {z.id: duration for z, duration in zones}
    steps: list[Step] = []
    clock = 0  # Sekunden seit Programmstart
    last_end: dict[str, int] = {}
    while any(remaining.values()):
        for zone, _ in zones:
            if remaining[zone.id] <= 0:
                continue
            # Einziehen lassen: frühestens soak Sekunden nach der letzten Phase.
            if zone.id in last_end and steps:
                wait = last_end[zone.id] + soak - clock
                if wait > 0:
                    prev = steps[-1]
                    steps[-1] = Step(
                        prev.zone_id, prev.duration_s, prev.pause_after_s + wait
                    )
                    clock += wait
            chunk = min(cycle, remaining[zone.id])
            remaining[zone.id] -= chunk
            steps.append(Step(zone.id, chunk, pause))
            clock += chunk
            last_end[zone.id] = clock
            clock += pause
    return steps


def plan_total_s(steps: list[Step]) -> int:
    """Gesamtdauer des Plans in Sekunden (ohne Wartezeiten der Warteschlange)."""
    return sum(s.duration_s + s.pause_after_s for s in steps)


# Zeitplan ---------------------------------------------------------------------


def _parse(value: str) -> time:
    parsed = dt_util.parse_time(value)
    if parsed is None:
        raise ValueError(f"{value!r} ist keine Uhrzeit")
    return parsed


def day_allowed(program: Program, day: date) -> bool:
    """Gibt an, ob das Programm an diesem Tag laufen darf."""
    if program.weekdays:
        return day.weekday() in program.weekdays
    if program.interval_days:
        if program.last_run is None:
            return True
        last = date.fromisoformat(program.last_run)
        return (day - last).days >= program.interval_days
    return True


type SunLookup = Callable[[str, date], datetime | None]
"""Liefert Sonnenaufgang/-untergang (``"sunrise"``/``"sunset"``) eines Tages."""


def _moment(
    value: str, day: date, tz: Any, offset_min: int, sun: SunLookup | None
) -> datetime | None:
    """Uhrzeit oder Sonnenereignis (mit Versatz) an einem Tag.

    ``None``, wenn es das Sonnenereignis an diesem Tag nicht gibt (Polartag
    oder -nacht) oder niemand die Sonnenzeiten liefern kann.
    """
    if value in SUN_EVENTS:
        event = sun(value, day) if sun is not None else None
        if event is None:
            return None
        return dt_util.as_local(event).astimezone(tz) + timedelta(minutes=offset_min)
    return datetime.combine(day, _parse(value), tzinfo=tz)


def next_start(
    program: Program,
    now: datetime,
    total_s: int,
    default_finish: str | None = None,
    sun: SunLookup | None = None,
) -> datetime | None:
    """Nächster planmäßiger Start ab ``now`` (auf die Minute).

    Startzeit und „fertig bis“ dürfen ein Sonnenereignis sein; dann gilt
    ``program.sun_offset_min`` als Versatz.
    """
    start_time = program.start_time
    finish_by = program.finish_by or (None if start_time else default_finish)
    if start_time is None and finish_by is None:
        return None
    now = dt_util.as_local(now).replace(second=0, microsecond=0)
    tz = now.tzinfo
    for offset in range(-1, 15):
        day = now.date() + timedelta(days=offset)
        if start_time is not None:
            start = _moment(start_time, day, tz, program.sun_offset_min, sun)
        else:
            finish = _moment(finish_by, day, tz, program.sun_offset_min, sun)  # type: ignore[arg-type]
            start = None if finish is None else finish - timedelta(seconds=total_s)
        if start is None:
            continue
        start = start.replace(second=0, microsecond=0)
        if start >= now and day_allowed(program, day):
            return start
    return None


# Wetter -----------------------------------------------------------------------


def weather_skip_reason(
    hass: HomeAssistant, weather_entity: str | None, program: Program
) -> str | None:
    """Grund, das Programm wegen des Wetters zu überspringen (oder ``None``)."""
    if not weather_entity or (state := hass.states.get(weather_entity)) is None:
        return None
    attrs = state.attributes
    if program.skip_on_rain and state.state in RAIN_CONDITIONS:
        return f"Regen ({state.state})"
    temp = attrs.get("temperature")
    if program.skip_on_frost and isinstance(temp, (int, float)):
        unit = attrs.get("temperature_unit", UnitOfTemperature.CELSIUS)
        celsius = TemperatureConverter.convert(temp, unit, UnitOfTemperature.CELSIUS)
        if celsius < FROST_THRESHOLD_C:
            return f"Frost ({celsius:.1f} °C)"
    wind = attrs.get("wind_speed")
    if program.skip_on_wind and isinstance(wind, (int, float)):
        unit = attrs.get("wind_speed_unit", UnitOfSpeed.KILOMETERS_PER_HOUR)
        kmh = SpeedConverter.convert(wind, unit, UnitOfSpeed.KILOMETERS_PER_HOUR)
        if kmh > WIND_THRESHOLD_KMH:
            return f"Wind ({kmh:.0f} km/h)"
    return None


async def async_forecast_rain_mm(
    hass: HomeAssistant, weather_entity: str | None
) -> float | None:
    """Erwarteter Regen der nächsten 24 h (mm) aus der Wettervorhersage.

    Erst stündlich (Summe der nächsten 24 h), sonst täglich (erster Tag).
    ``None``, wenn keine Vorhersage zu bekommen ist.
    """
    if not weather_entity or not hass.services.has_service("weather", "get_forecasts"):
        return None
    for kind in ("hourly", "daily"):
        try:
            response = await hass.services.async_call(
                "weather",
                "get_forecasts",
                {"entity_id": weather_entity, "type": kind},
                blocking=True,
                return_response=True,
            )
        except HomeAssistantError:
            continue
        forecast = ((response or {}).get(weather_entity) or {}).get("forecast") or []
        if not forecast:
            continue
        if kind == "daily":
            return float(forecast[0].get("precipitation") or 0)
        limit = dt_util.utcnow() + timedelta(hours=24)
        total = 0.0
        for item in forecast:
            when = dt_util.parse_datetime(str(item.get("datetime", "")))
            if when is not None and when <= limit:
                total += float(item.get("precipitation") or 0)
        return total
    return None


# Verwaltung -------------------------------------------------------------------


@dataclass(slots=True)
class ProgramResult:
    """Was beim letzten Termin passiert ist."""

    at: datetime
    started: bool
    reason: str


class ProgramManager:
    """Startet Programme von Hand oder nach Zeitplan."""

    def __init__(
        self,
        hass: HomeAssistant,
        store: IrrigationPlannerStore,
        scheduler: IrrigationScheduler,
        *,
        weather_entity: str | None = None,
        window_end: str | None = None,
    ) -> None:
        """Verbindet die Programme mit Warteschlange und Speicher."""
        self.hass = hass
        self.store = store
        self.scheduler = scheduler
        self.weather_entity = weather_entity
        self.window_end = window_end
        self.results: dict[str, ProgramResult] = {}
        # Wasserhaushalt (für berechnete Dauer); wird nach dem Anlegen gesetzt.
        self.balance: BalanceManager | None = None
        self._skip_next: set[str] = set()
        self._listeners: list[Callable[[], None]] = []
        self._unsub: CALLBACK_TYPE | None = None

    @property
    def model(self) -> GardenModel:
        """Das aktuelle Modell."""
        return self.store.model

    def program(self, program_id: str) -> Program:
        """Programm nach ID (``QueueError``, wenn es fehlt)."""
        for program in self.model.programs:
            if program.id == program_id:
                return program
        raise QueueError(f"Programm {program_id} gibt es nicht")

    def plan(self, program: Program) -> list[Step]:
        """Aktueller Plan eines Programms (mit berechneter Dauer, falls vorhanden)."""
        if self.balance is None:
            return build_plan(self.model, program)
        balance = self.balance
        return build_plan(
            self.model,
            program,
            lambda zone: balance.planned(zone).seconds,
            balance.deficit_mm,
        )

    def next_start(
        self, program: Program, now: datetime | None = None
    ) -> datetime | None:
        """Nächster automatischer Start (``None`` = keiner geplant)."""
        if not program.enabled or not self.automatic_active:
            return None
        total = plan_total_s(self.plan(program))
        return next_start(
            program, now or dt_util.now(), total, self.window_end, self._sun
        )

    def _sun(self, event: str, day: date) -> datetime | None:
        """Sonnenaufgang/-untergang am Standort von Home Assistant."""
        return get_astral_event_date(self.hass, event, day)

    @property
    def automatic_active(self) -> bool:
        """Gibt an, ob Programme gerade automatisch starten."""
        settings = self.model.settings
        return settings.automatic and not settings.winter_mode

    @callback
    def async_start(self) -> None:
        """Prüft jede Minute, ob ein Programm dran ist."""
        self._unsub = async_track_time_change(self.hass, self._on_minute, second=0)

    @callback
    def async_stop(self) -> None:
        """Beendet die Zeitprüfung."""
        if self._unsub is not None:
            self._unsub()
            self._unsub = None

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

    @callback
    def async_run(self, program_id: str, *, source: str = "manual") -> int:
        """Startet ein Programm jetzt. Gibt die Zahl der Schritte zurück."""
        program = self.program(program_id)
        steps = self.plan(program)
        if not steps:
            raise QueueError(
                f"Programm „{program.name}“: keine Zone mit Ventil und Bedarf "
                "bzw. Dauer"
            )
        self.scheduler.async_enqueue_program(
            program.id, [(s.zone_id, s.duration_s, s.pause_after_s) for s in steps]
        )
        program.last_run = dt_util.now().date().isoformat()
        self.store.async_schedule_save()
        self.results[program.id] = ProgramResult(dt_util.now(), True, source)
        self.hass.bus.async_fire(
            EVENT_PROGRAM_STARTED,
            {
                "program_id": program.id,
                "program_name": program.name,
                "source": source,
                "zones": [s.zone_id for s in steps],
                "total_s": plan_total_s(steps),
            },
        )
        LOGGER.info(
            "Programm %s gestartet (%s, %s Schritte)", program.name, source, len(steps)
        )
        self._notify()
        return len(steps)

    @callback
    def async_skip_next(self, program_id: str) -> None:
        """Überspringt den nächsten automatischen Start."""
        self.program(program_id)
        self._skip_next.add(program_id)
        self._notify()

    def skip_next_pending(self, program_id: str) -> bool:
        """Gibt an, ob der nächste Start übersprungen wird."""
        return program_id in self._skip_next

    async def _on_minute(self, now: datetime) -> None:
        if not self.automatic_active:
            return
        now = dt_util.as_local(now).replace(second=0, microsecond=0)
        for program in list(self.model.programs):
            if self.next_start(program, now) != now:
                continue
            reason: str | None = None
            if program.id in self._skip_next:
                self._skip_next.discard(program.id)
                reason = "von Hand übersprungen"
            else:
                reason = weather_skip_reason(self.hass, self.weather_entity, program)
            if reason is None and program.skip_on_rain:
                rain = await async_forecast_rain_mm(self.hass, self.weather_entity)
                if rain is not None and rain >= FORECAST_RAIN_SKIP_MM:
                    reason = f"{rain:.1f} mm Regen erwartet"
            if reason is not None:
                LOGGER.info("Programm %s übersprungen: %s", program.name, reason)
                self.hass.bus.async_fire(
                    EVENT_PROGRAM_SKIPPED,
                    {
                        "program_id": program.id,
                        "program_name": program.name,
                        "reason": reason,
                    },
                )
                self.results[program.id] = ProgramResult(now, False, reason)
                self._notify()
                continue
            try:
                self.async_run(program.id, source="schedule")
            except QueueError as err:
                LOGGER.warning("Programm %s nicht gestartet: %s", program.name, err)
                self.results[program.id] = ProgramResult(now, False, str(err))
                self._notify()
