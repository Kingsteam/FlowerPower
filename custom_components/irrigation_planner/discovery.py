"""Geräte erkennen: Entitäten einem Ventil zuordnen, Profil und Treiber vorschlagen.

Für den Assistenten „Ventil hinzufügen“. Alles ist nur ein Vorschlag; in
der Oberfläche lässt sich jede Zuordnung überschreiben.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from homeassistant.core import HomeAssistant
from homeassistant.helpers import device_registry as dr, entity_registry as er

from .model import ValveRole
from .profiles import EntityHint, Profile, find_profile


@dataclass(slots=True)
class Suggestion:
    """Vorschlag für ein Gerät."""

    name: str
    driver: str
    profile: Profile | None = None
    entities: dict[ValveRole, str] = field(default_factory=dict)  # Rolle → entity_id
    friendly_name: str | None = None  # für Zigbee2MQTT


def _device_class(entry: er.RegistryEntry) -> str | None:
    return entry.device_class or entry.original_device_class


def _matches(entry: er.RegistryEntry, hint: EntityHint) -> bool:
    if entry.domain != hint.domain:
        return False
    if hint.device_class is not None and _device_class(entry) != hint.device_class:
        return False
    return not (
        hint.unique_id_suffix is not None
        and not entry.unique_id.endswith(hint.unique_id_suffix)
    )


def _generic_roles(entries: list[er.RegistryEntry]) -> dict[ValveRole, str]:
    """Rollen ohne Profil, nach Domain und Geräteklasse."""
    roles: dict[ValveRole, str] = {}
    valves = [e for e in entries if e.domain == "valve"]
    switches = [e for e in entries if e.domain == "switch"]
    if valves or switches:
        roles[ValveRole.VALVE] = (valves or switches)[0].entity_id
    for entry in entries:
        if entry.domain != "sensor":
            continue
        device_class = _device_class(entry)
        text = f"{entry.unique_id} {entry.original_name or ''}".lower()
        if device_class == "volume_flow_rate":
            roles.setdefault(ValveRole.FLOW, entry.entity_id)
        elif device_class == "battery":
            roles.setdefault(ValveRole.BATTERY, entry.entity_id)
        elif device_class in ("water", "volume") and "daily" not in text:
            roles.setdefault(ValveRole.VOLUME, entry.entity_id)
        elif "status" in text:
            roles.setdefault(ValveRole.STATUS, entry.entity_id)
    return roles


def is_zigbee2mqtt(device: dr.DeviceEntry) -> bool:
    """Gibt an, ob das Gerät von Zigbee2MQTT stammt (über MQTT-Discovery)."""
    return any(
        domain == "mqtt" and ident.startswith("zigbee2mqtt_")
        for domain, ident in device.identifiers
    )


def suggest(
    hass: HomeAssistant, device_id: str, profiles: dict[str, Profile]
) -> Suggestion:
    """Schlägt Profil, Treiber und Entitäten für ein Gerät vor."""
    device = dr.async_get(hass).async_get(device_id)
    if device is None:
        raise ValueError("Gerät nicht gefunden")
    entries = [
        e
        for e in er.async_entries_for_device(er.async_get(hass), device_id)
        if e.disabled_by is None
    ]
    name = device.name_by_user or device.name or "Ventil"
    profile = find_profile(profiles, device.manufacturer, device.model, device.model_id)

    roles: dict[ValveRole, str] = {}
    if profile is not None:
        for role, hint in profile.entities.items():
            match = next((e for e in entries if _matches(e, hint)), None)
            if match is not None:
                roles[role] = match.entity_id
    for role, entity_id in _generic_roles(entries).items():
        roles.setdefault(role, entity_id)

    if profile is not None:
        driver = profile.driver
    elif is_zigbee2mqtt(device):
        driver = "zigbee2mqtt"
    elif roles.get(ValveRole.VALVE, "").startswith("valve."):
        driver = "ha_valve"
    else:
        driver = "ha_switch"
    return Suggestion(
        name=name,
        driver=driver,
        profile=profile,
        entities=roles,
        friendly_name=device.name if driver == "zigbee2mqtt" else None,
    )
