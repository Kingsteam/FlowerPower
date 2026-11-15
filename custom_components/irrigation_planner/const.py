"""Konstanten für den Bewässerungsplaner."""

from __future__ import annotations

import logging
from typing import Final

DOMAIN: Final = "irrigation_planner"
NAME: Final = "Bewässerungsplaner"

LOGGER: Final = logging.getLogger(__package__)

# Config-Entry-Schlüssel
CONF_WEATHER_ENTITY: Final = "weather_entity"
CONF_WINDOW_START: Final = "window_start"
CONF_WINDOW_END: Final = "window_end"
CONF_MAX_OPEN_VALVES: Final = "max_open_valves"

DEFAULT_WINDOW_START: Final = "04:00:00"
DEFAULT_WINDOW_END: Final = "07:00:00"

# Sicherheitsregel: An einer Wasserversorgung ist standardmäßig immer nur
# EIN Ventil gleichzeitig offen. Die Warteschlange setzt das hart durch,
# auch bei manuellen Starts.
DEFAULT_MAX_OPEN_VALVES: Final = 1

# Sicherheitsgrenzen für jede Ventilöffnung (Sekunden).
# Ein Ventil wird nie ohne positive Dauer geöffnet. Die Obergrenze fängt
# Rechenfehler ab; die Höchstdauer je Zone kommt später zusätzlich dazu.
MIN_VALVE_DURATION_S: Final = 1
MAX_VALVE_DURATION_S: Final = 4 * 60 * 60

# Hardwaretests nur mit kurzen Dauern.
HARDWARE_TEST_MIN_S: Final = 10
HARDWARE_TEST_MAX_S: Final = 60

# Speicher (.storage/irrigation_planner)
STORAGE_KEY: Final = DOMAIN
STORAGE_VERSION: Final = 1
STORAGE_MINOR_VERSION: Final = 1
