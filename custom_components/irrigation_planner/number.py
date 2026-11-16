"""Gießdauer je Zone (in Minuten einstellbar, gespeichert in Sekunden)."""

from __future__ import annotations

from homeassistant.components.number import NumberDeviceClass, NumberEntity, NumberMode
from homeassistant.const import PERCENTAGE, EntityCategory, UnitOfTime
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from . import IrrigationPlannerConfigEntry
from .const import MAX_VALVE_DURATION_S
from .entity import PlannerEntity, ZoneEntity, main_device
from .model import MAX_WATER_SAVING_PCT


async def async_setup_entry(
    hass: HomeAssistant,
    entry: IrrigationPlannerConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Legt die Zahlenfelder an."""
    async_add_entities(
        [
            WaterSavingNumber(entry),
            *(
                ZoneDurationNumber(entry, zone)
                for zone in entry.runtime_data.store.model.zones
            ),
        ]
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


class WaterSavingNumber(PlannerEntity, NumberEntity):
    """Wassersparen: geplante Gießdauer um n % kürzen (z. B. bei Hitzewarnung)."""

    _attr_native_unit_of_measurement = PERCENTAGE
    _attr_native_min_value = 0
    _attr_native_max_value = MAX_WATER_SAVING_PCT
    _attr_native_step = 5
    _attr_mode = NumberMode.SLIDER
    _attr_icon = "mdi:water-minus"

    def __init__(self, entry: IrrigationPlannerConfigEntry) -> None:
        """Legt den Regler an."""
        super().__init__(entry, "water_saving", main_device(entry))

    @property
    def native_value(self) -> float:
        """Prozent (0 = aus)."""
        return self.data.store.model.settings.water_saving_pct

    async def async_set_native_value(self, value: float) -> None:
        """Speichert den Wert und plant neu."""
        self.data.store.model.settings.water_saving_pct = int(
            min(MAX_WATER_SAVING_PCT, max(0, round(value)))
        )
        self.data.async_model_changed()
        self.data.balance.async_notify()
