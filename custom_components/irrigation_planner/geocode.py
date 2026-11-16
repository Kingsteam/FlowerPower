"""Adresssuche für das Luftbild (Nominatim / OpenStreetMap).

Das Panel fragt über die WebSocket-Schnittstelle, Home Assistant fragt
Nominatim mit einer eindeutigen Kennung (User-Agent), wie es die
Nutzungsregeln verlangen: höchstens eine Anfrage pro Sekunde, nur auf
Knopfdruck, keine Vorschläge beim Tippen. Die Adresse wird nirgends
gespeichert und nicht protokolliert.
"""

from __future__ import annotations

import asyncio
import time
from typing import Any, Final

import aiohttp
from homeassistant.core import HomeAssistant
from homeassistant.helpers.aiohttp_client import async_get_clientsession

NOMINATIM_URL: Final = "https://nominatim.openstreetmap.org/search"
USER_AGENT: Final = (
    "HomeAssistant-irrigation_planner (+https://github.com/Kingsteam/FlowerPower)"
)
MIN_INTERVAL_S: Final = 1.0
TIMEOUT_S: Final = 10
MAX_RESULTS: Final = 5
_LOCK: Final = "irrigation_planner_geocode_lock"
_LAST: Final = "irrigation_planner_geocode_last"


class GeocodeError(Exception):
    """Suche fehlgeschlagen (Text für die Anzeige)."""


def parse_places(raw: Any) -> list[dict[str, Any]]:
    """Wandelt die Antwort von Nominatim in Orte um (unbrauchbare fallen weg)."""
    if not isinstance(raw, list):
        return []
    places: list[dict[str, Any]] = []
    for hit in raw:
        if not isinstance(hit, dict) or not hit.get("display_name"):
            continue
        try:
            latitude = float(hit["lat"])
            longitude = float(hit["lon"])
        except KeyError, TypeError, ValueError:
            continue
        parts = [p.strip() for p in str(hit["display_name"]).split(",")]
        name = hit.get("name") or parts[0]
        detail = ", ".join([p for p in parts if p != name][:4])
        if any(p["name"] == name and p["detail"] == detail for p in places):
            continue  # gleicher Ort mehrfach (z. B. Platz und Haltestelle)
        places.append(
            {
                "name": name,
                "detail": detail,
                "latitude": latitude,
                "longitude": longitude,
            }
        )
    return places[:MAX_RESULTS]


async def async_search(
    hass: HomeAssistant, query: str, language: str = "de"
) -> list[dict[str, Any]]:
    """Sucht eine Adresse (höchstens eine Anfrage pro Sekunde)."""
    query = query.strip()
    if len(query) < 3:
        raise GeocodeError("Bitte mindestens 3 Zeichen eingeben")
    lock: asyncio.Lock = hass.data.setdefault(_LOCK, asyncio.Lock())
    async with lock:
        wait = hass.data.get(_LAST, 0.0) + MIN_INTERVAL_S - time.monotonic()
        if wait > 0:
            await asyncio.sleep(wait)
        hass.data[_LAST] = time.monotonic()
        session = async_get_clientsession(hass)
        try:
            async with session.get(
                NOMINATIM_URL,
                params={
                    "q": query,
                    "format": "jsonv2",
                    "limit": str(MAX_RESULTS),
                    "addressdetails": "0",
                    "accept-language": language,
                },
                headers={"User-Agent": USER_AGENT, "Accept": "application/json"},
                timeout=aiohttp.ClientTimeout(total=TIMEOUT_S),
            ) as resp:
                if resp.status != 200:
                    raise GeocodeError(
                        f"Die Adresssuche antwortet nicht ({resp.status})"
                    )
                raw = await resp.json(content_type=None)
        except (aiohttp.ClientError, TimeoutError) as err:
            raise GeocodeError("Die Adresssuche ist gerade nicht erreichbar") from err
    return parse_places(raw)
