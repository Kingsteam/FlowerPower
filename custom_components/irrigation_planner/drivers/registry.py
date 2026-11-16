"""Verzeichnis der Treiber: aus einem Ventil im Modell den Treiber bauen.

Eigenes Modul (nicht in ``drivers/__init__.py``), weil ``model.py`` die
Basisklasse importiert und die Treiber wiederum ``model.py`` brauchen.
"""

from __future__ import annotations

from typing import Final

from homeassistant.core import HomeAssistant

from ..model import Valve
from ..profiles import Profile
from .ha import HassValveDriver
from .ha_switch import HaSwitchDriver
from .ha_valve import HaValveDriver
from .service_call import ServiceCallDriver
from .zigbee2mqtt import Zigbee2MqttDriver

DRIVERS: Final[dict[str, type[HassValveDriver]]] = {
    cls.name: cls
    for cls in (HaSwitchDriver, HaValveDriver, Zigbee2MqttDriver, ServiceCallDriver)
}


def create_driver(
    hass: HomeAssistant, valve: Valve, profiles: dict[str, Profile]
) -> HassValveDriver:
    """Baut den Treiber für ein Ventil (``ValueError`` bei Fehlern)."""
    try:
        driver_cls = DRIVERS[valve.driver]
    except KeyError:
        raise ValueError(
            f"{valve.name}: unbekannter Treiber {valve.driver!r}"
        ) from None
    profile = None
    if valve.profile is not None:
        if (profile := profiles.get(valve.profile)) is None:
            raise ValueError(f"{valve.name}: unbekanntes Profil {valve.profile!r}")
        if profile.driver != valve.driver:
            raise ValueError(
                f"{valve.name}: Profil {profile.id} gehört zum Treiber "
                f"{profile.driver}, nicht {valve.driver}"
            )
    return driver_cls(hass, valve, profile)
