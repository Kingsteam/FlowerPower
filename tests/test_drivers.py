"""Tests für die Treiber mit simulierten Entitäten, Diensten und MQTT.

Kein Test spricht mit echter Hardware.
"""

from __future__ import annotations

from datetime import timedelta
import json
from typing import Any

from freezegun.api import FrozenDateTimeFactory
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import entity_registry as er
import pytest
from pytest_homeassistant_custom_component.common import (
    async_fire_time_changed,
    async_mock_service,
)
from pytest_homeassistant_custom_component.typing import MqttMockHAClient

from custom_components.irrigation_planner.const import FAILSAFE_GRACE_S
from custom_components.irrigation_planner.drivers.base import (
    Capability,
    SafetyLevel,
)
from custom_components.irrigation_planner.drivers.ha import HassValveDriver
from custom_components.irrigation_planner.drivers.ha_switch import HaSwitchDriver
from custom_components.irrigation_planner.drivers.ha_valve import HaValveDriver
from custom_components.irrigation_planner.drivers.registry import (
    DRIVERS,
    create_driver,
)
from custom_components.irrigation_planner.drivers.service_call import (
    ServiceCallDriver,
)
from custom_components.irrigation_planner.drivers.zigbee2mqtt import (
    Zigbee2MqttDriver,
)
from custom_components.irrigation_planner.model import EntityRef, Valve, ValveRole
from custom_components.irrigation_planner.profiles import load_builtin_profiles

PROFILES = load_builtin_profiles()
SWV = PROFILES["sonoff_swv"]


def make_valve(driver: str, domain: str = "switch", **kwargs: Any) -> Valve:
    """Ventil im Modell, das auf eine simulierte Entität zeigt."""
    entities = kwargs.pop(
        "entities",
        {ValveRole.VALVE: EntityRef(domain=domain, platform="sim", unique_id="v1")},
    )
    return Valve(
        id="v1",
        name="Ventil 1",
        device_id="dev1",
        driver=driver,
        entities=entities,
        **kwargs,
    )


@pytest.fixture
def sim_entity(hass: HomeAssistant, entity_registry: er.EntityRegistry):
    """Legt eine simulierte Ventil-Entität an und gibt ihre entity_id zurück."""

    def _create(domain: str = "switch", state: str = "off") -> str:
        entry = entity_registry.async_get_or_create(
            domain, "sim", "v1", suggested_object_id="ventil_1"
        )
        hass.states.async_set(entry.entity_id, state)
        return entry.entity_id

    return _create


async def _advance(
    hass: HomeAssistant, freezer: FrozenDateTimeFactory, seconds: float
) -> None:
    freezer.tick(timedelta(seconds=seconds))
    async_fire_time_changed(hass)
    await hass.async_block_till_done()


# Allgemein --------------------------------------------------------------------


def test_registry_knows_all_drivers() -> None:
    assert set(DRIVERS) == {"ha_switch", "ha_valve", "zigbee2mqtt", "service_call"}
    for cls in DRIVERS.values():
        assert "async_open" not in cls.__dict__


@pytest.mark.parametrize("driver_name", sorted(DRIVERS))
@pytest.mark.parametrize("duration", [0, -5, None, 2.5, "60"])
async def test_no_driver_opens_without_valid_duration(
    hass: HomeAssistant, sim_entity: Any, driver_name: str, duration: Any
) -> None:
    """Sicherheitsregel 1 gilt für jeden Treiber: kein Aufruf, kein Timer."""
    sim_entity()
    on_calls = async_mock_service(hass, "switch", "turn_on")
    valve_calls = async_mock_service(hass, "valve", "open_valve")
    svc_calls = async_mock_service(hass, "sim", "open_for")
    options = {
        "zigbee2mqtt": {"friendly_name": "Ventil 1"},
        "service_call": {
            "open_service": "sim.open_for",
            "open_data": {"duration": "{duration}"},
        },
    }.get(driver_name, {})
    domain = "valve" if driver_name == "ha_valve" else "switch"
    driver = create_driver(
        hass, make_valve(driver_name, domain, driver_options=options), PROFILES
    )
    with pytest.raises(ValueError, match="Ventil darf nur"):
        await driver.async_open(duration)
    assert on_calls == valve_calls == svc_calls == []
    assert not driver.close_pending


@pytest.mark.parametrize(
    ("valve", "message"),
    [
        (make_valve("gibt_es_nicht"), "unbekannter Treiber"),
        (make_valve("zigbee2mqtt", profile="fehlt"), "unbekanntes Profil"),
        (make_valve("ha_switch", profile="sonoff_swv"), "gehört zum Treiber"),
    ],
)
async def test_create_driver_errors(
    hass: HomeAssistant, valve: Valve, message: str
) -> None:
    with pytest.raises(ValueError, match=message):
        create_driver(hass, valve, PROFILES)


# ha_switch --------------------------------------------------------------------


async def test_switch_opens_and_failsafe_closes(
    hass: HomeAssistant, sim_entity: Any, freezer: FrozenDateTimeFactory
) -> None:
    entity_id = sim_entity()
    on = async_mock_service(hass, "switch", "turn_on")
    off = async_mock_service(hass, "switch", "turn_off")
    driver = create_driver(hass, make_valve("ha_switch"), PROFILES)

    assert isinstance(driver, HaSwitchDriver)
    assert driver.safety_level is SafetyLevel.HA_ONLY
    assert Capability.DEVICE_TIMER not in driver.capabilities

    await driver.async_open(30)
    assert [c.data for c in on] == [{"entity_id": entity_id}]
    assert driver.close_pending

    await _advance(hass, freezer, 29)
    assert off == []
    await _advance(hass, freezer, 2)
    assert [c.data for c in off] == [{"entity_id": entity_id}]
    assert not driver.close_pending


async def test_manual_close_cancels_failsafe(
    hass: HomeAssistant, sim_entity: Any, freezer: FrozenDateTimeFactory
) -> None:
    sim_entity()
    async_mock_service(hass, "switch", "turn_on")
    off = async_mock_service(hass, "switch", "turn_off")
    driver = create_driver(hass, make_valve("ha_switch"), PROFILES)

    await driver.async_open(30)
    await driver.async_close()
    assert len(off) == 1
    await _advance(hass, freezer, 60)
    assert len(off) == 1


async def test_reopen_restarts_failsafe(
    hass: HomeAssistant, sim_entity: Any, freezer: FrozenDateTimeFactory
) -> None:
    sim_entity()
    async_mock_service(hass, "switch", "turn_on")
    off = async_mock_service(hass, "switch", "turn_off")
    driver = create_driver(hass, make_valve("ha_switch"), PROFILES)

    await driver.async_open(30)
    await _advance(hass, freezer, 20)
    await driver.async_open(30)
    await _advance(hass, freezer, 20)
    assert off == []
    await _advance(hass, freezer, 11)
    assert len(off) == 1


async def test_shutdown_closes_open_valve(hass: HomeAssistant, sim_entity: Any) -> None:
    """Beim Entladen darf ein Ventil ohne Gerätetimer nicht offen bleiben."""
    sim_entity()
    async_mock_service(hass, "switch", "turn_on")
    off = async_mock_service(hass, "switch", "turn_off")
    driver = create_driver(hass, make_valve("ha_switch"), PROFILES)

    await driver.async_shutdown()
    assert off == []
    await driver.async_open(30)
    await driver.async_shutdown()
    assert len(off) == 1
    assert not driver.close_pending


async def test_failsafe_close_error_is_logged(
    hass: HomeAssistant,
    sim_entity: Any,
    freezer: FrozenDateTimeFactory,
    caplog: pytest.LogCaptureFixture,
) -> None:
    sim_entity()
    async_mock_service(hass, "switch", "turn_on")

    async def broken(call: ServiceCall) -> None:
        raise HomeAssistantError("Funk weg")

    hass.services.async_register("switch", "turn_off", broken)
    driver = create_driver(hass, make_valve("ha_switch"), PROFILES)
    await driver.async_open(10)
    await _advance(hass, freezer, 11)
    assert "Schließen nach Ablauf fehlgeschlagen" in caplog.text


async def test_missing_entity_raises(hass: HomeAssistant) -> None:
    async_mock_service(hass, "switch", "turn_on")
    driver = create_driver(hass, make_valve("ha_switch"), PROFILES)
    with pytest.raises(HomeAssistantError, match="nicht gefunden"):
        await driver.async_open(30)
    assert not driver.close_pending


@pytest.mark.parametrize(
    ("domain", "state", "expected"),
    [
        ("switch", "on", True),
        ("switch", "off", False),
        ("switch", "unavailable", None),
        ("valve", "open", True),
        ("valve", "closed", False),
        ("valve", "unknown", None),
    ],
)
async def test_is_open(
    hass: HomeAssistant,
    sim_entity: Any,
    domain: str,
    state: str,
    expected: bool | None,
) -> None:
    sim_entity(domain, state)
    driver = HaSwitchDriver(hass, make_valve("ha_switch", domain))
    assert driver.is_open is expected


async def test_is_open_without_entity(hass: HomeAssistant) -> None:
    driver = HaSwitchDriver(hass, make_valve("ha_switch"))
    assert driver.is_open is None


async def test_capabilities_from_roles(hass: HomeAssistant) -> None:
    valve = make_valve(
        "ha_switch",
        entities={
            ValveRole.VALVE: EntityRef(domain="switch", platform="sim", unique_id="v"),
            ValveRole.FLOW: EntityRef(domain="sensor", platform="sim", unique_id="f"),
            ValveRole.STATUS: EntityRef(domain="sensor", platform="sim", unique_id="s"),
        },
    )
    driver = HaSwitchDriver(hass, valve)
    assert driver.capabilities == {Capability.FLOW, Capability.STATUS}


# ha_valve ---------------------------------------------------------------------


async def test_valve_entity_driver(
    hass: HomeAssistant, sim_entity: Any, freezer: FrozenDateTimeFactory
) -> None:
    entity_id = sim_entity("valve", "closed")
    opened = async_mock_service(hass, "valve", "open_valve")
    closed = async_mock_service(hass, "valve", "close_valve")
    driver = create_driver(hass, make_valve("ha_valve", "valve"), PROFILES)
    assert isinstance(driver, HaValveDriver)
    assert driver.safety_level is SafetyLevel.HA_ONLY

    await driver.async_open(15)
    assert [c.data for c in opened] == [{"entity_id": entity_id}]
    await _advance(hass, freezer, 16)
    assert [c.data for c in closed] == [{"entity_id": entity_id}]


# zigbee2mqtt ------------------------------------------------------------------


def _published(mqtt_mock: MqttMockHAClient) -> list[tuple[str, Any]]:
    return [
        (call.args[0], json.loads(call.args[1]))
        for call in mqtt_mock.async_publish.call_args_list
    ]


async def test_z2m_sends_duration_to_device(
    hass: HomeAssistant,
    mqtt_mock: MqttMockHAClient,
    freezer: FrozenDateTimeFactory,
) -> None:
    """Sicherheitsregel 1: Die Dauer geht mit dem Befehl ans Gerät."""
    valve = make_valve(
        "zigbee2mqtt",
        profile="sonoff_swv",
        driver_options={"friendly_name": "Ventil 1"},
    )
    driver = create_driver(hass, valve, PROFILES)
    assert isinstance(driver, Zigbee2MqttDriver)
    assert driver.safety_level is SafetyLevel.DEVICE

    await driver.async_open(600)
    await hass.async_block_till_done()
    assert _published(mqtt_mock) == [
        ("zigbee2mqtt/Ventil 1/set", {"state": "ON", "on_time": 600})
    ]
    assert mqtt_mock.async_publish.call_args.args[2] == 1  # qos

    # Das Gerät schließt selbst; Home Assistant schickt OFF erst etwas später.
    await _advance(hass, freezer, 600 + FAILSAFE_GRACE_S - 1)
    assert len(_published(mqtt_mock)) == 1
    await _advance(hass, freezer, 2)
    assert _published(mqtt_mock)[-1] == ("zigbee2mqtt/Ventil 1/set", {"state": "OFF"})


async def test_z2m_without_profile_still_sends_on_time(
    hass: HomeAssistant,
    mqtt_mock: MqttMockHAClient,
    freezer: FrozenDateTimeFactory,
) -> None:
    """Ohne Profil: on_time trotzdem mitschicken, aber Stufe gelb."""
    valve = make_valve(
        "zigbee2mqtt",
        driver_options={"friendly_name": "garten/ventil", "base_topic": "z2m"},
    )
    driver = create_driver(hass, valve, PROFILES)
    assert driver.safety_level is SafetyLevel.HA_ONLY

    await driver.async_open(45)
    await hass.async_block_till_done()
    assert _published(mqtt_mock) == [
        ("z2m/garten/ventil/set", {"state": "ON", "on_time": 45})
    ]
    await _advance(hass, freezer, 46)
    assert _published(mqtt_mock)[-1] == ("z2m/garten/ventil/set", {"state": "OFF"})


async def test_z2m_tested_device_timer_counts(hass: HomeAssistant) -> None:
    """Hat der Testlauf den Gerätetimer bestätigt, ist die Stufe grün."""
    valve = make_valve(
        "zigbee2mqtt",
        driver_options={"friendly_name": "Ventil 1"},
        capabilities=frozenset({Capability.DEVICE_TIMER}),
    )
    assert create_driver(hass, valve, PROFILES).safety_level is SafetyLevel.DEVICE


# Der MQTT-Simulator von Home Assistant hinterlässt hier einen eigenen Timer.
@pytest.mark.parametrize("expected_lingering_timers", [True])
async def test_z2m_custom_payload(
    hass: HomeAssistant, mqtt_mock: MqttMockHAClient
) -> None:
    valve = make_valve(
        "zigbee2mqtt",
        driver_options={
            "friendly_name": "V",
            "open_payload": {
                "cyclic_timed_irrigation": {
                    "total_number": 1,
                    "irrigation_duration": "{duration}",
                    "irrigation_interval": 0,
                }
            },
        },
    )
    driver = create_driver(hass, valve, PROFILES)
    await driver.async_open(120)
    await hass.async_block_till_done()
    assert _published(mqtt_mock)[0][1] == {
        "cyclic_timed_irrigation": {
            "total_number": 1,
            "irrigation_duration": 120,
            "irrigation_interval": 0,
        }
    }
    await driver.async_close()


@pytest.mark.parametrize(
    ("options", "kwargs", "message"),
    [
        ({}, {}, "friendly_name"),
        ({"friendly_name": ""}, {}, "friendly_name"),
        ({"friendly_name": "a/#"}, {}, r"\+ oder #"),
        ({"friendly_name": "V", "base_topic": "z+"}, {}, r"\+ oder #"),
        ({"friendly_name": "V", "open_payload": "ON"}, {}, "JSON-Objekte"),
        # Gerätetimer bekannt, aber eigener Befehl ohne Dauer: verboten.
        (
            {"friendly_name": "V", "open_payload": {"state": "ON"}},
            {"profile": "sonoff_swv"},
            "duration",
        ),
        (
            {"friendly_name": "V", "open_payload": {"state": "ON"}},
            {"capabilities": frozenset({Capability.DEVICE_TIMER})},
            "duration",
        ),
    ],
)
async def test_z2m_rejects_bad_options(
    hass: HomeAssistant, options: dict[str, Any], kwargs: dict[str, Any], message: str
) -> None:
    valve = make_valve("zigbee2mqtt", driver_options=options, **kwargs)
    with pytest.raises(ValueError, match=message):
        create_driver(hass, valve, PROFILES)


async def test_z2m_without_mqtt_raises(hass: HomeAssistant) -> None:
    valve = make_valve("zigbee2mqtt", driver_options={"friendly_name": "V"})
    driver = create_driver(hass, valve, PROFILES)
    with pytest.raises(HomeAssistantError, match="MQTT"):
        await driver.async_open(30)
    assert not driver.close_pending


# service_call -----------------------------------------------------------------


async def test_service_call_with_device_timer(
    hass: HomeAssistant, sim_entity: Any, freezer: FrozenDateTimeFactory
) -> None:
    entity_id = sim_entity()
    opened = async_mock_service(hass, "sim", "open_for")
    off = async_mock_service(hass, "switch", "turn_off")
    valve = make_valve(
        "service_call",
        driver_options={
            "open_service": "sim.open_for",
            "open_data": {"zone": 3, "duration": "{duration}"},
            "device_timer": True,
        },
    )
    driver = create_driver(hass, valve, PROFILES)
    assert isinstance(driver, ServiceCallDriver)
    assert driver.safety_level is SafetyLevel.DEVICE

    await driver.async_open(90)
    assert [c.data for c in opened] == [{"zone": 3, "duration": 90}]
    await _advance(hass, freezer, 90 + FAILSAFE_GRACE_S + 1)
    assert [c.data for c in off] == [{"entity_id": entity_id}]


async def test_service_call_minutes_and_close_service(
    hass: HomeAssistant, freezer: FrozenDateTimeFactory
) -> None:
    opened = async_mock_service(hass, "rain", "start")
    stopped = async_mock_service(hass, "rain", "stop")
    valve = make_valve(
        "service_call",
        entities={},
        driver_options={
            "open_service": "rain.start",
            "open_data": {"zone": 1, "minutes": "{duration}"},
            "duration_unit": "min",
            "close_service": "rain.stop",
            "close_data": {"zone": 1},
        },
    )
    driver = create_driver(hass, valve, PROFILES)
    assert driver.safety_level is SafetyLevel.HA_ONLY

    await driver.async_open(90)
    assert [c.data for c in opened] == [{"zone": 1, "minutes": 2}]
    # Home Assistant schließt nach der echten Dauer, nicht nach 2 Minuten.
    await _advance(hass, freezer, 91)
    assert [c.data for c in stopped] == [{"zone": 1}]


async def test_service_call_closes_valve_entity(
    hass: HomeAssistant, sim_entity: Any
) -> None:
    entity_id = sim_entity("valve", "open")
    async_mock_service(hass, "sim", "open_for")
    closed = async_mock_service(hass, "valve", "close_valve")
    valve = make_valve(
        "service_call",
        "valve",
        driver_options={
            "open_service": "sim.open_for",
            "open_data": {"duration": "{duration}"},
        },
    )
    driver = create_driver(hass, valve, PROFILES)
    await driver.async_close()
    assert [c.data for c in closed] == [{"entity_id": entity_id}]


@pytest.mark.parametrize(
    ("options", "entities", "message"),
    [
        ({"open_data": {"d": "{duration}"}}, None, "open_service"),
        (
            {"open_service": "ohnepunkt", "open_data": {"d": "{duration}"}},
            None,
            "open_service",
        ),
        ({"open_service": "a.b"}, None, "duration"),
        ({"open_service": "a.b", "open_data": {"d": 60}}, None, "duration"),
        (
            {
                "open_service": "a.b",
                "open_data": {"d": "{duration}"},
                "duration_unit": "h",
            },
            None,
            "duration_unit",
        ),
        # Nie etwas öffnen, das sich nicht schließen lässt.
        ({"open_service": "a.b", "open_data": {"d": "{duration}"}}, {}, "Schließen"),
        (
            {
                "open_service": "a.b",
                "open_data": {"d": "{duration}"},
                "close_service": "x",
            },
            None,
            "close_service",
        ),
    ],
)
async def test_service_call_rejects_bad_options(
    hass: HomeAssistant,
    options: dict[str, Any],
    entities: dict | None,
    message: str,
) -> None:
    kwargs: dict[str, Any] = {"driver_options": options}
    if entities is not None:
        kwargs["entities"] = entities
    with pytest.raises(ValueError, match=message):
        create_driver(hass, make_valve("service_call", **kwargs), PROFILES)


def test_hass_driver_is_abstract() -> None:
    with pytest.raises(TypeError):
        HassValveDriver(None, make_valve("x"))  # type: ignore[abstract,arg-type]
