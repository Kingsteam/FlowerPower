"""Überwachung des Durchflusses und der Gerätemeldungen (Konzept, Abschnitt 7).

Geprüft wird bei jeder Änderung von Ventil, Durchfluss oder Gerätestatus und
zusätzlich alle ``WATCHDOG_INTERVAL_S`` Sekunden.

| Situation | Reaktion |
|---|---|
| Gerät meldet Leck | schließen, Alarm, Zone gesperrt |
| offen, Durchfluss viel höher als gelernt | schließen, Alarm, Zone gesperrt |
| offen, kein Durchfluss / Wassermangel | schließen, Alarm |
| offen, Durchfluss viel niedriger als gelernt | nach Frist schließen, Warnung |
| zu, Durchfluss > 0 | OFF wiederholen, Alarm |
| mehr Ventile einer Versorgung offen als erlaubt | das später geöffnete schließen |

Gesperrte Zonen gibt man nach der Kontrolle mit ``release_zone`` (oder dem
Knopf „Zone freigeben“) frei. In der Winterpause wird nicht geprüft: Ventile
ohne Batterie sind dann normal.

Grenze: Ein Durchflussmesser im Ventil sieht nur Wasser, das durch dieses
Ventil fließt. Ein Leck vor den Ventilen erkennt er nicht.

Nebenbei wird der Durchfluss gelernt: Nach jedem ungestörten Lauf ab
``LEARN_MIN_RUN_S`` fließt der mittlere Durchfluss in einen gleitenden
Mittelwert ein (``Valve.learned_flow_l_min``).
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any

from homeassistant.components import persistent_notification
from homeassistant.const import (
    ATTR_UNIT_OF_MEASUREMENT,
    STATE_UNAVAILABLE,
    STATE_UNKNOWN,
    UnitOfVolumeFlowRate,
)
from homeassistant.core import CALLBACK_TYPE, Event, HomeAssistant, callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.event import (
    async_track_state_change_event,
    async_track_time_interval,
)
from homeassistant.util import dt as dt_util
from homeassistant.util.unit_conversion import VolumeFlowRateConverter

from .const import (
    CLOSED_FLOW_L_MIN,
    CLOSED_FLOW_S,
    DOMAIN,
    EVENT_ALARM,
    FLOW_ZERO_L_MIN,
    HIGH_FLOW_FACTOR,
    HIGH_FLOW_S,
    LEARN_MIN_RUN_S,
    LEARN_WEIGHT,
    LOGGER,
    LOW_FLOW_FACTOR,
    LOW_FLOW_S,
    NO_FLOW_GRACE_S,
    NO_FLOW_HOLD_S,
    WATCHDOG_INTERVAL_S,
)
from .drivers.ha import HassValveDriver
from .model import ValveRole
from .profiles import DeviceStatus, Profile
from .scheduler import IrrigationScheduler
from .store import IrrigationPlannerStore

# Ohne Profil: Statuswerte wie beim SONOFF SWV deuten.
DEFAULT_STATUS_MAP = {
    "normal_state": DeviceStatus.OK,
    "water_shortage": DeviceStatus.SHORTAGE,
    "water_leakage": DeviceStatus.LEAK,
}


@dataclass(slots=True)
class Alarm:
    """Ein offener Alarm oder eine Warnung."""

    valve_id: str
    kind: str
    message: str
    at: datetime
    locks_zone: bool = False
    severity: str = "alarm"  # "alarm" oder "warning"


@dataclass(slots=True)
class _ValveWatch:
    """Was über ein Ventil gerade beobachtet wird."""

    open_since: datetime | None = None
    flow_sum: float = 0.0  # L/min mal Sekunden, für den Mittelwert
    flow_seconds: float = 0.0
    last_sample: datetime | None = None
    last_flow: float | None = None
    disturbed: bool = False  # Lauf mit Alarm: nicht daraus lernen
    since: dict[str, datetime] = field(default_factory=dict)
    # Gemessene Menge der letzten Öffnung (für den Verlauf)
    last_liters: float | None = None
    last_closed: datetime | None = None
    measured: bool = False  # in dieser Öffnung gab es Messwerte


class Watchdog:
    """Überwacht alle Ventile."""

    def __init__(
        self,
        hass: HomeAssistant,
        store: IrrigationPlannerStore,
        scheduler: IrrigationScheduler,
        drivers: dict[str, HassValveDriver],
    ) -> None:
        """Merkt sich, was überwacht wird."""
        self.hass = hass
        self.store = store
        self.scheduler = scheduler
        self.drivers = drivers
        self.alarms: dict[tuple[str, str], Alarm] = {}
        self._watch = {valve_id: _ValveWatch() for valve_id in drivers}
        self._unsubs: list[CALLBACK_TYPE] = []

    # Start und Ende ---------------------------------------------------------

    @callback
    def async_start(self) -> None:
        """Beginnt die Überwachung."""
        entity_ids: dict[str, str] = {}
        for valve_id, driver in self.drivers.items():
            for role in (ValveRole.VALVE, ValveRole.FLOW, ValveRole.STATUS):
                if (entity_id := driver.entity_id(role)) is not None:
                    entity_ids[entity_id] = valve_id
            if driver.is_open is True:
                self._watch[valve_id].open_since = dt_util.utcnow()
        if entity_ids:

            @callback
            def _changed(event: Event) -> None:
                self._check(entity_ids[event.data["entity_id"]])

            self._unsubs.append(
                async_track_state_change_event(self.hass, list(entity_ids), _changed)
            )
        self._unsubs.append(
            async_track_time_interval(
                self.hass, self._check_all, timedelta(seconds=WATCHDOG_INTERVAL_S)
            )
        )

    @callback
    def async_stop(self) -> None:
        """Beendet die Überwachung."""
        for unsub in self._unsubs:
            unsub()
        self._unsubs.clear()

    # Abfragen ---------------------------------------------------------------

    @property
    def messages(self) -> list[str]:
        """Offene Alarme und Warnungen im Klartext."""
        return [a.message for a in self.alarms.values()]

    def _zone_ids(self, valve_id: str) -> list[str]:
        return [z.id for z in self.store.model.zones if z.valve_id == valve_id]

    def flow_l_min(self, valve_id: str) -> float | None:
        """Aktueller Durchfluss in L/min (``None`` = kein Messwert)."""
        driver = self.drivers[valve_id]
        entity_id = driver.entity_id(ValveRole.FLOW)
        state = None if entity_id is None else self.hass.states.get(entity_id)
        if state is None or state.state in (STATE_UNAVAILABLE, STATE_UNKNOWN):
            return None
        try:
            value = float(state.state)
        except ValueError:
            return None
        unit = state.attributes.get(
            ATTR_UNIT_OF_MEASUREMENT, UnitOfVolumeFlowRate.LITERS_PER_MINUTE
        )
        try:
            return VolumeFlowRateConverter.convert(
                value, unit, UnitOfVolumeFlowRate.LITERS_PER_MINUTE
            )
        except HomeAssistantError:
            return None

    def measured_liters(self, valve_id: str, since: datetime) -> float | None:
        """Gemessene Liter der Öffnung, die nach ``since`` begann (``None`` = kein Zähler).

        Ist das Ventil für die Überwachung noch offen (die Meldung „zu“ kommt
        oft kurz nach dem Ende des Laufs), zählt der Stand bis jetzt.
        """
        watch = self._watch.get(valve_id)
        if watch is None:
            return None
        if watch.open_since is not None:
            if not watch.measured:
                return None
            liters = watch.flow_sum / 60
            if watch.last_sample is not None and watch.last_flow is not None:
                seconds = (dt_util.utcnow() - watch.last_sample).total_seconds()
                liters += watch.last_flow * max(0.0, seconds) / 60
            return liters
        if watch.last_closed is not None and watch.last_closed >= since:
            return watch.last_liters
        return None

    def device_status(self, valve_id: str) -> DeviceStatus | None:
        """Gedeuteter Gerätestatus (``None`` = unbekannt)."""
        driver = self.drivers[valve_id]
        entity_id = driver.entity_id(ValveRole.STATUS)
        state = None if entity_id is None else self.hass.states.get(entity_id)
        if state is None:
            return None
        profile: Profile | None = driver.profile
        if profile is not None and profile.status_map:
            return profile.map_status(state.state)
        return DEFAULT_STATUS_MAP.get(state.state)

    # Prüfen -----------------------------------------------------------------

    @callback
    def _check_all(self, _now: Any = None) -> None:
        for valve_id in self.drivers:
            self._check(valve_id)

    @callback
    def _check(self, valve_id: str) -> None:
        if self.store.model.settings.winter_mode:
            return
        now = dt_util.utcnow()
        watch = self._watch[valve_id]
        driver = self.drivers[valve_id]
        is_open = driver.is_open
        flow = self.flow_l_min(valve_id)
        status = self.device_status(valve_id)
        learned = driver.valve.learned_flow_l_min
        name = driver.valve.name

        self._track_open(valve_id, watch, is_open, flow, now)

        # Gerät meldet ein Leck: immer schließen und sperren.
        if status is DeviceStatus.LEAK:
            self._raise(valve_id, "leak", f"{name}: Gerät meldet ein Leck", lock=True)
            if is_open:
                self.scheduler.async_close_valve(valve_id, "Leck gemeldet")
        else:
            self._clear(valve_id, "leak", only_if_unlocked=True)

        if is_open is True:
            open_for = (
                (now - watch.open_since).total_seconds() if watch.open_since else 0
            )
            if status is DeviceStatus.SHORTAGE:
                self._raise(valve_id, "shortage", f"{name}: kein Wasser (Wassermangel)")
                self.scheduler.async_close_valve(valve_id, "Wassermangel")
            if flow is not None:
                # Eine kurze Nullmessung (z. B. beim Schließen) reicht nicht:
                # Der Durchfluss muss NO_FLOW_HOLD_S Sekunden am Stück fehlen.
                no_flow = flow < FLOW_ZERO_L_MIN
                if (
                    self._held(watch, "no_flow", no_flow, now, NO_FLOW_HOLD_S)
                    and open_for >= NO_FLOW_GRACE_S
                ):
                    self._raise(
                        valve_id, "no_flow", f"{name}: offen, aber kein Durchfluss"
                    )
                    self.scheduler.async_close_valve(valve_id, "kein Durchfluss")
                if learned:
                    high = flow > learned * HIGH_FLOW_FACTOR
                    if self._held(watch, "high", high, now, HIGH_FLOW_S):
                        self._raise(
                            valve_id,
                            "high_flow",
                            f"{name}: Durchfluss {flow:.1f} L/min statt "
                            f"{learned:.1f} L/min. Schlauch gelöst oder geplatzt?",
                            lock=True,
                        )
                        self.scheduler.async_close_valve(valve_id, "Durchfluss zu hoch")
                    low = FLOW_ZERO_L_MIN <= flow < learned * LOW_FLOW_FACTOR
                    if self._held(watch, "low", low, now, LOW_FLOW_S):
                        self._raise(
                            valve_id,
                            "low_flow",
                            f"{name}: Durchfluss {flow:.1f} L/min statt "
                            f"{learned:.1f} L/min. Knick, Verstopfung, wenig Druck?",
                            severity="warning",
                        )
                        self.scheduler.async_close_valve(
                            valve_id, "Durchfluss zu niedrig"
                        )
            self._check_supply_limit(valve_id)
        elif is_open is False:
            for key in ("no_flow", "high", "low"):
                watch.since.pop(key, None)
            self._clear(valve_id, "shortage")
            leaking = flow is not None and flow >= CLOSED_FLOW_L_MIN
            if self._held(watch, "closed_flow", leaking, now, CLOSED_FLOW_S):
                if (valve_id, "closed_flow") not in self.alarms:
                    self._raise(
                        valve_id,
                        "closed_flow",
                        f"{name}: Durchfluss {flow:.1f} L/min, obwohl das Ventil "
                        "zu ist. Ventil dichtet nicht?",
                    )
                    self.hass.async_create_task(self._resend_off(driver))
            elif not leaking:
                self._clear(valve_id, "closed_flow")

    def _check_supply_limit(self, valve_id: str) -> None:
        """Mehr Ventile offen als erlaubt: das später geöffnete schließen."""
        supply = self.scheduler.supply_of(valve_id)
        if supply is None:
            return
        opened = []
        for other in supply.valve_ids:
            driver = self.drivers.get(other)
            if driver is None or driver.is_open is not True:
                continue
            state = self.hass.states.get(driver.entity_id(ValveRole.VALVE) or "")
            opened.append((state.last_changed if state else dt_util.utcnow(), other))
        if len(opened) <= supply.max_open:
            return
        opened.sort()
        for _, extra in opened[supply.max_open :]:
            name = self.drivers[extra].valve.name
            self._raise(
                extra,
                "too_many",
                f"{name}: zu viele Ventile an „{supply.name}“ offen, "
                "das später geöffnete wird geschlossen",
                severity="warning",
            )
            self.scheduler.async_close_valve(extra, "zu viele Ventile offen")

    @staticmethod
    def _held(
        watch: _ValveWatch, key: str, condition: bool, now: datetime, seconds: float = 0
    ) -> bool:
        """Prüft, ob die Bedingung schon mindestens ``seconds`` Sekunden gilt."""
        if not condition:
            watch.since.pop(key, None)
            return False
        since = watch.since.setdefault(key, now)
        return (now - since).total_seconds() >= seconds

    # Lernen -----------------------------------------------------------------

    def _track_open(
        self,
        valve_id: str,
        watch: _ValveWatch,
        is_open: bool | None,
        flow: float | None,
        now: datetime,
    ) -> None:
        if is_open is True:
            if watch.open_since is None:
                watch.open_since = now
                watch.flow_sum = watch.flow_seconds = 0.0
                watch.disturbed = False
                watch.measured = flow is not None
                watch.last_sample = now
                watch.last_flow = flow
                return
            if watch.last_sample is not None and watch.last_flow is not None:
                seconds = (now - watch.last_sample).total_seconds()
                watch.flow_sum += watch.last_flow * seconds
                watch.flow_seconds += seconds
            watch.last_sample = now
            watch.last_flow = flow
            watch.measured = watch.measured or flow is not None
            if any(a.valve_id == valve_id for a in self.alarms.values()):
                watch.disturbed = True
        elif is_open is False and watch.open_since is not None:
            if watch.last_sample is not None and watch.last_flow is not None:
                seconds = (now - watch.last_sample).total_seconds()
                watch.flow_sum += watch.last_flow * seconds
                watch.flow_seconds += seconds
            self._learn(valve_id, watch)
            watch.last_liters = watch.flow_sum / 60 if watch.measured else None
            watch.last_closed = now
            watch.open_since = None

    def _learn(self, valve_id: str, watch: _ValveWatch) -> None:
        if watch.disturbed or watch.flow_seconds < LEARN_MIN_RUN_S:
            return
        average = watch.flow_sum / watch.flow_seconds
        if average < FLOW_ZERO_L_MIN:
            return
        valve = self.drivers[valve_id].valve
        old = valve.learned_flow_l_min
        new = (
            average
            if old is None
            else (1 - LEARN_WEIGHT) * old + LEARN_WEIGHT * average
        )
        valve.learned_flow_l_min = round(new, 2)
        LOGGER.info("%s: Durchfluss gelernt: %.2f L/min", valve.name, new)
        self.store.async_schedule_save()

    # Alarme -----------------------------------------------------------------

    def _raise(
        self,
        valve_id: str,
        kind: str,
        message: str,
        *,
        lock: bool = False,
        severity: str = "alarm",
    ) -> None:
        key = (valve_id, kind)
        if key in self.alarms:
            return
        alarm = Alarm(valve_id, kind, message, dt_util.utcnow(), lock, severity)
        self.alarms[key] = alarm
        self._watch[valve_id].disturbed = True
        zone_ids = self._zone_ids(valve_id)
        if lock:
            for zone_id in zone_ids:
                self.scheduler.locked_zones[zone_id] = message
        log = LOGGER.error if severity == "alarm" else LOGGER.warning
        log("%s", message)
        persistent_notification.async_create(
            self.hass,
            message
            + (
                "\n\nDie Zone bleibt gesperrt, bis du sie nach der Kontrolle freigibst."
                if lock
                else ""
            ),
            title="Bewässerung: " + ("Alarm" if severity == "alarm" else "Warnung"),
            notification_id=f"{DOMAIN}_{valve_id}_{kind}",
        )
        self.hass.bus.async_fire(
            EVENT_ALARM,
            {
                "valve_id": valve_id,
                "zone_ids": zone_ids,
                "kind": kind,
                "severity": severity,
                "message": message,
                "zone_locked": lock,
            },
        )
        self.scheduler.async_notify()

    def _clear(
        self, valve_id: str, kind: str, *, only_if_unlocked: bool = False
    ) -> None:
        alarm = self.alarms.get((valve_id, kind))
        if alarm is None or (only_if_unlocked and alarm.locks_zone):
            return
        del self.alarms[(valve_id, kind)]
        persistent_notification.async_dismiss(self.hass, f"{DOMAIN}_{valve_id}_{kind}")
        self.scheduler.async_notify()

    @callback
    def async_release_zone(self, zone_id: str) -> bool:
        """Gibt eine gesperrte Zone frei. ``False``, wenn sie nicht gesperrt war."""
        if self.scheduler.locked_zones.pop(zone_id, None) is None:
            return False
        zone = next((z for z in self.store.model.zones if z.id == zone_id), None)
        if zone is not None and zone.valve_id is not None:
            still_locked = any(
                z.valve_id == zone.valve_id and z.id in self.scheduler.locked_zones
                for z in self.store.model.zones
            )
            if not still_locked:
                for key in [k for k in self.alarms if k[0] == zone.valve_id]:
                    del self.alarms[key]
                    persistent_notification.async_dismiss(
                        self.hass, f"{DOMAIN}_{key[0]}_{key[1]}"
                    )
        LOGGER.info("Zone %s freigegeben", zone_id)
        self.scheduler.async_notify()
        return True

    async def _resend_off(self, driver: HassValveDriver) -> None:
        try:
            await driver.async_close()
        except Exception as err:
            LOGGER.warning(
                "%s: OFF erneut senden fehlgeschlagen: %s", driver.valve.name, err
            )
