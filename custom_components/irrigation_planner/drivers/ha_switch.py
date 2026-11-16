"""Treiber für eine beliebige ``switch``-Entität.

Nur Home Assistant überwacht die Zeit (Sicherheitsstufe gelb).
"""

from __future__ import annotations

from ..model import ValveRole
from .ha import HassValveDriver


class HaSwitchDriver(HassValveDriver):
    """Öffnen = einschalten, Schließen = ausschalten."""

    name = "ha_switch"

    async def _async_open(self, duration_s: int) -> None:
        """Schaltet ein. Das Schließen plant die Basisklasse ein."""
        entity_id = self.require_entity_id(ValveRole.VALVE)
        await self._call("switch", "turn_on", {"entity_id": entity_id})

    async def _async_close(self) -> None:
        """Schaltet aus."""
        entity_id = self.require_entity_id(ValveRole.VALVE)
        await self._call("switch", "turn_off", {"entity_id": entity_id})
