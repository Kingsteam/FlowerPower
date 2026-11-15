"""Tests für die Ersteinrichtung."""

from __future__ import annotations

from unittest.mock import patch

from homeassistant.config_entries import SOURCE_USER
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResultType
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.irrigation_planner.const import (
    CONF_MAX_OPEN_VALVES,
    CONF_WEATHER_ENTITY,
    CONF_WINDOW_END,
    CONF_WINDOW_START,
    DOMAIN,
    NAME,
)

SETUP_ENTRY = "custom_components.irrigation_planner.async_setup_entry"


async def test_create_entry(hass: HomeAssistant) -> None:
    """Das Formular legt einen Eintrag an; max. offene Ventile ist fest 1."""
    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": SOURCE_USER}
    )
    assert result["type"] is FlowResultType.FORM
    assert result["step_id"] == "user"
    assert result["errors"] == {}

    with patch(SETUP_ENTRY, return_value=True) as mock_setup:
        result = await hass.config_entries.flow.async_configure(
            result["flow_id"],
            {
                CONF_WEATHER_ENTITY: "weather.test",
                CONF_WINDOW_START: "04:00:00",
                CONF_WINDOW_END: "07:00:00",
            },
        )
        await hass.async_block_till_done()

    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert result["title"] == NAME
    assert result["data"] == {
        CONF_WEATHER_ENTITY: "weather.test",
        CONF_WINDOW_START: "04:00:00",
        CONF_WINDOW_END: "07:00:00",
        CONF_MAX_OPEN_VALVES: 1,
    }
    assert len(mock_setup.mock_calls) == 1


async def test_create_entry_without_weather(hass: HomeAssistant) -> None:
    """Die Wetterquelle ist optional."""
    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": SOURCE_USER}
    )
    with patch(SETUP_ENTRY, return_value=True):
        result = await hass.config_entries.flow.async_configure(
            result["flow_id"],
            {CONF_WINDOW_START: "22:00:00", CONF_WINDOW_END: "02:00:00"},
        )
        await hass.async_block_till_done()

    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert CONF_WEATHER_ENTITY not in result["data"]


async def test_empty_window(hass: HomeAssistant) -> None:
    """Gleicher Beginn und gleiches Ende ergibt einen Fehler."""
    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": SOURCE_USER}
    )
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"],
        {CONF_WINDOW_START: "05:00:00", CONF_WINDOW_END: "05:00:00"},
    )
    assert result["type"] is FlowResultType.FORM
    assert result["errors"] == {"base": "window_empty"}


async def test_single_instance(
    hass: HomeAssistant, mock_config_entry: MockConfigEntry
) -> None:
    """Ein zweiter Eintrag wird abgelehnt."""
    mock_config_entry.add_to_hass(hass)

    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": SOURCE_USER}
    )
    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "single_instance_allowed"
