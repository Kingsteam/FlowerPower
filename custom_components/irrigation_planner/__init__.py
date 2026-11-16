"""Bewässerungsplaner (irrigation_planner) für Home Assistant.

Die Integration lädt das gespeicherte Gartenmodell, baut für jedes Ventil
den passenden Treiber und startet die Warteschlange. Gesteuert wird über
Dienste (``run_zone``, ``run_program``, ``skip_next``, ``stop_all``)
und den Zeitplan der Programme.
"""

from __future__ import annotations

from dataclasses import dataclass

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant, callback
from homeassistant.exceptions import ConfigEntryError
from homeassistant.helpers import config_validation as cv, device_registry as dr
from homeassistant.helpers.typing import ConfigType

from .balance import BalanceManager
from .const import CONF_WEATHER_ENTITY, CONF_WINDOW_END, DOMAIN, LOGGER, NAME
from .drivers.ha import HassValveDriver
from .drivers.registry import create_driver
from .history import HistoryManager
from .panel import async_register_panel, async_remove_panel
from .profiles import Profile, async_load_builtin_profiles
from .programs import ProgramManager
from .scheduler import IrrigationScheduler
from .season import Season
from .services import async_setup_services
from .store import IrrigationPlannerStore
from .watchdog import Watchdog
from .websocket_api import async_register as async_register_websocket

CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)

PLATFORMS = [
    Platform.BINARY_SENSOR,
    Platform.BUTTON,
    Platform.NUMBER,
    Platform.SELECT,
    Platform.SENSOR,
    Platform.SWITCH,
]


@dataclass(slots=True)
class IrrigationPlannerData:
    """Laufzeitdaten eines Config-Entrys (``entry.runtime_data``)."""

    store: IrrigationPlannerStore
    profiles: dict[str, Profile]
    drivers: dict[str, HassValveDriver]
    scheduler: IrrigationScheduler
    programs: ProgramManager
    watchdog: Watchdog
    balance: BalanceManager
    history: HistoryManager
    season: Season | None = None
    # Geräte-ID des Hauptgeräts (Zonen und Programme hängen daran).
    main_device_id: str = ""

    @property
    def problems(self) -> list[str]:
        """Alle aktuellen Probleme im Klartext."""
        problems = list(self.scheduler.errors) + self.watchdog.messages
        names = {z.id: z.name for z in self.store.model.zones}
        problems += [
            f"Zone {names.get(zone_id, zone_id)} gesperrt: {reason}"
            for zone_id, reason in self.scheduler.locked_zones.items()
            if reason not in problems
        ]
        return problems

    @callback
    def async_model_changed(self) -> None:
        """Nach einer Änderung am Modell: speichern und alle informieren."""
        self.store.async_schedule_save()
        self.scheduler.async_notify()
        self.programs.async_notify()

    async def async_set_winter_mode(self, on: bool) -> None:
        """Winterpause ein- oder ausschalten (siehe ``season.py``)."""
        assert self.season is not None
        await self.season.async_set(on)


type IrrigationPlannerConfigEntry = ConfigEntry[IrrigationPlannerData]


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Registriert die Dienste (einmal, unabhängig vom Config-Entry)."""
    async_setup_services(hass)
    async_register_websocket(hass)
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
    watchdog = Watchdog(hass, store, scheduler, drivers)
    balance = BalanceManager(
        hass, store, scheduler, weather_entity=entry.data.get(CONF_WEATHER_ENTITY)
    )
    await balance.async_load()
    programs.balance = balance
    history = HistoryManager(hass, store, scheduler, watchdog)
    await history.async_load()
    entry.runtime_data = IrrigationPlannerData(
        store=store,
        profiles=profiles,
        drivers=drivers,
        scheduler=scheduler,
        programs=programs,
        watchdog=watchdog,
        balance=balance,
        history=history,
    )
    main_device = dr.async_get(hass).async_get_or_create(
        config_entry_id=entry.entry_id,
        identifiers={(DOMAIN, entry.entry_id)},
        name=NAME,
        manufacturer=NAME,
        entry_type=dr.DeviceEntryType.SERVICE,
    )
    entry.runtime_data.main_device_id = main_device.id
    entry.runtime_data.season = Season(hass, entry.runtime_data)
    entry.runtime_data.season.async_start()
    await scheduler.async_start()
    programs.async_start()
    watchdog.async_start()
    balance.async_start()
    history.async_start()
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    await async_register_panel(hass)
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
    unloaded = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    async_remove_panel(hass)
    entry.runtime_data.programs.async_stop()
    entry.runtime_data.watchdog.async_stop()
    if entry.runtime_data.season is not None:
        entry.runtime_data.season.async_stop()
    await entry.runtime_data.scheduler.async_shutdown()
    await entry.runtime_data.balance.async_stop()
    await entry.runtime_data.history.async_stop()
    return unloaded
