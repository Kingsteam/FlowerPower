"""Tests für die Warteschlange mit simulierten Ventilen.

Die simulierten Ventile verhalten sich wie echte Schalter: ``turn_on`` und
``turn_off`` ändern ihren Zustand, außer ein Ventil „klemmt“. Ein Wächter
zählt bei jeder Zustandsänderung, wie viele Ventile gleichzeitig offen sind.
"""

from __future__ import annotations

from collections.abc import Callable
from datetime import timedelta
from typing import Any

from freezegun.api import FrozenDateTimeFactory
from homeassistant.config_entries import ConfigEntryState
from homeassistant.core import Event, HomeAssistant, ServiceCall
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.event import async_track_state_change_event
import pytest
from pytest_homeassistant_custom_component.common import (
    MockConfigEntry,
    async_fire_time_changed,
)

from custom_components.irrigation_planner.const import (
    CLOSE_ATTEMPTS,
    CLOSE_CONFIRM_TIMEOUT_S,
    CLOSE_RETRY_INTERVAL_S,
    DOMAIN,
    STORAGE_KEY,
    STORAGE_VERSION,
    UNASSIGNED_SUPPLY_ID,
)
from custom_components.irrigation_planner.scheduler import (
    IrrigationScheduler,
    QueueError,
    RunState,
)


class SimValves:
    """Simulierte Schalter-Ventile mit Wächter."""

    def __init__(self, hass: HomeAssistant, registry: er.EntityRegistry) -> None:
        self.hass = hass
        self.registry = registry
        self.entity_ids: dict[str, str] = {}
        self.stuck: set[str] = set()  # schließen nicht
        self.broken_open: set[str] = set()  # Öffnen schlägt fehl
        self.max_open_seen = 0
        self.log: list[tuple[str, str]] = []

    def add(self, valve_id: str, state: str = "off") -> None:
        entry = self.registry.async_get_or_create(
            "switch", "sim", valve_id, suggested_object_id=valve_id
        )
        self.entity_ids[valve_id] = entry.entity_id
        self.hass.states.async_set(entry.entity_id, state)

    def open_ids(self) -> set[str]:
        return {
            v
            for v, e in self.entity_ids.items()
            if (s := self.hass.states.get(e)) and s.state == "on"
        }

    def is_open(self, valve_id: str) -> bool:
        return valve_id in self.open_ids()

    def set(self, valve_id: str, state: str) -> None:
        self.hass.states.async_set(self.entity_ids[valve_id], state)

    def install(self) -> None:
        by_entity = {e: v for v, e in self.entity_ids.items()}

        async def turn_on(call: ServiceCall) -> None:
            for entity_id in (
                call.data["entity_id"]
                if isinstance(call.data["entity_id"], list)
                else [call.data["entity_id"]]
            ):
                valve_id = by_entity[entity_id]
                if valve_id in self.broken_open:
                    raise RuntimeError("Funk gestört")
                self.log.append(("on", valve_id))
                self.hass.states.async_set(entity_id, "on")

        async def turn_off(call: ServiceCall) -> None:
            for entity_id in (
                call.data["entity_id"]
                if isinstance(call.data["entity_id"], list)
                else [call.data["entity_id"]]
            ):
                valve_id = by_entity[entity_id]
                self.log.append(("off", valve_id))
                if valve_id not in self.stuck:
                    self.hass.states.async_set(entity_id, "off")

        self.hass.services.async_register("switch", "turn_on", turn_on)
        self.hass.services.async_register("switch", "turn_off", turn_off)

        def watch(_event: Event) -> None:
            self.max_open_seen = max(self.max_open_seen, len(self.open_ids()))

        async_track_state_change_event(self.hass, list(self.entity_ids.values()), watch)


def make_model(
    valves: int = 3,
    *,
    max_open: int = 1,
    supply: bool = True,
    zone_extra: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Modell: Zone zN hängt an Ventil vN (Treiber ha_switch)."""
    ids = [f"v{i}" for i in range(1, valves + 1)]
    model: dict[str, Any] = {
        "zones": [
            {
                "id": f"z{i}",
                "name": f"Zone {i}",
                "type": "drip",
                "valve_id": f"v{i}",
                **(zone_extra or {}),
            }
            for i in range(1, valves + 1)
        ],
        "valves": [
            {
                "id": v,
                "name": f"Ventil {v}",
                "device_id": f"dev_{v}",
                "driver": "ha_switch",
                "entities": {
                    "valve": {"domain": "switch", "platform": "sim", "unique_id": v}
                },
            }
            for v in ids
        ],
        "water_supplies": [],
    }
    if supply:
        model["water_supplies"] = [
            {
                "id": "w1",
                "name": "Hauswasser",
                "valve_ids": ids,
                "max_open_valves": max_open,
            }
        ]
    return model


@pytest.fixture
def sim(hass: HomeAssistant, entity_registry: er.EntityRegistry) -> SimValves:
    return SimValves(hass, entity_registry)


@pytest.fixture
def setup(
    hass: HomeAssistant,
    hass_storage: dict[str, Any],
    mock_config_entry: MockConfigEntry,
    sim: SimValves,
) -> Callable[..., Any]:
    """Richtet die Integration mit einem Modell und simulierten Ventilen ein."""

    async def _setup(
        model: dict[str, Any], open_at_start: set[str] | None = None
    ) -> IrrigationScheduler:
        for valve in model["valves"]:
            sim.add(
                valve["id"], "on" if valve["id"] in (open_at_start or set()) else "off"
            )
        sim.install()
        hass_storage[STORAGE_KEY] = {
            "version": STORAGE_VERSION,
            "minor_version": 1,
            "key": STORAGE_KEY,
            "data": model,
        }
        mock_config_entry.add_to_hass(hass)
        assert await hass.config_entries.async_setup(mock_config_entry.entry_id)
        await hass.async_block_till_done()
        return mock_config_entry.runtime_data.scheduler

    return _setup


@pytest.fixture
def advance(
    hass: HomeAssistant, freezer: FrozenDateTimeFactory
) -> Callable[[int], Any]:
    """Lässt die Zeit sekundenweise vergehen."""

    async def _advance(seconds: int) -> None:
        for _ in range(seconds):
            freezer.tick(timedelta(seconds=1))
            async_fire_time_changed(hass)
            await hass.async_block_till_done()

    return _advance


# Grundablauf ------------------------------------------------------------------


async def test_run_opens_and_closes(
    hass: HomeAssistant, setup: Any, sim: SimValves, advance: Any
) -> None:
    scheduler = await setup(make_model(1))
    run = scheduler.async_enqueue("z1", 30)
    await hass.async_block_till_done()
    assert sim.is_open("v1")
    assert run.state is RunState.RUNNING

    await advance(29)
    assert sim.is_open("v1")
    await advance(2)
    assert not sim.is_open("v1")
    assert run.state is RunState.DONE
    assert scheduler.runs() == []


async def test_manual_start_during_run_is_queued(
    hass: HomeAssistant, setup: Any, sim: SimValves, advance: Any
) -> None:
    """Sicherheitsregel 2: Ein Start während eines Laufs wird eingereiht."""
    scheduler = await setup(make_model(3))
    first = scheduler.async_enqueue("z1", 20)
    second = scheduler.async_enqueue("z2", 20)
    third = scheduler.async_enqueue("z3", 20)
    await hass.async_block_till_done()

    assert sim.open_ids() == {"v1"}
    assert second.state is RunState.QUEUED

    await advance(21)
    assert first.state is RunState.DONE
    assert sim.open_ids() == {"v2"}
    await advance(21)
    assert sim.open_ids() == {"v3"}
    await advance(21)
    assert sim.open_ids() == set()
    assert third.state is RunState.DONE

    assert sim.max_open_seen == 1
    # Strenge Reihenfolge: das nächste Ventil öffnet erst nach dem Schließen.
    # (Ein doppeltes OFF ist erlaubt: Treiber-Schutz und Warteschlange.)
    deduped = [e for i, e in enumerate(sim.log) if i == 0 or e != sim.log[i - 1]]
    assert deduped == [
        ("on", "v1"), ("off", "v1"),
        ("on", "v2"), ("off", "v2"),
        ("on", "v3"), ("off", "v3"),
    ]  # fmt: skip


async def test_service_run_zone(
    hass: HomeAssistant, setup: Any, sim: SimValves, advance: Any
) -> None:
    await setup(make_model(2))
    await hass.services.async_call(
        DOMAIN, "run_zone", {"zone_id": "z1", "duration": 10}, blocking=True
    )
    await hass.services.async_call(
        DOMAIN, "run_zone", {"zone_id": "z2", "duration": 10}, blocking=True
    )
    await hass.async_block_till_done()
    assert sim.open_ids() == {"v1"}
    await advance(11)
    assert sim.open_ids() == {"v2"}
    assert sim.max_open_seen == 1


@pytest.mark.parametrize(
    ("data", "message"),
    [
        ({"zone_id": "fehlt", "duration": 10}, "gibt es nicht"),
        ({"zone_id": "z1", "duration": 0}, None),
        ({"zone_id": "z1", "duration": -5}, None),
        ({"zone_id": "z1"}, None),
    ],
)
async def test_service_rejects_bad_input(
    hass: HomeAssistant, setup: Any, sim: SimValves, data: dict, message: str | None
) -> None:
    await setup(make_model(1))
    with pytest.raises((ServiceValidationError, Exception)) as err:
        await hass.services.async_call(DOMAIN, "run_zone", data, blocking=True)
    if message:
        assert message in str(err.value)
    await hass.async_block_till_done()
    assert sim.log == []


# Höchstgrenze und Wasserversorgungen ------------------------------------------


async def test_two_valves_allowed_never_three(
    hass: HomeAssistant, setup: Any, sim: SimValves, advance: Any
) -> None:
    scheduler = await setup(make_model(3, max_open=2))
    for zone in ("z1", "z2", "z3"):
        scheduler.async_enqueue(zone, 20)
    await hass.async_block_till_done()
    assert sim.open_ids() == {"v1", "v2"}
    await advance(21)
    assert sim.open_ids() == {"v3"}
    assert sim.max_open_seen == 2


async def test_valves_without_supply_share_limit_one(
    hass: HomeAssistant, setup: Any, sim: SimValves
) -> None:
    scheduler = await setup(make_model(2, supply=False))
    assert set(scheduler.supplies) == {UNASSIGNED_SUPPLY_ID}
    assert scheduler.supplies[UNASSIGNED_SUPPLY_ID].max_open == 1
    scheduler.async_enqueue("z1", 20)
    scheduler.async_enqueue("z2", 20)
    await hass.async_block_till_done()
    assert sim.open_ids() == {"v1"}


async def test_externally_opened_valve_blocks(
    hass: HomeAssistant, setup: Any, sim: SimValves
) -> None:
    """Von Hand geöffnetes Ventil zählt mit; es öffnet kein zweites."""
    scheduler = await setup(make_model(2))
    sim.set("v2", "on")  # jemand öffnet von Hand
    await hass.async_block_till_done()
    run = scheduler.async_enqueue("z1", 20)
    await hass.async_block_till_done()
    assert run.state is RunState.QUEUED
    assert not sim.is_open("v1")

    sim.set("v2", "off")  # von Hand wieder zu
    await hass.async_block_till_done()
    assert sim.open_ids() == {"v1"}


async def test_max_duration_limits_run(
    hass: HomeAssistant, setup: Any, sim: SimValves, advance: Any
) -> None:
    scheduler = await setup(make_model(1, zone_extra={"max_duration_s": 15}))
    run = scheduler.async_enqueue("z1", 600)
    assert run.duration_s == 15
    await hass.async_block_till_done()
    await advance(16)
    assert not sim.is_open("v1")


@pytest.mark.parametrize(
    ("zone_extra", "zone", "message"),
    [
        ({}, "fehlt", "gibt es nicht"),
        ({"enabled": False}, "z1", "deaktiviert"),
        ({"valve_id": None}, "z1", "kein Ventil"),
    ],
)
async def test_enqueue_errors(
    hass: HomeAssistant,
    setup: Any,
    sim: SimValves,
    zone_extra: dict,
    zone: str,
    message: str,
) -> None:
    scheduler = await setup(make_model(1, zone_extra=zone_extra))
    with pytest.raises(QueueError, match=message):
        scheduler.async_enqueue(zone, 30)


@pytest.mark.parametrize("duration", [0, -1, None, 1.5, "30"])
async def test_enqueue_rejects_invalid_duration(
    hass: HomeAssistant, setup: Any, sim: SimValves, duration: Any
) -> None:
    """Sicherheitsregel 1 auch an der Warteschlange: nie ohne gültige Dauer."""
    scheduler = await setup(make_model(1))
    with pytest.raises(QueueError, match="Ventil darf nur"):
        scheduler.async_enqueue("z1", duration)
    assert scheduler.runs() == []


async def test_same_zone_twice_is_rejected(
    hass: HomeAssistant, setup: Any, sim: SimValves
) -> None:
    scheduler = await setup(make_model(1))
    scheduler.async_enqueue("z1", 30)
    with pytest.raises(QueueError, match="schon"):
        scheduler.async_enqueue("z1", 30)


async def test_unusable_valve_is_reported(
    hass: HomeAssistant, setup: Any, sim: SimValves, caplog: pytest.LogCaptureFixture
) -> None:
    model = make_model(2)
    model["valves"][1]["driver"] = "gibt_es_nicht"
    scheduler = await setup(model)
    assert "nicht steuerbar" in caplog.text
    with pytest.raises(QueueError, match="nicht steuerbar"):
        scheduler.async_enqueue("z2", 30)
    scheduler.async_enqueue("z1", 30)  # die anderen gehen weiter


# Ventil schließt nicht ----------------------------------------------------------


async def test_stuck_valve_blocks_supply_until_closed(
    hass: HomeAssistant, setup: Any, sim: SimValves, advance: Any
) -> None:
    """Schließt ein Ventil nicht, öffnet KEIN weiteres an derselben Versorgung."""
    scheduler = await setup(make_model(2))
    sim.stuck.add("v1")
    first = scheduler.async_enqueue("z1", 10)
    second = scheduler.async_enqueue("z2", 3600)
    await hass.async_block_till_done()

    # Lauf vorbei, alle Schließversuche scheitern.
    await advance(10 + CLOSE_ATTEMPTS * CLOSE_CONFIRM_TIMEOUT_S + 5)
    assert sim.log.count(("off", "v1")) >= CLOSE_ATTEMPTS
    assert first.state is RunState.FAILED
    assert scheduler.supplies["w1"].error is not None
    assert second.state is RunState.QUEUED
    assert not sim.is_open("v2")

    # Es wird weiter versucht; noch klemmt es.
    await advance(CLOSE_RETRY_INTERVAL_S + 2)
    assert not sim.is_open("v2")

    # Ventil geht wieder: beim nächsten Versuch zu, dann ist Zone 2 dran.
    sim.stuck.discard("v1")
    await advance(CLOSE_RETRY_INTERVAL_S + 2)
    assert not sim.is_open("v1")
    assert scheduler.supplies["w1"].error is None
    assert sim.open_ids() == {"v2"}
    assert second.state is RunState.RUNNING
    assert sim.max_open_seen == 1


async def test_open_failure_still_closes_and_continues(
    hass: HomeAssistant, setup: Any, sim: SimValves, advance: Any
) -> None:
    scheduler = await setup(make_model(2))
    sim.broken_open.add("v1")
    first = scheduler.async_enqueue("z1", 10)
    scheduler.async_enqueue("z2", 10)
    await hass.async_block_till_done()
    assert first.state is RunState.FAILED
    assert ("off", "v1") in sim.log  # sicherheitshalber geschlossen
    assert sim.open_ids() == {"v2"}


# Stoppen, überspringen, Pause ---------------------------------------------------


async def test_stop_all(
    hass: HomeAssistant, setup: Any, sim: SimValves, advance: Any
) -> None:
    scheduler = await setup(make_model(3))
    first = scheduler.async_enqueue("z1", 600)
    second = scheduler.async_enqueue("z2", 600)
    await hass.async_block_till_done()
    assert sim.is_open("v1")

    await hass.services.async_call(DOMAIN, "stop_all", {}, blocking=True)
    await hass.async_block_till_done()
    assert sim.open_ids() == set()
    assert first.state is RunState.SKIPPED
    assert second.state is RunState.SKIPPED
    assert scheduler.runs() == []
    await advance(5)
    assert sim.open_ids() == set()


async def test_stop_all_closes_foreign_valves(
    hass: HomeAssistant, setup: Any, sim: SimValves
) -> None:
    scheduler = await setup(make_model(2))
    sim.set("v2", "on")
    await scheduler.async_stop_all()
    await hass.async_block_till_done()
    assert sim.open_ids() == set()


async def test_skip_moves_to_next_zone(
    hass: HomeAssistant, setup: Any, sim: SimValves
) -> None:
    scheduler = await setup(make_model(2))
    first = scheduler.async_enqueue("z1", 600)
    scheduler.async_enqueue("z2", 600)
    await hass.async_block_till_done()
    scheduler.async_skip()
    await hass.async_block_till_done()
    assert first.state is RunState.SKIPPED
    assert sim.open_ids() == {"v2"}
    assert sim.max_open_seen == 1


async def test_pause_between_valves(
    hass: HomeAssistant, setup: Any, sim: SimValves, advance: Any
) -> None:
    scheduler = await setup(make_model(2))
    scheduler.async_enqueue("z1", 10, pause_after_s=20)
    scheduler.async_enqueue("z2", 10)
    await hass.async_block_till_done()
    await advance(11)
    assert sim.open_ids() == set()  # Pause: Druck erholt sich
    await advance(18)
    assert sim.open_ids() == set()
    await advance(3)
    assert sim.open_ids() == {"v2"}


# Start und Entladen ---------------------------------------------------------------


async def test_open_valves_are_closed_at_startup(
    hass: HomeAssistant, setup: Any, sim: SimValves
) -> None:
    await setup(make_model(2), open_at_start={"v1", "v2"})
    await hass.async_block_till_done()
    assert sim.open_ids() == set()


async def test_unload_closes_running_valve(
    hass: HomeAssistant,
    setup: Any,
    sim: SimValves,
    mock_config_entry: MockConfigEntry,
    advance: Any,
) -> None:
    scheduler = await setup(make_model(2))
    scheduler.async_enqueue("z1", 600)
    scheduler.async_enqueue("z2", 600)
    await hass.async_block_till_done()
    assert sim.is_open("v1")

    assert await hass.config_entries.async_unload(mock_config_entry.entry_id)
    await hass.async_block_till_done()
    assert mock_config_entry.state is ConfigEntryState.NOT_LOADED
    assert sim.open_ids() == set()
    await advance(5)
    assert sim.open_ids() == set()  # nach dem Entladen öffnet nichts mehr


async def test_unknown_state_is_left_alone_on_unload(
    hass: HomeAssistant,
    setup: Any,
    sim: SimValves,
    mock_config_entry: MockConfigEntry,
) -> None:
    """Ventile ohne Batterie (unbekannter Zustand) werden nicht angefunkt."""
    await setup(make_model(1))
    sim.set("v1", "unavailable")
    assert await hass.config_entries.async_unload(mock_config_entry.entry_id)
    assert sim.log == []
