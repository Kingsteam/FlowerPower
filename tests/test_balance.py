"""Tests für den Wasserhaushalt im Betrieb (balance.py)."""

from __future__ import annotations

from datetime import date, datetime
from typing import Any

from freezegun.api import FrozenDateTimeFactory
from homeassistant.core import HomeAssistant
from homeassistant.helpers import entity_registry as er
from homeassistant.util import dt as dt_util
import pytest
from pytest_homeassistant_custom_component.common import (
    MockConfigEntry,
    async_fire_time_changed,
)

from custom_components.irrigation_planner.balance import (
    BALANCE_STORAGE_KEY,
    zone_efficiency,
    zone_taw,
)
from custom_components.irrigation_planner.model import Zone, ZoneType
from custom_components.irrigation_planner.water_balance import (
    DayWeather,
    et0_for_day,
)

from .helpers import SimValves, make_model

WEATHER = "weather.test"


def at(day: int, hour: int, minute: int = 0) -> datetime:
    """Ortszeit im Juli 2026."""
    return datetime(2026, 7, day, hour, minute, tzinfo=dt_util.get_default_time_zone())


async def _to(
    hass: HomeAssistant, freezer: FrozenDateTimeFactory, when: datetime
) -> None:
    freezer.move_to(when)
    async_fire_time_changed(hass, when)
    await hass.async_block_till_done()


def weather(
    hass: HomeAssistant, temp: float, humidity: float = 60, wind: float = 10
) -> None:
    hass.states.async_set(
        WEATHER,
        "sunny",
        {
            "temperature": temp,
            "temperature_unit": "°C",
            "humidity": humidity,
            "wind_speed": wind,
            "wind_speed_unit": "km/h",
        },
    )


def garden(**zone_extra: Any) -> dict[str, Any]:
    model = make_model(
        2, zone_extra={"area_m2": 10.0, "kc": 0.8, **zone_extra}, learned_flow=5.0
    )
    return model


def expected_et0(hass: HomeAssistant, t_min: float, t_max: float, day: int) -> float:
    return et0_for_day(
        DayWeather(t_min=t_min, t_max=t_max, rh_mean=60, wind_ms=10 / 3.6),
        hass.config.latitude,
        date(2026, 7, day).timetuple().tm_yday,
        float(hass.config.elevation or 0),
    )


async def test_day_is_closed_after_midnight(
    hass: HomeAssistant,
    setup: Any,
    sim: SimValves,
    freezer: FrozenDateTimeFactory,
    mock_config_entry: MockConfigEntry,
) -> None:
    freezer.move_to(at(1, 6))
    weather(hass, 14)
    await setup(garden())
    balance = mock_config_entry.runtime_data.balance
    zone = mock_config_entry.runtime_data.store.model.zones[0]

    weather(hass, 28)
    await _to(hass, freezer, at(1, 14))
    weather(hass, 20)
    await _to(hass, freezer, at(1, 22))
    assert balance.deficit_mm(zone) == 0  # erst nach Mitternacht

    await _to(hass, freezer, at(2, 0, 1))
    et0 = expected_et0(hass, 14, 28, 1)
    assert et0 > 2
    assert balance.deficit_mm(zone) == pytest.approx(et0 * 0.8, abs=0.01)
    assert balance.history[-1].et0_mm == pytest.approx(et0, abs=0.01)


async def test_rain_reduces_deficit_and_cap(
    hass: HomeAssistant,
    setup: Any,
    sim: SimValves,
    freezer: FrozenDateTimeFactory,
    mock_config_entry: MockConfigEntry,
    entity_registry: er.EntityRegistry,
) -> None:
    rain = entity_registry.async_get_or_create("sensor", "test", "rain_today")
    hass.states.async_set(rain.entity_id, "0", {"unit_of_measurement": "mm"})
    model = garden()
    model["sensors"] = [
        {
            "id": "regen",
            "name": "Regen",
            "kind": "rain_mm",
            "entity": {
                "domain": "sensor",
                "platform": "test",
                "unique_id": "rain_today",
            },
        }
    ]
    freezer.move_to(at(1, 6))
    weather(hass, 14)
    await setup(model)
    data = mock_config_entry.runtime_data
    zone = data.store.model.zones[0]
    data.balance.balance(zone.id).deficit_mm = 20.0

    weather(hass, 24)
    hass.states.async_set(rain.entity_id, "12", {"unit_of_measurement": "mm"})
    await _to(hass, freezer, at(1, 15))
    hass.states.async_set(rain.entity_id, "0", {"unit_of_measurement": "mm"})
    await _to(hass, freezer, at(2, 0, 1))
    et0 = expected_et0(hass, 14, 24, 1)
    # 12 mm Regen, davon 80 % wirksam = 9,6 mm
    assert data.balance.deficit_mm(zone) == pytest.approx(
        20 + et0 * 0.8 - 9.6, abs=0.01
    )

    # Viele trockene, heiße Tage: nie trockener als die Bodenspeicherung.
    for day in range(2, 30):
        weather(hass, 15)
        await _to(hass, freezer, at(day, 6))
        weather(hass, 35)
        await _to(hass, freezer, at(day, 15))
    await _to(hass, freezer, at(30, 0, 1))
    assert data.balance.deficit_mm(zone) == pytest.approx(zone_taw(zone))


async def test_cumulative_rain_sensor(
    hass: HomeAssistant,
    setup: Any,
    sim: SimValves,
    freezer: FrozenDateTimeFactory,
    mock_config_entry: MockConfigEntry,
    entity_registry: er.EntityRegistry,
) -> None:
    rain = entity_registry.async_get_or_create("sensor", "test", "rain_total")
    attrs = {"unit_of_measurement": "mm", "state_class": "total_increasing"}
    hass.states.async_set(rain.entity_id, "100", attrs)
    model = garden()
    model["sensors"] = [
        {
            "id": "regen",
            "name": "Regen",
            "kind": "rain_mm",
            "entity": {
                "domain": "sensor",
                "platform": "test",
                "unique_id": "rain_total",
            },
        }
    ]
    freezer.move_to(at(1, 6))
    weather(hass, 14)
    await setup(model)
    hass.states.async_set(rain.entity_id, "103", attrs)
    await _to(hass, freezer, at(1, 12))
    hass.states.async_set(rain.entity_id, "2", attrs)  # Zähler zurückgesetzt
    await _to(hass, freezer, at(1, 18))
    await _to(hass, freezer, at(2, 0, 1))
    assert mock_config_entry.runtime_data.balance.history[-1].rain_mm == pytest.approx(
        5
    )


async def test_irrigation_is_booked(
    hass: HomeAssistant,
    setup: Any,
    sim: SimValves,
    advance: Any,
    mock_config_entry: MockConfigEntry,
) -> None:
    scheduler = await setup(garden())
    data = mock_config_entry.runtime_data
    zone = data.store.model.zones[0]
    data.balance.balance(zone.id).deficit_mm = 5.0
    scheduler.async_enqueue(zone.id, 120)  # 2 min x 5 L/min = 10 L
    await hass.async_block_till_done()
    await advance(121)
    # 10 L x 0,9 / 10 m² = 0,9 mm
    assert data.balance.deficit_mm(zone) == pytest.approx(5.0 - 0.9, abs=0.02)
    assert data.balance.balance(zone.id).last_irrigation_mm == pytest.approx(
        0.9, abs=0.02
    )


async def test_soil_sensor_overrides_estimate(
    hass: HomeAssistant,
    setup: Any,
    sim: SimValves,
    mock_config_entry: MockConfigEntry,
    entity_registry: er.EntityRegistry,
) -> None:
    soil = entity_registry.async_get_or_create("sensor", "test", "soil_1")
    hass.states.async_set(soil.entity_id, "23.5")
    model = garden()
    model["sensors"] = [
        {
            "id": "boden",
            "name": "Boden",
            "kind": "soil_moisture",
            "entity": {"domain": "sensor", "platform": "test", "unique_id": "soil_1"},
            "zone_ids": ["z1"],
            "field_capacity_pct": 35,
            "wilting_point_pct": 12,
        }
    ]
    await setup(model)
    data = mock_config_entry.runtime_data
    zone = data.store.model.zones[0]
    # (35 - 23,5) / (35 - 12) = halb leer
    assert data.balance.deficit_mm(zone) == pytest.approx(zone_taw(zone) / 2)
    hass.states.async_set(soil.entity_id, "unavailable")
    data.balance.balance(zone.id).deficit_mm = 3.0
    assert data.balance.deficit_mm(zone) == 3.0  # ohne Messwert: Schätzung


async def test_no_weather_keeps_deficit(
    hass: HomeAssistant,
    setup: Any,
    sim: SimValves,
    freezer: FrozenDateTimeFactory,
    mock_config_entry: MockConfigEntry,
) -> None:
    freezer.move_to(at(1, 6))
    await setup(garden())
    data = mock_config_entry.runtime_data
    zone = data.store.model.zones[0]
    data.balance.balance(zone.id).deficit_mm = 7.0
    await _to(hass, freezer, at(2, 0, 1))
    assert data.balance.deficit_mm(zone) == 7.0


async def test_winter_pauses_and_resets(
    hass: HomeAssistant,
    setup: Any,
    sim: SimValves,
    freezer: FrozenDateTimeFactory,
    mock_config_entry: MockConfigEntry,
) -> None:
    freezer.move_to(at(1, 6))
    weather(hass, 14)
    await setup(garden())
    data = mock_config_entry.runtime_data
    zone = data.store.model.zones[0]
    data.balance.balance(zone.id).deficit_mm = 7.0
    await data.async_set_winter_mode(True)
    weather(hass, 30)
    await _to(hass, freezer, at(1, 15))
    await _to(hass, freezer, at(2, 0, 1))
    assert data.balance.deficit_mm(zone) == 7.0  # ruht
    await data.async_set_winter_mode(False)
    assert data.balance.deficit_mm(zone) == 0.0  # zurückgesetzt


async def test_balance_survives_restart(
    hass: HomeAssistant,
    setup: Any,
    sim: SimValves,
    mock_config_entry: MockConfigEntry,
    hass_storage: dict,
) -> None:
    await setup(garden())
    data = mock_config_entry.runtime_data
    data.balance.balance("z1").deficit_mm = 4.2
    assert await hass.config_entries.async_reload(mock_config_entry.entry_id)
    await hass.async_block_till_done()
    assert hass_storage[BALANCE_STORAGE_KEY]["data"]["zones"]["z1"]["deficit_mm"] == 4.2
    reloaded = hass.config_entries.async_get_entry(mock_config_entry.entry_id)
    zone = reloaded.runtime_data.store.model.zones[0]
    assert reloaded.runtime_data.balance.deficit_mm(zone) == 4.2


def test_zone_defaults() -> None:
    drip = Zone(id="a", name="a", type=ZoneType.DRIP)
    sprinkler = Zone(id="b", name="b", type=ZoneType.SPRINKLER, efficiency=None)
    assert zone_efficiency(drip) == 0.9
    assert zone_efficiency(sprinkler) == 0.75
    assert zone_taw(Zone(id="c", name="c", type=ZoneType.DRIP, plant_type="roses")) == (
        pytest.approx(160 * 0.5)
    )


async def test_local_temperature_sensor_replaces_weather(
    hass: HomeAssistant,
    setup: Any,
    sim: SimValves,
    freezer: FrozenDateTimeFactory,
    mock_config_entry: MockConfigEntry,
    entity_registry: er.EntityRegistry,
) -> None:
    """Eigener Temperaturfühler geht vor der Wetter-Entität (hier in °F)."""
    temp = entity_registry.async_get_or_create("sensor", "test", "garten_temp")
    model = garden()
    model["sensors"] = [
        {
            "id": "temp",
            "name": "Temperatur Garten",
            "kind": "temperature",
            "entity": {
                "domain": "sensor",
                "platform": "test",
                "unique_id": "garten_temp",
            },
        }
    ]
    freezer.move_to(at(1, 6))
    weather(hass, 0)  # Wetterdienst meint 0 °C, der Fühler weiß es besser
    hass.states.async_set(temp.entity_id, "57.2", {"unit_of_measurement": "°F"})
    await setup(model)
    data = mock_config_entry.runtime_data
    zone = data.store.model.zones[0]
    hass.states.async_set(temp.entity_id, "82.4", {"unit_of_measurement": "°F"})
    await _to(hass, freezer, at(1, 14))
    # Fühler fällt aus: dann gilt wieder die Wetter-Entität
    hass.states.async_set(temp.entity_id, "unavailable")
    weather(hass, 20)
    await _to(hass, freezer, at(1, 22))
    await _to(hass, freezer, at(2, 0, 1))
    et0 = expected_et0(hass, 14, 28, 1)  # 57,2 °F = 14 °C, 82,4 °F = 28 °C
    assert data.balance.deficit_mm(zone) == pytest.approx(et0 * 0.8, abs=0.01)
