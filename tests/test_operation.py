"""Tests: Abbrechen/Überspringen, Verlauf und die Seite „Betrieb“."""

from __future__ import annotations

from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ServiceValidationError
import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.irrigation_planner.const import DOMAIN
from custom_components.irrigation_planner.water_balance import EFFICIENCY_DRIP

from .helpers import SimValves, make_model

SQUARE = [[0, 0], [10, 0], [10, 10], [0, 10]]  # 100 m²


def _model(**kwargs: Any) -> dict[str, Any]:
    model = make_model(3, zone_extra={"duration_s": 60, "polygon": SQUARE}, **kwargs)
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


async def _call(client: Any, **msg: Any) -> dict[str, Any]:
    await client.send_json_auto_id(msg)
    return await client.receive_json()


def _history(entry: MockConfigEntry) -> list[dict[str, Any]]:
    return entry.runtime_data.history.entries


async def test_cancel_running_zone_continues_with_next(
    hass: HomeAssistant,
    setup: Any,
    sim: SimValves,
    advance: Any,
    mock_config_entry: MockConfigEntry,
) -> None:
    scheduler = await setup(_model(learned_flow=10.0))
    scheduler.async_enqueue("z1", 60)
    scheduler.async_enqueue("z2", 60)
    await advance(10)
    assert sim.open_ids() == {"v1"}

    assert scheduler.async_cancel_zone("z1")
    await advance(3)
    # z1 ist zu, z2 gießt jetzt (immer nur ein Ventil)
    assert sim.open_ids() == {"v2"}
    run = _history(mock_config_entry)[-1]
    assert (run["zone_id"], run["state"]) == ("z1", "skipped")
    assert 5 <= run["seconds"] <= 12
    # Geschätzt aus dem gelernten Durchfluss: 10 L/min
    assert run["measured"] is False
    assert run["liters"] == pytest.approx(run["seconds"] / 6, abs=0.2)
    await scheduler.async_stop_all()
    await hass.async_block_till_done()


async def test_cancel_waiting_zone(
    hass: HomeAssistant,
    setup: Any,
    sim: SimValves,
    advance: Any,
    mock_config_entry: MockConfigEntry,
) -> None:
    scheduler = await setup(_model())
    scheduler.async_enqueue("z1", 60)
    scheduler.async_enqueue("z2", 60)
    scheduler.async_enqueue("z3", 60)
    await advance(2)
    assert scheduler.async_cancel_zone("z2")
    assert [r.zone_id for r in scheduler.runs()] == ["z1", "z3"]
    entry = _history(mock_config_entry)[-1]
    assert (entry["kind"], entry["zone_id"]) == ("cancelled", "z2")
    assert sim.open_ids() == {"v1"}  # der laufende bleibt
    assert not scheduler.async_cancel_zone("z2")  # nichts mehr da
    await scheduler.async_stop_all()
    await hass.async_block_till_done()


async def test_cancel_program_keeps_other_runs(
    hass: HomeAssistant, setup: Any, sim: SimValves, advance: Any
) -> None:
    scheduler = await setup(_model())
    await hass.services.async_call(
        DOMAIN, "run_program", {"program_id": "p1"}, blocking=True
    )
    scheduler.async_enqueue("z3", 60)
    await advance(2)
    assert sim.open_ids() == {"v1"}
    await hass.services.async_call(
        DOMAIN, "cancel_program", {"program_id": "p1"}, blocking=True
    )
    await advance(3)
    assert [r.zone_id for r in scheduler.runs()] == ["z3"]
    assert sim.open_ids() == {"v3"}
    with pytest.raises(ServiceValidationError):
        await hass.services.async_call(
            DOMAIN, "cancel_program", {"program_id": "p1"}, blocking=True
        )
    await hass.services.async_call(
        DOMAIN, "cancel_zone", {"zone_id": "z3"}, blocking=True
    )
    await advance(3)
    assert sim.open_ids() == set()


async def test_history_measures_liters_and_mm(
    hass: HomeAssistant,
    setup: Any,
    sim: SimValves,
    advance: Any,
    mock_config_entry: MockConfigEntry,
) -> None:
    model = _model(sensors=True)
    model["zones"][0]["polygon"] = [[0, 0], [2, 0], [2, 2], [0, 2]]  # 4 m²
    scheduler = await setup(model)
    scheduler.async_enqueue("z1", 60)
    await advance(75)
    run = next(e for e in _history(mock_config_entry) if e["kind"] == "run")
    assert run["state"] == "done"
    assert run["measured"] is True
    # Simulierter Zähler: 5 L/min für eine Minute
    assert run["liters"] == pytest.approx(5.0, abs=0.5)
    # Tropfbewässerung auf 4 m²: Liter mal Effizienz durch Fläche
    assert run["mm"] == pytest.approx(run["liters"] * EFFICIENCY_DRIP / 4, abs=0.1)
    assert mock_config_entry.runtime_data.history.last_run("z1") is run


async def test_history_records_programs_and_survives_reload(
    hass: HomeAssistant,
    setup: Any,
    sim: SimValves,
    advance: Any,
    mock_config_entry: MockConfigEntry,
) -> None:
    await setup(_model(learned_flow=6.0))
    await hass.services.async_call(
        DOMAIN, "run_program", {"program_id": "p1"}, blocking=True
    )
    await advance(130)
    kinds = [e["kind"] for e in _history(mock_config_entry)]
    assert kinds == ["program_started", "run", "run"]
    run = _history(mock_config_entry)[1]
    assert run["source_text"] == "Programm Morgens"
    assert run["liters"] == pytest.approx(6.0, abs=0.2)

    await hass.config_entries.async_reload(mock_config_entry.entry_id)
    await hass.async_block_till_done()
    assert [e["kind"] for e in _history(mock_config_entry)] == kinds


async def test_operation_page(
    hass: HomeAssistant,
    setup: Any,
    sim: SimValves,
    advance: Any,
    hass_ws_client: Any,
    hass_read_only_access_token: str,
) -> None:
    scheduler = await setup(_model(learned_flow=10.0))
    client = await hass_ws_client(hass, access_token=hass_read_only_access_token)
    await client.send_json_auto_id({"type": f"{DOMAIN}/operation/subscribe"})
    assert (await client.receive_json())["success"]
    first = (await client.receive_json())["event"]
    assert first["queue"] == []
    assert [z["name"] for z in first["zones"]] == ["Zone 1", "Zone 2", "Zone 3"]
    assert first["zones"][0]["next"]["program"] == "Morgens"
    assert len(first["days"]) == 14

    scheduler.async_enqueue("z1", 60)
    scheduler.async_enqueue("z2", 60)
    await advance(2)
    event = None
    while True:
        event = (await client.receive_json())["event"]
        if len(event["queue"]) == 2 and event["queue"][0]["state"] == "running":
            break
    assert event["queue"][0]["ends_at"]
    assert event["queue"][1]["active"] is False

    # Abbrechen dürfen auch Benutzer ohne Admin-Rechte (es schließt nur).
    other = await hass_ws_client(hass, access_token=hass_read_only_access_token)
    msg = await _call(other, type=f"{DOMAIN}/queue/cancel", zone_id="z2")
    assert msg["success"], msg
    msg = await _call(other, type=f"{DOMAIN}/queue/cancel", zone_id="z2")
    assert msg["error"]["code"] == "not_found"
    msg = await _call(other, type=f"{DOMAIN}/queue/cancel", all=True)
    assert msg["success"]
    await advance(3)
    assert sim.open_ids() == set()

    msg = await _call(other, type=f"{DOMAIN}/history/get", zone_id="z1")
    assert [e["zone_id"] for e in msg["result"]["entries"]] == ["z1"]
    today = msg["result"]["entries"][0]["at"][:10]
    assert today
