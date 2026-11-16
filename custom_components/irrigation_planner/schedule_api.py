"""WebSocket-Befehle für die Seite „Zeitplan“ im Panel.

- ``irrigation_planner/programs/get``: alle Programme mit Ablauf, nächsten
  Starts (eine Woche), letztem Ergebnis und den Entitäten, die man in
  eigenen Automationen verwenden kann.
- ``irrigation_planner/programs/save`` (nur Admin): Zeitplan und Ablauf eines
  Programms ändern. Wirkt sofort, ohne Neuladen.
- ``irrigation_planner/programs/create`` und ``.../delete`` (nur Admin):
  Programm anlegen oder löschen. Danach wird die Integration neu geladen,
  damit die Entitäten entstehen bzw. verschwinden; darum nur, solange
  nichts gegossen wird.

Keiner dieser Befehle öffnet ein Ventil. „Jetzt starten“ ruft im Panel den
Dienst ``run_program`` auf, der nur einreiht.
"""

from __future__ import annotations

import copy
from datetime import timedelta
from typing import TYPE_CHECKING, Any, Final

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant
from homeassistant.helpers import entity_registry as er
from homeassistant.util import dt as dt_util, slugify
import voluptuous as vol

from .const import (
    DOMAIN,
    EVENT_ALARM,
    EVENT_PROGRAM_SKIPPED,
    EVENT_PROGRAM_STARTED,
    EVENT_RUN_FINISHED,
    EVENT_RUN_STARTED,
)
from .model import MAX_SUN_OFFSET_MIN, Program, ProgramMode
from .panel import async_reload_keep_panel
from .programs import next_start, plan_total_s

if TYPE_CHECKING:
    from . import IrrigationPlannerConfigEntry

PREVIEW_DAYS: Final = 7
# Entitäten je Programm: (Plattform, Schlüssel, Bedeutung)
PROGRAM_ENTITIES: Final = (
    ("switch", "program_enabled", "enabled"),
    ("button", "program_start", "start"),
    ("sensor", "next_run", "next_run"),
    ("sensor", "program_duration", "duration"),
    ("select", "program_mode", "mode"),
)
EVENTS: Final = (
    (EVENT_RUN_STARTED, "Eine Zone beginnt zu gießen"),
    (EVENT_RUN_FINISHED, "Eine Zone ist fertig (mit Ergebnis und Minuten)"),
    (EVENT_PROGRAM_STARTED, "Ein Programm startet"),
    (EVENT_PROGRAM_SKIPPED, "Ein Programm wird übersprungen (mit Grund)"),
    (EVENT_ALARM, "Alarm der Durchflussüberwachung"),
)
TIME = vol.Any(None, vol.Match(r"^(sunrise|sunset|\d{1,2}:\d{2}(:\d{2})?)$"))
PROGRAM_FIELDS: Final = {
    vol.Optional("name"): vol.All(str, vol.Length(min=1, max=60)),
    vol.Optional("zone_ids"): [str],
    vol.Optional("mode"): vol.In([m.value for m in ProgramMode]),
    vol.Optional("pause_between_s"): vol.All(int, vol.Range(min=0, max=3600)),
    vol.Optional("cycle_s"): vol.Any(None, vol.All(int, vol.Range(min=60, max=7200))),
    vol.Optional("soak_s"): vol.Any(None, vol.All(int, vol.Range(min=0, max=14400))),
    vol.Optional("start_time"): TIME,
    vol.Optional("finish_by"): TIME,
    vol.Optional("sun_offset_min"): vol.All(
        int, vol.Range(min=-MAX_SUN_OFFSET_MIN, max=MAX_SUN_OFFSET_MIN)
    ),
    vol.Optional("weekdays"): [vol.All(int, vol.Range(min=0, max=6))],
    vol.Optional("interval_days"): vol.Any(
        None, vol.All(int, vol.Range(min=1, max=60))
    ),
    vol.Optional("skip_on_rain"): bool,
    vol.Optional("skip_on_frost"): bool,
    vol.Optional("skip_on_wind"): bool,
    vol.Optional("enabled"): bool,
}


def _entry(hass: HomeAssistant) -> IrrigationPlannerConfigEntry | None:
    entries = hass.config_entries.async_loaded_entries(DOMAIN)
    return entries[0] if entries else None


def _program_entities(
    hass: HomeAssistant, entry_id: str, program_id: str
) -> dict[str, str]:
    registry = er.async_get(hass)
    found: dict[str, str] = {}
    for platform, key, role in PROGRAM_ENTITIES:
        unique_id = f"{entry_id}_program_{program_id}_{key}"
        if entity_id := registry.async_get_entity_id(platform, DOMAIN, unique_id):
            found[role] = entity_id
    return found


def programs_payload(hass: HomeAssistant, entry: IrrigationPlannerConfigEntry) -> dict:
    """Programme mit Vorschau für die Seite „Zeitplan“."""
    data = entry.runtime_data
    manager = data.programs
    names = {z.id: z.name for z in data.store.model.zones}
    now = dt_util.now()
    result: list[dict[str, Any]] = []
    for program in data.store.model.programs:
        steps = manager.plan(program)
        total = plan_total_s(steps)
        upcoming: list[str] = []
        moment = now
        while len(upcoming) < 14:
            start = next_start(program, moment, total, manager.window_end, manager._sun)
            if start is None or start > now + timedelta(days=PREVIEW_DAYS):
                break
            upcoming.append(start.isoformat())
            moment = start + timedelta(minutes=1)
        last = manager.results.get(program.id)
        result.append(
            {
                "id": program.id,
                "name": program.name,
                "zone_ids": list(program.zone_ids),
                "mode": program.mode.value,
                "pause_between_s": program.pause_between_s,
                "cycle_s": program.cycle_s,
                "soak_s": program.soak_s,
                "start_time": program.start_time,
                "finish_by": program.finish_by,
                "sun_offset_min": program.sun_offset_min,
                "weekdays": list(program.weekdays),
                "interval_days": program.interval_days,
                "skip_on_rain": program.skip_on_rain,
                "skip_on_frost": program.skip_on_frost,
                "skip_on_wind": program.skip_on_wind,
                "enabled": program.enabled,
                "last_run": program.last_run,
                "steps": [
                    {
                        "zone_id": s.zone_id,
                        "zone_name": names.get(s.zone_id, s.zone_id),
                        "duration_s": s.duration_s,
                        "pause_after_s": s.pause_after_s,
                    }
                    for s in steps
                ],
                "total_s": total,
                "next_start": (
                    start.isoformat()
                    if (start := manager.next_start(program, now))
                    else None
                ),
                "upcoming": upcoming,
                "skip_next": manager.skip_next_pending(program.id),
                "last_result": (
                    None
                    if last is None
                    else {
                        "at": last.at.isoformat(),
                        "started": last.started,
                        "reason": last.reason,
                    }
                ),
                "entities": _program_entities(hass, entry.entry_id, program.id),
            }
        )
    settings = data.store.model.settings
    return {
        "automatic": settings.automatic,
        "winter_mode": settings.winter_mode,
        "window_end": manager.window_end,
        "programs": result,
        "events": [{"type": e, "description": d} for e, d in EVENTS],
    }


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/programs/get"})
@websocket_api.async_response
async def ws_programs_get(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict
) -> None:
    """Programme lesen."""
    entry = _entry(hass)
    if entry is None:
        connection.send_error(msg["id"], "not_loaded", "Nicht eingerichtet")
        return
    connection.send_result(msg["id"], programs_payload(hass, entry))


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/programs/save",
        vol.Required("program_id"): str,
        **PROGRAM_FIELDS,
    }
)
@websocket_api.require_admin
@websocket_api.async_response
async def ws_programs_save(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict
) -> None:
    """Ein Programm ändern (geprüft, wirkt sofort)."""
    entry = _entry(hass)
    if entry is None:
        connection.send_error(msg["id"], "not_loaded", "Nicht eingerichtet")
        return
    data = entry.runtime_data
    model = copy.deepcopy(data.store.model)
    program = next((p for p in model.programs if p.id == msg["program_id"]), None)
    if program is None:
        connection.send_error(
            msg["id"], "invalid", f"Programm {msg['program_id']} gibt es nicht"
        )
        return
    try:
        _apply(program, msg)
        model.validate()
    except (ValueError, TypeError) as err:
        connection.send_error(msg["id"], "invalid", str(err))
        return
    current = next(p for p in data.store.model.programs if p.id == msg["program_id"])
    _apply(current, msg)
    await data.store.async_save()
    data.async_model_changed()
    connection.send_result(msg["id"], programs_payload(hass, entry))


def _apply(program: Program, msg: dict[str, Any]) -> None:
    for key in (
        "name",
        "zone_ids",
        "pause_between_s",
        "cycle_s",
        "soak_s",
        "start_time",
        "finish_by",
        "sun_offset_min",
        "weekdays",
        "interval_days",
        "skip_on_rain",
        "skip_on_frost",
        "skip_on_wind",
        "enabled",
    ):
        if key in msg:
            value = msg[key]
            setattr(program, key, sorted(value) if key == "weekdays" else value)
    if "mode" in msg:
        program.mode = ProgramMode(msg["mode"])
    if program.start_time and program.finish_by:
        raise ValueError("Entweder Startzeit oder „fertig bis“, nicht beides")


def _busy(entry: IrrigationPlannerConfigEntry) -> bool:
    return bool(entry.runtime_data.scheduler.runs())


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/programs/create",
        vol.Required("name"): vol.All(str, vol.Length(min=1, max=60)),
    }
)
@websocket_api.require_admin
@websocket_api.async_response
async def ws_programs_create(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict
) -> None:
    """Neues Programm (ohne Zeitplan, nicht aktiv). Lädt danach neu."""
    entry = _entry(hass)
    if entry is None:
        connection.send_error(msg["id"], "not_loaded", "Nicht eingerichtet")
        return
    if _busy(entry):
        connection.send_error(
            msg["id"], "busy", "Bitte warten, bis die Bewässerung fertig ist"
        )
        return
    data = entry.runtime_data
    taken = {p.id for p in data.store.model.programs}
    base = slugify(msg["name"]) or "programm"
    program_id, n = base, 2
    while program_id in taken:
        program_id, n = f"{base}_{n}", n + 1
    data.store.model.programs.append(
        Program(id=program_id, name=msg["name"], enabled=False, finish_by="sunrise")
    )
    await data.store.async_save()
    async_reload_keep_panel(hass, entry.entry_id)
    connection.send_result(msg["id"], {"id": program_id, "reloaded": True})


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/programs/delete",
        vol.Required("program_id"): str,
    }
)
@websocket_api.require_admin
@websocket_api.async_response
async def ws_programs_delete(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict
) -> None:
    """Programm löschen. Lädt danach neu."""
    entry = _entry(hass)
    if entry is None:
        connection.send_error(msg["id"], "not_loaded", "Nicht eingerichtet")
        return
    if _busy(entry):
        connection.send_error(
            msg["id"], "busy", "Bitte warten, bis die Bewässerung fertig ist"
        )
        return
    data = entry.runtime_data
    before = len(data.store.model.programs)
    data.store.model.programs = [
        p for p in data.store.model.programs if p.id != msg["program_id"]
    ]
    if len(data.store.model.programs) == before:
        connection.send_error(
            msg["id"], "invalid", f"Programm {msg['program_id']} gibt es nicht"
        )
        return
    await data.store.async_save()
    async_reload_keep_panel(hass, entry.entry_id)
    connection.send_result(msg["id"], {"reloaded": True})


ALL_COMMANDS: Final = (
    ws_programs_get,
    ws_programs_save,
    ws_programs_create,
    ws_programs_delete,
)
