"""Verlauf: was wann wo wie lange gegossen wurde.

Jeder Lauf wird mit Dauer, Wassermenge (gemessen, sonst aus dem gelernten
Durchfluss geschätzt) und Millimetern auf der Fläche festgehalten. Dazu
kommen abgebrochene Läufe, gestartete und übersprungene Programme und Alarme.
Eigener Store ``irrigation_planner.history``; ältere Einträge fallen weg.

Der Verlauf schreibt nur mit, er steuert nichts.
"""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any, Final

from homeassistant.core import CALLBACK_TYPE, Event, HomeAssistant, callback
from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util

from .balance import zone_efficiency
from .const import (
    DOMAIN,
    EVENT_ALARM,
    EVENT_PROGRAM_SKIPPED,
    EVENT_PROGRAM_STARTED,
)
from .geometry import zone_area
from .scheduler import IrrigationScheduler, Run
from .store import IrrigationPlannerStore
from .watchdog import Watchdog
from .water_balance import mm_delivered

STORAGE_KEY: Final = f"{DOMAIN}.history"
STORAGE_VERSION: Final = 1
MAX_ENTRIES: Final = 3000
MAX_AGE_DAYS: Final = 365

STATE_TEXT: Final = {
    "done": "fertig",
    "skipped": "abgebrochen",
    "failed": "Fehler",
    "cancelled": "nicht gestartet (abgebrochen)",
}


def source_text(source: str, program_names: dict[str, str]) -> str:
    """Woher ein Lauf kam, im Klartext."""
    if source.startswith("program:"):
        program_id = source.removeprefix("program:")
        return f"Programm {program_names.get(program_id, program_id)}"
    return {
        "manual": "von Hand",
        "panel": "von Hand (Panel)",
        "button": "Knopf „Jetzt gießen“",
        "test": "Testlauf",
    }.get(source, source)


class HistoryManager:
    """Schreibt den Verlauf mit."""

    def __init__(
        self,
        hass: HomeAssistant,
        store: IrrigationPlannerStore,
        scheduler: IrrigationScheduler,
        watchdog: Watchdog,
    ) -> None:
        """Verlauf anlegen (Laden mit ``async_load``)."""
        self.hass = hass
        self.store = store
        self.scheduler = scheduler
        self.watchdog = watchdog
        self._storage: Store[dict[str, Any]] = Store(hass, STORAGE_VERSION, STORAGE_KEY)
        self.entries: list[dict[str, Any]] = []
        self._unsubs: list[CALLBACK_TYPE] = []
        self._listeners: list[CALLBACK_TYPE] = []

    async def async_load(self) -> None:
        """Lädt den Verlauf."""
        raw = await self._storage.async_load() or {}
        self.entries = list(raw.get("entries", []))

    @callback
    def async_start(self) -> None:
        """Mitschreiben beginnen."""
        self._unsubs = [
            self.scheduler.async_add_run_listener(self._on_run),
            self.scheduler.async_add_cancel_listener(self._on_cancel),
            self.hass.bus.async_listen(EVENT_PROGRAM_STARTED, self._on_program),
            self.hass.bus.async_listen(EVENT_PROGRAM_SKIPPED, self._on_program),
            self.hass.bus.async_listen(EVENT_ALARM, self._on_alarm),
        ]

    async def async_stop(self) -> None:
        """Mitschreiben beenden und speichern."""
        for unsub in self._unsubs:
            unsub()
        self._unsubs = []
        await self._storage.async_save(self._data())

    @callback
    def async_add_listener(self, update: CALLBACK_TYPE) -> CALLBACK_TYPE:
        """Meldet sich für neue Einträge an."""
        self._listeners.append(update)
        return lambda: self._listeners.remove(update)

    def _data(self) -> dict[str, Any]:
        return {"entries": self.entries}

    @callback
    def _add(self, entry: dict[str, Any]) -> None:
        self.entries.append(entry)
        cutoff = (dt_util.utcnow() - timedelta(days=MAX_AGE_DAYS)).isoformat()
        self.entries = [e for e in self.entries if e["at"] >= cutoff][-MAX_ENTRIES:]
        self._storage.async_delay_save(self._data, 10)
        for update in list(self._listeners):
            update()

    # Mitschreiben --------------------------------------------------------------

    def _names(self) -> tuple[dict[str, str], dict[str, str]]:
        model = self.store.model
        return (
            {z.id: z.name for z in model.zones},
            {p.id: p.name for p in model.programs},
        )

    @callback
    def _on_run(self, run: Run, seconds: float) -> None:
        zones, programs = self._names()
        zone = next((z for z in self.store.model.zones if z.id == run.zone_id), None)
        valve = next((v for v in self.store.model.valves if v.id == run.valve_id), None)
        liters: float | None = None
        measured = False
        if run.started_at is not None:
            liters = self.watchdog.measured_liters(run.valve_id, run.started_at)
            measured = liters is not None
        if liters is None and valve is not None and valve.learned_flow_l_min:
            liters = valve.learned_flow_l_min * seconds / 60
        area = zone_area(zone) if zone else None
        mm = (
            mm_delivered(liters, area, zone_efficiency(zone))
            if zone and liters is not None and area
            else None
        )
        self._add(
            {
                "at": (run.started_at or dt_util.utcnow()).isoformat(),
                "end": (run.ends_at or dt_util.utcnow()).isoformat(),
                "kind": "run",
                "zone_id": run.zone_id,
                "zone_name": zones.get(run.zone_id, run.zone_id),
                "source": run.source,
                "source_text": source_text(run.source, programs),
                "planned_s": run.duration_s,
                "seconds": round(seconds),
                "state": run.state.value,
                "error": run.error,
                "liters": None if liters is None else round(liters, 1),
                "measured": measured,
                "mm": None if mm is None else round(mm, 1),
            }
        )

    @callback
    def _on_cancel(self, run: Run) -> None:
        zones, programs = self._names()
        self._add(
            {
                "at": dt_util.utcnow().isoformat(),
                "kind": "cancelled",
                "zone_id": run.zone_id,
                "zone_name": zones.get(run.zone_id, run.zone_id),
                "source": run.source,
                "source_text": source_text(run.source, programs),
                "planned_s": run.duration_s,
                "seconds": 0,
                "state": "cancelled",
            }
        )

    @callback
    def _on_program(self, event: Event) -> None:
        started = event.event_type == EVENT_PROGRAM_STARTED
        data = event.data
        self._add(
            {
                "at": dt_util.utcnow().isoformat(),
                "kind": "program_started" if started else "program_skipped",
                "program_id": data.get("program_id"),
                "program_name": data.get("program_name"),
                "reason": data.get("reason"),
                "source": data.get("source"),
                "planned_s": data.get("total_s"),
            }
        )

    @callback
    def _on_alarm(self, event: Event) -> None:
        zones, _ = self._names()
        data = event.data
        self._add(
            {
                "at": dt_util.utcnow().isoformat(),
                "kind": "alarm",
                "severity": data.get("severity"),
                "message": data.get("message"),
                "zone_ids": data.get("zone_ids", []),
                "zone_name": ", ".join(
                    zones.get(z, z) for z in data.get("zone_ids", [])
                ),
            }
        )

    # Abfragen ------------------------------------------------------------------

    def last_run(self, zone_id: str) -> dict[str, Any] | None:
        """Letzter Lauf einer Zone, der wirklich gegossen hat."""
        for entry in reversed(self.entries):
            if (
                entry["kind"] == "run"
                and entry["zone_id"] == zone_id
                and entry["seconds"]
            ):
                return entry
        return None

    def daily(
        self, days: int, now: datetime | None = None
    ) -> dict[str, dict[str, Any]]:
        """Je Tag (lokales Datum): Liter gesamt und mm je Zone."""
        now = now or dt_util.now()
        first = (now - timedelta(days=days - 1)).date()
        result: dict[str, dict[str, Any]] = {}
        for entry in self.entries:
            if entry["kind"] != "run" or not entry.get("seconds"):
                continue
            moment = dt_util.parse_datetime(entry["at"])
            if moment is None:
                continue
            day = dt_util.as_local(moment).date()
            if day < first:
                continue
            item = result.setdefault(day.isoformat(), {"liters": 0.0, "zones_mm": {}})
            item["liters"] += entry.get("liters") or 0.0
            if entry.get("mm") is not None:
                zones = item["zones_mm"]
                zones[entry["zone_id"]] = round(
                    zones.get(entry["zone_id"], 0.0) + entry["mm"], 1
                )
        for item in result.values():
            item["liters"] = round(item["liters"], 1)
        return result
