"""Gemeinsame Grundlage für Treiber, die über Home Assistant schalten.

Zusätzliche Absicherung: Nach jeder Öffnung plant der Treiber selbst ein
Schließen nach Ablauf der Dauer ein (bei Gerätetimer etwas später, damit
das Gerät zuerst schließt). So ist ein Ventil nie „einfach offen“, auch
wenn das Gerät keinen eigenen Timer hat.
"""

from __future__ import annotations

from abc import abstractmethod
from typing import Any, ClassVar

from homeassistant.const import STATE_ON
from homeassistant.core import CALLBACK_TYPE, HomeAssistant, callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.event import async_call_later

from ..const import FAILSAFE_GRACE_S, LOGGER
from ..model import EntityRef, Valve, ValveRole
from ..profiles import Profile
from .base import Capability, ValveDriver

# Rollen, deren Vorhandensein eine Fähigkeit bedeutet.
_ROLE_CAPABILITIES = {
    ValveRole.FLOW: Capability.FLOW,
    ValveRole.VOLUME: Capability.VOLUME,
    ValveRole.STATUS: Capability.STATUS,
}


def resolve_entity_id(hass: HomeAssistant, ref: EntityRef) -> str | None:
    """Sucht die aktuelle ``entity_id`` zu einem stabilen Verweis."""
    return er.async_get(hass).async_get_entity_id(
        ref.domain, ref.platform, ref.unique_id
    )


class HassValveDriver(ValveDriver):
    """Basis für alle Treiber, die über Home Assistant schalten."""

    #: Kurzname des Treibers, so wie er im Modell gespeichert wird.
    name: ClassVar[str]

    def __init__(
        self, hass: HomeAssistant, valve: Valve, profile: Profile | None = None
    ) -> None:
        """Verbindet den Treiber mit einem Ventil aus dem Modell."""
        self.hass = hass
        self.valve = valve
        self.profile = profile
        self._close_timer: CALLBACK_TYPE | None = None
        caps = {
            cap for role, cap in _ROLE_CAPABILITIES.items() if role in valve.entities
        }
        if self._device_timer():
            caps.add(Capability.DEVICE_TIMER)
        self.capabilities = frozenset(caps)  # type: ignore[misc]

    def _device_timer(self) -> bool:
        """Schickt dieser Treiber die Dauer ans Gerät? Standard: nein."""
        return False

    # Entitäten -------------------------------------------------------------

    def entity_id(self, role: ValveRole) -> str | None:
        """Aktuelle ``entity_id`` der Entität für eine Rolle."""
        ref = self.valve.entities.get(role)
        return None if ref is None else resolve_entity_id(self.hass, ref)

    def require_entity_id(self, role: ValveRole) -> str:
        """Wie ``entity_id``, aber mit Fehler, wenn sie fehlt."""
        if (entity_id := self.entity_id(role)) is None:
            raise HomeAssistantError(
                f"{self.valve.name}: Entität für Rolle „{role}“ nicht gefunden"
            )
        return entity_id

    @property
    def is_open(self) -> bool | None:
        """Offen laut Home Assistant (``None`` = unbekannt/nicht erreichbar)."""
        entity_id = self.entity_id(ValveRole.VALVE)
        state = None if entity_id is None else self.hass.states.get(entity_id)
        if state is None:
            return None
        if state.state in (STATE_ON, "open", "opening"):
            return True
        if state.state in ("off", "closed", "closing"):
            return False
        return None

    async def _call(self, domain: str, service: str, data: dict[str, Any]) -> None:
        await self.hass.services.async_call(domain, service, data, blocking=True)

    # Öffnen und Schließen --------------------------------------------------

    async def _async_after_open(self, duration_s: int) -> None:
        """Plant das Sicherheits-Schließen ein."""
        self._cancel_close_timer()
        delay = duration_s
        if Capability.DEVICE_TIMER in self.capabilities:
            delay += FAILSAFE_GRACE_S
        self._close_timer = async_call_later(self.hass, delay, self._failsafe_close)

    async def async_close(self) -> None:
        """Schließt das Ventil."""
        self._cancel_close_timer()
        await self._async_close()

    @abstractmethod
    async def _async_close(self) -> None:
        """Schickt den Schließbefehl."""

    async def _failsafe_close(self, _now: Any) -> None:
        self._close_timer = None
        LOGGER.debug("%s: Dauer abgelaufen, schließe", self.valve.name)
        try:
            await self.async_close()
        except Exception:
            # Wird in Schritt 3 (Warteschlange) wiederholt, bis das Ventil zu ist.
            LOGGER.exception(
                "%s: Schließen nach Ablauf fehlgeschlagen", self.valve.name
            )

    @callback
    def _cancel_close_timer(self) -> None:
        if self._close_timer is not None:
            self._close_timer()
            self._close_timer = None

    @callback
    def async_cancel_failsafe(self) -> None:
        """Verwirft das eingeplante Schließen (nur wenn das Ventil bestätigt zu ist)."""
        if self.is_open is False:
            self._cancel_close_timer()

    @property
    def close_pending(self) -> bool:
        """Gibt an, ob ein Sicherheits-Schließen eingeplant ist."""
        return self._close_timer is not None

    async def async_shutdown(self) -> None:
        """Beim Entladen: Ist noch ein Schließen eingeplant, sofort schließen.

        Nur den Timer zu verwerfen würde ein Ventil ohne Gerätetimer offen
        lassen.
        """
        if self.close_pending:
            await self.async_close()
