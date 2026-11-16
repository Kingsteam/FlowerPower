"""Tests: Seite „Geräte“ im Panel (Ventile und Sensoren anlegen, Testlauf)."""

from __future__ import annotations

from typing import Any

from homeassistant.components import frontend
from homeassistant.core import HomeAssistant
from homeassistant.helpers import device_registry as dr, entity_registry as er
import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.irrigation_planner.const import DOMAIN
from custom_components.irrigation_planner.drivers.base import SafetyLevel
from custom_components.irrigation_planner.model import SensorKind, ValveRole

from .helpers import SimValves, make_model


async def _call(client: Any, **msg: Any) -> dict[str, Any]:
    await client.send_json_auto_id(msg)
    return await client.receive_json()


def _model(entry: MockConfigEntry) -> Any:
    return entry.runtime_data.store.model


@pytest.fixture
def sonoff(
    hass: HomeAssistant,
    device_registry: dr.DeviceRegistry,
    entity_registry: er.EntityRegistry,
) -> dict[str, str]:
    """Ein Sonoff-Ventil über Zigbee2MQTT (nur Registereinträge)."""
    other = MockConfigEntry(domain="mqtt")
    other.add_to_hass(hass)
    device = device_registry.async_get_or_create(
        config_entry_id=other.entry_id,
        identifiers={("mqtt", "zigbee2mqtt_0xabc")},
        manufacturer="SONOFF",
        model="Zigbee smart water valve",
        model_id="SWV",
        name="Ventil Beet",
    )
    found = {"device_id": device.id}
    for role, domain, unique_id, device_class in (
        ("valve", "switch", "0xabc_switch", None),
        ("flow", "sensor", "0xabc_flow", "volume_flow_rate"),
        ("volume", "sensor", "0xabc_real_time_irrigation_volume", "volume"),
        ("status", "sensor", "0xabc_current_device_status", None),
        ("battery", "sensor", "0xabc_battery", "battery"),
    ):
        entry = entity_registry.async_get_or_create(
            domain,
            "mqtt",
            unique_id,
            device_id=device.id,
            original_device_class=device_class,
        )
        found[role] = entry.entity_id
    return found


async def test_add_sonoff_valve(
    hass: HomeAssistant,
    setup: Any,
    sim: SimValves,
    sonoff: dict[str, str],
    hass_ws_client: Any,
    mock_config_entry: MockConfigEntry,
) -> None:
    await setup(make_model(1))
    client = await hass_ws_client(hass)

    msg = await _call(client, type=f"{DOMAIN}/devices/get")
    assert msg["success"], msg
    result = msg["result"]
    assert [v["id"] for v in result["valves"]] == ["v1"]
    candidate = next(
        c for c in result["candidates"] if c["device_id"] == sonoff["device_id"]
    )
    assert candidate["profile"] == "SONOFF SWV (Zigbee2MQTT)"
    assert candidate["used_by"] is None
    assert "zigbee2mqtt" in result["drivers"]

    msg = await _call(
        client, type=f"{DOMAIN}/devices/suggest", device_id=sonoff["device_id"]
    )
    assert msg["success"], msg
    proposal = msg["result"]
    assert proposal["driver"] == "zigbee2mqtt"
    assert proposal["profile"] == "sonoff_swv"
    assert proposal["driver_options"]["friendly_name"] == "Ventil Beet"
    for role in ("valve", "flow", "volume", "status", "battery"):
        assert proposal["entities"][role] == sonoff[role]
    assert len(proposal["device_entities"]) == 5

    msg = await _call(
        client,
        type=f"{DOMAIN}/devices/save_valve",
        name=proposal["name"],
        device_id=sonoff["device_id"],
        driver=proposal["driver"],
        profile=proposal["profile"],
        entities=proposal["entities"],
        driver_options=proposal["driver_options"],
        water_supply_id="w1",
        new_zone_name="Hochbeet",
        new_zone_minutes=8,
    )
    assert msg["success"], msg
    valve_id = msg["result"]["id"]
    await hass.async_block_till_done()

    model = _model(mock_config_entry)
    valve = next(v for v in model.valves if v.id == valve_id)
    assert valve.driver == "zigbee2mqtt"
    assert valve.profile == "sonoff_swv"
    assert valve.driver_options == {
        "friendly_name": "Ventil Beet",
        "base_topic": "zigbee2mqtt",
    }
    assert valve.entities[ValveRole.VALVE].unique_id == "0xabc_switch"
    assert valve.entities[ValveRole.VOLUME].unique_id.endswith("irrigation_volume")
    assert valve.water_supply_id == "w1"
    assert valve_id in next(s for s in model.water_supplies if s.id == "w1").valve_ids
    zone = next(z for z in model.zones if z.name == "Hochbeet")
    assert zone.valve_id == valve_id
    assert zone.duration_s == 480
    assert valve.zone_ids == [zone.id]
    # Neu geladen: der Treiber für das neue Ventil existiert
    assert valve_id in mock_config_entry.runtime_data.drivers
    # Das Panel bleibt beim Neuladen angemeldet (sonst springt der Browser weg)
    assert "bewaesserung" in hass.data[frontend.DATA_PANELS]

    msg = await _call(client, type=f"{DOMAIN}/devices/get")
    candidate = next(
        c for c in msg["result"]["candidates"] if c["device_id"] == sonoff["device_id"]
    )
    assert candidate["used_by"] == valve_id


async def test_edit_valve_zones_and_new_supply(
    hass: HomeAssistant,
    setup: Any,
    sim: SimValves,
    hass_ws_client: Any,
    mock_config_entry: MockConfigEntry,
) -> None:
    await setup(make_model(2))
    client = await hass_ws_client(hass)
    data = (await _call(client, type=f"{DOMAIN}/devices/get"))["result"]
    v1 = data["valves"][0]
    assert v1["entities"]["valve"] == sim.entity_ids["v1"]
    assert v1["zone_ids"] == ["z1"]

    # v1 übernimmt zusätzlich die Zone von v2 und kommt an eine neue Versorgung
    msg = await _call(
        client,
        type=f"{DOMAIN}/devices/save_valve",
        valve_id="v1",
        name="Rasen",
        device_id=v1["device_id"],
        driver="ha_switch",
        entities={"valve": sim.entity_ids["v1"]},
        water_supply_id="__new__",
        new_supply_name="Zisterne",
        zone_ids=["z1", "z2"],
    )
    assert msg["success"], msg
    await hass.async_block_till_done()
    model = _model(mock_config_entry)
    v1m, v2m = model.valves
    assert v1m.name == "Rasen"
    assert v1m.zone_ids == ["z1", "z2"]
    assert v2m.zone_ids == []
    assert {z.id: z.valve_id for z in model.zones} == {"z1": "v1", "z2": "v1"}
    supply = next(s for s in model.water_supplies if s.name == "Zisterne")
    assert supply.valve_ids == ["v1"]
    assert v1m.water_supply_id == supply.id
    assert "v1" not in next(s for s in model.water_supplies if s.id == "w1").valve_ids

    # Ohne Entität zum Schalten geht es nicht; das Modell bleibt
    msg = await _call(
        client,
        type=f"{DOMAIN}/devices/save_valve",
        valve_id="v1",
        name="Rasen",
        device_id=v1["device_id"],
        driver="ha_switch",
        entities={"valve": None},
        water_supply_id="w1",
    )
    assert msg["error"]["code"] == "invalid"
    assert _model(mock_config_entry).valves[0].water_supply_id == supply.id

    msg = await _call(client, type=f"{DOMAIN}/devices/delete_valve", valve_id="v2")
    assert msg["success"], msg
    await hass.async_block_till_done()
    model = _model(mock_config_entry)
    assert [v.id for v in model.valves] == ["v1"]
    assert "v2" not in mock_config_entry.runtime_data.drivers


async def test_refused_while_watering_and_without_admin(
    hass: HomeAssistant,
    setup: Any,
    sim: SimValves,
    advance: Any,
    hass_ws_client: Any,
    hass_read_only_access_token: str,
) -> None:
    scheduler = await setup(make_model(1, zone_extra={"duration_s": 60}))
    client = await hass_ws_client(hass)
    scheduler.async_enqueue("z1", 60)
    await advance(2)
    msg = await _call(client, type=f"{DOMAIN}/devices/delete_valve", valve_id="v1")
    assert msg["error"]["code"] == "busy"
    msg = await _call(client, type=f"{DOMAIN}/devices/test_valve", valve_id="v1")
    assert msg["error"]["code"] == "busy"
    assert (await _call(client, type=f"{DOMAIN}/devices/get"))["result"]["busy"]
    await scheduler.async_stop_all()
    await hass.async_block_till_done()

    other = await hass_ws_client(hass, access_token=hass_read_only_access_token)
    msg = await _call(other, type=f"{DOMAIN}/devices/get")
    assert msg["error"]["code"] == "unauthorized"
    msg = await _call(other, type=f"{DOMAIN}/devices/test_valve", valve_id="v1")
    assert msg["error"]["code"] == "unauthorized"


async def test_hardware_test_only_10_to_60_s(
    hass: HomeAssistant,
    setup: Any,
    sim: SimValves,
    advance: Any,
    hass_ws_client: Any,
    mock_config_entry: MockConfigEntry,
) -> None:
    await setup(make_model(1, sensors=True))
    client = await hass_ws_client(hass)
    for seconds in (5, 61):
        msg = await _call(
            client, type=f"{DOMAIN}/devices/test_valve", valve_id="v1", seconds=seconds
        )
        assert not msg["success"]
    assert sim.log == []  # nichts geöffnet

    await client.send_json_auto_id(
        {"type": f"{DOMAIN}/devices/test_valve", "valve_id": "v1", "seconds": 10}
    )
    # Ping als Rundreise: danach ist der Testlauf sicher angekommen.
    assert (await _call(client, type="ping"))["type"] == "pong"
    await hass.async_block_till_done()
    assert sim.is_open("v1")
    await advance(10 + 6)
    msg = await client.receive_json()
    assert msg["success"], msg
    result = msg["result"]
    assert not sim.is_open("v1")
    assert result["level"] == "warn"
    assert "Nur Home Assistant" in result["text"]
    assert result["flow_l_min"] == pytest.approx(5.0)
    await hass.async_block_till_done()
    valve = _model(mock_config_entry).valves[0]
    assert valve.safety_level is SafetyLevel.HA_ONLY
    assert valve.learned_flow_l_min == 5.0
    assert sim.max_open_seen == 1


async def test_sensors(
    hass: HomeAssistant,
    setup: Any,
    sim: SimValves,
    hass_ws_client: Any,
    entity_registry: er.EntityRegistry,
    mock_config_entry: MockConfigEntry,
) -> None:
    await setup(make_model(1))
    soil = entity_registry.async_get_or_create("sensor", "test", "soil")
    client = await hass_ws_client(hass)
    msg = await _call(
        client,
        type=f"{DOMAIN}/devices/save_sensor",
        name="Feuchte Beet",
        kind="soil_moisture",
        entity_id=soil.entity_id,
        zone_ids=["z1"],
        field_capacity_pct=40,
        wilting_point_pct=15,
    )
    assert msg["success"], msg
    sensor_id = msg["result"]["id"]
    await hass.async_block_till_done()
    sensor = _model(mock_config_entry).sensors[0]
    assert (sensor.kind, sensor.zone_ids, sensor.field_capacity_pct) == (
        SensorKind.SOIL_MOISTURE,
        ["z1"],
        40,
    )

    msg = await _call(
        client,
        type=f"{DOMAIN}/devices/save_sensor",
        sensor_id=sensor_id,
        name="Feuchte Beet",
        kind="soil_moisture",
        entity_id=soil.entity_id,
        field_capacity_pct=10,
        wilting_point_pct=15,
    )
    assert msg["error"]["code"] == "invalid"

    listed = (await _call(client, type=f"{DOMAIN}/devices/get"))["result"]["sensors"]
    assert listed[0]["entity_id"] == soil.entity_id

    msg = await _call(
        client, type=f"{DOMAIN}/devices/delete_sensor", sensor_id=sensor_id
    )
    assert msg["success"], msg
    await hass.async_block_till_done()
    assert _model(mock_config_entry).sensors == []
