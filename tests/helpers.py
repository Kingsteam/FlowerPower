"""Simulierte Ventile und Beispielmodelle für Tests."""

from __future__ import annotations

from typing import Any

from homeassistant.components.switch import SwitchEntity
from homeassistant.core import Event, HomeAssistant
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.event import async_track_state_change_event
from homeassistant.setup import async_setup_component
from pytest_homeassistant_custom_component.common import setup_test_component_platform


class SimSwitch(SwitchEntity):
    """Ein simuliertes Ventil als echte Schalter-Entität."""

    _attr_should_poll = False

    def __init__(self, valves: SimValves, valve_id: str, state: str) -> None:
        self._valves = valves
        self.valve_id = valve_id
        self._attr_unique_id = valve_id
        self._attr_name = valve_id
        self._attr_is_on = state == "on"

    async def async_turn_on(self, **kwargs: Any) -> None:
        if self.valve_id in self._valves.broken_open:
            raise HomeAssistantError("Funk gestört")
        self._valves.log.append(("on", self.valve_id))
        self._attr_is_on = True
        self.async_write_ha_state()

    async def async_turn_off(self, **kwargs: Any) -> None:
        self._valves.log.append(("off", self.valve_id))
        if self.valve_id not in self._valves.stuck:
            self._attr_is_on = False
            self.async_write_ha_state()


class SimValves:
    """Simulierte Schalter-Ventile mit Wächter.

    Die Ventile sind echte ``switch``-Entitäten der Test-Plattform „test“.
    ``stuck`` schließt nicht, ``broken_open`` lässt das Öffnen scheitern.
    Der Wächter zählt bei jeder Zustandsänderung die offenen Ventile.
    """

    def __init__(self, hass: HomeAssistant, registry: er.EntityRegistry) -> None:
        self.hass = hass
        self.registry = registry
        self.entities: dict[str, SimSwitch] = {}
        self.entity_ids: dict[str, str] = {}
        self.stuck: set[str] = set()  # schließen nicht
        self.broken_open: set[str] = set()  # Öffnen schlägt fehl
        self.max_open_seen = 0
        self.log: list[tuple[str, str]] = []

    def add(self, valve_id: str, state: str = "off") -> None:
        self.entities[valve_id] = SimSwitch(self, valve_id, state)

    async def async_install(self) -> None:
        """Richtet die Test-Plattform mit allen Ventilen ein."""
        setup_test_component_platform(self.hass, "switch", self.entities.values())
        assert await async_setup_component(
            self.hass, "switch", {"switch": {"platform": "test"}}
        )
        await self.hass.async_block_till_done()
        for valve_id in self.entities:
            entity_id = self.registry.async_get_entity_id("switch", "test", valve_id)
            assert entity_id is not None
            self.entity_ids[valve_id] = entity_id

        def watch(_event: Event) -> None:
            self.max_open_seen = max(self.max_open_seen, len(self.open_ids()))

        async_track_state_change_event(self.hass, list(self.entity_ids.values()), watch)

    def open_ids(self) -> set[str]:
        return {
            v
            for v, e in self.entity_ids.items()
            if (s := self.hass.states.get(e)) and s.state == "on"
        }

    def is_open(self, valve_id: str) -> bool:
        return valve_id in self.open_ids()

    def set(self, valve_id: str, state: str) -> None:
        """Ändert ein Ventil „von außen“ (von Hand oder Ausfall)."""
        entity = self.entities[valve_id]
        if state == "unavailable":
            entity._attr_available = False
        else:
            entity._attr_available = True
            entity._attr_is_on = state == "on"
        entity.async_write_ha_state()


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
                    "valve": {"domain": "switch", "platform": "test", "unique_id": v}
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
