"""Abstrakte Basisklasse für Ventiltreiber.

Sicherheitsregel: Ein Ventil wird NIE ohne Dauer geöffnet.
``ValveDriver.async_open`` prüft die Dauer, bevor der Treiber überhaupt
etwas tut. Treiber implementieren ``_async_open`` und dürfen
``async_open`` nicht überschreiben (wird beim Anlegen der Klasse geprüft).

Kann ein Treiber ``Capability.DEVICE_TIMER``, MUSS er die Dauer ans Gerät
mitschicken, damit das Ventil auch ohne Home Assistant von selbst schließt.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from enum import StrEnum
from typing import Any, ClassVar

from ..const import MAX_VALVE_DURATION_S, MIN_VALVE_DURATION_S


class Capability(StrEnum):
    """Fähigkeiten eines Treibers bzw. Geräts."""

    DEVICE_TIMER = "device_timer"  # Gerät schließt selbst nach mitgeschickter Dauer
    VOLUME_MODE = "volume_mode"  # Gerät kann "N Liter" statt "N Sekunden"
    FLOW = "flow"  # misst Durchfluss
    VOLUME = "volume"  # misst Menge
    STATUS = "status"  # meldet Wassermangel oder Leck
    POSITION = "position"  # kann teilweise öffnen


class SafetyLevel(StrEnum):
    """Sicherheitsstufe eines Ventils, wie sie die Oberfläche anzeigt."""

    DEVICE = "device"  # grün: Gerät schließt selbst
    HA_ONLY = "ha_only"  # gelb: nur Home Assistant überwacht die Zeit


def validate_duration(duration_s: Any) -> int:
    """Prüft eine Öffnungsdauer und gibt sie als ``int`` zurück.

    Erlaubt sind ganze Sekunden von ``MIN_VALVE_DURATION_S`` bis
    ``MAX_VALVE_DURATION_S``. Alles andere (``None``, 0, negativ, zu groß,
    Kommazahl, Text, ``bool``) löst ``ValueError`` aus.
    """
    if isinstance(duration_s, bool) or not isinstance(duration_s, int):
        raise ValueError(
            f"Ventil darf nur mit einer Dauer in ganzen Sekunden öffnen, "
            f"nicht mit {duration_s!r}"
        )
    if duration_s < MIN_VALVE_DURATION_S:
        raise ValueError(
            f"Ventil darf nur mit positiver Dauer öffnen, nicht mit {duration_s} s"
        )
    if duration_s > MAX_VALVE_DURATION_S:
        raise ValueError(
            f"Dauer {duration_s} s ist länger als die Obergrenze "
            f"{MAX_VALVE_DURATION_S} s"
        )
    return duration_s


class ValveDriver(ABC):
    """Basisklasse für alle Ventiltreiber."""

    #: Fähigkeiten, die der Treiber grundsätzlich bietet.
    capabilities: ClassVar[frozenset[Capability]] = frozenset()

    def __init_subclass__(cls, **kwargs: Any) -> None:
        """Verhindert, dass Unterklassen die Dauerprüfung umgehen."""
        super().__init_subclass__(**kwargs)
        if "async_open" in cls.__dict__:
            raise TypeError(
                f"{cls.__name__} darf async_open nicht überschreiben; "
                "bitte _async_open implementieren"
            )

    @property
    def safety_level(self) -> SafetyLevel:
        """Grün, wenn das Gerät selbst schließt, sonst gelb."""
        if Capability.DEVICE_TIMER in self.capabilities:
            return SafetyLevel.DEVICE
        return SafetyLevel.HA_ONLY

    async def async_open(self, duration_s: int) -> None:
        """Öffnet das Ventil für ``duration_s`` Sekunden.

        Die Dauer ist Pflicht und muss positiv sein, sonst ``ValueError``.
        """
        await self._async_open(validate_duration(duration_s))

    @abstractmethod
    async def _async_open(self, duration_s: int) -> None:
        """Öffnet das Ventil. ``duration_s`` ist bereits geprüft.

        Treiber mit ``Capability.DEVICE_TIMER`` schicken die Dauer ans Gerät.
        """

    @abstractmethod
    async def async_close(self) -> None:
        """Schließt das Ventil."""
