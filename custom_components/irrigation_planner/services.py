"""Dienste des Bewässerungsplaners.

``run_zone`` reiht immer nur ein; die Warteschlange entscheidet, wann das
Ventil wirklich öffnet. So gilt „ein Ventil gleichzeitig“ auch für Starts
von Hand oder aus Automationen.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from homeassistant.config_entries import ConfigEntryState
from homeassistant.core import HomeAssistant, ServiceCall, callback
from homeassistant.exceptions import ServiceValidationError
import voluptuous as vol

from .const import (
    ATTR_DURATION,
    ATTR_ZONE_ID,
    DOMAIN,
    MAX_VALVE_DURATION_S,
    MIN_VALVE_DURATION_S,
    SERVICE_RUN_ZONE,
    SERVICE_STOP_ALL,
)
from .scheduler import IrrigationScheduler, QueueError

if TYPE_CHECKING:
    from . import IrrigationPlannerConfigEntry

RUN_ZONE_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_ZONE_ID): vol.All(str, vol.Length(min=1)),
        vol.Required(ATTR_DURATION): vol.All(
            vol.Coerce(int),
            vol.Range(min=MIN_VALVE_DURATION_S, max=MAX_VALVE_DURATION_S),
        ),
    }
)


def _scheduler(hass: HomeAssistant) -> IrrigationScheduler:
    entries: list[IrrigationPlannerConfigEntry] = hass.config_entries.async_entries(
        DOMAIN
    )
    for entry in entries:
        if entry.state is ConfigEntryState.LOADED:
            return entry.runtime_data.scheduler
    raise ServiceValidationError("Der Bewässerungsplaner ist nicht geladen")


@callback
def async_setup_services(hass: HomeAssistant) -> None:
    """Registriert die Dienste."""

    async def run_zone(call: ServiceCall) -> None:
        try:
            _scheduler(hass).async_enqueue(
                call.data[ATTR_ZONE_ID], call.data[ATTR_DURATION], source="manual"
            )
        except QueueError as err:
            raise ServiceValidationError(str(err)) from err

    async def stop_all(call: ServiceCall) -> None:
        await _scheduler(hass).async_stop_all()

    hass.services.async_register(
        DOMAIN, SERVICE_RUN_ZONE, run_zone, schema=RUN_ZONE_SCHEMA
    )
    hass.services.async_register(DOMAIN, SERVICE_STOP_ALL, stop_all)
