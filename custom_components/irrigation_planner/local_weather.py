"""Eigene Wetterfühler im Garten (Temperatur, Luftfeuchte, Wind).

Ist ein Sensor dieser Art eingerichtet, ersetzt sein Messwert den Wert der
Wetter-Entität: für die Verdunstung (``balance.py``) und für Frost/Wind beim
Überspringen von Programmen (``programs.py``). Fehlt der Messwert (nicht
erreichbar, keine Zahl), gilt wieder die Wetter-Entität.
"""

from __future__ import annotations

from homeassistant.const import (
    ATTR_UNIT_OF_MEASUREMENT,
    STATE_UNAVAILABLE,
    STATE_UNKNOWN,
    UnitOfSpeed,
    UnitOfTemperature,
)
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import entity_registry as er
from homeassistant.util.unit_conversion import SpeedConverter, TemperatureConverter

from .const import LOGGER
from .model import GardenModel, SensorKind

LOCAL_KINDS = (SensorKind.TEMPERATURE, SensorKind.HUMIDITY, SensorKind.WIND_SPEED)


def _raw(
    hass: HomeAssistant, model: GardenModel, kind: SensorKind
) -> tuple[float, str | None] | None:
    sensor = next((s for s in model.sensors if s.kind is kind), None)
    if sensor is None:
        return None
    entity_id = er.async_get(hass).async_get_entity_id(
        sensor.entity.domain, sensor.entity.platform, sensor.entity.unique_id
    )
    state = hass.states.get(entity_id) if entity_id else None
    if state is None or state.state in (STATE_UNAVAILABLE, STATE_UNKNOWN):
        return None
    try:
        value = float(state.state)
    except ValueError:
        return None
    return value, state.attributes.get(ATTR_UNIT_OF_MEASUREMENT)


def local_temperature_c(hass: HomeAssistant, model: GardenModel) -> float | None:
    """Temperatur des eigenen Fühlers in °C (``None`` = keiner oder kein Wert)."""
    if (raw := _raw(hass, model, SensorKind.TEMPERATURE)) is None:
        return None
    value, unit = raw
    try:
        return TemperatureConverter.convert(
            value, unit or UnitOfTemperature.CELSIUS, UnitOfTemperature.CELSIUS
        )
    except HomeAssistantError as err:
        LOGGER.debug("Temperatur nicht lesbar: %s", err)
        return None


def local_humidity(hass: HomeAssistant, model: GardenModel) -> float | None:
    """Relative Luftfeuchte des eigenen Fühlers in %."""
    if (raw := _raw(hass, model, SensorKind.HUMIDITY)) is None:
        return None
    value = raw[0]
    return value if 0 <= value <= 100 else None


def local_wind_ms(hass: HomeAssistant, model: GardenModel) -> float | None:
    """Windgeschwindigkeit des eigenen Fühlers in m/s."""
    if (raw := _raw(hass, model, SensorKind.WIND_SPEED)) is None:
        return None
    value, unit = raw
    try:
        return SpeedConverter.convert(
            value,
            unit or UnitOfSpeed.KILOMETERS_PER_HOUR,
            UnitOfSpeed.METERS_PER_SECOND,
        )
    except HomeAssistantError as err:
        LOGGER.debug("Wind nicht lesbar: %s", err)
        return None
