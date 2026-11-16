"""Problem-Melder: an, solange ein Ventil klemmt oder ein Alarm offen ist."""

from __future__ import annotations

from homeassistant.components.binary_sensor import (
    BinarySensorDeviceClass,
    BinarySensorEntity,
)
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from . import IrrigationPlannerConfigEntry
from .entity import PlannerEntity, main_device


async def async_setup_entry(
    hass: HomeAssistant,
    entry: IrrigationPlannerConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Legt den Problem-Melder an."""
    async_add_entities([ProblemSensor(entry)])


class ProblemSensor(PlannerEntity, BinarySensorEntity):
    """Problem."""

    _attr_device_class = BinarySensorDeviceClass.PROBLEM

    def __init__(self, entry: IrrigationPlannerConfigEntry) -> None:
        """Legt den Melder an."""
        super().__init__(entry, "problem", main_device(entry))

    @property
    def is_on(self) -> bool:
        """Problem vorhanden."""
        return bool(self.data.problems)

    @property
    def extra_state_attributes(self) -> dict[str, list[str]]:
        """Die Meldungen im Klartext."""
        return {"messages": self.data.problems}
