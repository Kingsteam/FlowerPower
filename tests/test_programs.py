"""Tests für Programme: Ablaufplan, Zeitplan, Wetter, Dienste."""

from __future__ import annotations

from datetime import date, datetime, timedelta
from typing import Any

from freezegun.api import FrozenDateTimeFactory
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers import entity_registry as er
from homeassistant.util import dt as dt_util
import pytest
from pytest_homeassistant_custom_component.common import async_fire_time_changed

from custom_components.irrigation_planner.const import DOMAIN
from custom_components.irrigation_planner.model import (
    EntityRef,
    GardenModel,
    Program,
    ProgramMode,
    Sensor,
    SensorKind,
    Zone,
    ZoneType,
)
from custom_components.irrigation_planner.programs import (
    Step,
    build_plan,
    day_allowed,
    next_start,
    plan_total_s,
    weather_skip_reason,
)

from .helpers import SimValves, make_model


def zone(zid: str, duration: int | None, **kw: Any) -> Zone:
    return Zone(
        id=zid,
        name=zid,
        type=ZoneType.DRIP,
        valve_id=f"v_{zid}",
        duration_s=duration,
        **kw,
    )


def garden(*zones: Zone) -> GardenModel:
    return GardenModel(zones=list(zones))


# Ablaufplan ---------------------------------------------------------------------


def test_sequence_plan() -> None:
    model = garden(zone("a", 60), zone("b", 120), zone("c", 30))
    program = Program(id="p", name="P", zone_ids=["a", "b", "c"], pause_between_s=20)
    steps = build_plan(model, program)
    assert steps == [Step("a", 60, 20), Step("b", 120, 20), Step("c", 30, 0)]
    assert plan_total_s(steps) == 60 + 20 + 120 + 20 + 30


def test_plan_skips_unusable_zones_and_limits() -> None:
    model = garden(
        zone("a", 60),
        zone("ohne_dauer", None),
        zone("aus", 60, enabled=False),
        zone("lang", 900, max_duration_s=300),
    )
    model.zones.append(
        Zone(id="ohne_ventil", name="x", type=ZoneType.DRIP, duration_s=5)
    )
    program = Program(
        id="p",
        name="P",
        zone_ids=["a", "ohne_dauer", "aus", "ohne_ventil", "lang", "fehlt"],
        pause_between_s=0,
    )
    assert build_plan(model, program) == [Step("a", 60, 0), Step("lang", 300, 0)]


def test_priority_plan() -> None:
    model = garden(
        zone("a", 10, priority=1), zone("b", 10, priority=5), zone("c", 10, priority=1)
    )
    program = Program(
        id="p",
        name="P",
        zone_ids=["a", "b", "c"],
        mode=ProgramMode.PRIORITY,
        pause_between_s=0,
    )
    assert [s.zone_id for s in build_plan(model, program)] == ["b", "a", "c"]


def test_cycle_soak_round_robin() -> None:
    model = garden(zone("a", 600), zone("b", 300))
    program = Program(
        id="p",
        name="P",
        zone_ids=["a", "b"],
        mode=ProgramMode.CYCLE_SOAK,
        cycle_s=300,
        soak_s=0,
        pause_between_s=10,
    )
    assert build_plan(model, program) == [
        Step("a", 300, 10),
        Step("b", 300, 10),
        Step("a", 300, 0),
    ]


def test_cycle_soak_waits_for_soak_time() -> None:
    """Eine Zone allein: zwischen den Phasen wird die Einziehzeit gewartet."""
    model = garden(zone("a", 500))
    program = Program(
        id="p",
        name="P",
        zone_ids=["a"],
        mode=ProgramMode.CYCLE_SOAK,
        cycle_s=200,
        soak_s=600,
        pause_between_s=20,
    )
    steps = build_plan(model, program)
    assert [s.duration_s for s in steps] == [200, 200, 100]
    # Pause nach jeder Phase = Einziehzeit (600), nicht nur 20 s.
    assert [s.pause_after_s for s in steps] == [600, 600, 0]
    assert sum(s.duration_s for s in steps) == 500


def test_cycle_soak_other_zones_fill_soak() -> None:
    model = garden(zone("a", 200), zone("b", 200), zone("c", 200))
    program = Program(
        id="p",
        name="P",
        zone_ids=["a", "b", "c"],
        mode=ProgramMode.CYCLE_SOAK,
        cycle_s=100,
        soak_s=250,
        pause_between_s=0,
    )
    steps = build_plan(model, program)
    # Nach a,b,c (300 s) ist a schon 200 s eingezogen: 50 s extra warten.
    assert steps[2] == Step("c", 100, 50)
    assert [s.zone_id for s in steps] == ["a", "b", "c", "a", "b", "c"]


# Zeitplan ---------------------------------------------------------------------


def at(day: int, hour: int, minute: int = 0) -> datetime:
    """Ortszeit im Juni 2026 (1.6.2026 = Montag)."""
    tz = dt_util.get_default_time_zone()
    return datetime(2026, 6, day, hour, minute, tzinfo=tz)


def test_next_start_with_start_time() -> None:
    program = Program(id="p", name="P", start_time="05:30:00")
    assert next_start(program, at(1, 4), 600) == at(1, 5, 30)
    assert next_start(program, at(1, 5, 30), 600) == at(1, 5, 30)
    assert next_start(program, at(1, 6), 600) == at(2, 5, 30)


def test_next_start_finish_by() -> None:
    program = Program(id="p", name="P", finish_by="07:00")
    assert next_start(program, at(1, 3), 3600) == at(1, 6, 0)
    assert next_start(program, at(1, 3), 3630) == at(1, 5, 59)


def test_default_finish_is_window_end() -> None:
    program = Program(id="p", name="P")
    assert next_start(program, at(1, 3), 1800) is None
    assert next_start(program, at(1, 3), 1800, "07:00:00") == at(1, 6, 30)


def fake_sun(event: str, day: date) -> datetime | None:
    """Sonnenaufgang 5:10, Untergang 21:00; am 3.6. „Polarnacht“ (kein Ereignis)."""
    if day == date(2026, 6, 3):
        return None
    tz = dt_util.get_default_time_zone()
    hour, minute = (5, 10) if event == "sunrise" else (21, 0)
    return datetime(day.year, day.month, day.day, hour, minute, tzinfo=tz)


def test_finish_by_sunrise_with_offset() -> None:
    program = Program(id="p", name="P", finish_by="sunrise", sun_offset_min=-60)
    # Fertig 4:10, 30 min Gesamtdauer: Start 3:40
    assert next_start(program, at(1, 1), 1800, sun=fake_sun) == at(1, 3, 40)
    assert next_start(program, at(1, 4), 1800, sun=fake_sun) == at(2, 3, 40)
    # Am 3.6. gibt es keinen Sonnenaufgang: nächster Start am 4.6.
    assert next_start(program, at(2, 4), 1800, sun=fake_sun) == at(4, 3, 40)


def test_start_at_sunset() -> None:
    program = Program(id="p", name="P", start_time="sunset", sun_offset_min=30)
    assert next_start(program, at(1, 12), 600, sun=fake_sun) == at(1, 21, 30)
    # Ohne Sonnenzeiten gibt es keinen Start (statt eines falschen).
    assert next_start(program, at(1, 12), 600) is None


def test_sun_offset_is_validated() -> None:
    model = GardenModel(
        programs=[Program(id="p", name="P", finish_by="sunrise", sun_offset_min=-400)]
    )
    with pytest.raises(ValueError, match="Versatz"):
        model.validate()
    model.programs[0].sun_offset_min = -60
    model.validate()
    model.programs[0].finish_by = "mittags"
    with pytest.raises(ValueError, match="Fertig bis"):
        model.validate()


async def test_manager_uses_real_sun_times(
    hass: HomeAssistant, setup: Any, sim: SimValves, mock_config_entry: Any
) -> None:
    from homeassistant.helpers.sun import get_astral_event_date

    model = make_model(1, zone_extra={"duration_s": 600})
    model["programs"] = [
        {
            "id": "p1",
            "name": "Morgens",
            "zone_ids": ["z1"],
            "finish_by": "sunrise",
            "sun_offset_min": -60,
            "pause_between_s": 0,
        }
    ]
    await setup(model)
    manager = mock_config_entry.runtime_data.programs
    program = mock_config_entry.runtime_data.store.model.programs[0]
    now = at(1, 0)
    start = manager.next_start(program, now)
    sunrise = dt_util.as_local(get_astral_event_date(hass, "sunrise", now.date()))
    # Fertig 60 min vor Sonnenaufgang, 10 min Gießdauer
    expected = (sunrise - timedelta(minutes=70)).replace(second=0, microsecond=0)
    assert start == expected


def test_weekdays_and_interval() -> None:
    program = Program(id="p", name="P", start_time="05:00", weekdays=[2, 4])  # Mi, Fr
    assert next_start(program, at(1, 6), 60) == at(3, 5)
    assert next_start(program, at(3, 6), 60) == at(5, 5)

    every3 = Program(id="q", name="Q", interval_days=3, last_run="2026-06-01")
    assert not day_allowed(every3, date(2026, 6, 3))
    assert day_allowed(every3, date(2026, 6, 4))
    every3.start_time = "05:00"
    assert next_start(every3, at(1, 6), 60) == at(4, 5)


# Wetter -----------------------------------------------------------------------


@pytest.mark.parametrize(
    ("state", "attrs", "program_kw", "expected"),
    [
        ("sunny", {"temperature": 18}, {}, None),
        ("rainy", {"temperature": 18}, {}, "Regen"),
        ("rainy", {"temperature": 18}, {"skip_on_rain": False}, None),
        ("sunny", {"temperature": 1}, {}, "Frost"),
        ("sunny", {"temperature": 30, "temperature_unit": "°F"}, {}, "Frost"),
        ("sunny", {"temperature": 1}, {"skip_on_frost": False}, None),
        ("sunny", {"wind_speed": 50}, {}, None),
        ("sunny", {"wind_speed": 50}, {"skip_on_wind": True}, "Wind"),
        (
            "sunny",
            {"wind_speed": 10, "wind_speed_unit": "m/s"},
            {"skip_on_wind": True},
            "Wind",
        ),
    ],
)
async def test_weather_skip(
    hass: HomeAssistant, state: str, attrs: dict, program_kw: dict, expected: str | None
) -> None:
    hass.states.async_set("weather.test", state, attrs)
    reason = weather_skip_reason(
        hass, "weather.test", Program(id="p", name="P", **program_kw)
    )
    assert (reason.split(" ")[0] if reason else None) == expected


async def test_local_sensors_for_frost_and_wind(
    hass: HomeAssistant, entity_registry: er.EntityRegistry
) -> None:
    """Eigene Fühler gehen vor; ohne Wetter-Entität geht es auch."""
    temp = entity_registry.async_get_or_create("sensor", "test", "t")
    wind = entity_registry.async_get_or_create("sensor", "test", "w")
    model = GardenModel(
        sensors=[
            Sensor(
                id="t",
                name="T",
                kind=SensorKind.TEMPERATURE,
                entity=EntityRef(domain="sensor", platform="test", unique_id="t"),
            ),
            Sensor(
                id="w",
                name="W",
                kind=SensorKind.WIND_SPEED,
                entity=EntityRef(domain="sensor", platform="test", unique_id="w"),
            ),
        ]
    )
    program = Program(id="p", name="P", skip_on_wind=True)
    hass.states.async_set("weather.test", "sunny", {"temperature": 15})
    hass.states.async_set(temp.entity_id, "1.5", {"unit_of_measurement": "°C"})
    hass.states.async_set(wind.entity_id, "3", {"unit_of_measurement": "m/s"})
    assert weather_skip_reason(hass, "weather.test", program, model) == "Frost (1.5 °C)"
    assert weather_skip_reason(hass, None, program, model) == "Frost (1.5 °C)"
    hass.states.async_set(temp.entity_id, "12", {"unit_of_measurement": "°C"})
    assert weather_skip_reason(hass, None, program, model) is None
    hass.states.async_set(wind.entity_id, "40", {"unit_of_measurement": "km/h"})
    assert weather_skip_reason(hass, None, program, model) == "Wind (40 km/h)"


async def test_weather_missing_does_not_skip(hass: HomeAssistant) -> None:
    assert weather_skip_reason(hass, "weather.fehlt", Program(id="p", name="P")) is None
    assert weather_skip_reason(hass, None, Program(id="p", name="P")) is None


# Mit Warteschlange --------------------------------------------------------------


def program_model(**program_kw: Any) -> dict[str, Any]:
    model = make_model(3, zone_extra={"duration_s": 20})
    model["programs"] = [
        {"id": "p1", "name": "Morgens", "zone_ids": ["z1", "z2", "z3"], **program_kw}
    ]
    return model


async def test_run_program_service(
    hass: HomeAssistant, setup: Any, sim: SimValves, advance: Any, hass_storage: dict
) -> None:
    await setup(program_model(pause_between_s=5))
    await hass.services.async_call(
        DOMAIN, "run_program", {"program_id": "p1"}, blocking=True
    )
    await hass.async_block_till_done()
    assert sim.open_ids() == {"v1"}
    await advance(21)
    assert sim.open_ids() == set()  # Pause zwischen den Ventilen
    await advance(5)
    assert sim.open_ids() == {"v2"}
    await advance(26)
    assert sim.open_ids() == {"v3"}
    await advance(21)
    assert sim.open_ids() == set()
    assert sim.max_open_seen == 1

    # Startdatum wird gespeichert (für „alle N Tage“).
    await advance(2)
    stored = hass_storage["irrigation_planner"]["data"]["programs"][0]
    assert stored["last_run"] == dt_util.now().date().isoformat()


async def test_program_twice_is_rejected(
    hass: HomeAssistant, setup: Any, sim: SimValves
) -> None:
    await setup(program_model())
    await hass.services.async_call(
        DOMAIN, "run_program", {"program_id": "p1"}, blocking=True
    )
    with pytest.raises(ServiceValidationError, match="schon"):
        await hass.services.async_call(
            DOMAIN, "run_program", {"program_id": "p1"}, blocking=True
        )


async def test_program_skips_busy_zone(
    hass: HomeAssistant, setup: Any, sim: SimValves
) -> None:
    scheduler = await setup(program_model())
    scheduler.async_enqueue("z2", 600)  # von Hand
    await hass.async_block_till_done()
    await hass.services.async_call(
        DOMAIN, "run_program", {"program_id": "p1"}, blocking=True
    )
    programs = [r.zone_id for r in scheduler.runs() if r.source == "program:p1"]
    assert programs == ["z1", "z3"]


@pytest.mark.parametrize(
    ("data", "message"),
    [({"program_id": "fehlt"}, "gibt es nicht")],
)
async def test_run_program_errors(
    hass: HomeAssistant, setup: Any, sim: SimValves, data: dict, message: str
) -> None:
    await setup(program_model())
    with pytest.raises(ServiceValidationError, match=message):
        await hass.services.async_call(DOMAIN, "run_program", data, blocking=True)


async def test_program_without_durations(
    hass: HomeAssistant, setup: Any, sim: SimValves
) -> None:
    model = program_model()
    for z in model["zones"]:
        z["duration_s"] = None
    await setup(model)
    with pytest.raises(ServiceValidationError, match="keine Zone"):
        await hass.services.async_call(
            DOMAIN, "run_program", {"program_id": "p1"}, blocking=True
        )


async def _to(
    hass: HomeAssistant, freezer: FrozenDateTimeFactory, when: datetime
) -> None:
    freezer.move_to(when)
    async_fire_time_changed(hass, when)
    await hass.async_block_till_done()


async def test_schedule_starts_program(
    hass: HomeAssistant, setup: Any, sim: SimValves, freezer: FrozenDateTimeFactory
) -> None:
    freezer.move_to(at(1, 4, 58))
    await setup(program_model(start_time="05:00"))
    await _to(hass, freezer, at(1, 4, 59))
    assert sim.open_ids() == set()
    await _to(hass, freezer, at(1, 5, 0))
    assert sim.open_ids() == {"v1"}


async def test_schedule_respects_automatic_and_winter(
    hass: HomeAssistant, setup: Any, sim: SimValves, freezer: FrozenDateTimeFactory
) -> None:
    freezer.move_to(at(1, 4, 58))
    model = program_model(start_time="05:00")
    model["settings"] = {"automatic": False}
    await setup(model)
    await _to(hass, freezer, at(1, 5, 0))
    assert sim.open_ids() == set()


async def test_schedule_skips_on_rain_and_skip_next(
    hass: HomeAssistant,
    setup: Any,
    sim: SimValves,
    freezer: FrozenDateTimeFactory,
    mock_config_entry: Any,
) -> None:
    freezer.move_to(at(1, 4, 58))
    hass.states.async_set("weather.test", "pouring", {"temperature": 15})
    await setup(program_model(start_time="05:00"))
    programs = mock_config_entry.runtime_data.programs

    await _to(hass, freezer, at(1, 5, 0))
    assert sim.open_ids() == set()
    assert programs.results["p1"].started is False
    assert "Regen" in programs.results["p1"].reason

    hass.states.async_set("weather.test", "sunny", {"temperature": 15})
    await hass.services.async_call(
        DOMAIN, "skip_next", {"program_id": "p1"}, blocking=True
    )
    assert programs.skip_next_pending("p1")
    await _to(hass, freezer, at(2, 5, 0))
    assert sim.open_ids() == set()
    assert programs.results["p1"].reason == "von Hand übersprungen"

    await _to(hass, freezer, at(3, 5, 0))
    assert sim.open_ids() == {"v1"}


async def test_disabled_program_does_not_start(
    hass: HomeAssistant, setup: Any, sim: SimValves, freezer: FrozenDateTimeFactory
) -> None:
    freezer.move_to(at(1, 4, 58))
    await setup(program_model(start_time="05:00", enabled=False))
    await _to(hass, freezer, at(1, 5, 0))
    assert sim.open_ids() == set()


def test_program_validation() -> None:
    model = GardenModel(programs=[Program(id="p", name="P", weekdays=[7])])
    with pytest.raises(ValueError, match="Wochentage"):
        model.validate()
    model = GardenModel(programs=[Program(id="p", name="P", start_time="25:00")])
    with pytest.raises(ValueError, match="Uhrzeit"):
        model.validate()
    model = GardenModel(programs=[Program(id="p", name="P", interval_days=0)])
    with pytest.raises(ValueError, match="Intervall"):
        model.validate()


async def test_window_tick_irrelevant_programs(
    hass: HomeAssistant, setup: Any, sim: SimValves, freezer: FrozenDateTimeFactory
) -> None:
    """Fertig bis = Ende des Zeitfensters (07:00) ohne eigene Zeiten."""
    freezer.move_to(at(1, 5, 0))
    await setup(program_model(pause_between_s=0))
    # 3 Zonen mal 20 s = 60 s, also Start um 06:59.
    await _to(hass, freezer, at(1, 6, 58))
    assert sim.open_ids() == set()
    await _to(hass, freezer, at(1, 6, 59))
    assert sim.open_ids() == {"v1"}
