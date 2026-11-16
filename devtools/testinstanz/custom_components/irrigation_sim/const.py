"""Konstanten des Ventil-Simulators (nur für die Testinstanz)."""

from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum
import logging
from typing import Final

DOMAIN: Final = "irrigation_sim"
LOGGER: Final = logging.getLogger(__package__)

# Wie oft der Simulator Durchfluss, Menge und Bodenfeuchte fortschreibt.
TICK_S: Final = 1.0

# Durchfluss eines undichten Ventils im geschlossenen Zustand (L/min).
DRIP_L_MIN: Final = 0.5


class Fault(StrEnum):
    """Störungen, die man in der Testinstanz auslösen kann."""

    NONE = "none"  # alles in Ordnung
    LEAK = "leak"  # Gerät meldet water_leakage
    SHORTAGE = "shortage"  # kein Wasser: Durchfluss 0, water_shortage
    BURST = "burst"  # Schlauch geplatzt: doppelter Durchfluss
    CLOGGED = "clogged"  # verstopft: 30 % Durchfluss
    STUCK_OPEN = "stuck_open"  # ignoriert Schließbefehle
    DRIPPING = "dripping"  # tropft im geschlossenen Zustand
    UNREACHABLE = "unreachable"  # Gerät antwortet nicht


class ValveKind(StrEnum):
    """Als welche Entität das simulierte Ventil in HA erscheint."""

    SWITCH = "switch"
    VALVE = "valve"


@dataclass(frozen=True, slots=True)
class ZoneSpec:
    """Feste Eigenschaften einer simulierten Zone."""

    number: int
    flow_l_min: float
    device_timer: bool
    kind: ValveKind
    soil_sensor: bool


# Zehn Zonen mit neutralen Namen. Bewusst gemischt, damit alle Treiber
# etwas zum Testen haben: Geräte mit eigenem Timer (wie ein Zigbee-Ventil
# mit on_time) und Geräte, bei denen nur Home Assistant die Zeit überwacht.
ZONES: Final[tuple[ZoneSpec, ...]] = (
    ZoneSpec(1, 4.5, True, ValveKind.SWITCH, True),
    ZoneSpec(2, 9.5, True, ValveKind.SWITCH, True),
    ZoneSpec(3, 6.0, True, ValveKind.SWITCH, True),
    ZoneSpec(4, 12.0, True, ValveKind.SWITCH, False),
    ZoneSpec(5, 12.0, True, ValveKind.SWITCH, True),
    ZoneSpec(6, 11.0, True, ValveKind.SWITCH, False),
    ZoneSpec(7, 10.0, True, ValveKind.SWITCH, False),
    ZoneSpec(8, 7.5, True, ValveKind.SWITCH, True),
    ZoneSpec(9, 5.0, False, ValveKind.SWITCH, False),
    ZoneSpec(10, 8.0, False, ValveKind.VALVE, False),
)

ATTR_DURATION: Final = "duration"
ATTR_FAULT: Final = "fault"
ATTR_LEVEL: Final = "level"
