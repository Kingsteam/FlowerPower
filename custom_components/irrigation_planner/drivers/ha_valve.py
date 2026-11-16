"""Treiber für eine beliebige ``valve``-Entität.

Nur Home Assistant überwacht die Zeit (Sicherheitsstufe gelb).
"""

from __future__ import annotations

from ..model import ValveRole
from .ha import HassValveDriver


class HaValveDriver(HassValveDriver):
    """Öffnen = ``valve.open_valve``, Schließen = ``valve.close_valve``."""

    name = "ha_valve"

    async def _async_open(self, duration_s: int) -> None:
        """Öffnet. Das Schließen plant die Basisklasse ein."""
        entity_id = self.require_entity_id(ValveRole.VALVE)
        await self._call("valve", "open_valve", {"entity_id": entity_id})

    async def _async_close(self) -> None:
        """Schließt."""
        entity_id = self.require_entity_id(ValveRole.VALVE)
        await self._call("valve", "close_valve", {"entity_id": entity_id})
