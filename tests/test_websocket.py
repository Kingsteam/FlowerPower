"""Tests: WebSocket-Schnittstelle und Bilder für den Plan-Editor."""

from __future__ import annotations

from typing import Any

from aiohttp import FormData
from homeassistant.core import HomeAssistant
import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.irrigation_planner.const import DOMAIN
from custom_components.irrigation_planner.panel import PANEL_URL

from .helpers import SimValves, make_model

PNG = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
    b"\x08\x06\x00\x00\x00\x1f\x15\xc4\x89"
)


async def _ws(hass_ws_client: Any, hass: HomeAssistant, **kwargs: Any) -> Any:
    return await hass_ws_client(hass, **kwargs)


async def test_get_plan(
    hass: HomeAssistant, setup: Any, sim: SimValves, hass_ws_client: Any
) -> None:
    model = make_model(2)
    model["zones"][0].update(
        {"type": "sprinkler", "center": [0, 0], "radius_m": 2.0, "arc_deg": 90}
    )
    await setup(model)
    client = await _ws(hass_ws_client, hass)
    await client.send_json_auto_id({"type": f"{DOMAIN}/plan/get"})
    msg = await client.receive_json()
    assert msg["success"]
    result = msg["result"]
    assert "basemap_at" in result["providers"]
    zone = result["zones"][0]
    assert zone["drawn_area_m2"] == pytest.approx(3.1416, abs=0.001)
    assert result["zones"][1]["drawn_area_m2"] is None
    assert [v["id"] for v in result["valves"]] == ["v1", "v2"]


async def test_save_geometry(
    hass: HomeAssistant,
    setup: Any,
    sim: SimValves,
    hass_ws_client: Any,
    mock_config_entry: MockConfigEntry,
) -> None:
    await setup(make_model(2))
    client = await _ws(hass_ws_client, hass)
    await client.send_json_auto_id(
        {
            "type": f"{DOMAIN}/plan/save",
            "garden": {
                "background": "map",
                "latitude": 10.0,
                "longitude": 20.0,
                "map_zoom": 19,
                "map_provider": "basemap_at",
            },
            "zones": [
                {"id": "z1", "polygon": [[0, 0], [4, 0], [4, 3]]},
            ],
            "valves": [{"id": "v1", "position": [1.5, 2.5]}],
        }
    )
    msg = await client.receive_json()
    assert msg["success"], msg
    model = mock_config_entry.runtime_data.store.model
    assert model.zones[0].polygon == [(0, 0), (4, 0), (4, 3)]
    assert model.valves[0].position == (1.5, 2.5)
    assert model.garden.map_zoom == 19
    assert msg["result"]["zones"][0]["effective_area_m2"] == pytest.approx(6)


async def test_change_zone_type_to_hose(
    hass: HomeAssistant,
    setup: Any,
    sim: SimValves,
    hass_ws_client: Any,
    mock_config_entry: MockConfigEntry,
) -> None:
    """Im Plan-Editor wird aus einem Beet ein Gießschlauch (Linie + Radius)."""
    await setup(make_model(2))
    client = await _ws(hass_ws_client, hass)
    await client.send_json_auto_id(
        {
            "type": f"{DOMAIN}/plan/save",
            "zones": [
                {
                    "id": "z1",
                    "type": "hose",
                    "polygon": [[0, 0], [10, 0]],
                    "radius_m": 0.5,
                }
            ],
        }
    )
    msg = await client.receive_json()
    assert msg["success"], msg
    zone = mock_config_entry.runtime_data.store.model.zones[0]
    assert zone.type.value == "hose"
    assert msg["result"]["zones"][0]["type"] == "hose"
    # Linie 10 m, 0,5 m je Seite: 10 + runde Enden
    assert msg["result"]["zones"][0]["drawn_area_m2"] == pytest.approx(10.785, abs=0.01)

    # Schlauch ohne Radius wird abgelehnt, nichts ändert sich
    await client.send_json_auto_id(
        {
            "type": f"{DOMAIN}/plan/save",
            "zones": [{"id": "z2", "type": "hose", "polygon": [[0, 0], [1, 0]]}],
        }
    )
    msg = await client.receive_json()
    assert not msg["success"]
    assert mock_config_entry.runtime_data.store.model.zones[1].type.value == "drip"


async def test_lock_feature(
    hass: HomeAssistant,
    setup: Any,
    sim: SimValves,
    hass_ws_client: Any,
    mock_config_entry: MockConfigEntry,
) -> None:
    """Grundriss-Formen lassen sich sperren; das bleibt gespeichert."""
    await setup(make_model(1))
    client = await _ws(hass_ws_client, hass)
    feature = {"id": "f1", "kind": "building", "points": [[0, 0], [5, 0], [5, 5]]}
    await client.send_json_auto_id(
        {
            "type": f"{DOMAIN}/plan/save",
            "garden": {
                "features": [{**feature, "locked": True}, {**feature, "id": "f2"}]
            },
        }
    )
    msg = await client.receive_json()
    assert msg["success"], msg
    assert [f["locked"] for f in msg["result"]["garden"]["features"]] == [True, False]
    await hass.config_entries.async_reload(mock_config_entry.entry_id)
    await hass.async_block_till_done()
    features = mock_config_entry.runtime_data.store.model.garden.features
    assert [f.locked for f in features] == [True, False]


async def test_save_flow_by_hand(
    hass: HomeAssistant,
    setup: Any,
    sim: SimValves,
    hass_ws_client: Any,
    mock_config_entry: MockConfigEntry,
) -> None:
    """Ohne Durchflusssensor lässt sich der Durchfluss von Hand eintragen."""
    await setup(make_model(2))
    client = await _ws(hass_ws_client, hass)
    await client.send_json_auto_id(
        {
            "type": f"{DOMAIN}/plan/save",
            "valves": [
                {"id": "v1", "position": None, "learned_flow_l_min": 8.5},
                {"id": "v2", "position": None},
            ],
        }
    )
    msg = await client.receive_json()
    assert msg["success"], msg
    valves = mock_config_entry.runtime_data.store.model.valves
    assert [v.learned_flow_l_min for v in valves] == [8.5, None]

    await client.send_json_auto_id(
        {
            "type": f"{DOMAIN}/plan/save",
            "valves": [{"id": "v1", "position": None, "learned_flow_l_min": 0}],
        }
    )
    assert not (await client.receive_json())["success"]
    assert valves[0].learned_flow_l_min == 8.5


async def test_save_valve_route(
    hass: HomeAssistant,
    setup: Any,
    sim: SimValves,
    hass_ws_client: Any,
    mock_config_entry: MockConfigEntry,
) -> None:
    """Die Leitung vom Ventil zur Zone hat Zwischenpunkte und bleibt gespeichert."""
    await setup(make_model(2))
    client = await _ws(hass_ws_client, hass)
    route = [[1, 0], [1, 5]]
    await client.send_json_auto_id(
        {
            "type": f"{DOMAIN}/plan/save",
            "zones": [{"id": "z1", "valve_route": route}],
        }
    )
    msg = await client.receive_json()
    assert msg["success"], msg
    assert msg["result"]["zones"][0]["valve_route"] == route
    await hass.config_entries.async_reload(mock_config_entry.entry_id)
    await hass.async_block_till_done()
    zone = mock_config_entry.runtime_data.store.model.zones[0]
    assert zone.valve_route == [(1, 0), (1, 5)]

    await client.send_json_auto_id(
        {
            "type": f"{DOMAIN}/plan/save",
            "zones": [{"id": "z1", "valve_route": [[0, 0]] * 51}],
        }
    )
    assert not (await client.receive_json())["success"]


async def test_assign_valve(
    hass: HomeAssistant,
    setup: Any,
    sim: SimValves,
    hass_ws_client: Any,
    mock_config_entry: MockConfigEntry,
) -> None:
    await setup(make_model(2))
    client = await _ws(hass_ws_client, hass)
    # Zone 1 bekommt Ventil 2, Zone 2 gar keins
    await client.send_json_auto_id(
        {
            "type": f"{DOMAIN}/plan/save",
            "zones": [{"id": "z1", "valve_id": "v2"}, {"id": "z2", "valve_id": None}],
        }
    )
    msg = await client.receive_json()
    assert msg["success"], msg
    model = mock_config_entry.runtime_data.store.model
    assert [z.valve_id for z in model.zones] == ["v2", None]
    assert {v.id: v.zone_ids for v in model.valves} == {"v1": [], "v2": ["z1"]}

    await client.send_json_auto_id(
        {"type": f"{DOMAIN}/plan/save", "zones": [{"id": "z1", "valve_id": "fehlt"}]}
    )
    msg = await client.receive_json()
    assert not msg["success"]
    assert model.zones[0].valve_id == "v2"


async def test_save_features(
    hass: HomeAssistant,
    setup: Any,
    sim: SimValves,
    hass_ws_client: Any,
    mock_config_entry: MockConfigEntry,
) -> None:
    await setup(make_model(1))
    client = await _ws(hass_ws_client, hass)
    features = [
        {"id": "f1", "kind": "building", "points": [[0, 0], [8, 0], [8, 6], [0, 6]]},
        {"id": "f2", "kind": "tree", "points": [[3, 3]], "radius_m": 2},
    ]
    await client.send_json_auto_id(
        {
            "type": f"{DOMAIN}/plan/save",
            "garden": {"features": features, "background_opacity": 0.3},
        }
    )
    msg = await client.receive_json()
    assert msg["success"], msg
    garden = mock_config_entry.runtime_data.store.model.garden
    assert [f.kind for f in garden.features] == ["building", "tree"]
    assert garden.background_opacity == 0.3
    assert msg["result"]["garden"]["features"][1]["radius_m"] == 2

    # Ungültige Form: nichts wird übernommen
    await client.send_json_auto_id(
        {
            "type": f"{DOMAIN}/plan/save",
            "garden": {"features": [{"id": "x", "kind": "fence", "points": [[0, 0]]}]},
        }
    )
    msg = await client.receive_json()
    assert not msg["success"]
    assert len(garden.features) == 2


@pytest.mark.parametrize(
    ("payload", "message"),
    [
        ({"zones": [{"id": "z1", "polygon": [[0, 0], [1, 1]]}]}, "3 Punkte"),
        ({"zones": [{"id": "fehlt", "polygon": []}]}, "gibt es nicht"),
        ({"valves": [{"id": "fehlt", "position": None}]}, "gibt es nicht"),
        ({"garden": {"background": "map"}}, "Kartenmitte"),
        (
            {
                "garden": {
                    "background": "map",
                    "latitude": 1,
                    "longitude": 1,
                    "map_zoom": 18,
                    "map_provider": "irgendwas",
                }
            },
            "Kartendienst",
        ),
    ],
)
async def test_save_rejects_invalid(
    hass: HomeAssistant,
    setup: Any,
    sim: SimValves,
    hass_ws_client: Any,
    mock_config_entry: MockConfigEntry,
    payload: dict[str, Any],
    message: str,
) -> None:
    await setup(make_model(1))
    client = await _ws(hass_ws_client, hass)
    await client.send_json_auto_id({"type": f"{DOMAIN}/plan/save", **payload})
    msg = await client.receive_json()
    assert not msg["success"]
    assert message in msg["error"]["message"]
    model = mock_config_entry.runtime_data.store.model
    assert model.zones[0].polygon == []  # nichts übernommen


async def test_save_needs_admin(
    hass: HomeAssistant,
    setup: Any,
    sim: SimValves,
    hass_ws_client: Any,
    hass_read_only_access_token: str,
) -> None:
    await setup(make_model(1))
    client = await _ws(hass_ws_client, hass, access_token=hass_read_only_access_token)
    await client.send_json_auto_id({"type": f"{DOMAIN}/plan/save"})
    msg = await client.receive_json()
    assert not msg["success"]
    assert msg["error"]["code"] == "unauthorized"


async def test_subscribe_status(
    hass: HomeAssistant, setup: Any, sim: SimValves, hass_ws_client: Any
) -> None:
    scheduler = await setup(make_model(2, zone_extra={"duration_s": 60}))
    client = await _ws(hass_ws_client, hass)
    await client.send_json_auto_id({"type": f"{DOMAIN}/plan/subscribe"})
    assert (await client.receive_json())["success"]
    first = await client.receive_json()
    assert first["event"]["zones"]["z1"]["state"] == "idle"
    scheduler.async_enqueue("z1", 60, source="test")
    await hass.async_block_till_done()
    states = set()
    for _ in range(5):
        event = (await client.receive_json())["event"]
        states.add(event["zones"]["z1"]["state"])
        if "running" in states:
            break
    assert "running" in states
    await scheduler.async_stop_all()
    await hass.async_block_till_done()


async def test_panel_registered(
    hass: HomeAssistant, setup: Any, sim: SimValves, mock_config_entry: MockConfigEntry
) -> None:
    await setup(make_model(1))
    assert PANEL_URL in hass.data["frontend_panels"]
    # Die Dashboard-Karte wird auf allen Seiten geladen.
    urls = hass.data["frontend_extra_module_url"].urls
    assert any(
        u.startswith(f"/{DOMAIN}_static/irrigation-planner-card.js?v=") for u in urls
    )
    await hass.config_entries.async_unload(mock_config_entry.entry_id)
    assert PANEL_URL not in hass.data["frontend_panels"]


async def test_image_upload_and_download(
    hass: HomeAssistant, setup: Any, sim: SimValves, hass_client: Any, tmp_path: Any
) -> None:
    hass.config.config_dir = str(tmp_path)
    await setup(make_model(1))
    client = await hass_client()
    form = FormData()
    form.add_field("file", PNG, filename="plan.png", content_type="image/png")
    resp = await client.post(f"/api/{DOMAIN}/image", data=form)
    assert resp.status == 200
    name = (await resp.json())["name"]
    assert name.startswith("plan-")
    assert name.endswith(".png")
    resp = await client.get(f"/api/{DOMAIN}/image/{name}")
    assert resp.status == 200
    assert await resp.read() == PNG
    assert (await client.get(f"/api/{DOMAIN}/image/secrets.yaml")).status == 404

    form = FormData()
    form.add_field("file", b"<svg/>", filename="x.svg", content_type="image/svg+xml")
    resp = await client.post(f"/api/{DOMAIN}/image", data=form)
    assert resp.status == 415


async def test_image_needs_login(
    hass: HomeAssistant, setup: Any, sim: SimValves, hass_client_no_auth: Any
) -> None:
    await setup(make_model(1))
    client = await hass_client_no_auth()
    assert (
        await client.get(f"/api/{DOMAIN}/image/plan-0000000000000000.png")
    ).status == 401


async def test_status_contains_sensor_values(
    hass: HomeAssistant,
    setup: Any,
    sim: SimValves,
    hass_ws_client: Any,
    entity_registry: Any,
) -> None:
    soil = entity_registry.async_get_or_create("sensor", "test", "boden_1")
    hass.states.async_set(soil.entity_id, "31.5", {"unit_of_measurement": "%"})
    model = make_model(1)
    model["sensors"] = [
        {
            "id": "s1",
            "name": "Boden",
            "kind": "soil_moisture",
            "entity": {"domain": "sensor", "platform": "test", "unique_id": "boden_1"},
            "zone_ids": ["z1"],
            "position": [1, 1],
        }
    ]
    await setup(model)
    client = await _ws(hass_ws_client, hass)
    await client.send_json_auto_id({"type": f"{DOMAIN}/plan/subscribe"})
    assert (await client.receive_json())["success"]
    event = (await client.receive_json())["event"]
    assert event["sensors"]["s1"]["value"] == 31.5
    assert event["sensors"]["s1"]["unit"] == "%"


async def test_plants_and_soil(
    hass: HomeAssistant,
    setup: Any,
    sim: SimValves,
    hass_ws_client: Any,
    mock_config_entry: MockConfigEntry,
) -> None:
    await setup(make_model(1))
    client = await _ws(hass_ws_client, hass)
    await client.send_json_auto_id({"type": f"{DOMAIN}/plan/get"})
    catalog = (await client.receive_json())["result"]["catalog"]
    assert catalog["plants"]["lawn"]["name"] == "Rasen"
    assert catalog["plants"]["herbs"]["need"] == "low"
    assert catalog["soils"]["loam"]["awc_mm_per_m"] == 160.0

    await client.send_json_auto_id(
        {
            "type": f"{DOMAIN}/plan/save",
            "zones": [
                {
                    "id": "z1",
                    "plant_type": "tomatoes",
                    "kc": 1.1,
                    "soil_type": "sandy_loam",
                    "root_depth_m": 0.5,
                }
            ],
        }
    )
    msg = await client.receive_json()
    assert msg["success"], msg
    zone = mock_config_entry.runtime_data.store.model.zones[0]
    assert (zone.plant_type, zone.kc, zone.soil_type, zone.root_depth_m) == (
        "tomatoes",
        1.1,
        "sandy_loam",
        0.5,
    )

    for bad, message in (
        ({"plant_type": "kaktus"}, "Pflanzenart"),
        ({"soil_type": "beton"}, "Bodenart"),
        ({"kc": 5}, "Pflanzenfaktor"),
    ):
        await client.send_json_auto_id(
            {"type": f"{DOMAIN}/plan/save", "zones": [{"id": "z1", **bad}]}
        )
        msg = await client.receive_json()
        assert not msg["success"]
        assert message in msg["error"]["message"]
    assert zone.plant_type == "tomatoes"
