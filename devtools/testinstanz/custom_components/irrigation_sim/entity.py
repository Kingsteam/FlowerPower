"""Gemeinsame Basis der Simulator-Entitäten."""

from __future__ import annotations

from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.entity import Entity

from .const import DOMAIN
from .sim import SimValve


def valve_device(valve: SimValve) -> DeviceInfo:
    """Geräteeintrag eines simulierten Ventils."""
    timer = "mit Gerätetimer" if valve.spec.device_timer else "ohne Gerätetimer"
    return DeviceInfo(
        identifiers={(DOMAIN, f"zone_{valve.spec.number}")},
        name=f"Simuliertes Ventil {valve.name}",
        manufacturer="Simulator",
        model=f"Ventil {timer}",
    )


class SimValveEntity(Entity):
    """Entität, die zu einem simulierten Ventil gehört."""

    _attr_has_entity_name = True
    _attr_should_poll = False

    def __init__(self, valve: SimValve, key: str) -> None:
        """Verbindet die Entität mit dem Ventil."""
        self.valve = valve
        self._attr_unique_id = f"zone_{valve.spec.number}_{key}"
        self._attr_device_info = valve_device(valve)

    @property
    def available(self) -> bool:
        """Nicht erreichbare Geräte sind nicht verfügbar."""
        return self.valve.available

    async def async_added_to_hass(self) -> None:
        """Auf Änderungen des Ventils hören."""
        self.async_on_remove(self.valve.add_listener(self.async_write_ha_state))
