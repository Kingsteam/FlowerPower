"""Ablauf eines Programms (Nacheinander, Abwechselnd, Nach Priorität)."""

from __future__ import annotations

from homeassistant.components.select import SelectEntity
from homeassistant.const import EntityCategory
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from . import IrrigationPlannerConfigEntry
from .entity import ProgramEntity
from .model import ProgramMode

PROGRAM_MODES = [m.value for m in ProgramMode]


async def async_setup_entry(
    hass: HomeAssistant,
    entry: IrrigationPlannerConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Legt die Auswahlfelder an."""
    async_add_entities(
        ProgramModeSelect(entry, p) for p in entry.runtime_data.store.model.programs
    )


class ProgramModeSelect(ProgramEntity, SelectEntity):
    """Ablaufmodus eines Programms."""

    _attr_options = PROGRAM_MODES
    _attr_entity_category = EntityCategory.CONFIG

    def __init__(self, entry: IrrigationPlannerConfigEntry, program) -> None:
        """Legt das Auswahlfeld an."""
        super().__init__(entry, "program_mode", program)

    @property
    def current_option(self) -> str:
        """Aktueller Modus."""
        return self.program.mode.value

    async def async_select_option(self, option: str) -> None:
        """Speichert den Modus."""
        self.program.mode = ProgramMode(option)
        self.data.async_model_changed()
