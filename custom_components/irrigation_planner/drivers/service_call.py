"""Treiber für Integrationen mit eigenem Dienst „Zone X für N Minuten“.

Beispiele: Bewässerungscomputer, ESPHome ``sprinkler``. Die Dauer wird im
Dienstaufruf mitgeschickt (Platzhalter ``{duration}``). Läuft der Timer
dann auf dem Gerät, wird ``device_timer: true`` gesetzt.

``driver_options``:

- ``open_service``: z. B. ``"rainbird.start_irrigation"`` (Pflicht)
- ``open_data``: Daten des Aufrufs, muss ``{duration}`` enthalten (Pflicht)
- ``duration_unit``: ``"s"`` (Standard) oder ``"min"`` (wird aufgerundet)
- ``close_service`` / ``close_data``: Schließen; fehlt es, wird die
  Ventil-Entität ausgeschaltet bzw. geschlossen
- ``device_timer``: ``true``, wenn das Gerät nach der Dauer selbst schließt
"""

from __future__ import annotations

import math
from typing import Any, Final

from homeassistant.core import HomeAssistant

from ..model import Valve, ValveRole
from ..profiles import Profile, contains_placeholder, fill_placeholder
from .ha import HassValveDriver

OPT_OPEN_SERVICE: Final = "open_service"
OPT_OPEN_DATA: Final = "open_data"
OPT_DURATION_UNIT: Final = "duration_unit"
OPT_CLOSE_SERVICE: Final = "close_service"
OPT_CLOSE_DATA: Final = "close_data"
OPT_DEVICE_TIMER: Final = "device_timer"

_CLOSE_BY_DOMAIN: Final = {"switch": "turn_off", "valve": "close_valve"}


def _split_service(valve: Valve, value: Any, label: str) -> tuple[str, str]:
    if not isinstance(value, str) or value.count(".") != 1:
        raise ValueError(f"{valve.name}: {label} muss die Form domain.dienst haben")
    domain, service = value.split(".")
    if not domain or not service:
        raise ValueError(f"{valve.name}: {label} muss die Form domain.dienst haben")
    return domain, service


class ServiceCallDriver(HassValveDriver):
    """Öffnet über einen Dienst mit Dauer."""

    name = "service_call"

    def __init__(
        self, hass: HomeAssistant, valve: Valve, profile: Profile | None = None
    ) -> None:
        """Prüft die Einstellungen: Öffnen nur mit Dauer, Schließen muss gehen."""
        opts = valve.driver_options
        self.open_service = _split_service(
            valve, opts.get(OPT_OPEN_SERVICE), "open_service"
        )
        self.open_data = opts.get(OPT_OPEN_DATA)
        if not isinstance(self.open_data, dict) or not contains_placeholder(
            self.open_data
        ):
            raise ValueError(
                f"{valve.name}: open_data muss die Dauer als {{duration}} enthalten"
            )
        self.duration_unit = opts.get(OPT_DURATION_UNIT, "s")
        if self.duration_unit not in ("s", "min"):
            raise ValueError(f"{valve.name}: duration_unit muss s oder min sein")

        self.close_service: tuple[str, str] | None = None
        self.close_data: dict[str, Any] = dict(opts.get(OPT_CLOSE_DATA) or {})
        if OPT_CLOSE_SERVICE in opts:
            self.close_service = _split_service(
                valve, opts[OPT_CLOSE_SERVICE], "close_service"
            )
        else:
            ref = valve.entities.get(ValveRole.VALVE)
            if ref is None or ref.domain not in _CLOSE_BY_DOMAIN:
                # Nie etwas öffnen, das sich nicht schließen lässt.
                raise ValueError(
                    f"{valve.name}: Ohne close_service braucht der Treiber eine "
                    "switch- oder valve-Entität zum Schließen"
                )
        self._timer_on_device = bool(opts.get(OPT_DEVICE_TIMER, False))
        super().__init__(hass, valve, profile)

    def _device_timer(self) -> bool:
        """Gibt an, ob die Dauer auf dem Gerät läuft."""
        return self._timer_on_device

    async def _async_open(self, duration_s: int) -> None:
        """Ruft den Dienst mit der Dauer auf."""
        value = duration_s if self.duration_unit == "s" else math.ceil(duration_s / 60)
        await self._call(*self.open_service, fill_placeholder(self.open_data, value))

    async def _async_close(self) -> None:
        """Schließt über den Dienst oder die Ventil-Entität."""
        if self.close_service is not None:
            await self._call(*self.close_service, self.close_data)
            return
        entity_id = self.require_entity_id(ValveRole.VALVE)
        domain = entity_id.split(".", 1)[0]
        await self._call(domain, _CLOSE_BY_DOMAIN[domain], {"entity_id": entity_id})
