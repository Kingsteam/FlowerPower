"""Tests für die Winterpause."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from freezegun.api import FrozenDateTimeFactory
from homeassistant.core import HomeAssistant
from homeassistant.helpers import device_registry as dr
from homeassistant.util import dt as dt_util
from pytest_homeassistant_custom_component.common import (
    MockConfigEntry,
    async_fire_time_changed,
)

from custom_components.irrigation_planner.const import CLOSE_ATTEMPTS

from .helpers import SimValves, make_model


async def _with_devices(
    hass: HomeAssistant, model: dict[str, Any], device_registry: dr.DeviceRegistry
) -> dict[str, str]:
    """Legt für jedes Ventil ein Gerät an und trägt es ins Modell ein."""
    other = MockConfigEntry(domain="test")
    other.add_to_hass(hass)
    ids = {}
    for valve in model["valves"]:
        device = device_registry.async_get_or_create(
            config_entry_id=other.entry_id, identifiers={("test", valve["id"])}
        )
        valve["device_id"] = device.id
        ids[valve["id"]] = device.id
    return ids


async def test_winter_on_and_off(
    hass: HomeAssistant,
    setup: Any,
    sim: SimValves,
    device_registry: dr.DeviceRegistry,
    mock_config_entry: MockConfigEntry,
    hass_storage: dict,
) -> None:
    model = make_model(3)
    ids = await _with_devices(hass, model, device_registry)
    # Ein Gerät war schon vorher deaktiviert: Es bleibt es auch nach dem Winter.
    device_registry.async_update_device(
        ids["v3"], disabled_by=dr.DeviceEntryDisabler.USER
    )
    scheduler = await setup(model)
    scheduler.async_enqueue("z1", 600)
    await hass.async_block_till_done()
    assert sim.is_open("v1")

    data = mock_config_entry.runtime_data
    await data.async_set_winter_mode(True)
    await hass.async_block_till_done()
    assert sim.open_ids() == set()
    assert (
        device_registry.async_get(ids["v1"]).disabled_by is dr.DeviceEntryDisabler.USER
    )
    assert (
        device_registry.async_get(ids["v2"]).disabled_by is dr.DeviceEntryDisabler.USER
    )
    assert data.store.model.settings.winter_disabled_devices == sorted(
        [ids["v1"], ids["v2"]]
    )

    await data.async_set_winter_mode(False)
    await hass.async_block_till_done()
    assert device_registry.async_get(ids["v1"]).disabled_by is None
    assert device_registry.async_get(ids["v2"]).disabled_by is None
    assert (
        device_registry.async_get(ids["v3"]).disabled_by is dr.DeviceEntryDisabler.USER
    )
    assert data.store.model.settings.winter_disabled_devices == []
    assert data.store.model.settings.winter_mode is False


async def test_winter_keeps_devices_if_valve_does_not_close(
    hass: HomeAssistant,
    setup: Any,
    sim: SimValves,
    device_registry: dr.DeviceRegistry,
    mock_config_entry: MockConfigEntry,
    freezer: FrozenDateTimeFactory,
) -> None:
    """Klemmt ein Ventil, werden die Geräte NICHT deaktiviert."""
    model = make_model(1)
    ids = await _with_devices(hass, model, device_registry)
    scheduler = await setup(model)
    sim.stuck.add("v1")
    scheduler.async_enqueue("z1", 600)
    await hass.async_block_till_done()

    data = mock_config_entry.runtime_data
    task = hass.async_create_background_task(
        data.async_set_winter_mode(True), "Winterpause im Test"
    )
    for _ in range(CLOSE_ATTEMPTS * 15 + 130):
        freezer.tick(1)
        async_fire_time_changed(hass)
        await hass.async_block_till_done(wait_background_tasks=False)
        if task.done():
            break
    assert task.done()
    assert device_registry.async_get(ids["v1"]).disabled_by is None
    assert data.store.model.settings.winter_mode is True
    assert data.store.model.settings.winter_disabled_devices == []


async def test_winter_by_date(
    hass: HomeAssistant,
    setup: Any,
    sim: SimValves,
    mock_config_entry: MockConfigEntry,
    freezer: FrozenDateTimeFactory,
) -> None:
    tz = dt_util.get_default_time_zone()
    freezer.move_to(datetime(2026, 10, 31, 23, 0, tzinfo=tz))
    model = make_model(1)
    model["settings"] = {"winter_start": "11-01", "winter_end": "04-01"}
    await setup(model)
    settings = mock_config_entry.runtime_data.store.model.settings

    when = datetime(2026, 11, 1, 0, 5, tzinfo=tz)
    freezer.move_to(when)
    async_fire_time_changed(hass, when)
    await hass.async_block_till_done()
    assert settings.winter_mode is True

    # Von Hand beenden: am nächsten Tag nicht wieder einschalten.
    await mock_config_entry.runtime_data.async_set_winter_mode(False)
    when = datetime(2026, 11, 2, 0, 5, tzinfo=tz)
    freezer.move_to(when)
    async_fire_time_changed(hass, when)
    await hass.async_block_till_done()
    assert settings.winter_mode is False

    await mock_config_entry.runtime_data.async_set_winter_mode(True)
    when = datetime(2027, 4, 1, 0, 5, tzinfo=tz)
    freezer.move_to(when)
    async_fire_time_changed(hass, when)
    await hass.async_block_till_done()
    assert settings.winter_mode is False
