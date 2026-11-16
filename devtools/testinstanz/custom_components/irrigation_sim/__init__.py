"""Ventil-Simulator für die Testinstanz des Bewässerungsplaners.

NUR zum Testen. Diese Integration steuert keine echte Hardware und wird
nicht mit dem Bewässerungsplaner ausgeliefert.
"""

from __future__ import annotations

from datetime import timedelta

from homeassistant.config_entries import SOURCE_IMPORT, ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.event import async_track_time_interval
from homeassistant.helpers.typing import ConfigType
import voluptuous as vol

from .const import ATTR_DURATION, ATTR_FAULT, ATTR_LEVEL, DOMAIN, TICK_S, ZONES, Fault
from .sim import Simulator, SimValve

PLATFORMS = [Platform.SENSOR, Platform.SWITCH, Platform.VALVE]
CONFIG_SCHEMA = cv.empty_config_schema(DOMAIN)

type SimConfigEntry = ConfigEntry[Simulator]

ATTR_ZONE = "zone"
ZONE_NUMBER = vol.All(vol.Coerce(int), vol.Range(min=1, max=len(ZONES)))


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Legt den Simulator automatisch an, wenn er in der YAML steht."""
    if DOMAIN in config and not hass.config_entries.async_entries(DOMAIN):
        hass.async_create_task(
            hass.config_entries.flow.async_init(
                DOMAIN, context={"source": SOURCE_IMPORT}, data={}
            )
        )
    return True


async def async_setup_entry(hass: HomeAssistant, entry: SimConfigEntry) -> bool:
    """Startet den Simulator."""
    sim = Simulator(hass, ZONES)
    entry.runtime_data = sim
    entry.async_on_unload(
        async_track_time_interval(hass, sim.tick, timedelta(seconds=TICK_S))
    )
    entry.async_on_unload(sim.shutdown)

    def valve(call: ServiceCall) -> SimValve:
        return sim.valves[call.data[ATTR_ZONE] - 1]

    # Als async-Funktionen anmelden: Lambdas würde Home Assistant in einem
    # Nebenthread ausführen, und Entitäten dürfen nur im Hauptthread schreiben.
    async def open_for(call: ServiceCall) -> None:
        valve(call).open(call.data[ATTR_DURATION])

    async def set_fault(call: ServiceCall) -> None:
        valve(call).set_fault(Fault(call.data[ATTR_FAULT]))

    async def set_battery(call: ServiceCall) -> None:
        valve(call).set_battery(call.data[ATTR_LEVEL])

    # „Zone X für N Sekunden“: Vorbild für den Treiber „Dienstaufruf“.
    # Bei Zonen mit Gerätetimer schließt das Ventil danach von selbst.
    hass.services.async_register(
        DOMAIN,
        "open_for",
        open_for,
        schema=vol.Schema(
            {
                vol.Required(ATTR_ZONE): ZONE_NUMBER,
                vol.Required(ATTR_DURATION): vol.All(vol.Coerce(int), vol.Range(min=1)),
            }
        ),
    )
    hass.services.async_register(
        DOMAIN,
        "set_fault",
        set_fault,
        schema=vol.Schema(
            {
                vol.Required(ATTR_ZONE): ZONE_NUMBER,
                vol.Required(ATTR_FAULT): vol.In([f.value for f in Fault]),
            }
        ),
    )
    hass.services.async_register(
        DOMAIN,
        "set_battery",
        set_battery,
        schema=vol.Schema(
            {
                vol.Required(ATTR_ZONE): ZONE_NUMBER,
                vol.Required(ATTR_LEVEL): vol.All(
                    vol.Coerce(int), vol.Range(min=0, max=100)
                ),
            }
        ),
    )

    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    return True


async def async_unload_entry(hass: HomeAssistant, entry: SimConfigEntry) -> bool:
    """Beendet den Simulator."""
    for service in ("open_for", "set_fault", "set_battery"):
        hass.services.async_remove(DOMAIN, service)
    return await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
