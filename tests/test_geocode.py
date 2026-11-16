"""Tests: Adresssuche für das Luftbild (Nominatim wird simuliert)."""

from __future__ import annotations

from typing import Any

from homeassistant.core import HomeAssistant
import pytest
from pytest_homeassistant_custom_component.test_util.aiohttp import (
    AiohttpClientMocker,
)

from custom_components.irrigation_planner import geocode
from custom_components.irrigation_planner.const import DOMAIN

from .helpers import SimValves, make_model

HIT = {
    "display_name": "Hauptplatz, Musterstadt, Musterland",
    "name": "Hauptplatz",
    "lat": "48.1",
    "lon": "16.2",
}


@pytest.fixture(autouse=True)
def no_wait(monkeypatch: pytest.MonkeyPatch) -> None:
    """Die Pause zwischen zwei Anfragen in Tests abschalten."""
    monkeypatch.setattr(geocode, "MIN_INTERVAL_S", 0.0)


def test_parse_places() -> None:
    places = geocode.parse_places(
        [
            HIT,
            {**HIT, "lat": "48.2"},  # gleicher Name und Ort: nur einmal
            {"display_name": "kaputt", "lat": "x", "lon": "1"},
            {"lat": "1"},
            "x",
        ]
    )
    assert places == [
        {
            "name": "Hauptplatz",
            "detail": "Musterstadt, Musterland",
            "latitude": 48.1,
            "longitude": 16.2,
        }
    ]
    assert geocode.parse_places({"error": "x"}) == []


async def test_search_via_websocket(
    hass: HomeAssistant,
    setup: Any,
    sim: SimValves,
    hass_ws_client: Any,
    aioclient_mock: AiohttpClientMocker,
) -> None:
    aioclient_mock.get(geocode.NOMINATIM_URL, json=[HIT])
    await setup(make_model(1))
    client = await hass_ws_client(hass)
    await client.send_json_auto_id(
        {"type": f"{DOMAIN}/geocode", "query": "  Hauptplatz 1 "}
    )
    msg = await client.receive_json()
    assert msg["success"], msg
    assert msg["result"]["places"][0]["latitude"] == 48.1
    method, url, _data, headers = aioclient_mock.mock_calls[0]
    assert method == "GET"
    assert url.query["q"] == "Hauptplatz 1"
    assert url.query["format"] == "jsonv2"
    assert "irrigation_planner" in headers["User-Agent"]


@pytest.mark.parametrize(
    ("query", "status", "exc", "message"),
    [
        ("ab", 200, None, "3 Zeichen"),
        ("Hauptplatz", 429, None, "429"),
        ("Hauptplatz", 200, TimeoutError(), "nicht erreichbar"),
    ],
)
async def test_search_errors(
    hass: HomeAssistant,
    setup: Any,
    sim: SimValves,
    hass_ws_client: Any,
    aioclient_mock: AiohttpClientMocker,
    query: str,
    status: int,
    exc: Exception | None,
    message: str,
) -> None:
    aioclient_mock.get(geocode.NOMINATIM_URL, status=status, json=[], exc=exc)
    await setup(make_model(1))
    client = await hass_ws_client(hass)
    await client.send_json_auto_id({"type": f"{DOMAIN}/geocode", "query": query})
    msg = await client.receive_json()
    assert not msg["success"]
    assert message in msg["error"]["message"]


async def test_search_needs_admin(
    hass: HomeAssistant,
    setup: Any,
    sim: SimValves,
    hass_ws_client: Any,
    hass_read_only_access_token: str,
) -> None:
    await setup(make_model(1))
    client = await hass_ws_client(hass, access_token=hass_read_only_access_token)
    await client.send_json_auto_id({"type": f"{DOMAIN}/geocode", "query": "Hauptplatz"})
    msg = await client.receive_json()
    assert msg["error"]["code"] == "unauthorized"
