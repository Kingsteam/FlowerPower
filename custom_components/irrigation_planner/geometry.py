"""Geometrie des Gartenplans (Konzept, Abschnitt 5.1).

Planpunkte sind in **Metern**: x nach Osten (rechts), y nach Süden (unten),
wie auf dem Bildschirm. Ursprung (0, 0) ist bei einem Luftbild die
gespeicherte Kartenmitte, bei einem hochgeladenen Bild die linke obere Ecke.

Winkel von Sprinklern zählen wie beim Kompass: 0° = Norden, im
Uhrzeigersinn. Ein Sprinkler mit Start 90° und Öffnung 180° beregnet den
Halbkreis von Osten über Süden nach Westen.

Reine Rechnungen ohne Home Assistant.
"""

from __future__ import annotations

from collections.abc import Iterable, Sequence
import math
from typing import Final

from .model import Point, Zone, ZoneType

EARTH_RADIUS_M: Final = 6_378_137.0  # wie Web-Mercator (Kartenkacheln)
TILE_SIZE_PX: Final = 256
# So viele Rasterpunkte höchstens für die Überlappung (Genauigkeit vs. Zeit).
OVERLAP_MAX_SAMPLES: Final = 60_000


# Flächen ---------------------------------------------------------------------


def sector_area(radius_m: float, arc_deg: float) -> float:
    """Fläche eines Kreissegments: π·r²·(Öffnungswinkel/360°)."""
    arc = max(0.0, min(360.0, arc_deg))
    return math.pi * radius_m**2 * arc / 360.0


def polygon_area(points: Sequence[Point]) -> float:
    """Fläche eines Polygons nach der Gaußschen Trapezformel (immer ≥ 0)."""
    if len(points) < 3:
        return 0.0
    total = 0.0
    for (x1, y1), (x2, y2) in zip(points, [*points[1:], points[0]], strict=True):
        total += x1 * y2 - x2 * y1
    return abs(total) / 2


def has_geometry(zone: Zone) -> bool:
    """Gibt an, ob die Zone auf dem Plan gezeichnet ist."""
    if zone.type is ZoneType.SPRINKLER:
        return zone.center is not None and bool(zone.radius_m)
    return len(zone.polygon) >= 3


def geometry_area(zone: Zone) -> float | None:
    """Fläche aus der Zeichnung (``None``, wenn nicht gezeichnet)."""
    if not has_geometry(zone):
        return None
    if zone.type is ZoneType.SPRINKLER:
        return sector_area(zone.radius_m or 0.0, zone.arc_deg)
    return polygon_area(zone.polygon)


def zone_area(zone: Zone) -> float | None:
    """Fläche für die Berechnung: aus der Zeichnung, sonst von Hand."""
    area = geometry_area(zone)
    return area if area is not None else zone.area_m2


# Punkt in Fläche ---------------------------------------------------------------


def _compass_deg(dx: float, dy: float) -> float:
    """Richtung eines Vektors als Kompasswinkel (0° Norden, im Uhrzeigersinn)."""
    return math.degrees(math.atan2(dx, -dy)) % 360


def in_sector(
    point: Point, center: Point, radius_m: float, start_deg: float, arc_deg: float
) -> bool:
    """Prüft, ob der Punkt im Kreissegment liegt."""
    dx, dy = point[0] - center[0], point[1] - center[1]
    if dx * dx + dy * dy > radius_m * radius_m:
        return False
    if arc_deg >= 360:
        return True
    angle = (_compass_deg(dx, dy) - start_deg) % 360
    return angle <= arc_deg


def in_polygon(point: Point, polygon: Sequence[Point]) -> bool:
    """Prüft (Strahlverfahren), ob der Punkt im Polygon liegt."""
    x, y = point
    inside = False
    n = len(polygon)
    for i in range(n):
        x1, y1 = polygon[i]
        x2, y2 = polygon[(i + 1) % n]
        if (y1 > y) != (y2 > y):
            cross = x1 + (y - y1) * (x2 - x1) / (y2 - y1)
            if x < cross:
                inside = not inside
    return inside


def contains(zone: Zone, point: Point) -> bool:
    """Prüft, ob der Punkt in der gezeichneten Zone liegt."""
    if not has_geometry(zone):
        return False
    if zone.type is ZoneType.SPRINKLER:
        assert zone.center is not None
        return in_sector(
            point, zone.center, zone.radius_m or 0.0, zone.start_angle_deg, zone.arc_deg
        )
    return in_polygon(point, zone.polygon)


def bounds(zone: Zone) -> tuple[float, float, float, float] | None:
    """Umgebendes Rechteck (x_min, y_min, x_max, y_max)."""
    if not has_geometry(zone):
        return None
    if zone.type is ZoneType.SPRINKLER:
        assert zone.center is not None
        r = zone.radius_m or 0.0
        cx, cy = zone.center
        return cx - r, cy - r, cx + r, cy + r
    xs = [p[0] for p in zone.polygon]
    ys = [p[1] for p in zone.polygon]
    return min(xs), min(ys), max(xs), max(ys)


def overlaps(zones: Iterable[Zone]) -> dict[str, float]:
    """Je Zone die Fläche (m²), die auch von einer anderen Zone erfasst wird.

    Näherung über ein Raster; der Rasterabstand passt sich der Gartengröße
    an (höchstens ``OVERLAP_MAX_SAMPLES`` Punkte, mindestens 5 cm).
    """
    drawn = [z for z in zones if has_geometry(z)]
    result = {z.id: 0.0 for z in drawn}
    if len(drawn) < 2:
        return result
    boxes = [bounds(z) for z in drawn]
    x_min = min(b[0] for b in boxes if b)
    y_min = min(b[1] for b in boxes if b)
    x_max = max(b[2] for b in boxes if b)
    y_max = max(b[3] for b in boxes if b)
    width, height = x_max - x_min, y_max - y_min
    step = max(0.05, math.sqrt(max(width * height, 1e-9) / OVERLAP_MAX_SAMPLES))
    cell = step * step
    y = y_min + step / 2
    while y < y_max:
        x = x_min + step / 2
        while x < x_max:
            hits = [
                z.id
                for z, b in zip(drawn, boxes, strict=True)
                if b and b[0] <= x <= b[2] and b[1] <= y <= b[3] and contains(z, (x, y))
            ]
            if len(hits) > 1:
                for zone_id in hits:
                    result[zone_id] += cell
            x += step
        y += step
    return result


# Karte -----------------------------------------------------------------------


def meters_per_pixel(latitude_deg: float, zoom: float) -> float:
    """Meter je Pixel einer Web-Mercator-Karte (256-px-Kacheln) am Breitengrad."""
    circumference = 2 * math.pi * EARTH_RADIUS_M
    return (
        circumference * math.cos(math.radians(latitude_deg)) / (TILE_SIZE_PX * 2**zoom)
    )


def latlon_to_plan(lat: float, lon: float, origin: tuple[float, float]) -> Point:
    """Geokoordinate → Planmeter relativ zum Ursprung (für Gartengröße genau genug)."""
    lat0, lon0 = origin
    x = math.radians(lon - lon0) * EARTH_RADIUS_M * math.cos(math.radians(lat0))
    y = -math.radians(lat - lat0) * EARTH_RADIUS_M
    return (x, y)


def plan_to_latlon(point: Point, origin: tuple[float, float]) -> tuple[float, float]:
    """Planmeter → Geokoordinate (Umkehrung von ``latlon_to_plan``)."""
    lat0, lon0 = origin
    lat = lat0 - math.degrees(point[1] / EARTH_RADIUS_M)
    lon = lon0 + math.degrees(
        point[0] / (EARTH_RADIUS_M * math.cos(math.radians(lat0)))
    )
    return (lat, lon)
