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


# Grundriss ---------------------------------------------------------------------


def _features(*features: dict) -> Garden:
    return garden_from_dict({"features": list(features)})


def test_features_round_trip() -> None:
    garden = _features(
        {"id": "haus", "kind": "building", "points": [[0, 0], [8, 0], [8, 6]]},
        {"id": "zaun", "kind": "fence", "points": [[0, 10], [20, 10]]},
        {"id": "baum", "kind": "tree", "points": [[3, 3]], "radius_m": 2.5},
        {"id": "text", "kind": "label", "points": [[1, 1]], "label": "Gemüse"},
    )
    garden.background_opacity = 0.4
    GardenModel(garden=garden).validate()
    again = garden_from_dict(garden_to_dict(garden))
    assert again == garden
    assert again.features[2].radius_m == 2.5
    assert garden_from_dict({}).features == []
    assert garden_from_dict({}).background_opacity == 1.0


@pytest.mark.parametrize(
    ("feature", "message"),
    [
        ({"id": "a", "kind": "building", "points": [[0, 0], [1, 0]]}, "3 Punkte"),
        ({"id": "a", "kind": "fence", "points": [[0, 0]]}, "2 Punkte"),
        ({"id": "a", "kind": "tree", "points": [[0, 0]]}, "Kronenradius"),
        (
            {"id": "a", "kind": "tree", "points": [[0, 0], [1, 1]], "radius_m": 1},
            "einen",
        ),
        ({"id": "a", "kind": "label", "points": [[0, 0]], "label": " "}, "fehlt"),
        ({"id": "a", "kind": "label", "points": [[0, 0]], "label": "x" * 61}, "60"),
        ({"id": "a", "kind": "rakete", "points": [[0, 0]]}, "unbekannte"),
        ({"id": "a", "kind": "tap", "points": [[float("nan"), 0]]}, "Koordinate"),
    ],
)
def test_feature_validation(feature: dict, message: str) -> None:
    with pytest.raises(ValueError, match=message):
        GardenModel(garden=_features(feature)).validate()


def test_feature_ids_unique_and_opacity_range() -> None:
    tap = {"id": "a", "kind": "tap", "points": [[0, 0]]}
    with pytest.raises(ValueError, match="doppelt"):
        GardenModel(garden=_features(tap, tap)).validate()
    garden = _features(tap)
    garden.background_opacity = 1.5
    with pytest.raises(ValueError, match="Deckkraft"):
        GardenModel(garden=garden).validate()


# Gießschlauch -----------------------------------------------------------------


def hose(zone_id: str, points, radius) -> Zone:
    return Zone(
        id=zone_id, name=zone_id, type=ZoneType.HOSE, polygon=points, radius_m=radius
    )


def test_hose_area_and_contains() -> None:
    zone = hose("s", [(0.0, 0.0), (10.0, 0.0)], 0.5)
    # 10 m mal 1 m plus zwei Halbkreise (= ein Kreis mit 0,5 m)
    assert geo.zone_area(zone) == pytest.approx(10 + math.pi * 0.25)
    assert geo.contains(zone, (5.0, 0.4))
    assert not geo.contains(zone, (5.0, 0.6))
    assert geo.contains(zone, (10.4, 0.0))  # rundes Ende
    assert geo.bounds(zone) == (-0.5, -0.5, 10.5, 0.5)
    overlap = geo.overlaps([zone, hose("t", [(5.0, -5.0), (5.0, 5.0)], 0.5)])
    assert overlap["s"] == pytest.approx(1.0, rel=0.15)


@pytest.mark.parametrize(
    ("zone", "message"),
    [
        (hose("s", [(0.0, 0.0)], 0.5), "2 Punkte"),
        (hose("s", [(0.0, 0.0), (1.0, 0.0)], None), "Breite"),
    ],
)
def test_hose_validation(zone: Zone, message: str) -> None:
    with pytest.raises(ValueError, match=message):
        GardenModel(zones=[zone]).validate()


def test_tree_trunk() -> None:
    tree = {
        "id": "b",
        "kind": "tree",
        "points": [[0, 0]],
        "radius_m": 2,
        "trunk_m": 0.6,
    }
    garden = _features(tree)
    GardenModel(garden=garden).validate()
    assert garden_from_dict(garden_to_dict(garden)).features[0].trunk_m == 0.6
    with pytest.raises(ValueError, match="Stamm"):
        GardenModel(garden=_features({**tree, "trunk_m": 5})).validate()
