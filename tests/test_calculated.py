"""Tests: berechnete Dauer in Programmen, Knöpfen, Anzeigen und Diensten."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from freezegun.api import FrozenDateTimeFactory
from homeassistant.core import HomeAssistant, ServiceCall, SupportsResponse
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers import entity_registry as er
from homeassistant.util import dt as dt_util
import pytest
from pytest_homeassistant_custom_component.common import (
    MockConfigEntry,
    async_fire_time_changed,
)

from custom_components.irrigation_planner.const import DOMAIN

from .helpers import SimValves, make_model


def calc_model(n: int = 2, **zone_extra: Any) -> dict[str, Any]:
    """Zonen mit Fläche 10 m², berechneter Dauer, gelerntem Durchfluss 5 L/min."""
    model = make_model(
        n,
        zone_extra={
            "area_m2": 10.0,
            "duration_mode": "calculated",
            "duration_s": 120,
            **zone_extra,
        },
        learned_flow=5.0,
    )
    model["programs"] = [
        {
            "id": "p1",
            "name": "Morgens",
            "zone_ids": [z["id"] for z in model["zones"]],
            "start_time": "05:00",
            "pause_between_s": 0,
        }
    ]
    return model


def data_of(entry: MockConfigEntry) -> Any:
    return entry.runtime_data


async def test_planned_duration_calculated(
    hass: HomeAssistant, setup: Any, sim: SimValves, mock_config_entry: MockConfigEntry
) -> None:
    await setup(calc_model())
    data = data_of(mock_config_entry)
    zone = data.store.model.zones[0]
    data.balance.balance(zone.id).deficit_mm = 5.0
    planned = data.balance.planned(zone)
    # 5 mm x 10 m² / 0,9 = 55,6 L; bei 5 L/min = 667 s
    assert planned.reason == "berechnet"
    assert planned.liters == pytest.approx(55.56, abs=0.01)
    assert planned.seconds == 667

    data.balance.balance(zone.id).deficit_mm = 0.5
    assert data.balance.planned(zone).seconds == 0
    assert data.balance.planned(zone).reason == "kein Bedarf"


async def test_no_learned_flow_falls_back_to_manual(
    hass: HomeAssistant, setup: Any, sim: SimValves, mock_config_entry: MockConfigEntry
) -> None:
    model = calc_model()
    for valve in model["valves"]:
        valve["learned_flow_l_min"] = None
    await setup(model)
    data = data_of(mock_config_entry)
    zone = data.store.model.zones[0]
    data.balance.balance(zone.id).deficit_mm = 5.0
    planned = data.balance.planned(zone)
    assert planned.seconds == 120
    assert "Dauer von Hand" in planned.reason


async def test_duration_from_entity(
    hass: HomeAssistant,
    setup: Any,
    sim: SimValves,
    mock_config_entry: MockConfigEntry,
    entity_registry: er.EntityRegistry,
) -> None:
    smart = entity_registry.async_get_or_create("sensor", "test", "smart_z1")
    hass.states.async_set(smart.entity_id, "7.5", {"unit_of_measurement": "min"})
    model = calc_model()
    model["zones"][0]["duration_mode"] = "entity"
    model["zones"][0]["duration_entity"] = {
        "domain": "sensor",
        "platform": "test",
        "unique_id": "smart_z1",
    }
    await setup(model)
    data = data_of(mock_config_entry)
    zone = data.store.model.zones[0]
    assert data.balance.planned(zone).seconds == 450
    hass.states.async_set(smart.entity_id, "300", {"unit_of_measurement": "s"})
    assert data.balance.planned(zone).seconds == 300
    hass.states.async_set(smart.entity_id, "unavailable")
    assert data.balance.planned(zone).seconds == 120  # Rückfall: von Hand


async def test_program_skips_zones_without_need(
    hass: HomeAssistant, setup: Any, sim: SimValves, mock_config_entry: MockConfigEntry
) -> None:
    scheduler = await setup(calc_model(3))
    data = data_of(mock_config_entry)
    zones = data.store.model.zones
    data.balance.balance(zones[0].id).deficit_mm = 3.0
    data.balance.balance(zones[2].id).deficit_mm = 6.0
    await hass.services.async_call(
        DOMAIN, "run_program", {"program_id": "p1"}, blocking=True
    )
    runs = {r.zone_id: r.duration_s for r in scheduler.runs()}
    assert set(runs) == {"z1", "z3"}  # z2 hat keinen Bedarf
    assert runs["z1"] == 400  # 3 mm: 33,3 L / 5 L/min
    assert runs["z3"] == 800


async def test_program_without_any_need(
    hass: HomeAssistant, setup: Any, sim: SimValves
) -> None:
    await setup(calc_model())
    with pytest.raises(ServiceValidationError, match="Bedarf"):
        await hass.services.async_call(
            DOMAIN, "run_program", {"program_id": "p1"}, blocking=True
        )


async def test_priority_mode_sorts_by_need(
    hass: HomeAssistant, setup: Any, sim: SimValves, mock_config_entry: MockConfigEntry
) -> None:
    model = calc_model(3)
    model["programs"][0]["mode"] = "priority"
    await setup(model)
    data = data_of(mock_config_entry)
    for zone_id, need in (("z1", 2.0), ("z2", 8.0), ("z3", 4.0)):
        data.balance.balance(zone_id).deficit_mm = need
    plan = data.programs.plan(data.store.model.programs[0])
    assert [s.zone_id for s in plan] == ["z2", "z3", "z1"]


async def test_forecast_rain_skips_program(
    hass: HomeAssistant,
    setup: Any,
    sim: SimValves,
    freezer: FrozenDateTimeFactory,
    mock_config_entry: MockConfigEntry,
) -> None:
    tz = dt_util.get_default_time_zone()
    freezer.move_to(datetime(2026, 7, 1, 4, 58, tzinfo=tz))
    hass.states.async_set("weather.test", "cloudy", {"temperature": 18})
    rain = {"mm": 8.0}

    async def get_forecasts(call: ServiceCall) -> dict:
        now = dt_util.utcnow()
        return {
            "weather.test": {
                "forecast": [
                    {
                        "datetime": (now.replace(minute=0)).isoformat(),
                        "precipitation": rain["mm"],
                    },
                ]
            }
        }

    hass.services.async_register(
        "weather",
        "get_forecasts",
        get_forecasts,
        supports_response=SupportsResponse.ONLY,
    )
    model = calc_model()
    model["zones"][0]["duration_mode"] = "manual"
    await setup(model)
    programs = data_of(mock_config_entry).programs

    when = datetime(2026, 7, 1, 5, 0, tzinfo=tz)
    freezer.move_to(when)
    async_fire_time_changed(hass, when)
    await hass.async_block_till_done()
    assert sim.open_ids() == set()
    assert programs.results["p1"].reason == "8.0 mm Regen erwartet"

    rain["mm"] = 1.0
    when = datetime(2026, 7, 2, 5, 0, tzinfo=tz)
    freezer.move_to(when)
    async_fire_time_changed(hass, when)
    await hass.async_block_till_done()
    assert sim.open_ids() == {"v1"}


async def test_sensors_and_reset_service(
    hass: HomeAssistant,
    setup: Any,
    sim: SimValves,
    mock_config_entry: MockConfigEntry,
    entity_registry: er.EntityRegistry,
) -> None:
    await setup(calc_model())
    data = data_of(mock_config_entry)
    data.balance.balance("z1").deficit_mm = 5.0
    data.balance.async_notify()
    await hass.async_block_till_done()
    prefix = f"{mock_config_entry.entry_id}_zone_z1"

    def state(domain: str, key: str) -> Any:
        entity_id = entity_registry.async_get_entity_id(
            domain, DOMAIN, f"{prefix}_{key}"
        )
        return hass.states.get(entity_id)

    assert state("sensor", "need").state == "5.0"
    planned = state("sensor", "planned_duration")
    assert float(planned.state) == pytest.approx(667 / 60, abs=0.01)
    assert planned.attributes["reason"] == "berechnet"

    await hass.services.async_call(
        DOMAIN, "reset_balance", {"zone_id": "z1"}, blocking=True
    )
    await hass.async_block_till_done()
    assert state("sensor", "need").state == "0.0"
    with pytest.raises(ServiceValidationError, match="gibt es nicht"):
        await hass.services.async_call(
            DOMAIN, "reset_balance", {"zone_id": "fehlt"}, blocking=True
        )
    await hass.services.async_call(DOMAIN, "recalculate", {}, blocking=True)


async def test_water_now_uses_planned_or_manual(
    hass: HomeAssistant,
    setup: Any,
    sim: SimValves,
    mock_config_entry: MockConfigEntry,
    entity_registry: er.EntityRegistry,
) -> None:
    scheduler = await setup(calc_model())
    data = data_of(mock_config_entry)
    data.balance.balance("z1").deficit_mm = 5.0
    button = entity_registry.async_get_entity_id(
        "button", DOMAIN, f"{mock_config_entry.entry_id}_zone_z1_water_now"
    )
    await hass.services.async_call(
        "button", "press", {"entity_id": button}, blocking=True
    )
    await hass.async_block_till_done()
    assert scheduler.runs()[0].duration_s == 667
    await data.scheduler.async_stop_all()
    await hass.async_block_till_done()

    # Kein Bedarf: Dauer von Hand.
    data.balance.balance("z1").deficit_mm = 0.0
    await hass.services.async_call(
        "button", "press", {"entity_id": button}, blocking=True
    )
    await hass.async_block_till_done()
    assert scheduler.runs()[0].duration_s == 120
