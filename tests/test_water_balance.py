"""Tests für den Rechenkern, mit den Rechenbeispielen aus FAO-56."""

from __future__ import annotations

import pytest

from custom_components.irrigation_planner.water_balance import (
    PLANTS,
    SOILS,
    DayWeather,
    duration_for,
    effective_rain,
    et0_for_day,
    et0_hargreaves,
    et0_penman_monteith,
    extraterrestrial_radiation,
    liters_for,
    mm_delivered,
    saturation_vapour_pressure,
    total_available_water,
    update_deficit,
    wind_at_2m,
)


def test_extraterrestrial_radiation_fao_example_8() -> None:
    """FAO-56 Beispiel 8: 20° Süd, 3. September → Ra = 32,2 MJ/m²/Tag."""
    assert extraterrestrial_radiation(-20.0, 246) == pytest.approx(32.2, abs=0.1)


def test_saturation_vapour_pressure() -> None:
    """FAO-56 Beispiel 3: e°(24,5 °C) = 3,075 kPa."""
    assert saturation_vapour_pressure(24.5) == pytest.approx(3.075, abs=0.002)


def test_wind_at_2m_fao_example_14() -> None:
    """FAO-56 Beispiel 14: 3,2 m/s in 10 m Höhe → 2,4 m/s in 2 m."""
    assert wind_at_2m(3.2, 10) == pytest.approx(2.4, abs=0.01)


def test_hargreaves_fao_example_20() -> None:
    """FAO-56 Beispiel 20: Lyon, 15. Juli, 26,6/14,8 °C → ET0 = 5,0 mm/Tag."""
    assert et0_hargreaves(14.8, 26.6, 45.72, 196) == pytest.approx(5.0, abs=0.1)


def test_penman_monteith_fao_example_18() -> None:
    """FAO-56 Beispiel 18: Brüssel, 6. Juli → ET0 = 3,9 mm/Tag.

    Mit gemessener Strahlung (22,07 MJ) und mittlerer Luftfeuchte statt
    RHmax/RHmin; die kleine Abweichung kommt von dieser Vereinfachung.
    """
    et0 = et0_penman_monteith(
        t_min=12.3,
        t_max=21.5,
        rh_mean=(63 + 84) / 2,
        wind_2m=wind_at_2m(2.78),
        latitude_deg=50.8,
        day_of_year=187,
        elevation_m=100,
        solar_radiation=22.07,
    )
    assert et0 == pytest.approx(3.9, abs=0.2)


def test_penman_monteith_without_radiation_is_plausible() -> None:
    """Ohne Strahlungsmessung: geschätzt, Größenordnung wie gemessen."""
    et0 = et0_penman_monteith(
        t_min=12.3,
        t_max=21.5,
        rh_mean=73.5,
        wind_2m=2.078,
        latitude_deg=50.8,
        day_of_year=187,
        elevation_m=100,
    )
    assert 3.0 < et0 < 4.5


def test_et0_for_day_falls_back_to_hargreaves() -> None:
    full = DayWeather(t_min=12.3, t_max=21.5, rh_mean=73.5, wind_ms=2.78)
    temp_only = DayWeather(t_min=12.3, t_max=21.5)
    assert et0_for_day(temp_only, 50.8, 187, 100) == pytest.approx(
        et0_hargreaves(12.3, 21.5, 50.8, 187)
    )
    assert et0_for_day(full, 50.8, 187, 100) != et0_for_day(temp_only, 50.8, 187, 100)


def test_winter_et0_is_small_and_never_negative() -> None:
    assert et0_hargreaves(-5, -1, 48.0, 15) < 0.5
    assert et0_hargreaves(5, 3, 48.0, 15) >= 0  # Tmax < Tmin: kein Fehler


@pytest.mark.parametrize(("rain", "expected"), [(0, 0), (1.9, 0), (2, 1.6), (10, 8)])
def test_effective_rain(rain: float, expected: float) -> None:
    assert effective_rain(rain) == pytest.approx(expected)


def test_total_available_water() -> None:
    assert total_available_water("loam", 0.3) == pytest.approx(48)
    assert total_available_water(None, None) == pytest.approx(48)  # Standard
    assert total_available_water("sand", 0.2) == pytest.approx(14)


def test_update_deficit_is_capped() -> None:
    assert update_deficit(10, 4, 0, 48) == 14
    assert update_deficit(10, 4, 20, 48) == 0  # Regen füllt auf, nie unter 0
    assert update_deficit(46, 4, 0, 48) == 48  # nie trockener als „leer“


def test_handbook_example_vorgarten() -> None:
    """Handbuch, Kapitel 9: 12,6 m² Tropf, 3,8 mm, 4,5 L/min → ~53 L, ~11:47."""
    liters = liters_for(3.8, 12.6, 0.9)
    assert liters == pytest.approx(53.2, abs=0.1)
    assert duration_for(liters, 4.5) == pytest.approx(11 * 60 + 47, abs=3)
    assert mm_delivered(liters, 12.6, 0.9) == pytest.approx(3.8)


def test_no_water_without_need_area_or_flow() -> None:
    assert liters_for(0, 10, 0.9) == 0
    assert liters_for(5, 0, 0.9) == 0
    assert duration_for(50, 0) == 0
    assert duration_for(0, 5) == 0


def test_tables_are_plausible() -> None:
    assert all(
        0.3 <= kc <= 1.3 and 0.1 <= depth <= 1.5 for kc, depth in PLANTS.values()
    )
    assert all(50 <= awc <= 250 for awc in SOILS.values())
