"""Gemeinsame Basis der Entitäten des Bewässerungsplaners.

Geräte: ein Hauptgerät „Bewässerungsplaner“, dazu je Zone und je Programm
ein eigenes Gerät. Alle Entitäten aktualisieren sich, wenn sich in der
Warteschlange oder bei den Programmen etwas ändert.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from homeassistant.helpers.device_registry import DeviceEntryType, DeviceInfo
from homeassistant.helpers.entity import Entity

from .const import DOMAIN, NAME
from .model import Program, Zone

if TYPE_CHECKING:
    from . import IrrigationPlannerConfigEntry, IrrigationPlannerData


def main_device(entry: IrrigationPlannerConfigEntry) -> DeviceInfo:
    """Hauptgerät."""
    return DeviceInfo(
        identifiers={(DOMAIN, entry.entry_id)},
        name=NAME,
        manufacturer=NAME,
        entry_type=DeviceEntryType.SERVICE,
    )


def zone_device(entry: IrrigationPlannerConfigEntry, zone: Zone) -> DeviceInfo:
    """Gerät einer Zone."""
    return DeviceInfo(
        identifiers={(DOMAIN, f"{entry.entry_id}_zone_{zone.id}")},
        name=zone.name,
        manufacturer=NAME,
        model="Zone",
        entry_type=DeviceEntryType.SERVICE,
        via_device=(DOMAIN, entry.entry_id),
    )


def program_device(entry: IrrigationPlannerConfigEntry, program: Program) -> DeviceInfo:
    """Gerät eines Programms."""
    return DeviceInfo(
        identifiers={(DOMAIN, f"{entry.entry_id}_program_{program.id}")},
        name=program.name,
        manufacturer=NAME,
        model="Programm",
        entry_type=DeviceEntryType.SERVICE,
        via_device=(DOMAIN, entry.entry_id),
    )


class PlannerEntity(Entity):
    """Basis: aktualisiert sich bei jeder Änderung."""

    _attr_has_entity_name = True
    _attr_should_poll = False

    def __init__(
        self,
        entry: IrrigationPlannerConfigEntry,
        key: str,
        device_info: DeviceInfo,
        object_key: str = "",
    ) -> None:
        """Setzt eindeutige ID, Gerät und Übersetzungsschlüssel."""
        self.entry = entry
        self._attr_translation_key = key
        suffix = f"_{object_key}" if object_key else ""
        self._attr_unique_id = f"{entry.entry_id}{suffix}_{key}"
        self._attr_device_info = device_info

    @property
    def data(self) -> IrrigationPlannerData:
        """Laufzeitdaten."""
        return self.entry.runtime_data

    async def async_added_to_hass(self) -> None:
        """Auf Änderungen hören."""
        self.async_on_remove(
            self.data.scheduler.async_add_listener(self.async_write_ha_state)
        )
        self.async_on_remove(
            self.data.programs.async_add_listener(self.async_write_ha_state)
        )


class ZoneEntity(PlannerEntity):
    """Entität einer Zone."""

    def __init__(
        self, entry: IrrigationPlannerConfigEntry, key: str, zone: Zone
    ) -> None:
        """Merkt sich die Zone."""
        super().__init__(entry, key, zone_device(entry, zone), f"zone_{zone.id}")
        self.zone_id = zone.id

    @property
    def zone(self) -> Zone:
        """Aktuelle Zone aus dem Modell."""
        return next(z for z in self.data.store.model.zones if z.id == self.zone_id)


class ProgramEntity(PlannerEntity):
    """Entität eines Programms."""

    def __init__(
        self, entry: IrrigationPlannerConfigEntry, key: str, program: Program
    ) -> None:
        """Merkt sich das Programm."""
        super().__init__(
            entry, key, program_device(entry, program), f"program_{program.id}"
        )
        self.program_id = program.id

    @property
    def program(self) -> Program:
        """Aktuelles Programm aus dem Modell."""
        return next(
            p for p in self.data.store.model.programs if p.id == self.program_id
        )
