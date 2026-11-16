"""Tests für die Geometrie des Gartenplans (ohne Home Assistant)."""

from __future__ import annotations

import math

import pytest

from custom_components.irrigation_planner import geometry as geo
from custom_components.irrigation_planner.model import (
    BackgroundType,
    DurationMode,
    Garden,
    GardenModel,
    Zone,
    ZoneType,
)
from custom_components.irrigation_planner.serialize import (
    garden_from_dict,
    garden_to_dict,
)


def sprinkler(zone_id: str, center, radius, start=0.0, arc=360.0) -> Zone:
    return Zone(
        id=zone_id,
        name=zone_id,
        type=ZoneType.SPRINKLER,
        center=center,
        radius_m=radius,
        start_angle_deg=start,
        arc_deg=arc,
    )


def bed(zone_id: str, polygon) -> Zone:
    return Zone(id=zone_id, name=zone_id, type=ZoneType.DRIP, polygon=polygon)


def test_sector_area() -> None:
    assert geo.sector_area(2, 360) == pytest.approx(4 * math.pi)
    assert geo.sector_area(2, 90) == pytest.approx(math.pi)
    assert geo.sector_area(2, 400) == pytest.approx(4 * math.pi)  # gekappt


def test_polygon_area_any_direction() -> None:
    square = [(0.0, 0.0), (4.0, 0.0), (4.0, 3.0), (0.0, 3.0)]
    assert geo.polygon_area(square) == pytest.approx(12)
    assert geo.polygon_area(list(reversed(square))) == pytest.approx(12)
    assert geo.polygon_area(square[:2]) == 0


def test_zone_area_prefers_drawing() -> None:
    zone = sprinkler("z", (0.0, 0.0), 3.0, arc=180)
    zone.area_m2 = 99.0
    assert geo.zone_area(zone) == pytest.approx(math.pi * 9 / 2)
    zone.center = None
    assert geo.zone_area(zone) == 99.0
    assert geo.zone_area(bed("b", [])) is None


def test_compass_angles() -> None:
    # Start 90° (Osten), Öffnung 180°: Osten über Süden nach Westen.
    args = ((0.0, 0.0), 5.0, 90.0, 180.0)
    assert geo.in_sector((3.0, 0.0), *args)  # Osten
    assert geo.in_sector((0.0, 3.0), *args)  # Süden (y nach unten)
    assert geo.in_sector((-3.0, 0.1), *args)  # Westen, knapp südlich
    assert not geo.in_sector((0.0, -3.0), *args)  # Norden
    assert not geo.in_sector((6.0, 0.0), *args)  # zu weit
    # Segment über Norden hinweg (300° + 120° = bis 60°).
    assert geo.in_sector((0.0, -3.0), (0.0, 0.0), 5.0, 300.0, 120.0)
    assert not geo.in_sector((0.0, 3.0), (0.0, 0.0), 5.0, 300.0, 120.0)


def test_in_polygon() -> None:
    shape = [(0.0, 0.0), (4.0, 0.0), (4.0, 4.0), (2.0, 1.0), (0.0, 4.0)]
    assert geo.in_polygon((1.0, 0.5), shape)
    assert not geo.in_polygon((2.0, 3.0), shape)  # in der Einbuchtung
    assert not geo.in_polygon((5.0, 1.0), shape)


def test_overlap_matches_lens_area() -> None:
    r, d = 3.0, 3.0
    lens = 2 * r * r * math.acos(d / (2 * r)) - d / 2 * math.sqrt(4 * r * r - d * d)
    result = geo.overlaps(
        [
            sprinkler("a", (0.0, 0.0), r),
            sprinkler("b", (d, 0.0), r),
            bed("weit", [(50.0, 50.0), (51.0, 50.0), (51.0, 51.0)]),
        ]
    )
    assert result["a"] == pytest.approx(lens, rel=0.03)
    assert result["b"] == pytest.approx(lens, rel=0.03)
    assert result["weit"] == 0


def test_overlap_needs_two_zones() -> None:
    assert geo.overlaps([sprinkler("a", (0.0, 0.0), 2.0)]) == {"a": 0.0}


def test_meters_per_pixel() -> None:
    assert geo.meters_per_pixel(0, 0) == pytest.approx(156_543.03, abs=0.01)
    assert geo.meters_per_pixel(60, 1) == pytest.approx(156_543.03 / 4, abs=0.01)


def test_latlon_round_trip() -> None:
    origin = (48.0, 15.0)
    x, y = geo.latlon_to_plan(48.0001, 15.0002, origin)
    assert x > 0  # östlich
    assert y < 0  # nördlich, also nach oben
    assert y == pytest.approx(-11.13, abs=0.01)
    lat, lon = geo.plan_to_latlon((x, y), origin)
    assert (lat, lon) == pytest.approx((48.0001, 15.0002), abs=1e-9)


def test_garden_serialize_round_trip() -> None:
    garden = Garden(
        background=BackgroundType.MAP,
        latitude=48.0,
        longitude=15.0,
        map_zoom=19.5,
        map_provider="custom",
        map_url="https://tiles.example/{z}/{x}/{y}.png",
    )
    assert garden_from_dict(garden_to_dict(garden)) == garden
    assert garden_from_dict({}).background is BackgroundType.NONE


@pytest.mark.parametrize(
    ("garden", "message"),
    [
        (Garden(background=BackgroundType.MAP), "Kartenmitte"),
        (
            Garden(
                background=BackgroundType.MAP,
                latitude=48.0,
                longitude=15.0,
                map_zoom=19,
                map_provider="custom",
                map_url="http://tiles.example/{z}/{x}/{y}",
            ),
            "https",
        ),
        (Garden(background=BackgroundType.IMAGE), "Datei"),
        (
            Garden(
                background=BackgroundType.IMAGE,
                background_image="plan.png",
                scale_points=((1.0, 1.0), (1.0, 1.0)),
                scale_distance_m=5.0,
            ),
            "Maßstab",
        ),
    ],
)
def test_garden_validation(garden: Garden, message: str) -> None:
    with pytest.raises(ValueError, match=message):
        GardenModel(garden=garden).validate()


@pytest.mark.parametrize(
    ("zone", "message"),
    [
        (sprinkler("z", (0.0, 0.0), 0.0), "Radius"),
        (sprinkler("z", (0.0, 0.0), 2.0, arc=0), "Öffnungswinkel"),
        (bed("z", [(0.0, 0.0), (1.0, 0.0)]), "3 Punkte"),
    ],
)
def test_zone_geometry_validation(zone: Zone, message: str) -> None:
    with pytest.raises(ValueError, match=message):
        GardenModel(zones=[zone]).validate()


def test_calculated_zone_with_drawing_needs_no_area() -> None:
    zone = sprinkler("z", (0.0, 0.0), 2.0)
    zone.duration_mode = DurationMode.CALCULATED
    GardenModel(zones=[zone]).validate()


def test_map_providers_are_complete() -> None:
    from custom_components.irrigation_planner.const import MAP_PROVIDERS

    assert "basemap_at" in MAP_PROVIDERS
    for key, provider in MAP_PROVIDERS.items():
        for url in filter(None, (provider["url"], provider.get("overlay"))):
            assert url.startswith("https://"), key
            assert all(p in url for p in ("{z}", "{x}", "{y}")), key
        assert provider["short"], key
        assert provider["kind"] in ("photo", "map"), key
        assert provider["attribution"], key
        assert 1 <= provider["max_zoom"] <= 22, key
