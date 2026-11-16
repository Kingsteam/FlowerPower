"""Wasserhaushalt: Rechenkern (Konzept, Abschnitt 5).

Reine Rechnungen ohne Home Assistant, damit sie sich genau prüfen lassen:

1. **Verdunstung ET0** (mm/Tag) nach FAO-56 Penman-Monteith. Fehlen
   Luftfeuchte oder Wind, nach Hargreaves (nur Temperatur). Ohne gemessene
   Strahlung wird sie aus dem Temperaturunterschied geschätzt (FAO-56,
   Gleichung 50).
2. **ETc = ET0 * Kc** je Zone (Pflanzenfaktor).
3. **Wasserhaushalt:** Defizit (mm) += ETc - wirksamer Regen, gedeckelt
   durch die nutzbare Feldkapazität (Bodenart * Wurzeltiefe).
4. **Liter = Bedarf_mm * Fläche_m² / Effizienz**, **Dauer = Liter /
   Durchfluss**.

Quelle der Formeln: Allen et al., FAO Irrigation and Drainage Paper 56
(1998), Kapitel 3. Gleichungsnummern stehen bei den Funktionen.
"""

from __future__ import annotations

from dataclasses import dataclass
import math
from typing import Final

# Pflanzen: Pflanzenfaktor Kc und typische Wurzeltiefe (m).
# Gerundete Mittelwerte für Hausgärten (FAO-56 Tabelle 12 bzw. übliche
# Gartenwerte); in der Oberfläche überschreibbar.
PLANTS: Final[dict[str, tuple[float, float]]] = {
    "lawn": (0.8, 0.2),
    "flower_bed": (0.9, 0.3),
    "raised_bed": (1.0, 0.3),
    "vegetables": (1.05, 0.3),
    "roses": (0.9, 0.5),
    "shrubs": (0.6, 0.5),
    "trees": (0.7, 0.8),
    "pots": (1.1, 0.2),
}

# Böden: nutzbare Feldkapazität in mm Wasser je m Wurzeltiefe
# (FAO-56 Tabelle 19, Mittelwerte von (FC - WP) * 1000).
SOILS: Final[dict[str, float]] = {
    "sand": 70.0,
    "loamy_sand": 110.0,
    "sandy_loam": 140.0,
    "loam": 160.0,
    "silt_loam": 190.0,
    "clay_loam": 150.0,
    "clay": 140.0,
}
DEFAULT_SOIL: Final = "loam"
DEFAULT_ROOT_DEPTH_M: Final = 0.3

# Wie viel des Wassers bei der Pflanze ankommt (Konzept: 0,9 / 0,75).
EFFICIENCY_DRIP: Final = 0.9
EFFICIENCY_SPRINKLER: Final = 0.75

# Regen unter dieser Menge verdunstet auf Blättern und Oberfläche.
RAIN_MIN_EFFECTIVE_MM: Final = 2.0
# Vom übrigen Regen kommt dieser Anteil im Boden an.
RAIN_EFFECTIVE_FACTOR: Final = 0.8

SOLAR_CONSTANT: Final = 0.0820  # MJ m⁻² min⁻¹
KRS_INLAND: Final = 0.16  # Gleichung 50, Binnenland
ALBEDO: Final = 0.23
STEFAN_BOLTZMANN: Final = 4.903e-9  # MJ K⁻⁴ m⁻² Tag⁻¹


# Strahlung -----------------------------------------------------------------


def extraterrestrial_radiation(latitude_deg: float, day_of_year: int) -> float:
    """Ra in MJ m⁻² Tag⁻¹ (Gleichungen 21 bis 25)."""
    phi = math.radians(latitude_deg)
    dr = 1 + 0.033 * math.cos(2 * math.pi / 365 * day_of_year)
    delta = 0.409 * math.sin(2 * math.pi / 365 * day_of_year - 1.39)
    ws = math.acos(max(-1.0, min(1.0, -math.tan(phi) * math.tan(delta))))
    return (
        24
        * 60
        / math.pi
        * SOLAR_CONSTANT
        * dr
        * (
            ws * math.sin(phi) * math.sin(delta)
            + math.cos(phi) * math.cos(delta) * math.sin(ws)
        )
    )


def saturation_vapour_pressure(temp_c: float) -> float:
    """e°(T) in kPa (Gleichung 11)."""
    return 0.6108 * math.exp(17.27 * temp_c / (temp_c + 237.3))


def wind_at_2m(wind_ms: float, height_m: float = 10.0) -> float:
    """Wind in 2 m Höhe aus einer Messung in ``height_m`` (Gleichung 47).

    Wetterdienste geben den Wind meist in 10 m Höhe an.
    """
    return wind_ms * 4.87 / math.log(67.8 * height_m - 5.42)


# Verdunstung ---------------------------------------------------------------


def et0_hargreaves(
    t_min: float, t_max: float, latitude_deg: float, day_of_year: int
) -> float:
    """ET0 in mm/Tag nur aus Temperatur (Gleichung 52)."""
    t_mean = (t_min + t_max) / 2
    ra_mm = 0.408 * extraterrestrial_radiation(latitude_deg, day_of_year)
    spread = max(0.0, t_max - t_min)
    return max(0.0, 0.0023 * (t_mean + 17.8) * math.sqrt(spread) * ra_mm)


def et0_penman_monteith(
    *,
    t_min: float,
    t_max: float,
    rh_mean: float,
    wind_2m: float,
    latitude_deg: float,
    day_of_year: int,
    elevation_m: float = 0.0,
    solar_radiation: float | None = None,
) -> float:
    """ET0 in mm/Tag nach FAO-56 Penman-Monteith (Gleichung 6).

    ``solar_radiation`` (Rs, MJ m⁻² Tag⁻¹) wird ohne Messung aus dem
    Temperaturunterschied geschätzt (Gleichung 50).
    """
    t_mean = (t_min + t_max) / 2
    pressure = 101.3 * ((293 - 0.0065 * elevation_m) / 293) ** 5.26  # Gl. 7
    gamma = 0.665e-3 * pressure  # Gl. 8
    es = (saturation_vapour_pressure(t_max) + saturation_vapour_pressure(t_min)) / 2
    ea = es * max(0.0, min(100.0, rh_mean)) / 100  # vereinfacht (Gl. 19)
    delta = 4098 * saturation_vapour_pressure(t_mean) / (t_mean + 237.3) ** 2  # Gl. 13

    ra = extraterrestrial_radiation(latitude_deg, day_of_year)
    if solar_radiation is None:
        solar_radiation = KRS_INLAND * math.sqrt(max(0.0, t_max - t_min)) * ra
    rso = (0.75 + 2e-5 * elevation_m) * ra  # Gl. 37
    rns = (1 - ALBEDO) * solar_radiation  # Gl. 38
    ratio = min(1.0, solar_radiation / rso) if rso > 0 else 0.0
    rnl = (
        STEFAN_BOLTZMANN
        * ((t_max + 273.16) ** 4 + (t_min + 273.16) ** 4)
        / 2
        * (0.34 - 0.14 * math.sqrt(ea))
        * (1.35 * ratio - 0.35)
    )  # Gl. 39
    rn = rns - rnl
    numerator = 0.408 * delta * rn + gamma * 900 / (t_mean + 273) * wind_2m * (es - ea)
    denominator = delta + gamma * (1 + 0.34 * wind_2m)
    return max(0.0, numerator / denominator)


@dataclass(slots=True)
class DayWeather:
    """Wetter eines Tages, so wie es gesammelt wurde."""

    t_min: float
    t_max: float
    rh_mean: float | None = None
    wind_ms: float | None = None  # in 10 m Höhe
    rain_mm: float = 0.0


def et0_for_day(
    weather: DayWeather, latitude_deg: float, day_of_year: int, elevation_m: float
) -> float:
    """ET0 eines Tages: Penman-Monteith, wenn möglich, sonst Hargreaves."""
    if weather.rh_mean is not None and weather.wind_ms is not None:
        return et0_penman_monteith(
            t_min=weather.t_min,
            t_max=weather.t_max,
            rh_mean=weather.rh_mean,
            wind_2m=wind_at_2m(weather.wind_ms),
            latitude_deg=latitude_deg,
            day_of_year=day_of_year,
            elevation_m=elevation_m,
        )
    return et0_hargreaves(weather.t_min, weather.t_max, latitude_deg, day_of_year)


# Wasserhaushalt ------------------------------------------------------------


def effective_rain(rain_mm: float) -> float:
    """Wirksamer Regen: kleine Mengen verdunsten, vom Rest 80 %."""
    if rain_mm < RAIN_MIN_EFFECTIVE_MM:
        return 0.0
    return rain_mm * RAIN_EFFECTIVE_FACTOR


def total_available_water(soil_type: str | None, root_depth_m: float | None) -> float:
    """Nutzbare Feldkapazität im Wurzelraum in mm."""
    awc = SOILS.get(soil_type or DEFAULT_SOIL, SOILS[DEFAULT_SOIL])
    return awc * (root_depth_m or DEFAULT_ROOT_DEPTH_M)


def update_deficit(
    deficit_mm: float, etc_mm: float, rain_mm: float, taw_mm: float
) -> float:
    """Neues Defizit nach einem Tag: + Verdunstung - wirksamer Regen.

    Nie unter 0 (der Boden kann nicht mehr als voll sein) und nie über die
    nutzbare Feldkapazität (trockener als „leer“ geht nicht).
    """
    new = deficit_mm + etc_mm - effective_rain(rain_mm)
    return min(max(new, 0.0), taw_mm)


def liters_for(need_mm: float, area_m2: float, efficiency: float) -> float:
    """Liter, die das Ventil liefern muss (1 mm auf 1 m² = 1 L)."""
    if need_mm <= 0 or area_m2 <= 0:
        return 0.0
    return need_mm * area_m2 / max(0.05, efficiency)


def duration_for(liters: float, flow_l_min: float) -> int:
    """Gießdauer in ganzen Sekunden (aufgerundet)."""
    if liters <= 0 or flow_l_min <= 0:
        return 0
    return math.ceil(liters / flow_l_min * 60)


def mm_delivered(liters: float, area_m2: float, efficiency: float) -> float:
    """Wie viel mm eine gelieferte Wassermenge im Boden ausmacht."""
    if area_m2 <= 0:
        return 0.0
    return liters * efficiency / area_m2
