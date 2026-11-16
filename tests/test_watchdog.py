"""Tests für die Überwachung des Durchflusses (Konzept, Abschnitt 7)."""

from __future__ import annotations

from typing import Any

from homeassistant.components import persistent_notification
from homeassistant.core import Event, HomeAssistant
from homeassistant.exceptions import ServiceValidationError
import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.irrigation_planner.const import (
    CLOSED_FLOW_S,
    DOMAIN,
    EVENT_ALARM,
    HIGH_FLOW_S,
    LOW_FLOW_S,
    NO_FLOW_GRACE_S,
    WATCHDOG_INTERVAL_S,
)
from custom_components.irrigation_planner.scheduler import QueueError, RunState

from .helpers import SimValves, make_model


@pytest.fixture
def alarms(hass: HomeAssistant) -> list[dict[str, Any]]:
    """Gesammelte Alarm-Ereignisse."""
    events: list[dict[str, Any]] = []

    def _listen(event: Event) -> None:
        events.append(dict(event.data))

    hass.bus.async_listen(EVENT_ALARM, _listen)
    return events


def watched(learned: float | None = 5.0, valves: int = 2) -> dict[str, Any]:
    return make_model(valves, sensors=True, learned_flow=learned)


def notifications(hass: HomeAssistant) -> list[str]:
    """Texte der offenen Benachrichtigungen."""
    store = persistent_notification._async_get_or_create_notifications(hass)
    return [n["message"] for n in store.values()]


async def test_normal_run_no_alarm(
    hass: HomeAssistant, setup: Any, sim: SimValves, advance: Any, alarms: list
) -> None:
    scheduler = await setup(watched())
    run = scheduler.async_enqueue("z1", 120)
    await hass.async_block_till_done()
    await advance(121)
    assert run.state is RunState.DONE
    assert alarms == []


async def test_leak_closes_and_locks_zone(
    hass: HomeAssistant,
    setup: Any,
    sim: SimValves,
    advance: Any,
    alarms: list,
    mock_config_entry: MockConfigEntry,
) -> None:
    scheduler = await setup(watched())
    run = scheduler.async_enqueue("z1", 600)
    scheduler.async_enqueue("z2", 600)
    await hass.async_block_till_done()
    assert sim.is_open("v1")

    sim.set_status("v1", "water_leakage")
    await hass.async_block_till_done()
    assert not sim.is_open("v1")
    assert run.state is RunState.FAILED
    assert alarms[0]["kind"] == "leak"
    assert alarms[0]["zone_locked"] is True
    assert sim.open_ids() == {"v2"}  # Warteschlange macht weiter
    assert "z1" in scheduler.locked_zones
    with pytest.raises(QueueError, match="gesperrt"):
        scheduler.async_enqueue("z1", 60)
    assert mock_config_entry.runtime_data.problems

    # Freigeben nach der Kontrolle.
    sim.set_status("v1", "normal_state")
    await hass.services.async_call(
        DOMAIN, "release_zone", {"zone_id": "z1"}, blocking=True
    )
    assert "z1" not in scheduler.locked_zones
    with pytest.raises(ServiceValidationError, match="nicht gesperrt"):
        await hass.services.async_call(
            DOMAIN, "release_zone", {"zone_id": "z1"}, blocking=True
        )


async def test_high_flow_closes_and_locks(
    hass: HomeAssistant, setup: Any, sim: SimValves, advance: Any, alarms: list
) -> None:
    scheduler = await setup(watched(learned=5.0))
    scheduler.async_enqueue("z1", 600)
    await hass.async_block_till_done()
    sim.set_flow("v1", 10.0)  # Schlauch gelöst
    await advance(HIGH_FLOW_S - 2)
    assert sim.is_open("v1")
    await advance(WATCHDOG_INTERVAL_S + 2)
    assert not sim.is_open("v1")
    assert alarms[0]["kind"] == "high_flow"
    assert "z1" in scheduler.locked_zones


async def test_no_flow_closes_without_lock(
    hass: HomeAssistant, setup: Any, sim: SimValves, advance: Any, alarms: list
) -> None:
    scheduler = await setup(watched(learned=None))
    scheduler.async_enqueue("z1", 600)
    await hass.async_block_till_done()
    sim.set_flow("v1", 0.0)  # Hahn zu
    await advance(NO_FLOW_GRACE_S - 5)
    assert sim.is_open("v1")
    await advance(WATCHDOG_INTERVAL_S + 6)
    assert not sim.is_open("v1")
    assert alarms[0]["kind"] == "no_flow"
    assert scheduler.locked_zones == {}


async def test_shortage_closes(
    hass: HomeAssistant, setup: Any, sim: SimValves, alarms: list
) -> None:
    scheduler = await setup(watched())
    scheduler.async_enqueue("z1", 600)
    await hass.async_block_till_done()
    sim.set_status("v1", "water_shortage")
    await hass.async_block_till_done()
    assert not sim.is_open("v1")
    assert alarms[0]["kind"] == "shortage"


async def test_low_flow_closes_with_warning(
    hass: HomeAssistant, setup: Any, sim: SimValves, advance: Any, alarms: list
) -> None:
    scheduler = await setup(watched(learned=5.0))
    scheduler.async_enqueue("z1", 600)
    await hass.async_block_till_done()
    sim.set_flow("v1", 1.0)  # Knick
    await advance(LOW_FLOW_S - 5)
    assert sim.is_open("v1")
    await advance(WATCHDOG_INTERVAL_S + 6)
    assert not sim.is_open("v1")
    assert alarms[0]["kind"] == "low_flow"
    assert alarms[0]["severity"] == "warning"
    assert scheduler.locked_zones == {}


async def test_flow_while_closed_resends_off(
    hass: HomeAssistant, setup: Any, sim: SimValves, advance: Any, alarms: list
) -> None:
    await setup(watched())
    sim.set_flow("v1", 1.5)  # Ventil dichtet nicht
    await advance(CLOSED_FLOW_S + WATCHDOG_INTERVAL_S + 1)
    assert alarms[0]["kind"] == "closed_flow"
    assert ("off", "v1") in sim.log
    # Wieder dicht: Alarm verschwindet.
    sim.set_flow("v1", None)
    await advance(WATCHDOG_INTERVAL_S + 1)
    assert not any("dichtet nicht" in m for m in notifications(hass))


async def test_too_many_open_closes_later_one(
    hass: HomeAssistant, setup: Any, sim: SimValves, advance: Any, alarms: list
) -> None:
    scheduler = await setup(watched())
    scheduler.async_enqueue("z1", 600)
    await hass.async_block_till_done()
    await advance(5)
    sim.set("v2", "on")  # jemand öffnet von Hand ein zweites Ventil
    await hass.async_block_till_done()
    await advance(2)
    assert sim.open_ids() == {"v1"}
    assert alarms[0]["kind"] == "too_many"
    assert alarms[0]["valve_id"] == "v2"


async def test_no_alarms_in_winter(
    hass: HomeAssistant,
    setup: Any,
    sim: SimValves,
    advance: Any,
    alarms: list,
    mock_config_entry: MockConfigEntry,
) -> None:
    await setup(watched())
    await mock_config_entry.runtime_data.async_set_winter_mode(True)
    sim.set_flow("v1", 3.0)
    sim.set_status("v2", "water_leakage")
    await advance(CLOSED_FLOW_S + WATCHDOG_INTERVAL_S + 1)
    assert alarms == []


async def test_unavailable_sensors_are_ignored(
    hass: HomeAssistant, setup: Any, sim: SimValves, advance: Any, alarms: list
) -> None:
    scheduler = await setup(watched())
    scheduler.async_enqueue("z1", 300)
    await hass.async_block_till_done()
    hass.states.async_set(sim.flow_ids["v1"], "unavailable")
    await advance(NO_FLOW_GRACE_S + WATCHDOG_INTERVAL_S + 1)
    assert sim.is_open("v1")
    assert alarms == []


async def test_flow_is_learned(
    hass: HomeAssistant,
    setup: Any,
    sim: SimValves,
    advance: Any,
    hass_storage: dict,
    mock_config_entry: MockConfigEntry,
) -> None:
    scheduler = await setup(watched(learned=None))
    sim.nominal_flow["v1"] = 6.0
    scheduler.async_enqueue("z1", 120)
    await hass.async_block_till_done()
    await advance(125)
    valve = mock_config_entry.runtime_data.store.model.valves[0]
    assert valve.learned_flow_l_min == pytest.approx(6.0, abs=0.1)

    # Zweiter Lauf mit 4 L/min: gleitender Mittelwert (70 % alt, 30 % neu).
    sim.nominal_flow["v1"] = 4.0
    scheduler.async_enqueue("z1", 120)
    await hass.async_block_till_done()
    await advance(125)
    assert valve.learned_flow_l_min == pytest.approx(5.4, abs=0.1)
    assert hass_storage["irrigation_planner"]["data"]["valves"][0][
        "learned_flow_l_min"
    ] == pytest.approx(5.4, abs=0.1)


async def test_short_runs_are_not_learned(
    hass: HomeAssistant,
    setup: Any,
    sim: SimValves,
    advance: Any,
    mock_config_entry: MockConfigEntry,
) -> None:
    scheduler = await setup(watched(learned=None))
    scheduler.async_enqueue("z1", 20)
    await hass.async_block_till_done()
    await advance(25)
    assert (
        mock_config_entry.runtime_data.store.model.valves[0].learned_flow_l_min is None
    )


async def test_short_zero_flow_is_no_alarm(
    hass: HomeAssistant, setup: Any, sim: SimValves, advance: Any, alarms: list
) -> None:
    """Fund aus der Testinstanz: kurze Nullmessung beim Schließen."""
    scheduler = await setup(watched(learned=None))
    scheduler.async_enqueue("z1", 300)
    await hass.async_block_till_done()
    await advance(NO_FLOW_GRACE_S + 30)  # lange genug offen
    sim.set_flow("v1", 0.0)
    await advance(5)
    sim.set_flow("v1", None)  # wieder normal
    await advance(WATCHDOG_INTERVAL_S * 3)
    assert sim.is_open("v1")
    assert alarms == []
