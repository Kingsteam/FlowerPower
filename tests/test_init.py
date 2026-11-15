"""Tests für Einrichten und Entladen."""

from __future__ import annotations

from typing import Any

from homeassistant.config_entries import ConfigEntryState
from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.irrigation_planner import IrrigationPlannerData
from custom_components.irrigation_planner.const import (
    STORAGE_KEY,
    STORAGE_VERSION,
)
from custom_components.irrigation_planner.diagnostics import (
    async_get_config_entry_diagnostics,
)


async def test_setup_and_unload(
    hass: HomeAssistant, mock_config_entry: MockConfigEntry
) -> None:
    """Der Eintrag lässt sich einrichten und wieder entladen."""
    mock_config_entry.add_to_hass(hass)

    assert await hass.config_entries.async_setup(mock_config_entry.entry_id)
    await hass.async_block_till_done()

    assert mock_config_entry.state is ConfigEntryState.LOADED
    assert isinstance(mock_config_entry.runtime_data, IrrigationPlannerData)
    assert mock_config_entry.runtime_data.store.data["valves"] == []

    assert await hass.config_entries.async_unload(mock_config_entry.entry_id)
    await hass.async_block_till_done()

    assert mock_config_entry.state is ConfigEntryState.NOT_LOADED


async def test_setup_loads_stored_data(
    hass: HomeAssistant,
    mock_config_entry: MockConfigEntry,
    hass_storage: dict[str, Any],
) -> None:
    """Gespeicherte Daten werden geladen, fehlende Schlüssel ergänzt."""
    hass_storage[STORAGE_KEY] = {
        "version": STORAGE_VERSION,
        "minor_version": 1,
        "key": STORAGE_KEY,
        "data": {"garden": {"north_deg": 12.0, "latitude": 1.0}},
    }
    mock_config_entry.add_to_hass(hass)

    assert await hass.config_entries.async_setup(mock_config_entry.entry_id)
    await hass.async_block_till_done()

    data = mock_config_entry.runtime_data.store.data
    assert data["garden"]["north_deg"] == 12.0
    assert data["zones"] == []

    diagnostics = await async_get_config_entry_diagnostics(hass, mock_config_entry)
    assert diagnostics["store"]["garden"]["latitude"] == "**REDACTED**"
    assert diagnostics["entry"]["max_open_valves"] == 1
