"""Simulierte Ventile und Beispielmodelle für Tests."""

from __future__ import annotations

from typing import Any

from homeassistant.core import Event, HomeAssistant, ServiceCall
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.event import async_track_state_change_event


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
