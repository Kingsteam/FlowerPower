"""Messwerte der simulierten Ventile, Bodenfeuchte und Zuleitung."""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass

from homeassistant.components.sensor import (
    SensorDeviceClass,
    SensorEntity,
    SensorEntityDescription,
    SensorStateClass,
)
from homeassistant.const import (
    PERCENTAGE,
    EntityCategory,
    UnitOfTime,
    UnitOfVolume,
    UnitOfVolumeFlowRate,
)
from homeassistant.core import HomeAssistant
from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from . import SimConfigEntry
from .const import DOMAIN
from .entity import SimValveEntity
from .sim import Simulator, SimValve

STATUS_OPTIONS = ["normal_state", "water_shortage", "water_leakage"]


@dataclass(frozen=True, kw_only=True)
class SimSensorDescription(SensorEntityDescription):
    """Beschreibung eines Ventil-Sensors."""

    value: Callable[[SimValve], float | int | str | None]


VALVE_SENSORS: tuple[SimSensorDescription, ...] = (
    SimSensorDescription(
        key="flow",
        name="Durchfluss",
        device_class=SensorDeviceClass.VOLUME_FLOW_RATE,
        native_unit_of_measurement=UnitOfVolumeFlowRate.LITERS_PER_MINUTE,
        state_class=SensorStateClass.MEASUREMENT,
        value=lambda v: v.flow_l_min,
    ),
    SimSensorDescription(
        key="volume",
        name="Menge gesamt",
        device_class=SensorDeviceClass.WATER,
        native_unit_of_measurement=UnitOfVolume.LITERS,
        state_class=SensorStateClass.TOTAL_INCREASING,
        suggested_display_precision=1,
        value=lambda v: round(v.total_l, 3),
    ),
    SimSensorDescription(
        key="run_volume",
        name="Menge letzter Lauf",
        device_class=SensorDeviceClass.VOLUME,
        native_unit_of_measurement=UnitOfVolume.LITERS,
        suggested_display_precision=1,
        value=lambda v: round(v.run_l, 3),
    ),
    SimSensorDescription(
        key="run_duration",
        name="Dauer letzter Lauf",
        device_class=SensorDeviceClass.DURATION,
        native_unit_of_measurement=UnitOfTime.SECONDS,
        value=lambda v: round(v.run_s),
    ),
    SimSensorDescription(
        key="status",
        name="Gerätestatus",
        device_class=SensorDeviceClass.ENUM,
        options=STATUS_OPTIONS,
        value=lambda v: v.status,
    ),
    SimSensorDescription(
        key="battery",
        name="Batterie",
        device_class=SensorDeviceClass.BATTERY,
        native_unit_of_measurement=PERCENTAGE,
        state_class=SensorStateClass.MEASUREMENT,
        entity_category=EntityCategory.DIAGNOSTIC,
        value=lambda v: v.battery,
    ),
)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: SimConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Legt alle Sensoren an."""
    sim = entry.runtime_data
    entities: list[SensorEntity] = [
        SimValveSensor(valve, desc) for valve in sim.valves for desc in VALVE_SENSORS
    ]
    entities += [SoilSensor(valve) for valve in sim.valves if valve.spec.soil_sensor]
    entities += [SupplyFlowSensor(sim), SupplyVolumeSensor(sim)]
    async_add_entities(entities)


class SimValveSensor(SimValveEntity, SensorEntity):
    """Ein Messwert eines simulierten Ventils."""

    entity_description: SimSensorDescription

    def __init__(self, valve: SimValve, description: SimSensorDescription) -> None:
        """Legt den Sensor an."""
        super().__init__(valve, description.key)
        self.entity_description = description

    @property
    def native_value(self) -> float | int | str | None:
        """Aktueller Wert."""
        return self.entity_description.value(self.valve)


class SoilSensor(SensorEntity):
    """Bodenfeuchte einer Zone, als eigenes Gerät."""

    _attr_has_entity_name = True
    _attr_should_poll = False
    _attr_name = "Bodenfeuchte"
    _attr_device_class = SensorDeviceClass.MOISTURE
    _attr_native_unit_of_measurement = PERCENTAGE
    _attr_state_class = SensorStateClass.MEASUREMENT
    _attr_suggested_display_precision = 1

    def __init__(self, valve: SimValve) -> None:
        """Legt den Sensor an."""
        self.valve = valve
        self._attr_unique_id = f"soil_{valve.spec.number}"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, f"soil_{valve.spec.number}")},
            name=f"Simulierter Bodenfeuchtesensor {valve.name}",
            manufacturer="Simulator",
            model="Bodenfeuchtesensor",
        )

    @property
    def native_value(self) -> float | None:
        """Bodenfeuchte in %."""
        return None if self.valve.moisture is None else round(self.valve.moisture, 2)

    async def async_added_to_hass(self) -> None:
        """Auf Änderungen hören."""
        self.async_on_remove(self.valve.add_listener(self.async_write_ha_state))


class _SupplyEntity(SensorEntity):
    _attr_has_entity_name = True
    _attr_should_poll = False

    def __init__(self, sim: Simulator, key: str) -> None:
        self.sim = sim
        self._attr_unique_id = f"supply_{key}"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, "supply")},
            name="Simulierter Wasserzähler Zuleitung",
            manufacturer="Simulator",
            model="Wasserzähler",
        )

    async def async_added_to_hass(self) -> None:
        self.async_on_remove(self.sim.add_listener(self.async_write_ha_state))


class SupplyFlowSensor(_SupplyEntity):
    """Durchfluss in der Zuleitung (Summe aller Ventile)."""

    _attr_name = "Durchfluss"
    _attr_device_class = SensorDeviceClass.VOLUME_FLOW_RATE
    _attr_native_unit_of_measurement = UnitOfVolumeFlowRate.LITERS_PER_MINUTE
    _attr_state_class = SensorStateClass.MEASUREMENT

    def __init__(self, sim: Simulator) -> None:
        """Legt den Sensor an."""
        super().__init__(sim, "flow")

    @property
    def native_value(self) -> float:
        """Durchfluss in L/min."""
        return self.sim.supply_flow_l_min


class SupplyVolumeSensor(_SupplyEntity):
    """Zählerstand der Zuleitung."""

    _attr_name = "Zählerstand"
    _attr_device_class = SensorDeviceClass.WATER
    _attr_native_unit_of_measurement = UnitOfVolume.LITERS
    _attr_state_class = SensorStateClass.TOTAL_INCREASING
    _attr_suggested_display_precision = 1

    def __init__(self, sim: Simulator) -> None:
        """Legt den Sensor an."""
        super().__init__(sim, "volume")

    @property
    def native_value(self) -> float:
        """Zählerstand in L."""
        return round(self.sim.supply_total_l, 3)
