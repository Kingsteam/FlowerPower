"""Knöpfe: Alles stoppen, Zone überspringen, Jetzt gießen, Programm starten.

„Jetzt gießen“ reiht die Zone mit ihrer eingestellten Gießdauer ein; die
Warteschlange entscheidet, wann das Ventil öffnet.
"""

from __future__ import annotations

from homeassistant.components.button import ButtonEntity
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from . import IrrigationPlannerConfigEntry
from .entity import PlannerEntity, ProgramEntity, ZoneEntity, main_device
from .scheduler import QueueError


async def async_setup_entry(
    hass: HomeAssistant,
    entry: IrrigationPlannerConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Legt die Knöpfe an."""
    model = entry.runtime_data.store.model
    entities: list[ButtonEntity] = [StopAllButton(entry), SkipButton(entry)]
    entities += [WaterNowButton(entry, zone) for zone in model.zones]
    entities += [ReleaseZoneButton(entry, zone) for zone in model.zones]
    entities += [ProgramStartButton(entry, p) for p in model.programs]
    async_add_entities(entities)


class StopAllButton(PlannerEntity, ButtonEntity):
    """Alles stoppen."""

    def __init__(self, entry: IrrigationPlannerConfigEntry) -> None:
        """Legt den Knopf an."""
        super().__init__(entry, "stop_all", main_device(entry))

    async def async_press(self) -> None:
        """Leert die Warteschlangen und schließt alle Ventile."""
        await self.data.scheduler.async_stop_all()


class SkipButton(PlannerEntity, ButtonEntity):
    """Laufende Zone beenden, mit der nächsten weitermachen."""

    def __init__(self, entry: IrrigationPlannerConfigEntry) -> None:
        """Legt den Knopf an."""
        super().__init__(entry, "skip", main_device(entry))

    async def async_press(self) -> None:
        """Überspringen."""
        self.data.scheduler.async_skip()


class WaterNowButton(ZoneEntity, ButtonEntity):
    """Zone jetzt mit ihrer Gießdauer gießen."""

    def __init__(self, entry: IrrigationPlannerConfigEntry, zone) -> None:
        """Legt den Knopf an."""
        super().__init__(entry, "water_now", zone)

    async def async_press(self) -> None:
        """Einreihen: geplante Dauer, ohne Bedarf die Dauer von Hand."""
        duration = self.data.balance.planned(self.zone).seconds or self.zone.duration_s
        if not duration:
            raise ServiceValidationError(
                f"Zone „{self.zone.name}“ hat keinen Bedarf und keine Gießdauer "
                "von Hand"
            )
        try:
            self.data.scheduler.async_enqueue(self.zone_id, duration, source="button")
        except QueueError as err:
            raise ServiceValidationError(str(err)) from err


class ProgramStartButton(ProgramEntity, ButtonEntity):
    """Programm jetzt starten."""

    def __init__(self, entry: IrrigationPlannerConfigEntry, program) -> None:
        """Legt den Knopf an."""
        super().__init__(entry, "program_start", program)

    async def async_press(self) -> None:
        """Starten."""
        try:
            self.data.programs.async_run(self.program_id, source="button")
        except QueueError as err:
            raise ServiceValidationError(str(err)) from err


class ReleaseZoneButton(ZoneEntity, ButtonEntity):
    """Zone nach einem Alarm und der Kontrolle wieder freigeben."""

    def __init__(self, entry: IrrigationPlannerConfigEntry, zone) -> None:
        """Legt den Knopf an."""
        super().__init__(entry, "release_zone", zone)

    async def async_press(self) -> None:
        """Freigeben (ohne Wirkung, wenn die Zone nicht gesperrt ist)."""
        self.data.watchdog.async_release_zone(self.zone_id)
