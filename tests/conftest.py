"""Gemeinsame Fixtures."""

from __future__ import annotations

from collections.abc import Callable
from datetime import timedelta
from typing import Any

from freezegun.api import FrozenDateTimeFactory
from homeassistant.core import HomeAssistant
from homeassistant.helpers import entity_registry as er
import pytest
from pytest_homeassistant_custom_component.common import (
    MockConfigEntry,
    async_fire_time_changed,
)

from custom_components.irrigation_planner.const import (
    CONF_MAX_OPEN_VALVES,
    CONF_WEATHER_ENTITY,
    CONF_WINDOW_END,
    CONF_WINDOW_START,
    DOMAIN,
    NAME,
    STORAGE_KEY,
    STORAGE_VERSION,
)
from custom_components.irrigation_planner.scheduler import IrrigationScheduler

from .helpers import SimValves


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


@pytest.fixture
def sim(hass: HomeAssistant, entity_registry: er.EntityRegistry) -> SimValves:
    return SimValves(hass, entity_registry)


@pytest.fixture
def setup(
    hass: HomeAssistant,
    hass_storage: dict[str, Any],
    mock_config_entry: MockConfigEntry,
    sim: SimValves,
) -> Callable[..., Any]:
    """Richtet die Integration mit einem Modell und simulierten Ventilen ein."""

    async def _setup(
        model: dict[str, Any], open_at_start: set[str] | None = None
    ) -> IrrigationScheduler:
        for valve in model["valves"]:
            sim.add(
                valve["id"], "on" if valve["id"] in (open_at_start or set()) else "off"
            )
        await sim.async_install()
        hass_storage[STORAGE_KEY] = {
            "version": STORAGE_VERSION,
            "minor_version": 1,
            "key": STORAGE_KEY,
            "data": model,
        }
        mock_config_entry.add_to_hass(hass)
        assert await hass.config_entries.async_setup(mock_config_entry.entry_id)
        await hass.async_block_till_done()
        return mock_config_entry.runtime_data.scheduler

    return _setup


@pytest.fixture
def advance(
    hass: HomeAssistant, freezer: FrozenDateTimeFactory
) -> Callable[[int], Any]:
    """Lässt die Zeit sekundenweise vergehen."""

    async def _advance(seconds: int) -> None:
        for _ in range(seconds):
            freezer.tick(timedelta(seconds=1))
            async_fire_time_changed(hass)
            await hass.async_block_till_done()

    return _advance
