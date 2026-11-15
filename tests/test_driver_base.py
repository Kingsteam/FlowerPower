"""Tests für die Treiber-Basisklasse: nie öffnen ohne gültige Dauer."""

from __future__ import annotations

from typing import Any

import pytest

from custom_components.irrigation_planner.const import MAX_VALVE_DURATION_S
from custom_components.irrigation_planner.drivers import (
    Capability,
    SafetyLevel,
    ValveDriver,
)
from custom_components.irrigation_planner.model import WaterSupply


class FakeDriver(ValveDriver):
    """Simuliertes Ventil, merkt sich die Aufrufe."""

    capabilities = frozenset({Capability.DEVICE_TIMER, Capability.FLOW})

    def __init__(self) -> None:
        self.calls: list[tuple[str, int | None]] = []

    async def _async_open(self, duration_s: int) -> None:
        self.calls.append(("open", duration_s))

    async def async_close(self) -> None:
        self.calls.append(("close", None))


class PlainSwitchDriver(FakeDriver):
    """Treiber ohne Gerätetimer."""

    capabilities = frozenset()


async def test_fake_driver_opens_and_closes() -> None:
    driver = FakeDriver()
    await driver.async_open(30)
    await driver.async_close()
    assert driver.calls == [("open", 30), ("close", None)]


@pytest.mark.parametrize(
    "duration",
    [0, -1, -60, None, 1.5, "30", True, MAX_VALVE_DURATION_S + 1],
)
async def test_open_rejects_invalid_duration(duration: Any) -> None:
    driver = FakeDriver()
    with pytest.raises(ValueError, match=r"Ventil darf nur|Obergrenze"):
        await driver.async_open(duration)
    assert driver.calls == []


async def test_open_without_argument_is_impossible() -> None:
    driver = FakeDriver()
    with pytest.raises(TypeError):
        await driver.async_open()  # type: ignore[call-arg]
    assert driver.calls == []


async def test_upper_limit_is_allowed() -> None:
    driver = FakeDriver()
    await driver.async_open(MAX_VALVE_DURATION_S)
    assert driver.calls == [("open", MAX_VALVE_DURATION_S)]


def test_subclass_must_not_override_async_open() -> None:
    with pytest.raises(TypeError):

        class Sneaky(ValveDriver):  # pylint: disable=unused-variable
            async def async_open(self, duration_s: int) -> None:  # type: ignore[override]
                """Würde die Dauerprüfung umgehen."""

            async def _async_open(self, duration_s: int) -> None:
                """Nicht erreicht."""

            async def async_close(self) -> None:
                """Nicht erreicht."""


def test_abstract_driver_cannot_be_instantiated() -> None:
    with pytest.raises(TypeError):
        ValveDriver()  # type: ignore[abstract]


def test_safety_level() -> None:
    assert FakeDriver().safety_level is SafetyLevel.DEVICE
    assert PlainSwitchDriver().safety_level is SafetyLevel.HA_ONLY


def test_water_supply_defaults_to_one_open_valve() -> None:
    assert WaterSupply(id="haus", name="Hauswasserleitung").max_open_valves == 1
    with pytest.raises(ValueError, match="mindestens 1"):
        WaterSupply(id="haus", name="Hauswasserleitung", max_open_valves=0)
