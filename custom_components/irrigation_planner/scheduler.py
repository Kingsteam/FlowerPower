"""Warteschlange: Wer wann gießt, und nie zu viele Ventile gleichzeitig.

Sicherheitsregeln, die hier hart durchgesetzt werden:

- Je Wasserversorgung sind höchstens ``max_open_valves`` Ventile offen
  (Standard 1). Das gilt auch für manuelle Starts: Ein Start während eines
  Laufs wird eingereiht, nie parallel ausgeführt.
- Ein Platz wird erst frei, wenn das Ventil **nachweislich zu** ist. Ein
  verschickter Schließbefehl reicht nicht.
- Schließt ein Ventil nicht, bleibt sein Platz belegt und die Versorgung ist
  gesperrt. Das Schließen wird jede Minute wiederholt; erst wenn das Ventil
  zu ist, geht es weiter.
- Ventile, die von außen geöffnet wurden (z. B. von Hand), zählen mit.
- Beim Start von Home Assistant werden offene Ventile geschlossen, bevor
  irgendetwas gestartet wird.
- Jede Laufzeit wird auf die Höchstdauer der Zone begrenzt.
"""

from __future__ import annotations

import asyncio
from collections.abc import Callable, Coroutine
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import StrEnum
from typing import Any

from homeassistant.core import CALLBACK_TYPE, Event, HomeAssistant, callback
from homeassistant.helpers.event import (
    async_call_later,
    async_track_state_change_event,
)
from homeassistant.helpers.start import async_at_started
from homeassistant.util import dt as dt_util

from .const import (
    CLOSE_ATTEMPTS,
    CLOSE_CONFIRM_TIMEOUT_S,
    CLOSE_RETRY_INTERVAL_S,
    DEFAULT_MAX_OPEN_VALVES,
    LOGGER,
    MAX_VALVE_DURATION_S,
    UNASSIGNED_SUPPLY_ID,
)
from .drivers.base import validate_duration
from .drivers.ha import HassValveDriver
from .model import GardenModel, ValveRole


class QueueError(ValueError):
    """Ein Lauf kann nicht eingereiht werden (verständliche Meldung)."""


class RunState(StrEnum):
    """Zustand eines Laufs."""

    QUEUED = "queued"  # wartet
    OPENING = "opening"  # Öffnungsbefehl unterwegs
    RUNNING = "running"  # gießt
    CLOSING = "closing"  # wird geschlossen
    PAUSE = "pause"  # Pause nach dem Lauf (Leitungsdruck erholt sich)
    DONE = "done"  # fertig
    SKIPPED = "skipped"  # vorzeitig beendet (überspringen/alles stoppen)
    FAILED = "failed"  # Fehler


@dataclass(slots=True, eq=False)
class Run:
    """Ein Lauf: eine Zone für eine Dauer."""

    zone_id: str
    valve_id: str
    supply_id: str
    duration_s: int
    source: str
    pause_after_s: int = 0
    state: RunState = RunState.QUEUED
    started_at: datetime | None = None
    ends_at: datetime | None = None
    error: str | None = None
    stop_requested: bool = False
    _wakeup: asyncio.Future[None] | None = field(default=None, repr=False)

    def interrupt(self) -> None:
        """Beendet den Lauf vorzeitig (auch wenn er gerade erst öffnet)."""
        self.stop_requested = True
        if self._wakeup is not None and not self._wakeup.done():
            self._wakeup.set_result(None)


@dataclass(slots=True, eq=False)
class SupplyQueue:
    """Warteschlange einer Wasserversorgung."""

    id: str
    name: str
    max_open: int
    valve_ids: set[str]
    pending: list[Run] = field(default_factory=list)
    active: dict[str, Run] = field(default_factory=dict)  # valve_id → Lauf
    stuck: set[str] = field(default_factory=set)  # Ventile, die nicht schließen
    ready: bool = False  # Startprüfung erledigt

    @property
    def error(self) -> str | None:
        """Fehlermeldung, solange die Versorgung gesperrt ist."""
        if not self.stuck:
            return None
        return "Ventil schließt nicht: " + ", ".join(sorted(self.stuck))


class IrrigationScheduler:
    """Alle Warteschlangen und die Ventilsteuerung."""

    def __init__(
        self,
        hass: HomeAssistant,
        model: GardenModel,
        drivers: dict[str, HassValveDriver],
    ) -> None:
        """Baut je Wasserversorgung eine Warteschlange."""
        self.hass = hass
        self.model = model
        self.drivers = drivers
        self.supplies: dict[str, SupplyQueue] = {}
        self._supply_of_valve: dict[str, str] = {}
        self._tasks: set[asyncio.Task[Any]] = set()
        self._listeners: list[Callable[[], None]] = []
        self._unsubs: list[CALLBACK_TYPE] = []
        self._stopping = False

        for supply in model.water_supplies:
            members = set(supply.valve_ids) | {
                v.id for v in model.valves if v.water_supply_id == supply.id
            }
            self.supplies[supply.id] = SupplyQueue(
                id=supply.id,
                name=supply.name,
                max_open=supply.max_open_valves,
                valve_ids=members,
            )
            for valve_id in members:
                self._supply_of_valve[valve_id] = supply.id
        # Ventile ohne Versorgung: gemeinsame Versorgung mit Grenze 1.
        if loose := {v.id for v in model.valves} - set(self._supply_of_valve):
            self.supplies[UNASSIGNED_SUPPLY_ID] = SupplyQueue(
                id=UNASSIGNED_SUPPLY_ID,
                name="Ohne Wasserversorgung",
                max_open=DEFAULT_MAX_OPEN_VALVES,
                valve_ids=loose,
            )
            for valve_id in loose:
                self._supply_of_valve[valve_id] = UNASSIGNED_SUPPLY_ID

    # Start und Ende ---------------------------------------------------------

    async def async_start(self) -> None:
        """Beobachtet die Ventile; Startprüfung, sobald HA gestartet ist."""
        entity_ids = [
            entity_id
            for driver in self.drivers.values()
            if (entity_id := driver.entity_id(ValveRole.VALVE)) is not None
        ]
        if entity_ids:
            self._unsubs.append(
                async_track_state_change_event(
                    self.hass, entity_ids, self._on_valve_state
                )
            )
        self._unsubs.append(async_at_started(self.hass, self._on_started))

    @callback
    def _on_started(self, _hass: HomeAssistant) -> None:
        for supply in self.supplies.values():
            self._spawn(self._startup_check(supply), f"Startprüfung {supply.id}")

    async def _startup_check(self, supply: SupplyQueue) -> None:
        """Schließt offene Ventile, bevor die Warteschlange losläuft."""
        for valve_id in sorted(supply.valve_ids):
            driver = self.drivers.get(valve_id)
            if driver is None or driver.is_open is not True:
                continue
            LOGGER.warning("%s ist beim Start offen, schließe", driver.valve.name)
            if not await self._close_confirmed(valve_id):
                self._mark_stuck(supply, valve_id)
        supply.ready = True
        self._notify()
        self._kick(supply)

    async def async_shutdown(self) -> None:
        """Beim Entladen: nichts Neues starten, alles schließen."""
        self._stopping = True
        for unsub in self._unsubs:
            unsub()
        self._unsubs.clear()
        for supply in self.supplies.values():
            supply.pending.clear()
        tasks = list(self._tasks)
        for task in tasks:
            task.cancel()
        await asyncio.gather(*tasks, return_exceptions=True)
        for driver in self.drivers.values():
            # Unbekannter Zustand (z. B. im Winter ohne Batterie) wird nicht
            # angefunkt; offene oder von uns geöffnete Ventile schon.
            if not (driver.close_pending or driver.is_open is True):
                continue
            try:
                await driver.async_close()
            except Exception:
                LOGGER.exception(
                    "%s: Schließen beim Entladen fehlgeschlagen", driver.valve.name
                )

    # Einreihen und Stoppen --------------------------------------------------

    @callback
    def async_enqueue(
        self,
        zone_id: str,
        duration_s: int,
        *,
        source: str = "manual",
        pause_after_s: int = 0,
    ) -> Run:
        """Reiht einen Lauf ein. Löst ``QueueError`` mit Grund aus."""
        if self._stopping:
            raise QueueError("Der Bewässerungsplaner wird gerade beendet")
        try:
            duration_s = validate_duration(duration_s)
        except ValueError as err:
            raise QueueError(str(err)) from err
        zone = next((z for z in self.model.zones if z.id == zone_id), None)
        if zone is None:
            raise QueueError(f"Zone {zone_id} gibt es nicht")
        if not zone.enabled:
            raise QueueError(f"Zone „{zone.name}“ ist deaktiviert")
        if zone.valve_id is None:
            raise QueueError(f"Zone „{zone.name}“ hat kein Ventil")
        if zone.valve_id not in self.drivers:
            raise QueueError(
                f"Das Ventil von Zone „{zone.name}“ ist nicht steuerbar (siehe Protokoll)"
            )
        if any(r.zone_id == zone_id for r in self.runs()):
            raise QueueError(f"Zone „{zone.name}“ läuft schon oder ist eingereiht")
        limit = min(zone.max_duration_s or MAX_VALVE_DURATION_S, MAX_VALVE_DURATION_S)
        if duration_s > limit:
            LOGGER.info(
                "Zone %s: %s s auf Höchstdauer %s s begrenzt",
                zone.name,
                duration_s,
                limit,
            )
            duration_s = limit

        supply = self.supplies[self._supply_of_valve[zone.valve_id]]
        run = Run(
            zone_id=zone_id,
            valve_id=zone.valve_id,
            supply_id=supply.id,
            duration_s=duration_s,
            source=source,
            pause_after_s=max(0, int(pause_after_s)),
        )
        supply.pending.append(run)
        LOGGER.debug("Zone %s eingereiht (%s s, %s)", zone.name, duration_s, source)
        self._notify()
        self._kick(supply)
        return run

    @callback
    def async_skip(self, supply_id: str | None = None) -> None:
        """Beendet die laufenden Zonen; die Warteschlange läuft weiter."""
        for supply in self._select(supply_id):
            for run in supply.active.values():
                run.interrupt()

    async def async_stop_all(self) -> None:
        """Leert alle Warteschlangen und schließt alle Ventile."""
        for supply in self.supplies.values():
            for run in supply.pending:
                run.state = RunState.SKIPPED
            supply.pending.clear()
            for run in supply.active.values():
                run.interrupt()
        # Auch Ventile schließen, die nicht von uns geöffnet wurden.
        for valve_id, driver in self.drivers.items():
            supply = self.supplies[self._supply_of_valve[valve_id]]
            if valve_id in supply.active or valve_id in supply.stuck:
                continue
            if driver.is_open is True or driver.close_pending:
                self._spawn(self._close_or_mark(supply, valve_id), f"Stopp {valve_id}")
        self._notify()

    # Abfragen ---------------------------------------------------------------

    def runs(self) -> list[Run]:
        """Alle laufenden und wartenden Läufe."""
        return [
            run
            for supply in self.supplies.values()
            for run in (*supply.active.values(), *supply.pending)
        ]

    @callback
    def async_add_listener(self, update: Callable[[], None]) -> CALLBACK_TYPE:
        """Meldet sich für Änderungen an (für Entitäten in Schritt 5)."""
        self._listeners.append(update)
        return lambda: self._listeners.remove(update)

    # Innenleben -------------------------------------------------------------

    def _select(self, supply_id: str | None) -> list[SupplyQueue]:
        if supply_id is None:
            return list(self.supplies.values())
        return [self.supplies[supply_id]] if supply_id in self.supplies else []

    @callback
    def _notify(self) -> None:
        for update in list(self._listeners):
            update()

    def _spawn(self, coro: Coroutine[Any, Any, Any], name: str) -> None:
        task = self.hass.async_create_background_task(
            coro, f"irrigation_planner {name}"
        )
        self._tasks.add(task)
        task.add_done_callback(self._tasks.discard)

    @callback
    def _on_valve_state(self, _event: Event) -> None:
        # Ein Ventil wurde (z. B. von Hand) geschlossen: vielleicht ist Platz frei.
        for supply in self.supplies.values():
            self._kick(supply)

    def _occupied(self, supply: SupplyQueue) -> set[str]:
        """Belegte Plätze: unsere Läufe, hängende und von außen offene Ventile."""
        occupied = set(supply.active) | supply.stuck
        for valve_id in supply.valve_ids:
            driver = self.drivers.get(valve_id)
            if driver is not None and driver.is_open is True:
                occupied.add(valve_id)
        return occupied

    @callback
    def _kick(self, supply: SupplyQueue) -> None:
        """Startet wartende Läufe, solange Platz ist (immer der Reihe nach)."""
        if self._stopping or not supply.ready:
            return
        while supply.pending:
            occupied = self._occupied(supply)
            run = supply.pending[0]
            if len(occupied) >= supply.max_open or run.valve_id in occupied:
                return
            supply.pending.pop(0)
            supply.active[run.valve_id] = run
            self._spawn(self._run(supply, run), f"Lauf {run.zone_id}")
        self._notify()

    async def _run(self, supply: SupplyQueue, run: Run) -> None:
        """Ein Lauf: öffnen, warten, schließen, bestätigen."""
        driver = self.drivers[run.valve_id]
        confirmed_closed = False
        try:
            run.state = RunState.OPENING
            self._notify()
            try:
                await driver.async_open(run.duration_s)
            except Exception as err:
                run.state = RunState.FAILED
                run.error = str(err)
                LOGGER.error("%s: Öffnen fehlgeschlagen: %s", driver.valve.name, err)
            else:
                run.started_at = dt_util.utcnow()
                run.ends_at = run.started_at + timedelta(seconds=run.duration_s)
                run.state = RunState.RUNNING
                self._notify()
                if not run.stop_requested:
                    await self._sleep(run, run.duration_s)
                run.state = RunState.SKIPPED if run.stop_requested else RunState.CLOSING
            self._notify()
            # Auch nach einem Fehler beim Öffnen: sicherheitshalber schließen.
            confirmed_closed = await self._close_confirmed(run.valve_id)
            if not confirmed_closed:
                run.state = RunState.FAILED
                run.error = "Ventil schließt nicht"
                return
            if run.state is RunState.CLOSING:
                run.state = RunState.DONE
                if run.pause_after_s and not run.stop_requested:
                    # Pause hält den Platz, damit sich der Leitungsdruck erholt.
                    run.state = RunState.PAUSE
                    self._notify()
                    await self._sleep(run, run.pause_after_s)
                    run.state = RunState.DONE
        finally:
            supply.active.pop(run.valve_id, None)
            if not confirmed_closed and not self._stopping:
                self._mark_stuck(supply, run.valve_id)
            self._notify()
            self._kick(supply)

    async def _sleep(self, run: Run | None, seconds: float) -> None:
        """Wartet; ein Lauf kann das Warten mit ``interrupt`` abbrechen."""
        future: asyncio.Future[None] = self.hass.loop.create_future()

        @callback
        def _done(_now: Any) -> None:
            if not future.done():
                future.set_result(None)

        cancel = async_call_later(self.hass, seconds, _done)
        if run is not None:
            run._wakeup = future
        try:
            await future
        finally:
            cancel()
            if run is not None:
                run._wakeup = None

    async def _close_confirmed(self, valve_id: str) -> bool:
        """Schickt OFF und wartet, bis das Ventil als zu gemeldet wird."""
        driver = self.drivers[valve_id]
        for attempt in range(1, CLOSE_ATTEMPTS + 1):
            try:
                await driver.async_close()
            except Exception as err:
                LOGGER.warning(
                    "%s: Schließen (Versuch %s) fehlgeschlagen: %s",
                    driver.valve.name,
                    attempt,
                    err,
                )
            for _ in range(CLOSE_CONFIRM_TIMEOUT_S):
                if driver.is_open is False:
                    return True
                await self._sleep(None, 1)
            if driver.is_open is False:
                return True
        return False

    async def _close_or_mark(self, supply: SupplyQueue, valve_id: str) -> None:
        if not await self._close_confirmed(valve_id):
            self._mark_stuck(supply, valve_id)
        self._kick(supply)

    @callback
    def _mark_stuck(self, supply: SupplyQueue, valve_id: str) -> None:
        """Ventil schließt nicht: Platz bleibt belegt, weiter versuchen."""
        if valve_id in supply.stuck:
            return
        supply.stuck.add(valve_id)
        name = self.drivers[valve_id].valve.name
        LOGGER.error(
            "%s schließt nicht! Wasserversorgung %s ist gesperrt, "
            "Schließen wird alle %s s wiederholt",
            name,
            supply.name,
            CLOSE_RETRY_INTERVAL_S,
        )
        self._notify()
        self._spawn(self._retry_stuck(supply, valve_id), f"Schließen {valve_id}")

    async def _retry_stuck(self, supply: SupplyQueue, valve_id: str) -> None:
        while valve_id in supply.stuck:
            await self._sleep(None, CLOSE_RETRY_INTERVAL_S)
            if await self._close_confirmed(valve_id):
                supply.stuck.discard(valve_id)
                LOGGER.warning(
                    "%s ist jetzt zu, Wasserversorgung %s wieder frei",
                    self.drivers[valve_id].valve.name,
                    supply.name,
                )
                self._notify()
                self._kick(supply)
