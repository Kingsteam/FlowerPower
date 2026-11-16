"""Katalog für das Panel: Pflanzen und Böden mit deutschen Namen.

Die Werte (Pflanzenfaktor Kc, Wurzeltiefe, nutzbare Feldkapazität) kommen
aus ``water_balance.py``; hier stehen nur die Namen für die Anzeige und die
Einstufung des Wasserbedarfs.
"""

from __future__ import annotations

from typing import Any, Final

from .water_balance import PLANTS, SOILS

PLANT_NAMES: Final = {
    "lawn": "Rasen",
    "flower_bed": "Blumenbeet",
    "raised_bed": "Hochbeet",
    "vegetables": "Gemüse",
    "roses": "Rosen",
    "shrubs": "Sträucher",
    "trees": "Bäume",
    "pots": "Töpfe",
    "perennials": "Stauden",
    "ground_cover": "Bodendecker",
    "hedge": "Hecke",
    "fruit_trees": "Obstbäume",
    "berries": "Beerensträucher",
    "strawberries": "Erdbeeren",
    "tomatoes": "Tomaten",
    "herbs": "Mediterrane Kräuter",
    "rock_garden": "Steingarten / Trockenbeet",
    "hydrangeas": "Hortensien",
}
SOIL_NAMES: Final = {
    "sand": "Sand",
    "loamy_sand": "lehmiger Sand",
    "sandy_loam": "sandiger Lehm",
    "loam": "Lehm",
    "silt_loam": "Schluff / Löss",
    "clay_loam": "toniger Lehm",
    "clay": "Ton",
}
# Wasserbedarf in Stufen: Pflanzenfaktor Kc bis zu dieser Grenze.
NEED_LEVELS: Final = (
    ("very_low", "sehr wenig", 0.45, 0.4),
    ("low", "wenig", 0.7, 0.6),
    ("medium", "mittel", 0.95, 0.85),
    ("high", "viel", 1.08, 1.0),
    ("very_high", "sehr viel", 9.0, 1.15),
)


def need_level(kc: float) -> str:
    """Stufe des Wasserbedarfs zu einem Pflanzenfaktor."""
    for key, _name, limit, _kc in NEED_LEVELS:
        if kc <= limit:
            return key
    return NEED_LEVELS[-1][0]


def catalog() -> dict[str, Any]:
    """Pflanzen, Böden und Bedarfsstufen für das Panel."""
    return {
        "plants": {
            key: {
                "name": PLANT_NAMES.get(key, key),
                "kc": kc,
                "root_depth_m": depth,
                "need": need_level(kc),
            }
            for key, (kc, depth) in PLANTS.items()
        },
        "soils": {
            key: {"name": SOIL_NAMES.get(key, key), "awc_mm_per_m": awc}
            for key, awc in SOILS.items()
        },
        "needs": [
            {"key": key, "name": name, "kc": kc}
            for key, name, _limit, kc in NEED_LEVELS
        ],
    }
