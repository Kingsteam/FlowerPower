"""Tests für Datenmodell, Speicherformat und Speicher."""

from __future__ import annotations

from typing import Any

from homeassistant.config_entries import ConfigEntryState
from homeassistant.core import HomeAssistant
import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.irrigation_planner.const import (
    DEFAULT_MAX_OPEN_VALVES,
    STORAGE_KEY,
    STORAGE_VERSION,
)
from custom_components.irrigation_planner.drivers.base import (
    Capability,
    SafetyLevel,
)
from custom_components.irrigation_planner.model import (
    DurationMode,
    EntityRef,
    Garden,
    GardenModel,
    Program,
    ProgramMode,
    Pump,
    Sensor,
    SensorKind,
    Settings,
    Valve,
    ValveRole,
    WaterSupply,
    Zone,
    ZoneType,
)
from custom_components.irrigation_planner.serialize import (
    model_from_dict,
    model_to_dict,
    supply_from_dict,
)
from custom_components.irrigation_planner.store import IrrigationPlannerStore


def _ref(uid: str, domain: str = "sensor") -> EntityRef:
    return EntityRef(domain=domain, platform="test", unique_id=uid)


def full_model() -> GardenModel:
    """Ein Modell, in dem jedes Feld gesetzt ist."""
    return GardenModel(
        settings=Settings(
            automatic=False, winter_mode=True, winter_start="11-01", winter_end="03-31"
        ),
        garden=Garden(
            background_image="plan.png",
            scale_points=((0.0, 0.0), (220.0, 0.0)),
            scale_distance_m=11.0,
            north_deg=15.0,
            latitude=1.5,
            longitude=2.5,
        ),
        zones=[
            Zone(
                id="z1",
                name="Beet",
                type=ZoneType.DRIP,
                polygon=[(0.0, 0.0), (10.0, 0.0), (10.0, 5.0)],
                plant_type="beet",
                kc=0.9,
                soil_type="lehm",
                root_depth_m=0.3,
                valve_id="v1",
                priority=2,
                max_duration_s=1800,
                duration_s=600,
                duration_mode=DurationMode.ENTITY,
                duration_entity=_ref("smart_irrigation_beet"),
                area_m2=12.6,
                efficiency=0.85,
                cycle_soak=True,
                enabled=False,
            ),
            Zone(
                id="z2",
                name="Rasen",
                type=ZoneType.SPRINKLER,
                center=(50.0, 60.0),
                radius_m=5.5,
                start_angle_deg=90.0,
                arc_deg=180.0,
                valve_id="v1",
            ),
        ],
        valves=[
            Valve(
                id="v1",
                name="Ventil 1",
                device_id="dev1",
                driver="zigbee2mqtt",
                profile="sonoff_swv",
                driver_options={"friendly_name": "Ventil 1"},
                entities={
                    ValveRole.VALVE: _ref("sw1", "switch"),
                    ValveRole.FLOW: _ref("flow1"),
                },
                capabilities=frozenset({Capability.DEVICE_TIMER, Capability.FLOW}),
                safety_level=SafetyLevel.DEVICE,
                zone_ids=["z1", "z2"],
                water_supply_id="w1",
                learned_flow_l_min=4.5,
            )
        ],
        water_supplies=[
            WaterSupply(
                id="w1",
                name="Hauswasser",
                valve_ids=["v1"],
                max_total_flow_l_min=20.0,
                water_meter=_ref("meter"),
                pump=Pump(
                    switch=_ref("pump", "switch"),
                    device_id="pumpdev",
                    pre_run_s=5,
                    post_run_s=3,
                ),
            )
        ],
        programs=[
            Program(
                id="p1",
                name="Morgens",
                zone_ids=["z2", "z1"],
                mode=ProgramMode.CYCLE_SOAK,
                pause_between_s=15,
                cycle_s=300,
                soak_s=600,
                finish_by="07:00:00",
                weekdays=[0, 2, 4],
                interval_days=2,
                skip_on_rain=False,
                skip_on_frost=True,
                skip_on_wind=True,
                enabled=False,
                last_run="2026-06-01",
            )
        ],
        sensors=[
            Sensor(
                id="s1",
                name="Boden",
                kind=SensorKind.SOIL_MOISTURE,
                entity=_ref("soil"),
                device_id="soildev",
                position=(3.0, 4.0),
                zone_ids=["z1"],
                field_capacity_pct=40.0,
                wilting_point_pct=15.0,
            )
        ],
    )


def test_roundtrip_keeps_every_field() -> None:
    model = full_model()
    assert model_from_dict(model_to_dict(model)) == model


def test_stored_form_is_plain_json() -> None:
    """Nur JSON-Typen: keine Tupel, Enums oder Mengen im gespeicherten dict."""

    def check(value: Any) -> None:
        if isinstance(value, dict):
            for key, item in value.items():
                assert type(key) is str
                check(item)
        elif isinstance(value, list):
            for item in value:
                check(item)
        else:
            assert value is None or type(value) in (str, int, float, bool)

    check(model_to_dict(full_model()))


def test_missing_fields_get_defaults() -> None:
    model = model_from_dict(
        {
            "zones": [{"id": "z", "name": "Z", "type": "drip"}],
            "water_supplies": [{"id": "w", "name": "W"}],
        }
    )
    assert model.zones[0].kc == 1.0
    assert model.zones[0].enabled is True
    assert model.water_supplies[0].max_open_valves == DEFAULT_MAX_OPEN_VALVES == 1


def test_supply_rejects_zero_open_valves() -> None:
    with pytest.raises(ValueError, match="mindestens 1"):
        supply_from_dict({"id": "w", "name": "W", "max_open_valves": 0})


@pytest.mark.parametrize(
    ("change", "message"),
    [
        (
            lambda m: m.zones.append(Zone(id="z1", name="x", type=ZoneType.DRIP)),
            "doppelt",
        ),
        (lambda m: setattr(m.zones[0], "valve_id", "fehlt"), "unbekannte"),
        (lambda m: m.valves[0].zone_ids.append("fehlt"), "unbekannte"),
        (lambda m: setattr(m.valves[0], "water_supply_id", "fehlt"), "unbekannte"),
        (lambda m: m.programs[0].zone_ids.append("fehlt"), "unbekannte"),
        (lambda m: m.sensors[0].zone_ids.append("fehlt"), "unbekannte"),
        (lambda m: setattr(m.zones[0], "max_duration_s", 0), "Höchstdauer"),
        (lambda m: setattr(m.zones[0], "area_m2", 0), "Fläche"),
        (lambda m: setattr(m.zones[0], "efficiency", 1.5), "Effizienz"),
        (lambda m: setattr(m.zones[0], "duration_entity", None), "Entität"),
        (
            lambda m: (
                setattr(m.zones[1], "duration_mode", DurationMode.CALCULATED),
                setattr(m.zones[1], "area_m2", None),
                setattr(m.zones[1], "center", None),
            ),
            "Fläche",
        ),
        (lambda m: setattr(m.sensors[0], "wilting_point_pct", 50), "Welkepunkt"),
        (
            lambda m: m.water_supplies.append(
                WaterSupply(id="w2", name="W2", valve_ids=["v1"])
            ),
            "zwei Wasserversorgungen",
        ),
        (
            lambda m: (
                m.water_supplies.append(WaterSupply(id="w2", name="W2")),
                setattr(m.valves[0], "water_supply_id", "w2"),
            ),
            "verweist aber auf",
        ),
    ],
)
def test_validate_finds_broken_references(change: Any, message: str) -> None:
    model = full_model()
    model.validate()
    change(model)
    with pytest.raises(ValueError, match=message):
        model.validate()


async def test_store_saves_and_loads(
    hass: HomeAssistant, hass_storage: dict[str, Any]
) -> None:
    store = IrrigationPlannerStore(hass)
    await store.async_load()
    assert store.model == GardenModel()

    store.model = full_model()
    await store.async_save()
    assert hass_storage[STORAGE_KEY]["data"] == model_to_dict(full_model())

    again = IrrigationPlannerStore(hass)
    assert await again.async_load() == full_model()


async def test_store_refuses_to_save_invalid_model(hass: HomeAssistant) -> None:
    store = IrrigationPlannerStore(hass)
    store.model = full_model()
    store.model.zones[0].valve_id = "fehlt"
    with pytest.raises(ValueError, match="unbekannte"):
        await store.async_save()


@pytest.mark.parametrize(
    "data",
    [
        {"zones": [{"id": "z", "name": "Z", "type": "drip", "valve_id": "fehlt"}]},
        {"zones": [{"name": "ohne ID", "type": "drip"}]},
        {"zones": [{"id": "z", "name": "Z", "type": "gibt_es_nicht"}]},
    ],
)
async def test_broken_storage_stops_setup_without_overwriting(
    hass: HomeAssistant,
    mock_config_entry: MockConfigEntry,
    hass_storage: dict[str, Any],
    data: dict[str, Any],
) -> None:
    """Defekte Daten: Einrichtung bricht ab, die Daten bleiben unverändert."""
    hass_storage[STORAGE_KEY] = {
        "version": STORAGE_VERSION,
        "minor_version": 1,
        "key": STORAGE_KEY,
        "data": data,
    }
    mock_config_entry.add_to_hass(hass)

    assert not await hass.config_entries.async_setup(mock_config_entry.entry_id)
    await hass.async_block_till_done()

    assert mock_config_entry.state is ConfigEntryState.SETUP_ERROR
    assert hass_storage[STORAGE_KEY]["data"] == data
