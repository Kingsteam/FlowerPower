"""Tests: Zeitplan-Seite (Programme lesen, ändern, anlegen, löschen) und Ereignisse."""

from __future__ import annotations

from typing import Any

from homeassistant.config_entries import ConfigEntryState
from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import (
    MockConfigEntry,
    async_capture_events,
)

from custom_components.irrigation_planner.const import (
    DOMAIN,
    EVENT_PROGRAM_STARTED,
    EVENT_RUN_FINISHED,
    EVENT_RUN_STARTED,
)

from .helpers import SimValves, make_model


def _model() -> dict[str, Any]:
    model = make_model(2, zone_extra={"duration_s": 60})
    model["programs"] = [
        {
            "id": "p1",
            "name": "Morgens",
            "zone_ids": ["z1", "z2"],
            "start_time": "05:00",
            "pause_between_s": 0,
        }
    ]
    return model


async def _call(client: Any, **msg: Any) -> dict[str, Any]:
    await client.send_json_auto_id(msg)
    return await client.receive_json()


async def test_get_programs(
    hass: HomeAssistant, setup: Any, sim: SimValves, hass_ws_client: Any
) -> None:
    await setup(_model())
    client = await hass_ws_client(hass)
    msg = await _call(client, type=f"{DOMAIN}/programs/get")
    assert msg["success"], msg
    program = msg["result"]["programs"][0]
    assert program["total_s"] == 120
    assert [s["zone_name"] for s in program["steps"]] == ["Zone 1", "Zone 2"]
    assert len(program["upcoming"]) >= 7  # jeden Tag um 5 Uhr
    assert program["entities"]["start"].startswith("button.")
    assert program["entities"]["enabled"].startswith("switch.")
    assert any(e["type"] == EVENT_RUN_FINISHED for e in msg["result"]["events"])


async def test_save_program(
    hass: HomeAssistant,
    setup: Any,
    sim: SimValves,
    hass_ws_client: Any,
    mock_config_entry: MockConfigEntry,
) -> None:
    await setup(_model())
    client = await hass_ws_client(hass)
    msg = await _call(
        client,
        type=f"{DOMAIN}/programs/save",
        program_id="p1",
        start_time=None,
        finish_by="sunrise",
        sun_offset_min=-60,
        weekdays=[4, 0, 2],
        zone_ids=["z2"],
    )
    assert msg["success"], msg
    program = mock_config_entry.runtime_data.store.model.programs[0]
    assert (program.finish_by, program.sun_offset_min, program.weekdays) == (
        "sunrise",
        -60,
        [0, 2, 4],
    )
    assert program.zone_ids == ["z2"]

    for bad, message in (
        ({"zone_ids": ["fehlt"]}, "unbekannte"),
        ({"start_time": "06:00", "finish_by": "07:00"}, "nicht beides"),
        ({"start_time": "25:99"}, "Startzeit"),
    ):
        msg = await _call(
            client, type=f"{DOMAIN}/programs/save", program_id="p1", **bad
        )
        assert not msg["success"], bad
        assert message in msg["error"]["message"]
    assert program.zone_ids == ["z2"]


async def test_create_and_delete_program(
    hass: HomeAssistant,
    setup: Any,
    sim: SimValves,
    hass_ws_client: Any,
    mock_config_entry: MockConfigEntry,
) -> None:
    await setup(_model())
    client = await hass_ws_client(hass)
    msg = await _call(client, type=f"{DOMAIN}/programs/create", name="Morgens")
    assert msg["success"], msg
    assert msg["result"]["id"] == "morgens"
    await hass.async_block_till_done()
    assert mock_config_entry.state is ConfigEntryState.LOADED
    programs = mock_config_entry.runtime_data.store.model.programs
    assert [p.id for p in programs] == ["p1", "morgens"]
    assert programs[1].enabled is False

    client = await hass_ws_client(hass)
    msg = await _call(client, type=f"{DOMAIN}/programs/delete", program_id="p1")
    assert msg["success"], msg
    await hass.async_block_till_done()
    programs = mock_config_entry.runtime_data.store.model.programs
    assert [p.id for p in programs] == ["morgens"]


async def test_no_create_while_watering(
    hass: HomeAssistant, setup: Any, sim: SimValves, hass_ws_client: Any
) -> None:
    scheduler = await setup(_model())
    scheduler.async_enqueue("z1", 60, source="test")
    await hass.async_block_till_done()
    client = await hass_ws_client(hass)
    msg = await _call(client, type=f"{DOMAIN}/programs/create", name="Neu")
    assert msg["error"]["code"] == "busy"
    await scheduler.async_stop_all()
    await hass.async_block_till_done()


async def test_events_for_automations(
    hass: HomeAssistant, setup: Any, sim: SimValves, advance: Any
) -> None:
    started = async_capture_events(hass, EVENT_RUN_STARTED)
    finished = async_capture_events(hass, EVENT_RUN_FINISHED)
    programs = async_capture_events(hass, EVENT_PROGRAM_STARTED)
    await setup(_model())
    await hass.services.async_call(
        DOMAIN, "run_program", {"program_id": "p1"}, blocking=True
    )
    await hass.async_block_till_done()
    assert programs[0].data["program_id"] == "p1"
    assert programs[0].data["total_s"] == 120
    assert started[0].data["zone_id"] == "z1"
    await advance(70)
    assert finished[0].data["zone_id"] == "z1"
    assert finished[0].data["state"] == "done"
    assert finished[0].data["seconds_open"] == 60
    assert finished[0].data["source"] == "program:p1"


async def test_programs_need_admin(
    hass: HomeAssistant,
    setup: Any,
    sim: SimValves,
    hass_ws_client: Any,
    hass_read_only_access_token: str,
) -> None:
    await setup(_model())
    client = await hass_ws_client(hass, access_token=hass_read_only_access_token)
    msg = await _call(
        client, type=f"{DOMAIN}/programs/save", program_id="p1", enabled=False
    )
    assert msg["error"]["code"] == "unauthorized"
    assert (await _call(client, type=f"{DOMAIN}/programs/get"))["success"]
