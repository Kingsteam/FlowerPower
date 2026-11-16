"""Tests: Sicherung exportieren und wieder einspielen."""

from __future__ import annotations

import copy
from typing import Any

from homeassistant.config_entries import ConfigEntryState
from homeassistant.core import HomeAssistant
import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.irrigation_planner.const import DOMAIN

from .helpers import SimValves, make_model


def _drawn_model() -> dict[str, Any]:
    model = make_model(2)
    model["zones"][0]["polygon"] = [[0, 0], [4, 0], [4, 3]]
    model["valves"][0]["position"] = [1, 1]
    model["garden"] = {
        "features": [
            {"id": "haus", "kind": "building", "points": [[0, 0], [8, 0], [8, 6]]}
        ]
    }
    return model


async def _call(client: Any, **msg: Any) -> dict[str, Any]:
    await client.send_json_auto_id(msg)
    return await client.receive_json()


async def test_export_and_import_drawing(
    hass: HomeAssistant,
    setup: Any,
    sim: SimValves,
    hass_ws_client: Any,
    mock_config_entry: MockConfigEntry,
) -> None:
    await setup(_drawn_model())
    client = await hass_ws_client(hass)
    exported = await _call(client, type=f"{DOMAIN}/export")
    assert exported["success"]
    backup = exported["result"]
    assert backup["format"] == "irrigation_planner"
    assert backup["model"]["garden"]["features"][0]["id"] == "haus"

    # Zeichnung löschen, dann nur die Zeichnung zurückholen
    model = mock_config_entry.runtime_data.store.model
    model.zones[0].polygon = []
    model.valves[0].position = None
    model.garden.features = []
    model.zones[1].name = "Neuer Name"  # bleibt erhalten
    extra = copy.deepcopy(backup)
    extra["model"]["zones"].append({"id": "weg", "name": "Alte Zone", "type": "drip"})
    msg = await _call(client, type=f"{DOMAIN}/import", mode="drawing", data=extra)
    assert msg["success"], msg
    assert msg["result"]["reloaded"] is False
    assert "Alte Zone" in msg["result"]["notes"][0]
    assert model.zones[0].polygon == [(0, 0), (4, 0), (4, 3)]
    assert model.valves[0].position == (1, 1)
    assert [f.id for f in model.garden.features] == ["haus"]
    assert model.zones[1].name == "Neuer Name"


async def test_import_all_replaces_and_reloads(
    hass: HomeAssistant,
    setup: Any,
    sim: SimValves,
    hass_ws_client: Any,
    mock_config_entry: MockConfigEntry,
) -> None:
    await setup(_drawn_model())
    client = await hass_ws_client(hass)
    backup = (await _call(client, type=f"{DOMAIN}/export"))["result"]
    backup["model"]["zones"][1]["name"] = "Aus der Sicherung"
    msg = await _call(client, type=f"{DOMAIN}/import", mode="all", data=backup)
    assert msg["success"], msg
    assert msg["result"]["reloaded"] is True
    await hass.async_block_till_done()
    assert mock_config_entry.state is ConfigEntryState.LOADED
    model = mock_config_entry.runtime_data.store.model
    assert model.zones[1].name == "Aus der Sicherung"


@pytest.mark.parametrize(
    ("data", "message"),
    [
        ({"format": "anderes"}, "keine Sicherung"),
        (
            {"format": "irrigation_planner", "format_version": 99, "model": {}},
            "neueren",
        ),
        ({"format": "irrigation_planner", "format_version": 1}, "keinen Gartenplan"),
        (
            {
                "format": "irrigation_planner",
                "format_version": 1,
                "model": {
                    "zones": [{"id": "z", "name": "Z", "type": "drip", "valve_id": "x"}]
                },
            },
            "Ventil",
        ),
    ],
)
async def test_import_rejects_bad_files(
    hass: HomeAssistant,
    setup: Any,
    sim: SimValves,
    hass_ws_client: Any,
    mock_config_entry: MockConfigEntry,
    data: dict[str, Any],
    message: str,
) -> None:
    await setup(_drawn_model())
    client = await hass_ws_client(hass)
    msg = await _call(client, type=f"{DOMAIN}/import", mode="all", data=data)
    assert not msg["success"]
    assert message in msg["error"]["message"]
    assert len(mock_config_entry.runtime_data.store.model.zones) == 2


async def test_backup_needs_admin(
    hass: HomeAssistant,
    setup: Any,
    sim: SimValves,
    hass_ws_client: Any,
    hass_read_only_access_token: str,
) -> None:
    await setup(_drawn_model())
    client = await hass_ws_client(hass, access_token=hass_read_only_access_token)
    for msg in (
        {"type": f"{DOMAIN}/export"},
        {"type": f"{DOMAIN}/import", "mode": "all", "data": {}},
    ):
        result = await _call(client, **msg)
        assert result["error"]["code"] == "unauthorized"
