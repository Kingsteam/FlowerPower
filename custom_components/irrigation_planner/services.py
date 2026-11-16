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
    ATTR_PROGRAM_ID,
    ATTR_ZONE_ID,
    DOMAIN,
    MAX_VALVE_DURATION_S,
    MIN_VALVE_DURATION_S,
    SERVICE_CANCEL_PROGRAM,
    SERVICE_CANCEL_ZONE,
    SERVICE_RECALCULATE,
    SERVICE_RELEASE_ZONE,
    SERVICE_RESET_BALANCE,
    SERVICE_RUN_PROGRAM,
    SERVICE_RUN_ZONE,
    SERVICE_SKIP_NEXT,
    SERVICE_STOP_ALL,
)
from .scheduler import IrrigationScheduler, QueueError

if TYPE_CHECKING:
    from . import IrrigationPlannerConfigEntry, IrrigationPlannerData

RUN_ZONE_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_ZONE_ID): vol.All(str, vol.Length(min=1)),
        vol.Required(ATTR_DURATION): vol.All(
            vol.Coerce(int),
            vol.Range(min=MIN_VALVE_DURATION_S, max=MAX_VALVE_DURATION_S),
        ),
    }
)


PROGRAM_SCHEMA = vol.Schema(
    {vol.Required(ATTR_PROGRAM_ID): vol.All(str, vol.Length(min=1))}
)


def _data(hass: HomeAssistant) -> IrrigationPlannerData:
    entries: list[IrrigationPlannerConfigEntry] = hass.config_entries.async_entries(
        DOMAIN
    )
    for entry in entries:
        if entry.state is ConfigEntryState.LOADED:
            return entry.runtime_data
    raise ServiceValidationError("Der Bewässerungsplaner ist nicht geladen")


def _scheduler(hass: HomeAssistant) -> IrrigationScheduler:
    return _data(hass).scheduler


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

    async def release_zone(call: ServiceCall) -> None:
        if not _data(hass).watchdog.async_release_zone(call.data[ATTR_ZONE_ID]):
            raise ServiceValidationError(
                f"Zone {call.data[ATTR_ZONE_ID]} ist nicht gesperrt"
            )

    async def recalculate(call: ServiceCall) -> None:
        # Bedarf und geplante Dauer werden laufend aus der Bilanz abgeleitet;
        # hier nur alle Anzeigen auffrischen.
        _data(hass).balance.async_notify()

    async def reset_balance(call: ServiceCall) -> None:
        data = _data(hass)
        zone_id = call.data.get(ATTR_ZONE_ID)
        if zone_id and all(z.id != zone_id for z in data.store.model.zones):
            raise ServiceValidationError(f"Zone {zone_id} gibt es nicht")
        data.balance.async_reset(zone_id)

    async def run_program(call: ServiceCall) -> None:
        try:
            _data(hass).programs.async_run(call.data[ATTR_PROGRAM_ID])
        except QueueError as err:
            raise ServiceValidationError(str(err)) from err

    async def skip_next(call: ServiceCall) -> None:
        try:
            _data(hass).programs.async_skip_next(call.data[ATTR_PROGRAM_ID])
        except QueueError as err:
            raise ServiceValidationError(str(err)) from err

    hass.services.async_register(
        DOMAIN, SERVICE_RUN_ZONE, run_zone, schema=RUN_ZONE_SCHEMA
    )
    hass.services.async_register(DOMAIN, SERVICE_STOP_ALL, stop_all)
    hass.services.async_register(
        DOMAIN, SERVICE_RUN_PROGRAM, run_program, schema=PROGRAM_SCHEMA
    )
    hass.services.async_register(DOMAIN, SERVICE_RECALCULATE, recalculate)
    hass.services.async_register(
        DOMAIN,
        SERVICE_RESET_BALANCE,
        reset_balance,
        schema=vol.Schema(
            {vol.Optional(ATTR_ZONE_ID): vol.All(str, vol.Length(min=1))}
        ),
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_RELEASE_ZONE,
        release_zone,
        schema=vol.Schema(
            {vol.Required(ATTR_ZONE_ID): vol.All(str, vol.Length(min=1))}
        ),
    )
    hass.services.async_register(
        DOMAIN, SERVICE_SKIP_NEXT, skip_next, schema=PROGRAM_SCHEMA
    )

    async def cancel_zone(call: ServiceCall) -> None:
        # Nur schließen bzw. aus der Warteschlange nehmen; der Rest läuft weiter.
        if not _scheduler(hass).async_cancel_zone(call.data[ATTR_ZONE_ID]):
            raise ServiceValidationError(
                f"Zone {call.data[ATTR_ZONE_ID]} läuft nicht und wartet nicht"
            )

    async def cancel_program(call: ServiceCall) -> None:
        if not _scheduler(hass).async_cancel_program(call.data[ATTR_PROGRAM_ID]):
            raise ServiceValidationError(
                f"Programm {call.data[ATTR_PROGRAM_ID]} läuft nicht"
            )

    hass.services.async_register(
        DOMAIN,
        SERVICE_CANCEL_ZONE,
        cancel_zone,
        schema=vol.Schema(
            {vol.Required(ATTR_ZONE_ID): vol.All(str, vol.Length(min=1))}
        ),
    )
    hass.services.async_register(
        DOMAIN, SERVICE_CANCEL_PROGRAM, cancel_program, schema=PROGRAM_SCHEMA
    )
