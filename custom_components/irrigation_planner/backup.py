"""Sichern und Wiederherstellen des Gartenplans (Export/Import als JSON).

- ``irrigation_planner/export`` (nur Admin): das ganze gespeicherte Modell
  mit Kopfdaten (Format, Version, Zeitpunkt).
- ``irrigation_planner/import`` (nur Admin), zwei Arten:

  - ``drawing``: nur die Zeichnung übernehmen (Hintergrund, Grundriss,
    Geometrie der Zonen, Positionen von Ventilen und Sensoren). Zuordnung
    über die IDs; Zonen, Ventile und Sensoren, die es nicht mehr gibt,
    werden ausgelassen und gemeldet. Ventile, Programme und Einstellungen
    bleiben unverändert.
  - ``all``: alles ersetzen. Danach wird die Integration neu geladen; dabei
    werden alle Ventile geschlossen (wie bei jedem Neuladen).

Gespeichert wird in beiden Fällen nur, wenn das ganze Modell gültig ist.
"""

from __future__ import annotations

import copy
from typing import TYPE_CHECKING, Any, Final

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant
from homeassistant.util import dt as dt_util
import voluptuous as vol

from .const import DOMAIN, LOGGER
from .serialize import garden_from_dict, model_from_dict, model_to_dict

if TYPE_CHECKING:
    from .model import GardenModel

EXPORT_FORMAT: Final = "irrigation_planner"
EXPORT_VERSION: Final = 1
GEOMETRY_KEYS: Final = (
    "type",
    "center",
    "radius_m",
    "start_angle_deg",
    "arc_deg",
    "polygon",
    "valve_route",
)


def export_payload(model: GardenModel, version: str) -> dict[str, Any]:
    """Inhalt der Sicherungsdatei."""
    return {
        "format": EXPORT_FORMAT,
        "format_version": EXPORT_VERSION,
        "integration_version": version,
        "exported_at": dt_util.utcnow().isoformat(),
        "model": model_to_dict(model),
    }


def _check_file(raw: Any) -> dict[str, Any]:
    if not isinstance(raw, dict) or raw.get("format") != EXPORT_FORMAT:
        raise ValueError("Das ist keine Sicherung des Bewässerungsplaners")
    if int(raw.get("format_version", 0)) > EXPORT_VERSION:
        raise ValueError(
            "Die Sicherung stammt aus einer neueren Version. Bitte zuerst aktualisieren."
        )
    model = raw.get("model")
    if not isinstance(model, dict):
        raise ValueError("Die Sicherung enthält keinen Gartenplan")
    return model


def import_drawing(current: GardenModel, raw: Any) -> tuple[GardenModel, list[str]]:
    """Übernimmt nur die Zeichnung aus der Sicherung (gibt Hinweise zurück)."""
    source = _check_file(raw)
    model = copy.deepcopy(current)
    notes: list[str] = []
    garden_raw = source.get("garden") or {}
    garden = garden_from_dict(garden_raw)
    model.garden = garden
    zones = {z.id: z for z in model.zones}
    skipped: list[str] = []
    for zone_raw in source.get("zones", []):
        zone = zones.get(zone_raw.get("id"))
        if zone is None:
            skipped.append(str(zone_raw.get("name") or zone_raw.get("id")))
            continue
        # Über das echte Einlesen gehen, damit Typen stimmen.
        parsed = model_from_dict({"zones": [_zone_shape(zone_raw)]}).zones[0]
        for key in GEOMETRY_KEYS:
            setattr(zone, key, getattr(parsed, key))
    if skipped:
        notes.append("Zonen nicht gefunden: " + ", ".join(skipped))
    for kind, items in (("valves", model.valves), ("sensors", model.sensors)):
        by_id = {i.id: i for i in items}
        for item_raw in source.get(kind, []):
            item = by_id.get(item_raw.get("id"))
            position = item_raw.get("position")
            if item is not None:
                item.position = (
                    None
                    if position is None
                    else (float(position[0]), float(position[1]))
                )
    model.validate()
    return model, notes


def _zone_shape(raw: dict[str, Any]) -> dict[str, Any]:
    """Nur die Teile einer Zone, die für die Zeichnung zählen."""
    shape = {"id": raw["id"], "name": raw.get("name", raw["id"])}
    shape["type"] = raw.get("type", "drip")
    for key in GEOMETRY_KEYS:
        if key in raw:
            shape[key] = raw[key]
    return shape


def import_all(raw: Any) -> GardenModel:
    """Liest das ganze Modell aus der Sicherung (geprüft)."""
    return model_from_dict(_check_file(raw))


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/export"})
@websocket_api.require_admin
@websocket_api.async_response
async def ws_export(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict
) -> None:
    """Sicherung erstellen."""
    entries = hass.config_entries.async_loaded_entries(DOMAIN)
    if not entries:
        connection.send_error(msg["id"], "not_loaded", "Nicht eingerichtet")
        return
    entry = entries[0]
    integration = await _version(hass)
    connection.send_result(
        msg["id"], export_payload(entry.runtime_data.store.model, integration)
    )


async def _version(hass: HomeAssistant) -> str:
    from homeassistant.loader import async_get_integration

    return str((await async_get_integration(hass, DOMAIN)).version or "")


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/import",
        vol.Required("mode"): vol.In(["drawing", "all"]),
        vol.Required("data"): dict,
    }
)
@websocket_api.require_admin
@websocket_api.async_response
async def ws_import(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict
) -> None:
    """Sicherung einspielen."""
    entries = hass.config_entries.async_loaded_entries(DOMAIN)
    if not entries:
        connection.send_error(msg["id"], "not_loaded", "Nicht eingerichtet")
        return
    entry = entries[0]
    data = entry.runtime_data
    try:
        if msg["mode"] == "drawing":
            model, notes = import_drawing(data.store.model, msg["data"])
        else:
            model, notes = import_all(msg["data"]), []
    except (ValueError, TypeError, KeyError, IndexError) as err:
        connection.send_error(msg["id"], "invalid", str(err))
        return
    if msg["mode"] == "drawing":
        current = data.store.model
        current.garden = model.garden
        new_zones = {z.id: z for z in model.zones}
        for zone in current.zones:
            for key in GEOMETRY_KEYS:
                setattr(zone, key, getattr(new_zones[zone.id], key))
        for target, source in (
            (current.valves, model.valves),
            (current.sensors, model.sensors),
        ):
            positions = {i.id: i.position for i in source}
            for item in target:
                item.position = positions[item.id]
        await data.store.async_save()
        data.async_model_changed()
        data.balance.async_notify()
        connection.send_result(msg["id"], {"reloaded": False, "notes": notes})
        return
    LOGGER.info("Sicherung wird eingespielt, die Integration wird neu geladen")
    data.store.model = model
    await data.store.async_save()
    hass.config_entries.async_schedule_reload(entry.entry_id)
    connection.send_result(msg["id"], {"reloaded": True, "notes": notes})
