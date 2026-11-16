"""Speicherung des Gartenmodells in ``.storage/irrigation_planner``.

Dünne Hülle um den Home-Assistant-``Store``. Das Format ist versioniert
(``STORAGE_VERSION``/``STORAGE_MINOR_VERSION``); spätere Formatänderungen
bekommen eine Migration in ``_IrrigationPlannerStorage._async_migrate_func``.

Im Speicher liegt das Modell als ``GardenModel``; die Umwandlung steht in
``serialize.py``. Defekte Daten werden nie still überschrieben: Das Laden
bricht dann mit ``ValueError`` ab.
"""

from __future__ import annotations

from typing import Any

from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.storage import Store

from .const import STORAGE_KEY, STORAGE_MINOR_VERSION, STORAGE_VERSION
from .model import GardenModel
from .serialize import model_from_dict, model_to_dict

type StoredData = dict[str, Any]


def _empty_data() -> StoredData:
    """Leeres Gartenmodell."""
    return {
        "settings": {},
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
        self.model = GardenModel()

    @property
    def data(self) -> StoredData:
        """Das Modell so, wie es gespeichert wird."""
        return model_to_dict(self.model)

    async def async_load(self) -> GardenModel:
        """Lädt die gespeicherten Daten oder legt ein leeres Modell an.

        Löst ``ValueError`` aus, wenn die Daten nicht zusammenpassen.
        """
        stored = await self._store.async_load()
        try:
            self.model = model_from_dict({**_empty_data(), **(stored or {})})
        except (KeyError, TypeError) as err:
            raise ValueError(f"Gespeicherte Daten sind unvollständig: {err}") from err
        return self.model

    @callback
    def async_schedule_save(self) -> None:
        """Speichert gleich (gebündelt), z. B. nach einem Schalterwechsel."""
        self.model.validate()
        self._store.async_delay_save(lambda: model_to_dict(self.model), 1)

    async def async_save(self) -> None:
        """Prüft und speichert das aktuelle Modell."""
        self.model.validate()
        await self._store.async_save(model_to_dict(self.model))
