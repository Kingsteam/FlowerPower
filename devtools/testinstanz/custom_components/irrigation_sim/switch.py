"""Simulierte Ventile als Schalter."""

from __future__ import annotations

from typing import Any

from homeassistant.components.switch import SwitchEntity
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from . import SimConfigEntry
from .const import ValveKind
from .entity import SimValveEntity


async def async_setup_entry(
    hass: HomeAssistant,
    entry: SimConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Legt die Schalter an."""
    async_add_entities(
        SimSwitch(valve)
        for valve in entry.runtime_data.valves
        if valve.spec.kind is ValveKind.SWITCH
    )


class SimSwitch(SimValveEntity, SwitchEntity):
    """Ventil als Schalter. Einschalten ohne Dauer: bleibt offen."""

    _attr_name = None
    _attr_icon = "mdi:water"

    def __init__(self, valve) -> None:
        """Legt den Schalter an."""
        super().__init__(valve, "switch")

    @property
    def is_on(self) -> bool:
        """Gibt an, ob das Ventil offen ist."""
        return self.valve.is_open

    async def async_turn_on(self, **kwargs: Any) -> None:
        """Öffnet ohne Dauer (wie ein einfacher Schalter)."""
        self.valve.open()

    async def async_turn_off(self, **kwargs: Any) -> None:
        """Schließt."""
        self.valve.close()
