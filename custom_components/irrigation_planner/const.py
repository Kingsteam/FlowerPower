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

# Sicherheits-Schließen durch Home Assistant: Nach jeder Öffnung schickt
# der Treiber nach Ablauf der Dauer selbst ein Schließen. Bei Geräten mit
# eigenem Timer erst etwas später, damit das Gerät zuerst schließt.
FAILSAFE_GRACE_S: Final = 10

# Warteschlange: Schließen bestätigen. Ein Platz in der Wasserversorgung
# wird erst frei, wenn das Ventil nachweislich zu ist.
CLOSE_CONFIRM_TIMEOUT_S: Final = 15  # so lange auf "zu" warten
CLOSE_ATTEMPTS: Final = 5  # so oft hintereinander OFF schicken
CLOSE_RETRY_INTERVAL_S: Final = 60  # danach: Versorgung gesperrt, OFF jede Minute

# Ventile ohne zugeordnete Wasserversorgung teilen sich diese (Grenze 1).
UNASSIGNED_SUPPLY_ID: Final = "_ohne_versorgung"

# Dienste
SERVICE_RUN_ZONE: Final = "run_zone"
SERVICE_STOP_ALL: Final = "stop_all"
ATTR_ZONE_ID: Final = "zone_id"
ATTR_DURATION: Final = "duration"

# Programme
CYCLE_DEFAULT_S: Final = 300  # Länge einer Gießphase bei „Abwechselnd“
FROST_THRESHOLD_C: Final = 3.0  # darunter: Frost, Programm wird übersprungen
WIND_THRESHOLD_KMH: Final = 30.0  # darüber: zu windig
RAIN_CONDITIONS: Final = frozenset(
    {"rainy", "pouring", "lightning-rainy", "snowy-rainy", "hail", "snowy"}
)
SERVICE_RUN_PROGRAM: Final = "run_program"
SERVICE_SKIP_NEXT: Final = "skip_next"
ATTR_PROGRAM_ID: Final = "program_id"

# Überwachung des Durchflusses (Konzept, Abschnitt 7)
WATCHDOG_INTERVAL_S: Final = 10  # so oft wird geprüft (zusätzlich bei Änderungen)
FLOW_ZERO_L_MIN: Final = 0.1  # darunter gilt: kein Durchfluss
NO_FLOW_GRACE_S: Final = 60  # so lange darf ein offenes Ventil ohne Durchfluss sein
NO_FLOW_HOLD_S: Final = 20  # ... und so lange muss „kein Durchfluss“ am Stück gelten
CLOSED_FLOW_L_MIN: Final = 0.2  # Durchfluss bei geschlossenem Ventil ab hier
CLOSED_FLOW_S: Final = 60  # ... und so lange: Ventil dichtet nicht
HIGH_FLOW_FACTOR: Final = 1.8  # mehr als 1,8-fach gelernt: Schlauch gelöst?
HIGH_FLOW_S: Final = 15
LOW_FLOW_FACTOR: Final = 0.4  # weniger als 0,4-fach gelernt: Knick/Verstopfung
LOW_FLOW_S: Final = 120
LEARN_MIN_RUN_S: Final = 60  # nur aus Läufen ab dieser Länge lernen
LEARN_WEIGHT: Final = 0.3  # Gewicht eines neuen Laufs im gleitenden Mittel
EVENT_ALARM: Final = "irrigation_planner_alarm"
# Ereignisse für eigene Home-Assistant-Automationen
EVENT_RUN_STARTED: Final = "irrigation_planner_run_started"
EVENT_RUN_FINISHED: Final = "irrigation_planner_run_finished"
EVENT_PROGRAM_STARTED: Final = "irrigation_planner_program_started"
EVENT_PROGRAM_SKIPPED: Final = "irrigation_planner_program_skipped"
SERVICE_RELEASE_ZONE: Final = "release_zone"

# Phase 2: Berechnung
MIN_NEED_MM: Final = 1.0  # darunter wird nicht gegossen
FORECAST_RAIN_SKIP_MM: Final = 5.0  # so viel Regen in 24 h erwartet: überspringen
SERVICE_RECALCULATE: Final = "recalculate"
SERVICE_RESET_BALANCE: Final = "reset_balance"

# Phase 3: Kartendienste für das Luftbild unter dem Plan. Die Kacheln lädt
# der Browser direkt vom Dienst; gespeichert werden nur Mitte und Zoom.
# Je Ansicht: Name, kurzer Name für den Umschalter auf der Karte, Art
# ("photo" oder "map"), Kachel-Adresse, optional eine Beschriftungsebene
# darüber ("overlay"), Quellenangabe und höchste Zoomstufe.
_BASEMAP: Final = "https://mapsneu.wien.gv.at/basemap"
_BASEMAP_ATTRIBUTION: Final = "Datenquelle: basemap.at (CC BY 4.0)"
MAP_PROVIDERS: Final = {
    "basemap_at": {
        "name": "basemap.at Orthofoto (nur Österreich)",
        "short": "Luftbild",
        "kind": "photo",
        "url": f"{_BASEMAP}/bmaporthofoto30cm/normal/google3857/{{z}}/{{y}}/{{x}}.jpeg",
        "attribution": _BASEMAP_ATTRIBUTION,
        "max_zoom": 19,
    },
    "basemap_at_labels": {
        "name": "basemap.at Orthofoto mit Beschriftung (nur Österreich)",
        "short": "Luftbild mit Straßen",
        "kind": "photo",
        "url": f"{_BASEMAP}/bmaporthofoto30cm/normal/google3857/{{z}}/{{y}}/{{x}}.jpeg",
        "overlay": f"{_BASEMAP}/bmapoverlay/normal/google3857/{{z}}/{{y}}/{{x}}.png",
        "attribution": _BASEMAP_ATTRIBUTION,
        "max_zoom": 19,
    },
    "basemap_at_map": {
        "name": "basemap.at Karte (nur Österreich)",
        "short": "Karte",
        "kind": "map",
        "url": f"{_BASEMAP}/geolandbasemap/normal/google3857/{{z}}/{{y}}/{{x}}.png",
        "attribution": _BASEMAP_ATTRIBUTION,
        "max_zoom": 19,
    },
    "basemap_at_grey": {
        "name": "basemap.at Karte grau (nur Österreich)",
        "short": "Karte grau",
        "kind": "map",
        "url": f"{_BASEMAP}/bmapgrau/normal/google3857/{{z}}/{{y}}/{{x}}.png",
        "attribution": _BASEMAP_ATTRIBUTION,
        "max_zoom": 19,
    },
    "osm": {
        "name": "OpenStreetMap (weltweit)",
        "short": "OpenStreetMap",
        "kind": "map",
        "url": "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        "attribution": "© OpenStreetMap-Mitwirkende",
        "max_zoom": 19,
    },
    "esri": {
        "name": "Esri World Imagery (Nutzungsbedingungen beachten)",
        "short": "Esri Satellit",
        "kind": "photo",
        "url": "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        "attribution": "Tiles © Esri, Maxar, Earthstar Geographics, GIS User Community",
        "max_zoom": 19,
    },
}
MAP_PROVIDER_CUSTOM: Final = "custom"
