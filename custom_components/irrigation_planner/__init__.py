"""Bewässerungsplaner (irrigation_planner) für Home Assistant.

Die Integration lädt das gespeicherte Gartenmodell, baut für jedes Ventil
den passenden Treiber und startet die Warteschlange. Gesteuert wird über
Dienste (``run_zone``, ``run_program``, ``skip_next``, ``stop_all``)
und den Zeitplan der Programme.
"""

from __future__ import annotations

from dataclasses import dataclass

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ConfigEntryError
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.typing import ConfigType

from .const import CONF_WEATHER_ENTITY, CONF_WINDOW_END, DOMAIN, LOGGER
from .drivers.ha import HassValveDriver
from .drivers.registry import create_driver
from .profiles import Profile, async_load_builtin_profiles
from .programs import ProgramManager
from .scheduler import IrrigationScheduler
from .services import async_setup_services
from .store import IrrigationPlannerStore

CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)


@dataclass(slots=True)
class IrrigationPlannerData:
    """Laufzeitdaten eines Config-Entrys (``entry.runtime_data``)."""

    store: IrrigationPlannerStore
    profiles: dict[str, Profile]
    drivers: dict[str, HassValveDriver]
    scheduler: IrrigationScheduler
    programs: ProgramManager


type IrrigationPlannerConfigEntry = ConfigEntry[IrrigationPlannerData]


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Registriert die Dienste (einmal, unabhängig vom Config-Entry)."""
    async_setup_services(hass)
    return True


async def async_setup_entry(
    hass: HomeAssistant, entry: IrrigationPlannerConfigEntry
) -> bool:
    """Richtet den Bewässerungsplaner aus einem Config-Entry ein."""
    store = IrrigationPlannerStore(hass)
    try:
        await store.async_load()
    except ValueError as err:
        # Nicht still mit leerem Modell weitermachen: Das würde die
        # gespeicherten Daten beim nächsten Speichern überschreiben.
        raise ConfigEntryError(f"Gespeicherte Daten sind fehlerhaft: {err}") from err

    profiles = await async_load_builtin_profiles(hass)
    drivers: dict[str, HassValveDriver] = {}
    for valve in store.model.valves:
        try:
            drivers[valve.id] = create_driver(hass, valve, profiles)
        except ValueError as err:
            # Ein falsch eingerichtetes Ventil legt nicht alles lahm; es
            # lässt sich nur nicht starten.
            LOGGER.error("Ventil %s ist nicht steuerbar: %s", valve.name, err)

    scheduler = IrrigationScheduler(hass, store.model, drivers)
    programs = ProgramManager(
        hass,
        store,
        scheduler,
        weather_entity=entry.data.get(CONF_WEATHER_ENTITY),
        window_end=entry.data.get(CONF_WINDOW_END),
    )
    entry.runtime_data = IrrigationPlannerData(
        store=store,
        profiles=profiles,
        drivers=drivers,
        scheduler=scheduler,
        programs=programs,
    )
    await scheduler.async_start()
    programs.async_start()
    LOGGER.debug(
        "Bewässerungsplaner eingerichtet: %s Zonen, %s steuerbare Ventile",
        len(store.model.zones),
        len(drivers),
    )
    return True


async def async_unload_entry(
    hass: HomeAssistant, entry: IrrigationPlannerConfigEntry
) -> bool:
    """Entlädt den Config-Entry und schließt dabei offene Ventile."""
    entry.runtime_data.programs.async_stop()
    await entry.runtime_data.scheduler.async_shutdown()
    return True
