"""Tests für Geräteprofile."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import pytest
import voluptuous as vol

from custom_components.irrigation_planner.drivers.base import Capability
from custom_components.irrigation_planner.model import ValveRole
from custom_components.irrigation_planner.profiles import (
    DeviceStatus,
    contains_placeholder,
    fill_placeholder,
    find_profile,
    load_builtin_profiles,
    parse_profile,
)


def _minimal(**changes: Any) -> dict[str, Any]:
    raw: dict[str, Any] = {
        "id": "test",
        "name": "Test",
        "driver": "zigbee2mqtt",
        "match": [{"manufacturer": "ACME"}],
    }
    raw.update(changes)
    return raw


def test_builtin_profiles_load() -> None:
    profiles = load_builtin_profiles()
    swv = profiles["sonoff_swv"]
    assert swv.driver == "zigbee2mqtt"
    assert Capability.DEVICE_TIMER in swv.capabilities
    assert swv.open_payload == {"state": "ON", "on_time": "{duration}"}
    assert swv.close_payload == {"state": "OFF"}
    assert swv.entities[ValveRole.VALVE].domain == "switch"
    assert swv.map_status("water_leakage") is DeviceStatus.LEAK
    assert swv.map_status("water_shortage") is DeviceStatus.SHORTAGE
    assert swv.map_status("normal_state") is DeviceStatus.OK
    assert swv.map_status("etwas_neues") is None


@pytest.mark.parametrize(
    ("manufacturer", "model", "model_id", "expected"),
    [
        ("SONOFF", "Zigbee smart water valve", "SWV", "sonoff_swv"),
        ("sonoff", None, "swv", "sonoff_swv"),
        ("SONOFF", "Zigbee smart water valve", None, "sonoff_swv"),
        ("SONOFF", "Smart plug", "S26R2ZB", None),
        ("Andere", None, "SWV", None),
        (None, None, None, None),
    ],
)
def test_find_profile(
    manufacturer: str | None,
    model: str | None,
    model_id: str | None,
    expected: str | None,
) -> None:
    profile = find_profile(load_builtin_profiles(), manufacturer, model, model_id)
    assert (profile.id if profile else None) == expected


def test_device_timer_requires_placeholder() -> None:
    """Sicherheitsregel 1: Mit Gerätetimer muss die Dauer im Befehl stehen."""
    with pytest.raises(vol.Invalid, match="duration"):
        parse_profile(
            _minimal(capabilities=["device_timer"], open_payload={"state": "ON"})
        )
    with pytest.raises(vol.Invalid, match="duration"):
        parse_profile(_minimal(capabilities=["device_timer"]))


@pytest.mark.parametrize(
    "change",
    [
        {"driver": "gibt_es_nicht"},
        {"match": []},
        {"match": [{}]},
        {"capabilities": ["fliegen"]},
        {"status_map": {"x": "kaputt"}},
        {"entities": {"rolle": {"domain": "switch"}}},
        {"id": "Mit Leerzeichen"},
    ],
)
def test_invalid_profiles_are_rejected(change: dict[str, Any]) -> None:
    with pytest.raises(vol.Invalid):
        parse_profile(_minimal(**change))


def test_broken_builtin_profile_is_reported(tmp_path: Path) -> None:
    (tmp_path / "kaputt.yaml").write_text(
        "id: kaputt\nname: K\ndriver: zigbee2mqtt\nmatch: [{model: X}]\n"
        "capabilities: [device_timer]\nopen_payload: {state: 'ON'}\n"
    )
    with pytest.raises(ValueError, match=r"kaputt\.yaml"):
        load_builtin_profiles(tmp_path)


def test_duplicate_profile_ids(tmp_path: Path) -> None:
    text = "id: doppelt\nname: D\ndriver: ha_switch\nmatch: [{model: X}]\n"
    (tmp_path / "a.yaml").write_text(text)
    (tmp_path / "b.yaml").write_text(text)
    with pytest.raises(ValueError, match="doppelt"):
        load_builtin_profiles(tmp_path)


def test_placeholder_helpers() -> None:
    payload = {"a": "{duration}", "b": ["x", {"c": "zone {duration} s"}], "d": 1}
    assert contains_placeholder(payload)
    assert not contains_placeholder({"a": "on", "b": [1, 2]})
    assert fill_placeholder(payload, 90) == {
        "a": 90,
        "b": ["x", {"c": "zone 90 s"}],
        "d": 1,
    }
