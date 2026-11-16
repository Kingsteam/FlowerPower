"""Tests für Entitäten: Anzeigen, Schalter, Knöpfe, Zahlen, Auswahl."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from freezegun.api import FrozenDateTimeFactory
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers import entity_registry as er
import pytest
from pytest_homeassistant_custom_component.common import (
    MockConfigEntry,
    async_fire_time_changed,
)

from custom_components.irrigation_planner.const import CLOSE_ATTEMPTS, DOMAIN

from .helpers import SimValves, make_model


def model_with_program() -> dict[str, Any]:
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


@pytest.fixture
def eid(entity_registry: er.EntityRegistry, mock_config_entry: MockConfigEntry) -> Any:
    """entity_id aus Plattform, Objekt und Schlüssel."""

    def _eid(domain: str, key: str, obj: str = "") -> str:
        suffix = f"_{obj}" if obj else ""
        unique_id = f"{mock_config_entry.entry_id}{suffix}_{key}"
        entity_id = entity_registry.async_get_entity_id(domain, DOMAIN, unique_id)
        assert entity_id, unique_id
        return entity_id

    return _eid


def state(hass: HomeAssistant, entity_id: str) -> str:
    return hass.states.get(entity_id).state


async def press(hass: HomeAssistant, entity_id: str) -> None:
    await hass.services.async_call(
        "button", "press", {"entity_id": entity_id}, blocking=True
    )
    await hass.async_block_till_done()


async def test_entities_exist_with_devices(
    hass: HomeAssistant, setup: Any, sim: SimValves, eid: Any
) -> None:
    await setup(model_with_program())
    assert state(hass, eid("sensor", "status")) == "ready"
    assert state(hass, eid("sensor", "active_zone")) == "unknown"
    assert state(hass, eid("sensor", "queue")) == "0"
    assert state(hass, eid("binary_sensor", "problem")) == "off"
    assert state(hass, eid("switch", "automatic")) == "on"
    assert state(hass, eid("switch", "winter_mode")) == "off"
    assert state(hass, eid("sensor", "zone_state", "zone_z1")) == "idle"
    assert state(hass, eid("switch", "zone_enabled", "zone_z1")) == "on"
    assert state(hass, eid("number", "duration", "zone_z1")) == "1.0"
    assert state(hass, eid("select", "program_mode", "program_p1")) == "sequence"
    assert state(hass, eid("sensor", "program_duration", "program_p1")) == "2.0"
    next_run = datetime.fromisoformat(
        state(hass, eid("sensor", "next_run", "program_p1"))
    )
    assert next_run.tzinfo is not None


async def test_water_now_and_status(
    hass: HomeAssistant, setup: Any, sim: SimValves, eid: Any, advance: Any
) -> None:
    await setup(model_with_program())
    await press(hass, eid("button", "water_now", "zone_z1"))
    await press(hass, eid("button", "water_now", "zone_z2"))
    assert sim.open_ids() == {"v1"}
    assert state(hass, eid("sensor", "status")) == "running"
    assert state(hass, eid("sensor", "active_zone")) == "Zone 1"
    assert state(hass, eid("sensor", "queue")) == "1"
    assert state(hass, eid("sensor", "zone_state", "zone_z1")) == "running"
    assert state(hass, eid("sensor", "zone_state", "zone_z2")) == "queued"
    assert state(hass, eid("sensor", "run_end")) not in ("unknown", "unavailable")

    await advance(61)
    assert sim.open_ids() == {"v2"}
    assert state(hass, eid("sensor", "zone_state", "zone_z1")) == "idle"
    last = hass.states.get(eid("sensor", "last_run", "zone_z1"))
    assert last.state not in ("unknown", "unavailable")
    assert last.attributes["result"] == "done"
    assert sim.max_open_seen == 1


async def test_water_now_without_duration(
    hass: HomeAssistant, setup: Any, sim: SimValves, eid: Any
) -> None:
    model = model_with_program()
    model["zones"][0]["duration_s"] = None
    await setup(model)
    with pytest.raises(ServiceValidationError, match="keine Gießdauer"):
        await press(hass, eid("button", "water_now", "zone_z1"))
    assert sim.log == []


async def test_switches_are_saved(
    hass: HomeAssistant,
    setup: Any,
    sim: SimValves,
    eid: Any,
    hass_storage: dict,
    freezer: FrozenDateTimeFactory,
) -> None:
    await setup(model_with_program())
    for entity_id in (
        eid("switch", "automatic"),
        eid("switch", "zone_enabled", "zone_z2"),
        eid("switch", "program_enabled", "program_p1"),
    ):
        await hass.services.async_call(
            "switch", "turn_off", {"entity_id": entity_id}, blocking=True
        )
    await hass.services.async_call(
        "number",
        "set_value",
        {"entity_id": eid("number", "duration", "zone_z1"), "value": 2.5},
        blocking=True,
    )
    await hass.services.async_call(
        "select",
        "select_option",
        {
            "entity_id": eid("select", "program_mode", "program_p1"),
            "option": "cycle_soak",
        },
        blocking=True,
    )
    await hass.async_block_till_done()
    assert state(hass, eid("sensor", "status")) == "paused"
    assert state(hass, eid("sensor", "zone_state", "zone_z2")) == "disabled"
    assert state(hass, eid("sensor", "next_run", "program_p1")) == "unknown"

    freezer.tick(5)
    async_fire_time_changed(hass)
    await hass.async_block_till_done()
    stored = hass_storage["irrigation_planner"]["data"]
    assert stored["settings"]["automatic"] is False
    assert stored["zones"][1]["enabled"] is False
    assert stored["zones"][0]["duration_s"] == 150
    assert stored["programs"][0]["enabled"] is False
    assert stored["programs"][0]["mode"] == "cycle_soak"

    # Deaktivierte Zone lässt sich nicht starten.
    with pytest.raises(ServiceValidationError, match="deaktiviert"):
        await press(hass, eid("button", "water_now", "zone_z2"))


async def test_winter_mode_stops_everything(
    hass: HomeAssistant, setup: Any, sim: SimValves, eid: Any
) -> None:
    await setup(model_with_program())
    await press(hass, eid("button", "program_start", "program_p1"))
    assert sim.open_ids() == {"v1"}
    await hass.services.async_call(
        "switch", "turn_on", {"entity_id": eid("switch", "winter_mode")}, blocking=True
    )
    await hass.async_block_till_done()
    assert sim.open_ids() == set()
    assert state(hass, eid("sensor", "status")) == "winter"
    assert state(hass, eid("sensor", "next_run", "program_p1")) == "unknown"


async def test_stop_and_skip_buttons(
    hass: HomeAssistant, setup: Any, sim: SimValves, eid: Any
) -> None:
    await setup(model_with_program())
    await press(hass, eid("button", "program_start", "program_p1"))
    assert sim.open_ids() == {"v1"}
    await press(hass, eid("button", "skip"))
    assert sim.open_ids() == {"v2"}
    await press(hass, eid("button", "stop_all"))
    assert sim.open_ids() == set()
    assert state(hass, eid("sensor", "queue")) == "0"


async def test_problem_sensor_when_valve_stuck(
    hass: HomeAssistant, setup: Any, sim: SimValves, eid: Any, advance: Any
) -> None:
    await setup(model_with_program())
    sim.stuck.add("v1")
    await press(hass, eid("button", "water_now", "zone_z1"))
    await advance(61 + CLOSE_ATTEMPTS * 15 + 2)
    problem = hass.states.get(eid("binary_sensor", "problem"))
    assert problem.state == "on"
    assert "schließt nicht" in problem.attributes["messages"][0]
    assert state(hass, eid("sensor", "status")) == "error"
    assert state(hass, eid("sensor", "zone_state", "zone_z1")) == "error"


async def test_unload_removes_entities(
    hass: HomeAssistant,
    setup: Any,
    sim: SimValves,
    eid: Any,
    mock_config_entry: MockConfigEntry,
) -> None:
    await setup(model_with_program())
    status = eid("sensor", "status")
    assert await hass.config_entries.async_unload(mock_config_entry.entry_id)
    await hass.async_block_till_done()
    assert state(hass, status) == "unavailable"


async def test_no_deprecated_device_warning(
    hass: HomeAssistant,
    setup: Any,
    sim: SimValves,
    caplog: pytest.LogCaptureFixture,
) -> None:
    """Zonen hängen über via_device_id am Hauptgerät (ohne Warnung)."""
    await setup(model_with_program())
    assert "deprecated" not in caplog.text
