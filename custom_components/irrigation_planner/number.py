"""Gießdauer je Zone (in Minuten einstellbar, gespeichert in Sekunden)."""

from __future__ import annotations

from homeassistant.components.number import NumberDeviceClass, NumberEntity, NumberMode
from homeassistant.const import EntityCategory, UnitOfTime
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from . import IrrigationPlannerConfigEntry
from .const import MAX_VALVE_DURATION_S
from .entity import ZoneEntity


async def async_setup_entry(
    hass: HomeAssistant,
    entry: IrrigationPlannerConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Legt die Zahlenfelder an."""
    async_add_entities(
        ZoneDurationNumber(entry, zone) for zone in entry.runtime_data.store.model.zones
    )


class ZoneDurationNumber(ZoneEntity, NumberEntity):
    """Gießdauer einer Zone (vorerst von Hand, ab Phase 2 berechnet)."""

    _attr_device_class = NumberDeviceClass.DURATION
    _attr_native_unit_of_measurement = UnitOfTime.MINUTES
    _attr_native_min_value = 0
    _attr_native_step = 0.5
    _attr_mode = NumberMode.BOX
    _attr_entity_category = EntityCategory.CONFIG

    def __init__(self, entry: IrrigationPlannerConfigEntry, zone) -> None:
        """Legt das Zahlenfeld an."""
        super().__init__(entry, "duration", zone)

    @property
    def native_max_value(self) -> float:
        """Höchstdauer der Zone, sonst die allgemeine Obergrenze."""
        limit = self.zone.max_duration_s or MAX_VALVE_DURATION_S
        return min(limit, MAX_VALVE_DURATION_S) / 60

    @property
    def native_value(self) -> float:
        """Minuten (0 = keine Dauer, Zone wird in Programmen übersprungen)."""
        return round((self.zone.duration_s or 0) / 60, 2)

    async def async_set_native_value(self, value: float) -> None:
        """Speichert die Dauer in ganzen Sekunden."""
        seconds = round(value * 60)
        self.zone.duration_s = seconds or None
        self.data.async_model_changed()
