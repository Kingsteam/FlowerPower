"""Speicherung des Gartenmodells in ``.storage/irrigation_planner``.

Dünne Hülle um den Home-Assistant-``Store``. Das Format ist versioniert
(``STORAGE_VERSION``/``STORAGE_MINOR_VERSION``); spätere Formatänderungen
bekommen eine Migration in ``_IrrigationPlannerStorage._async_migrate_func``.

TODO: Umwandlung zwischen ``model.Garden`` und dem gespeicherten dict.
"""

from __future__ import annotations

from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store

from .const import STORAGE_KEY, STORAGE_MINOR_VERSION, STORAGE_VERSION

type StoredData = dict[str, Any]


def _empty_data() -> StoredData:
    """Leeres Gartenmodell."""
    return {
        "garden": {},
        "zones": [],
        "valves": [],
        "water_supplies": [],
        "programs": [],
        "sensors": [],
    }


class _IrrigationPlannerStorage(Store[StoredData]):
    """Store mit Migrationshaken."""

    async def _async_migrate_func(
        self,
        old_major_version: int,
        old_minor_version: int,
        old_data: StoredData,
    ) -> StoredData:
        """Migriert ältere Speicherformate. Bisher gibt es nur Version 1."""
        if old_major_version > STORAGE_VERSION:
            raise NotImplementedError("Speicherformat ist neuer als diese Version")
        return old_data


class IrrigationPlannerStore:
    """Lädt und speichert die Daten des Bewässerungsplaners."""

    def __init__(self, hass: HomeAssistant) -> None:
        """Initialisiert den Speicher."""
        self._store = _IrrigationPlannerStorage(
            hass,
            STORAGE_VERSION,
            STORAGE_KEY,
            minor_version=STORAGE_MINOR_VERSION,
        )
        self.data: StoredData = _empty_data()

    async def async_load(self) -> StoredData:
        """Lädt die gespeicherten Daten oder legt ein leeres Modell an."""
        stored = await self._store.async_load()
        self.data = {**_empty_data(), **stored} if stored else _empty_data()
        return self.data

    async def async_save(self) -> None:
        """Speichert die aktuellen Daten."""
        await self._store.async_save(self.data)
