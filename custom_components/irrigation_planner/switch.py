"""Schalter: Automatik, Winterpause, Zone aktiv, Programm aktiv.

Das sind Einstellungen des Bewässerungsplaners, keine Ventile. Ein Ventil
lässt sich hier nicht „einfach öffnen“.
"""

from __future__ import annotations

from typing import Any

from homeassistant.components.switch import SwitchEntity
from homeassistant.const import EntityCategory
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from . import IrrigationPlannerConfigEntry
from .entity import PlannerEntity, ProgramEntity, ZoneEntity, main_device


async def async_setup_entry(
    hass: HomeAssistant,
    entry: IrrigationPlannerConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Legt die Schalter an."""
    model = entry.runtime_data.store.model
    entities: list[SwitchEntity] = [AutomaticSwitch(entry), WinterSwitch(entry)]
    entities += [ZoneEnabledSwitch(entry, zone) for zone in model.zones]
    entities += [ProgramEnabledSwitch(entry, p) for p in model.programs]
    async_add_entities(entities)


class AutomaticSwitch(PlannerEntity, SwitchEntity):
    """Zeitpläne an oder aus."""

    def __init__(self, entry: IrrigationPlannerConfigEntry) -> None:
        """Legt den Schalter an."""
        super().__init__(entry, "automatic", main_device(entry))

    @property
    def is_on(self) -> bool:
        """Automatik an."""
        return self.data.store.model.settings.automatic

    async def async_turn_on(self, **kwargs: Any) -> None:
        """Einschalten."""
        self.data.store.model.settings.automatic = True
        self.data.async_model_changed()

    async def async_turn_off(self, **kwargs: Any) -> None:
        """Ausschalten (laufende Läufe gehen zu Ende)."""
        self.data.store.model.settings.automatic = False
        self.data.async_model_changed()


class WinterSwitch(PlannerEntity, SwitchEntity):
    """Winterpause."""

    def __init__(self, entry: IrrigationPlannerConfigEntry) -> None:
        """Legt den Schalter an."""
        super().__init__(entry, "winter_mode", main_device(entry))

    @property
    def is_on(self) -> bool:
        """Winterpause aktiv."""
        return self.data.store.model.settings.winter_mode

    async def async_turn_on(self, **kwargs: Any) -> None:
        """Winterpause beginnen."""
        await self.data.async_set_winter_mode(True)

    async def async_turn_off(self, **kwargs: Any) -> None:
        """Winterpause beenden."""
        await self.data.async_set_winter_mode(False)


class ZoneEnabledSwitch(ZoneEntity, SwitchEntity):
    """Zone aktiv (deaktivierte Zonen werden nie gestartet)."""

    _attr_entity_category = EntityCategory.CONFIG

    def __init__(self, entry: IrrigationPlannerConfigEntry, zone) -> None:
        """Legt den Schalter an."""
        super().__init__(entry, "zone_enabled", zone)

    @property
    def is_on(self) -> bool:
        """Zone aktiv."""
        return self.zone.enabled

    async def async_turn_on(self, **kwargs: Any) -> None:
        """Aktivieren."""
        self.zone.enabled = True
        self.data.async_model_changed()

    async def async_turn_off(self, **kwargs: Any) -> None:
        """Deaktivieren (ein laufender Lauf geht zu Ende)."""
        self.zone.enabled = False
        self.data.async_model_changed()


class ProgramEnabledSwitch(ProgramEntity, SwitchEntity):
    """Programm aktiv (startet dann nach Zeitplan)."""

    _attr_entity_category = EntityCategory.CONFIG

    def __init__(self, entry: IrrigationPlannerConfigEntry, program) -> None:
        """Legt den Schalter an."""
        super().__init__(entry, "program_enabled", program)

    @property
    def is_on(self) -> bool:
        """Programm aktiv."""
        return self.program.enabled

    async def async_turn_on(self, **kwargs: Any) -> None:
        """Aktivieren."""
        self.program.enabled = True
        self.data.async_model_changed()

    async def async_turn_off(self, **kwargs: Any) -> None:
        """Deaktivieren."""
        self.program.enabled = False
        self.data.async_model_changed()
