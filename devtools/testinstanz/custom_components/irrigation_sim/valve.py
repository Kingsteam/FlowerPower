"""Simulierte Ventile als ``valve``-Entität."""

from __future__ import annotations

from homeassistant.components.valve import (
    ValveDeviceClass,
    ValveEntity,
    ValveEntityFeature,
)
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
    """Legt die Ventil-Entitäten an."""
    async_add_entities(
        SimValveValve(valve)
        for valve in entry.runtime_data.valves
        if valve.spec.kind is ValveKind.VALVE
    )


class SimValveValve(SimValveEntity, ValveEntity):
    """Ventil als ``valve``-Entität (nur auf/zu)."""

    _attr_name = None
    _attr_device_class = ValveDeviceClass.WATER
    _attr_reports_position = False
    _attr_supported_features = ValveEntityFeature.OPEN | ValveEntityFeature.CLOSE

    def __init__(self, valve) -> None:
        """Legt die Entität an."""
        super().__init__(valve, "valve")

    @property
    def is_closed(self) -> bool:
        """Gibt an, ob das Ventil zu ist."""
        return not self.valve.is_open

    async def async_open_valve(self) -> None:
        """Öffnet."""
        self.valve.open()

    async def async_close_valve(self) -> None:
        """Schließt."""
        self.valve.close()
