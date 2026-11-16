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
        self._valves.update_sensors(self.valve_id)

    async def async_turn_off(self, **kwargs: Any) -> None:
        self._valves.log.append(("off", self.valve_id))
        if self.valve_id not in self._valves.stuck:
            self._attr_is_on = False
            self.async_write_ha_state()
            self._valves.update_sensors(self.valve_id)


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
        # Durchfluss (L/min) bei offenem Ventil; Überschreibungen für Störungen.
        self.nominal_flow: dict[str, float] = {}
        self.flow_override: dict[str, float] = {}
        self.flow_ids: dict[str, str] = {}
        self.status_ids: dict[str, str] = {}

    def add(
        self,
        valve_id: str,
        state: str = "off",
        *,
        flow: bool = False,
        status: bool = False,
    ) -> None:
        self.entities[valve_id] = SimSwitch(self, valve_id, state)
        if flow:
            self.nominal_flow[valve_id] = 5.0
            entry = self.registry.async_get_or_create(
                "sensor", "test", f"flow_{valve_id}"
            )
            self.flow_ids[valve_id] = entry.entity_id
        if status:
            entry = self.registry.async_get_or_create(
                "sensor", "test", f"status_{valve_id}"
            )
            self.status_ids[valve_id] = entry.entity_id
            self.hass.states.async_set(entry.entity_id, "normal_state")

    def update_sensors(self, valve_id: str) -> None:
        """Setzt den Durchfluss passend zum Ventil (oder zur Überschreibung)."""
        if valve_id not in self.flow_ids:
            return
        if valve_id in self.flow_override:
            flow = self.flow_override[valve_id]
        else:
            flow = self.nominal_flow[valve_id] if self.is_open(valve_id) else 0.0
        self.hass.states.async_set(
            self.flow_ids[valve_id], str(flow), {"unit_of_measurement": "L/min"}
        )

    def set_flow(self, valve_id: str, flow: float | None) -> None:
        """Überschreibt den Durchfluss (``None`` = wieder normal)."""
        if flow is None:
            self.flow_override.pop(valve_id, None)
        else:
            self.flow_override[valve_id] = flow
        self.update_sensors(valve_id)

    def set_status(self, valve_id: str, status: str) -> None:
        self.hass.states.async_set(self.status_ids[valve_id], status)

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
            self.update_sensors(valve_id)

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
        self.update_sensors(valve_id)


def make_model(
    valves: int = 3,
    *,
    max_open: int = 1,
    supply: bool = True,
    zone_extra: dict[str, Any] | None = None,
    sensors: bool = False,
    learned_flow: float | None = None,
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
                    "valve": {"domain": "switch", "platform": "test", "unique_id": v},
                    **(
                        {
                            "flow": {
                                "domain": "sensor",
                                "platform": "test",
                                "unique_id": f"flow_{v}",
                            },
                            "status": {
                                "domain": "sensor",
                                "platform": "test",
                                "unique_id": f"status_{v}",
                            },
                        }
                        if sensors
                        else {}
                    ),
                },
                "learned_flow_l_min": learned_flow,
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
