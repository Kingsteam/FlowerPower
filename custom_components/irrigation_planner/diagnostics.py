"""Diagnosedaten für den Bewässerungsplaner."""

from __future__ import annotations

from typing import Any

from homeassistant.components.diagnostics import async_redact_data
from homeassistant.core import HomeAssistant

from . import IrrigationPlannerConfigEntry

# Geokoordinaten des Gartens gehören nicht in einen Diagnose-Download.
# Die eigene Kartenadresse kann einen Zugangsschlüssel enthalten.
TO_REDACT = {"latitude", "longitude", "map_url"}


async def async_get_config_entry_diagnostics(
    hass: HomeAssistant, entry: IrrigationPlannerConfigEntry
) -> dict[str, Any]:
    """Gibt Diagnosedaten zurück."""
    return {
        "entry": async_redact_data(dict(entry.data), TO_REDACT),
        "store": async_redact_data(entry.runtime_data.store.data, TO_REDACT),
    }
