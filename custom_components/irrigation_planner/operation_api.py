"""WebSocket-Befehle für die Seite „Betrieb“ im Panel.

- ``irrigation_planner/operation/subscribe``: Was läuft, was wartet, Stand
  jeder Zone (zuletzt gegossen, Bedarf, nächster Start), Wetter und
  Wasserhaushalt der letzten Tage. Wird bei jeder Änderung neu geschickt.
- ``irrigation_planner/history/get``: Verlauf (neueste zuerst).
- ``irrigation_planner/queue/cancel``: Zone, Programm oder alles abbrechen.

Abbrechen schließt nur und nimmt aus der Warteschlange; es öffnet nie ein
Ventil. Darum dürfen das auch Benutzer ohne Admin-Rechte (wie die Dienste).
"""

from __future__ import annotations

import contextlib
from datetime import timedelta
from typing import TYPE_CHECKING, Any, Final

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback
from homeassistant.util import dt as dt_util
import voluptuous as vol

from .balance import zone_taw
from .const import DOMAIN
from .geometry import zone_area
from .history import source_text
from .model import MAX_WATER_SAVING_PCT
from .scheduler import RunState

if TYPE_CHECKING:
    from . import IrrigationPlannerData

WEATHER_DAYS: Final = 14


def _data(hass: HomeAssistant) -> IrrigationPlannerData | None:
    entries = hass.config_entries.async_loaded_entries(DOMAIN)
    return entries[0].runtime_data if entries else None


def _iso(value: Any) -> str | None:
    return value.isoformat() if value is not None else None


def operation_payload(data: IrrigationPlannerData) -> dict[str, Any]:
    """Alles für die Seite „Betrieb“."""
    model = data.store.model
    zones_by_id = {z.id: z for z in model.zones}
    programs = {p.id: p.name for p in model.programs}
    now = dt_util.now()

    queue: list[dict[str, Any]] = []
    for supply in data.scheduler.supplies.values():
        runs = [*supply.active.values(), *supply.pending]
        for position, run in enumerate(runs):
            zone = zones_by_id.get(run.zone_id)
            queue.append(
                {
                    "zone_id": run.zone_id,
                    "zone_name": zone.name if zone else run.zone_id,
                    "supply": supply.name,
                    "state": run.state.value,
                    "active": run.state is not RunState.QUEUED,
                    "position": position,
                    "source": run.source,
                    "source_text": source_text(run.source, programs),
                    "program_id": run.source.removeprefix("program:")
                    if run.source.startswith("program:")
                    else None,
                    "duration_s": run.duration_s,
                    "pause_after_s": run.pause_after_s,
                    "started_at": _iso(run.started_at),
                    "ends_at": _iso(run.ends_at),
                }
            )

    # Nächster Start je Zone (aus allen aktiven Programmen)
    next_by_zone: dict[str, dict[str, Any]] = {}
    for program in model.programs:
        start = data.programs.next_start(program, now)
        if start is None:
            continue
        for zone_id in program.zone_ids:
            known = next_by_zone.get(zone_id)
            if known is None or start.isoformat() < known["at"]:
                next_by_zone[zone_id] = {
                    "at": start.isoformat(),
                    "program": program.name,
                }

    zones: list[dict[str, Any]] = []
    for zone in model.zones:
        planned = data.balance.planned(zone)
        balance = data.balance.balance(zone.id)
        zones.append(
            {
                "id": zone.id,
                "name": zone.name,
                "type": zone.type.value,
                "enabled": zone.enabled,
                "duration_mode": zone.duration_mode.value,
                "area_m2": _round(zone_area(zone)),
                "need_mm": round(data.balance.deficit_mm(zone), 1),
                "capacity_mm": round(zone_taw(zone), 1),
                "measured": balance.measured,
                "planned_s": planned.seconds,
                "planned_liters": _round(planned.liters),
                "reason": planned.reason,
                "locked": data.scheduler.locked_zones.get(zone.id),
                "last": data.history.last_run(zone.id),
                "next": next_by_zone.get(zone.id),
            }
        )

    daily = data.history.daily(WEATHER_DAYS, now)
    weather_days = {d.day: d for d in data.balance.history}
    days: list[dict[str, Any]] = []
    for offset in range(WEATHER_DAYS - 1, -1, -1):
        day = (now - timedelta(days=offset)).date().isoformat()
        result = weather_days.get(day)
        irrigation = daily.get(day, {"liters": 0.0, "zones_mm": {}})
        days.append(
            {
                "day": day,
                "et0_mm": None if result is None else round(result.et0_mm, 1),
                "rain_mm": None if result is None else round(result.rain_mm, 1),
                "liters": irrigation["liters"],
                "zones_mm": irrigation["zones_mm"],
            }
        )
    today = data.balance.today
    weather_today = None
    if today is not None and today.day == now.date().isoformat():
        w = today.weather()
        weather_today = {
            "t_min": _round(today.t_min),
            "t_max": _round(today.t_max),
            "rh_mean": _round(w.rh_mean) if w else None,
            "wind_ms": _round(w.wind_ms) if w else None,
            "rain_mm": _round(today.rain_mm),
        }
    settings = model.settings
    return {
        "queue": queue,
        "zones": zones,
        "days": days,
        "weather_today": weather_today,
        "weather_entity": data.balance.weather_entity,
        "automatic": settings.automatic,
        "winter_mode": settings.winter_mode,
        "water_saving_pct": settings.water_saving_pct,
        "problems": data.problems,
        "history_last": data.history.entries[-1]["at"]
        if data.history.entries
        else None,
        "history_count": len(data.history.entries),
        "programs": [
            {"id": p.id, "name": p.name, "next": _iso(data.programs.next_start(p, now))}
            for p in model.programs
        ],
    }


def _round(value: float | None, digits: int = 1) -> float | None:
    return None if value is None else round(value, digits)


@websocket_api.websocket_command(
    {vol.Required("type"): f"{DOMAIN}/operation/subscribe"}
)
@callback
def ws_operation_subscribe(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict
) -> None:
    """Betrieb abonnieren."""
    data = _data(hass)
    if data is None:
        connection.send_error(msg["id"], "not_loaded", "Nicht eingerichtet")
        return

    @callback
    def send() -> None:
        connection.send_message(
            websocket_api.event_message(msg["id"], operation_payload(data))
        )

    removers = [
        data.scheduler.async_add_listener(send),
        data.balance.async_add_listener(send),
        data.programs.async_add_listener(send),
        data.history.async_add_listener(send),
    ]

    @callback
    def unsubscribe() -> None:
        for remove in removers:
            with contextlib.suppress(ValueError):  # schon abgemeldet
                remove()

    connection.subscriptions[msg["id"]] = unsubscribe
    connection.send_result(msg["id"])
    send()


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/history/get",
        vol.Optional("zone_id"): str,
        vol.Optional("limit", default=200): vol.All(int, vol.Range(min=1, max=1000)),
    }
)
@callback
def ws_history_get(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict
) -> None:
    """Verlauf lesen (neueste zuerst)."""
    data = _data(hass)
    if data is None:
        connection.send_error(msg["id"], "not_loaded", "Nicht eingerichtet")
        return
    zone_id = msg.get("zone_id")
    entries = [
        e
        for e in reversed(data.history.entries)
        if zone_id is None
        or e.get("zone_id") == zone_id
        or zone_id in e.get("zone_ids", [])
    ]
    connection.send_result(msg["id"], {"entries": entries[: msg["limit"]]})


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/queue/cancel",
        vol.Exclusive("zone_id", "what"): str,
        vol.Exclusive("program_id", "what"): str,
        vol.Exclusive("all", "what"): True,
    }
)
@websocket_api.async_response
async def ws_queue_cancel(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict
) -> None:
    """Zone, Programm oder alles abbrechen (schließt nur)."""
    data = _data(hass)
    if data is None:
        connection.send_error(msg["id"], "not_loaded", "Nicht eingerichtet")
        return
    scheduler = data.scheduler
    if msg.get("all"):
        await scheduler.async_stop_all()
        found = True
    elif "zone_id" in msg:
        found = scheduler.async_cancel_zone(msg["zone_id"])
    elif "program_id" in msg:
        found = scheduler.async_cancel_program(msg["program_id"])
    else:
        connection.send_error(msg["id"], "invalid", "Was soll abgebrochen werden?")
        return
    if not found:
        connection.send_error(msg["id"], "not_found", "Läuft nicht und wartet nicht")
        return
    connection.send_result(msg["id"], {"cancelled": True})


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/settings/automatic",
        vol.Required("on"): bool,
    }
)
@websocket_api.require_admin
@callback
def ws_set_automatic(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict
) -> None:
    """Automatik ein- oder ausschalten (wie der Schalter „Automatik“).

    Aus: Programme starten nicht mehr nach Zeitplan; was läuft, läuft zu Ende.
    """
    data = _data(hass)
    if data is None:
        connection.send_error(msg["id"], "not_loaded", "Nicht eingerichtet")
        return
    data.store.model.settings.automatic = msg["on"]
    data.async_model_changed()
    connection.send_result(msg["id"], {"automatic": msg["on"]})


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/settings/water_saving",
        vol.Required("percent"): vol.All(
            vol.Coerce(int), vol.Range(min=0, max=MAX_WATER_SAVING_PCT)
        ),
    }
)
@websocket_api.require_admin
@callback
def ws_set_water_saving(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict
) -> None:
    """Wassersparen einstellen (geplante Gießdauer um n % kürzen)."""
    data = _data(hass)
    if data is None:
        connection.send_error(msg["id"], "not_loaded", "Nicht eingerichtet")
        return
    data.store.model.settings.water_saving_pct = msg["percent"]
    data.async_model_changed()
    data.balance.async_notify()
    connection.send_result(msg["id"], {"percent": msg["percent"]})


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/balance/reset",
        vol.Optional("zone_id"): str,
    }
)
@websocket_api.require_admin
@callback
def ws_balance_reset(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict
) -> None:
    """Wasserkonto einer Zone (oder aller) auf „voll“ setzen."""
    data = _data(hass)
    if data is None:
        connection.send_error(msg["id"], "not_loaded", "Nicht eingerichtet")
        return
    zone_id = msg.get("zone_id")
    if zone_id is not None and all(z.id != zone_id for z in data.store.model.zones):
        connection.send_error(msg["id"], "invalid", f"Zone {zone_id} gibt es nicht")
        return
    data.balance.async_reset(zone_id)
    connection.send_result(msg["id"], {"reset": zone_id or "all"})


ALL_COMMANDS: Final = (
    ws_set_water_saving,
    ws_balance_reset,
    ws_operation_subscribe,
    ws_history_get,
    ws_queue_cancel,
    ws_set_automatic,
)
