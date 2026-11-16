"""Geräteprofile: deklarative Beschreibung von Ventil-Hardware.

Ein Profil (YAML-Datei in diesem Ordner) beschreibt, woran man ein Gerät
erkennt, welcher Treiber passt, wie der Befehl mit Dauer aussieht und wie
die Statuswerte zu deuten sind. Neue Hardware braucht so kein neues Python.

Sicherheitsregel: Ein Profil mit der Fähigkeit ``device_timer`` MUSS im
Öffnungsbefehl den Platzhalter ``{duration}`` enthalten, sonst wird es
nicht geladen. So kann die Dauer nie „vergessen“ werden.
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum
from pathlib import Path
from typing import Any, Final

from homeassistant.core import HomeAssistant
from homeassistant.util.yaml import load_yaml_dict
import voluptuous as vol

from ..drivers.base import Capability
from ..model import ValveRole

PROFILE_DIR: Final = Path(__file__).parent
DURATION_PLACEHOLDER: Final = "{duration}"


class DeviceStatus(StrEnum):
    """Gedeuteter Gerätestatus."""

    OK = "ok"
    SHORTAGE = "shortage"  # kein Wasser
    LEAK = "leak"  # Gerät meldet ein Leck


@dataclass(frozen=True, slots=True, kw_only=True)
class DeviceMatch:
    """Merkmale aus dem Geräteverzeichnis; gesetzte Felder müssen passen."""

    manufacturer: str | None = None
    model: str | None = None
    model_id: str | None = None

    def matches(
        self, manufacturer: str | None, model: str | None, model_id: str | None
    ) -> bool:
        """Passt das Gerät? Groß-/Kleinschreibung zählt nicht."""
        pairs = (
            (self.manufacturer, manufacturer),
            (self.model, model),
            (self.model_id, model_id),
        )
        return any(want for want, _ in pairs) and all(
            want is None or (have is not None and want.casefold() == have.casefold())
            for want, have in pairs
        )


@dataclass(frozen=True, slots=True, kw_only=True)
class EntityHint:
    """Woran die Entität für eine Rolle zu erkennen ist."""

    domain: str
    device_class: str | None = None
    unique_id_suffix: str | None = None


@dataclass(frozen=True, slots=True, kw_only=True)
class Profile:
    """Ein Geräteprofil."""

    id: str
    name: str
    driver: str
    match: tuple[DeviceMatch, ...]
    capabilities: frozenset[Capability]
    open_payload: dict[str, Any] | None = None
    close_payload: dict[str, Any] | None = None
    entities: dict[ValveRole, EntityHint]
    status_map: dict[str, DeviceStatus]

    def map_status(self, raw: str | None) -> DeviceStatus | None:
        """Deutet einen Statuswert des Geräts (``None`` = unbekannt)."""
        return None if raw is None else self.status_map.get(raw)


def contains_placeholder(value: Any) -> bool:
    """Prüft, ob ``{duration}`` irgendwo im (verschachtelten) Wert steckt."""
    if isinstance(value, str):
        return DURATION_PLACEHOLDER in value
    if isinstance(value, dict):
        return any(contains_placeholder(v) for v in value.values())
    if isinstance(value, list):
        return any(contains_placeholder(v) for v in value)
    return False


def fill_placeholder(value: Any, duration: int) -> Any:
    """Ersetzt ``{duration}`` durch die Dauer.

    Ist ein Wert genau der Platzhalter, wird er zur Zahl; steht er in einem
    längeren Text, wird er im Text ersetzt.
    """
    if isinstance(value, str):
        if value == DURATION_PLACEHOLDER:
            return duration
        return value.replace(DURATION_PLACEHOLDER, str(duration))
    if isinstance(value, dict):
        return {k: fill_placeholder(v, duration) for k, v in value.items()}
    if isinstance(value, list):
        return [fill_placeholder(v, duration) for v in value]
    return value


def _check_timer(profile: dict[str, Any]) -> dict[str, Any]:
    if Capability.DEVICE_TIMER.value in profile[
        "capabilities"
    ] and not contains_placeholder(profile.get("open_payload")):
        raise vol.Invalid("Profil mit device_timer braucht {duration} im open_payload")
    return profile


PROFILE_SCHEMA = vol.All(
    vol.Schema(
        {
            vol.Required("id"): vol.All(str, vol.Match(r"^[a-z0-9_]+$")),
            vol.Required("name"): str,
            vol.Required("driver"): vol.In(
                ["ha_switch", "ha_valve", "zigbee2mqtt", "service_call"]
            ),
            vol.Required("match"): vol.All(
                [
                    vol.All(
                        {
                            vol.Optional("manufacturer"): str,
                            vol.Optional("model"): str,
                            vol.Optional("model_id"): str,
                        },
                        vol.Length(min=1),
                    )
                ],
                vol.Length(min=1),
            ),
            vol.Optional("capabilities", default=list): [
                vol.In([c.value for c in Capability])
            ],
            vol.Optional("open_payload"): dict,
            vol.Optional("close_payload"): dict,
            vol.Optional("entities", default=dict): {
                vol.In([r.value for r in ValveRole]): {
                    vol.Required("domain"): str,
                    vol.Optional("device_class"): str,
                    vol.Optional("unique_id_suffix"): str,
                }
            },
            vol.Optional("status_map", default=dict): {
                str: vol.In([s.value for s in DeviceStatus])
            },
        }
    ),
    _check_timer,
)


def parse_profile(raw: dict[str, Any]) -> Profile:
    """Prüft ein Profil und wandelt es um (``vol.Invalid`` bei Fehlern)."""
    data = PROFILE_SCHEMA(raw)
    return Profile(
        id=data["id"],
        name=data["name"],
        driver=data["driver"],
        match=tuple(DeviceMatch(**m) for m in data["match"]),
        capabilities=frozenset(Capability(c) for c in data["capabilities"]),
        open_payload=data.get("open_payload"),
        close_payload=data.get("close_payload"),
        entities={
            ValveRole(role): EntityHint(**hint)
            for role, hint in data["entities"].items()
        },
        status_map={k: DeviceStatus(v) for k, v in data["status_map"].items()},
    )


def load_builtin_profiles(directory: Path = PROFILE_DIR) -> dict[str, Profile]:
    """Lädt alle mitgelieferten Profile (blockierend, im Executor aufrufen)."""
    profiles: dict[str, Profile] = {}
    for path in sorted(directory.glob("*.yaml")):
        try:
            profile = parse_profile(load_yaml_dict(str(path)))
        except vol.Invalid as err:
            raise ValueError(f"Profil {path.name} ist ungültig: {err}") from err
        if profile.id in profiles:
            raise ValueError(f"Profil-ID {profile.id} kommt doppelt vor")
        profiles[profile.id] = profile
    return profiles


async def async_load_builtin_profiles(hass: HomeAssistant) -> dict[str, Profile]:
    """Lädt die mitgelieferten Profile, ohne die Ereignisschleife zu blockieren."""
    return await hass.async_add_executor_job(load_builtin_profiles)


def find_profile(
    profiles: dict[str, Profile],
    manufacturer: str | None,
    model: str | None,
    model_id: str | None,
) -> Profile | None:
    """Sucht das erste Profil, das zum Gerät passt."""
    for profile in profiles.values():
        if any(m.matches(manufacturer, model, model_id) for m in profile.match):
            return profile
    return None
