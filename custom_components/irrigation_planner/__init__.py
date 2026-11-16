"""Bewässerungsplaner (irrigation_planner) für Home Assistant.

Stand 0.1.0: Grundgerüst. Die Integration lädt ihre Einstellungen und das
gespeicherte Gartenmodell, steuert aber noch KEIN Ventil.
"""

from __future__ import annotations

from dataclasses import dataclass

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ConfigEntryError

from .const import LOGGER
from .store import IrrigationPlannerStore


@dataclass(slots=True)
class IrrigationPlannerData:
    """Laufzeitdaten eines Config-Entrys (``entry.runtime_data``)."""

    store: IrrigationPlannerStore


type IrrigationPlannerConfigEntry = ConfigEntry[IrrigationPlannerData]


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
    entry.runtime_data = IrrigationPlannerData(store=store)

    # Noch keine Plattformen. Sobald es welche gibt:
    # await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    LOGGER.debug("Bewässerungsplaner eingerichtet (Grundgerüst, steuert nichts)")
    return True


async def async_unload_entry(
    hass: HomeAssistant, entry: IrrigationPlannerConfigEntry
) -> bool:
    """Entlädt den Config-Entry."""
    # Später: return await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    return True
