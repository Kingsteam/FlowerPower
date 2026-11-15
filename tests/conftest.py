"""Gemeinsame Fixtures."""

from __future__ import annotations

import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.irrigation_planner.const import (
    CONF_MAX_OPEN_VALVES,
    CONF_WEATHER_ENTITY,
    CONF_WINDOW_END,
    CONF_WINDOW_START,
    DOMAIN,
    NAME,
)


@pytest.fixture(autouse=True)
def auto_enable_custom_integrations(enable_custom_integrations: None) -> None:
    """Lädt Integrationen aus custom_components in jedem Test."""


@pytest.fixture
def mock_config_entry() -> MockConfigEntry:
    """Ein Config-Entry wie nach der Ersteinrichtung."""
    return MockConfigEntry(
        domain=DOMAIN,
        title=NAME,
        data={
            CONF_WEATHER_ENTITY: "weather.test",
            CONF_WINDOW_START: "04:00:00",
            CONF_WINDOW_END: "07:00:00",
            CONF_MAX_OPEN_VALVES: 1,
        },
    )
