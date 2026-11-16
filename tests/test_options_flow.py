"""Tests für die Einrichtung über die Oberfläche (Options-Flow)."""

from __future__ import annotations

from datetime import timedelta
from typing import Any

from freezegun.api import FrozenDateTimeFactory
from homeassistant.core import HomeAssistant, ServiceCall, callback
from homeassistant.data_entry_flow import FlowResultType
from homeassistant.helpers import device_registry as dr, entity_registry as er
from homeassistant.helpers.event import async_call_later
import pytest
from pytest_homeassistant_custom_component.common import (
    MockConfigEntry,
    async_fire_time_changed,
)

from custom_components.irrigation_planner.const import DOMAIN
from custom_components.irrigation_planner.discovery import suggest
from custom_components.irrigation_planner.drivers.base import (
    Capability,
    SafetyLevel,
)
from custom_components.irrigation_planner.model import ValveRole
from custom_components.irrigation_planner.profiles import load_builtin_profiles

from .helpers import SimValves, make_model


@pytest.fixture
def device_for(
    hass: HomeAssistant,
    device_registry: dr.DeviceRegistry,
    entity_registry: er.EntityRegistry,
) -> Any:
    """Hängt Entitäten an ein Gerät einer fremden Integration."""
    other = MockConfigEntry(domain="test")
    other.add_to_hass(hass)

    def _make(entity_ids: list[str], **device_kw: Any) -> str:
        device = device_registry.async_get_or_create(
            config_entry_id=other.entry_id,
            identifiers=device_kw.pop("identifiers", {("test", entity_ids[0])}),
            **device_kw,
        )
        for entity_id in entity_ids:
            entity_registry.async_update_entity(entity_id, device_id=device.id)
        return device.id

    return _make


async def _menu(hass: HomeAssistant, entry: MockConfigEntry, *path: str) -> dict:
    result = await hass.config_entries.options.async_init(entry.entry_id)
    assert result["type"] is FlowResultType.MENU
    for step in path:
        result = await hass.config_entries.options.async_configure(
            result["flow_id"], {"next_step_id": step}
        )
    return result


async def _advance(
    hass: HomeAssistant, freezer: FrozenDateTimeFactory, seconds: int
) -> None:
    for _ in range(seconds):
        freezer.tick(timedelta(seconds=1))
        async_fire_time_changed(hass)
        await hass.async_block_till_done()


def _model(hass: HomeAssistant, entry: MockConfigEntry) -> Any:
    return hass.config_entries.async_get_entry(entry.entry_id).runtime_data.store.model


# Ventil-Assistent -------------------------------------------------------------


async def test_add_valve_wizard(
    hass: HomeAssistant,
    setup: Any,
    sim: SimValves,
    mock_config_entry: MockConfigEntry,
    device_for: Any,
    entity_registry: er.EntityRegistry,
) -> None:
    model = make_model(2, sensors=True)
    model["valves"] = model["valves"][:1]
    model["zones"] = model["zones"][:1]
    model["water_supplies"][0]["valve_ids"] = ["v1"]
    # v2 existiert als Gerät in HA, ist aber noch nicht im Planer.
    sim.add("v2", flow=True)
    await setup(model)
    device_id = device_for(
        [sim.entity_ids["v2"], sim.flow_ids["v2"]], manufacturer="ACME", model="Ventil"
    )

    result = await _menu(hass, mock_config_entry, "valves", "add_valve")
    assert result["step_id"] == "add_valve"
    result = await hass.config_entries.options.async_configure(
        result["flow_id"], {"device": device_id}
    )
    assert result["step_id"] == "valve_entities"
    # Vorschlag: Schalter als Ventil, Treiber ha_switch.
    schema = result["data_schema"].schema
    suggested = {
        str(k): k.description.get("suggested_value") for k in schema if k.description
    }
    assert suggested["valve"] == sim.entity_ids["v2"]

    result = await hass.config_entries.options.async_configure(
        result["flow_id"],
        {
            "name": "Beet hinten",
            "driver": "ha_switch",
            "profile": "__none__",
            "valve": sim.entity_ids["v2"],
            "flow": sim.flow_ids["v2"],
        },
    )
    assert result["step_id"] == "valve_assign"
    result = await hass.config_entries.options.async_configure(
        result["flow_id"],
        {
            "water_supply": "w1",
            "create_zone": True,
            "zone_name": "Beet hinten",
            "zone_duration": 5,
            "run_test": False,
        },
    )
    assert result["type"] is FlowResultType.CREATE_ENTRY
    await hass.async_block_till_done()

    m = _model(hass, mock_config_entry)
    valve = next(v for v in m.valves if v.name == "Beet hinten")
    assert valve.id == "beet_hinten"
    assert valve.device_id == device_id
    assert valve.entities[ValveRole.VALVE].unique_id == "v2"
    assert valve.water_supply_id == "w1"
    assert valve.safety_level is SafetyLevel.HA_ONLY
    zone = next(z for z in m.zones if z.valve_id == valve.id)
    assert zone.duration_s == 300
    assert "beet_hinten" in m.water_supplies[0].valve_ids
    # Nach dem Neuladen gibt es die Entitäten der neuen Zone.
    assert entity_registry.async_get_entity_id(
        "button", DOMAIN, f"{mock_config_entry.entry_id}_zone_{zone.id}_water_now"
    )


async def test_hardware_test_ha_only(
    hass: HomeAssistant,
    setup: Any,
    sim: SimValves,
    mock_config_entry: MockConfigEntry,
    freezer: FrozenDateTimeFactory,
) -> None:
    await setup(make_model(1, sensors=True))
    result = await _menu(hass, mock_config_entry, "valves", "edit_valve")
    result = await hass.config_entries.options.async_configure(
        result["flow_id"], {"item": "v1"}
    )
    result = await hass.config_entries.options.async_configure(
        result["flow_id"],
        {
            "name": "Ventil v1",
            "driver": "ha_switch",
            "profile": "__none__",
            "valve": sim.entity_ids["v1"],
            "flow": sim.flow_ids["v1"],
        },
    )
    result = await hass.config_entries.options.async_configure(
        result["flow_id"], {"water_supply": "w1", "run_test": True}
    )
    assert result["type"] is FlowResultType.SHOW_PROGRESS
    await hass.async_block_till_done()
    assert sim.is_open("v1")
    await _advance(hass, freezer, 10 + 6)
    assert not sim.is_open("v1")
    result = await hass.config_entries.options.async_configure(result["flow_id"])
    assert result["step_id"] == "valve_test_result"
    assert "Nur Home Assistant" in result["description_placeholders"]["outcome"]
    assert result["description_placeholders"]["flow"] == "5.0 L/min"
    result = await hass.config_entries.options.async_configure(result["flow_id"], {})
    assert result["type"] is FlowResultType.CREATE_ENTRY
    await hass.async_block_till_done()
    valve = _model(hass, mock_config_entry).valves[0]
    assert valve.safety_level is SafetyLevel.HA_ONLY
    assert valve.learned_flow_l_min == 5.0


async def test_hardware_test_device_timer(
    hass: HomeAssistant,
    setup: Any,
    sim: SimValves,
    mock_config_entry: MockConfigEntry,
    freezer: FrozenDateTimeFactory,
) -> None:
    """Dienstaufruf mit einem Gerät, das selbst schließt: Stufe grün."""
    await setup(make_model(1))
    calls: list[dict] = []

    async def open_for(call: ServiceCall) -> None:
        calls.append(dict(call.data))
        sim.set("v1", "on")

        @callback
        def _close(_now: Any) -> None:
            sim.set("v1", "off")

        async_call_later(hass, call.data["duration"], _close)

    hass.services.async_register("sim", "open_for", open_for)

    result = await _menu(hass, mock_config_entry, "valves", "edit_valve")
    result = await hass.config_entries.options.async_configure(
        result["flow_id"], {"item": "v1"}
    )
    result = await hass.config_entries.options.async_configure(
        result["flow_id"],
        {
            "name": "Ventil v1",
            "driver": "service_call",
            "profile": "__none__",
            "valve": sim.entity_ids["v1"],
        },
    )
    assert result["step_id"] == "valve_driver"
    result = await hass.config_entries.options.async_configure(
        result["flow_id"],
        {
            "open_service": "sim.open_for",
            "open_data": {"duration": "{duration}"},
            "duration_unit": "s",
            "device_timer": False,
        },
    )
    result = await hass.config_entries.options.async_configure(
        result["flow_id"], {"water_supply": "w1", "run_test": True}
    )
    assert result["type"] is FlowResultType.SHOW_PROGRESS
    await hass.async_block_till_done()
    assert calls == [{"duration": 10}]
    await _advance(hass, freezer, 10 + 6)
    assert sim.log.count(("off", "v1")) == 0  # Home Assistant musste nicht schließen
    result = await hass.config_entries.options.async_configure(result["flow_id"])
    assert "🟢" in result["description_placeholders"]["outcome"]
    result = await hass.config_entries.options.async_configure(result["flow_id"], {})
    await hass.async_block_till_done()
    valve = _model(hass, mock_config_entry).valves[0]
    assert valve.safety_level is SafetyLevel.DEVICE
    assert Capability.DEVICE_TIMER in valve.capabilities
    assert valve.driver_options["device_timer"] is True


async def test_hardware_test_refused_while_running(
    hass: HomeAssistant,
    setup: Any,
    sim: SimValves,
    mock_config_entry: MockConfigEntry,
) -> None:
    """Regel 2 gilt auch für Testläufe: nicht, während etwas läuft."""
    scheduler = await setup(make_model(2))
    scheduler.async_enqueue("z1", 600)
    await hass.async_block_till_done()
    result = await _menu(hass, mock_config_entry, "valves", "edit_valve")
    result = await hass.config_entries.options.async_configure(
        result["flow_id"], {"item": "v2"}
    )
    result = await hass.config_entries.options.async_configure(
        result["flow_id"],
        {
            "name": "Ventil v2",
            "driver": "ha_switch",
            "profile": "__none__",
            "valve": sim.entity_ids["v2"],
        },
    )
    result = await hass.config_entries.options.async_configure(
        result["flow_id"], {"water_supply": "w1", "run_test": True}
    )
    await hass.async_block_till_done()
    while result["type"] in (
        FlowResultType.SHOW_PROGRESS,
        FlowResultType.SHOW_PROGRESS_DONE,
    ):
        result = await hass.config_entries.options.async_configure(result["flow_id"])
    assert result["step_id"] == "valve_test_result"
    assert "läuft gerade" in result["description_placeholders"]["outcome"]
    assert sim.open_ids() == {"v1"}
    # Abbrechen ändert nichts; die laufende Bewässerung läuft weiter.
    hass.config_entries.options.async_abort(result["flow_id"])
    await hass.async_block_till_done()
    assert sim.open_ids() == {"v1"}


async def test_valve_wizard_rejects_bad_driver_options(
    hass: HomeAssistant,
    setup: Any,
    sim: SimValves,
    mock_config_entry: MockConfigEntry,
) -> None:
    await setup(make_model(1))
    result = await _menu(hass, mock_config_entry, "valves", "edit_valve")
    result = await hass.config_entries.options.async_configure(
        result["flow_id"], {"item": "v1"}
    )
    result = await hass.config_entries.options.async_configure(
        result["flow_id"],
        {
            "name": "Ventil v1",
            "driver": "service_call",
            "profile": "__none__",
            "valve": sim.entity_ids["v1"],
        },
    )
    result = await hass.config_entries.options.async_configure(
        result["flow_id"],
        {
            "open_service": "sim.open_for",
            "open_data": {"zone": 1},  # ohne Dauer
            "duration_unit": "s",
            "device_timer": True,
        },
    )
    result = await hass.config_entries.options.async_configure(
        result["flow_id"], {"water_supply": "w1", "run_test": False}
    )
    assert result["errors"] == {"base": "invalid"}
    assert "duration" in result["description_placeholders"]["error"]


async def test_profile_driver_mismatch(
    hass: HomeAssistant, setup: Any, sim: SimValves, mock_config_entry: MockConfigEntry
) -> None:
    await setup(make_model(1))
    result = await _menu(hass, mock_config_entry, "valves", "edit_valve")
    result = await hass.config_entries.options.async_configure(
        result["flow_id"], {"item": "v1"}
    )
    result = await hass.config_entries.options.async_configure(
        result["flow_id"],
        {
            "name": "Ventil v1",
            "driver": "ha_switch",
            "profile": "sonoff_swv",
            "valve": sim.entity_ids["v1"],
        },
    )
    assert result["errors"] == {"profile": "profile_driver_mismatch"}


async def test_remove_valve_keeps_zone(
    hass: HomeAssistant, setup: Any, sim: SimValves, mock_config_entry: MockConfigEntry
) -> None:
    await setup(make_model(2))
    result = await _menu(hass, mock_config_entry, "valves", "remove_valve")
    result = await hass.config_entries.options.async_configure(
        result["flow_id"], {"item": "v1"}
    )
    assert result["type"] is FlowResultType.CREATE_ENTRY
    await hass.async_block_till_done()
    m = _model(hass, mock_config_entry)
    assert [v.id for v in m.valves] == ["v2"]
    assert m.zones[0].valve_id is None
    assert m.water_supplies[0].valve_ids == ["v2"]


# Zonen, Programme, Versorgungen, Einstellungen ----------------------------------


async def test_add_edit_remove_zone(
    hass: HomeAssistant, setup: Any, sim: SimValves, mock_config_entry: MockConfigEntry
) -> None:
    await setup(make_model(1))
    result = await _menu(hass, mock_config_entry, "zones", "add_zone")
    result = await hass.config_entries.options.async_configure(
        result["flow_id"],
        {
            "name": "Rasen vorne",
            "valve": "v1",
            "duration": 12.5,
            "max_duration": 30,
            "priority": 3,
            "enabled": True,
        },
    )
    assert result["type"] is FlowResultType.CREATE_ENTRY
    await hass.async_block_till_done()
    zone = next(
        z for z in _model(hass, mock_config_entry).zones if z.name == "Rasen vorne"
    )
    assert (zone.id, zone.duration_s, zone.max_duration_s, zone.priority) == (
        "rasen_vorne",
        750,
        1800,
        3,
    )

    result = await _menu(hass, mock_config_entry, "zones", "edit_zone")
    result = await hass.config_entries.options.async_configure(
        result["flow_id"], {"item": "rasen_vorne"}
    )
    result = await hass.config_entries.options.async_configure(
        result["flow_id"],
        {
            "name": "Rasen vorne",
            "valve": "__none__",
            "duration": 0,
            "max_duration": 0,
            "priority": 0,
            "enabled": False,
        },
    )
    await hass.async_block_till_done()
    zone = next(
        z for z in _model(hass, mock_config_entry).zones if z.id == "rasen_vorne"
    )
    assert (zone.valve_id, zone.duration_s, zone.enabled) == (None, None, False)

    result = await _menu(hass, mock_config_entry, "zones", "remove_zone")
    result = await hass.config_entries.options.async_configure(
        result["flow_id"], {"item": "rasen_vorne"}
    )
    await hass.async_block_till_done()
    assert all(z.id != "rasen_vorne" for z in _model(hass, mock_config_entry).zones)


async def test_add_program(
    hass: HomeAssistant, setup: Any, sim: SimValves, mock_config_entry: MockConfigEntry
) -> None:
    await setup(make_model(2, zone_extra={"duration_s": 60}))
    result = await _menu(hass, mock_config_entry, "programs", "add_program")
    result = await hass.config_entries.options.async_configure(
        result["flow_id"],
        {
            "name": "Abends",
            "zones": ["z2", "z1"],
            "mode": "cycle_soak",
            "pause_between": 15,
            "cycle": 2,
            "soak": 10,
            "schedule": "start_time",
            "time": "21:30:00",
            "weekdays": ["0", "3"],
            "interval_days": 0,
            "skip_on_rain": True,
            "skip_on_frost": False,
            "skip_on_wind": True,
            "enabled": True,
        },
    )
    assert result["type"] is FlowResultType.CREATE_ENTRY
    await hass.async_block_till_done()
    program = _model(hass, mock_config_entry).programs[0]
    assert program.id == "abends"
    assert program.zone_ids == ["z2", "z1"]
    assert (program.cycle_s, program.soak_s, program.start_time) == (
        120,
        600,
        "21:30:00",
    )
    assert program.finish_by is None
    assert program.weekdays == [0, 3]


async def test_program_finish_before_sunrise(
    hass: HomeAssistant, setup: Any, sim: SimValves, mock_config_entry: MockConfigEntry
) -> None:
    await setup(make_model(1, zone_extra={"duration_s": 60}))
    result = await _menu(hass, mock_config_entry, "programs", "add_program")
    result = await hass.config_entries.options.async_configure(
        result["flow_id"],
        {
            "name": "Vor Sonnenaufgang",
            "zones": ["z1"],
            "mode": "sequence",
            "pause_between": 0,
            "cycle": 5,
            "soak": 0,
            "schedule": "finish_sun",
            "time": "07:00:00",
            "sun_event": "sunrise",
            "sun_offset": -60,
            "weekdays": [],
            "interval_days": 0,
            "skip_on_rain": True,
            "skip_on_frost": True,
            "skip_on_wind": False,
            "enabled": True,
        },
    )
    assert result["type"] is FlowResultType.CREATE_ENTRY
    await hass.async_block_till_done()
    program = _model(hass, mock_config_entry).programs[0]
    assert (program.start_time, program.finish_by, program.sun_offset_min) == (
        None,
        "sunrise",
        -60,
    )

    # Beim Ändern stehen die Werte wieder im Formular.
    result = await _menu(hass, mock_config_entry, "programs", "edit_program")
    result = await hass.config_entries.options.async_configure(
        result["flow_id"], {"item": program.id}
    )
    defaults = {
        str(key): key.default() for key in result["data_schema"].schema if key.default
    }
    assert defaults["schedule"] == "finish_sun"
    assert defaults["sun_event"] == "sunrise"
    assert defaults["sun_offset"] == -60


async def test_supply_and_settings(
    hass: HomeAssistant, setup: Any, sim: SimValves, mock_config_entry: MockConfigEntry
) -> None:
    await setup(make_model(1))
    result = await _menu(hass, mock_config_entry, "supplies", "edit_supply")
    result = await hass.config_entries.options.async_configure(
        result["flow_id"], {"item": "w1"}
    )
    result = await hass.config_entries.options.async_configure(
        result["flow_id"], {"name": "Garten", "max_open_valves": 1}
    )
    await hass.async_block_till_done()
    assert _model(hass, mock_config_entry).water_supplies[0].name == "Garten"

    result = await _menu(hass, mock_config_entry, "settings")
    result = await hass.config_entries.options.async_configure(
        result["flow_id"],
        {"window_start": "05:00:00", "window_end": "08:00:00", "winter_start": "13-01"},
    )
    assert result["errors"] == {"base": "invalid"}
    result = await hass.config_entries.options.async_configure(
        result["flow_id"],
        {
            "window_start": "05:00:00",
            "window_end": "08:00:00",
            "winter_start": "11-01",
            "winter_end": "04-01",
        },
    )
    assert result["type"] is FlowResultType.CREATE_ENTRY
    await hass.async_block_till_done()
    entry = hass.config_entries.async_get_entry(mock_config_entry.entry_id)
    assert entry.data["window_end"] == "08:00:00"
    assert "weather_entity" not in entry.data
    settings = _model(hass, mock_config_entry).settings
    assert (settings.winter_start, settings.winter_end) == ("11-01", "04-01")


async def test_nothing_to_select(
    hass: HomeAssistant, setup: Any, sim: SimValves, mock_config_entry: MockConfigEntry
) -> None:
    await setup(make_model(1))
    result = await _menu(hass, mock_config_entry, "programs", "edit_program")
    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "nothing_to_select"


# Erkennung --------------------------------------------------------------------


async def test_discovery_sonoff_profile(
    hass: HomeAssistant,
    entity_registry: er.EntityRegistry,
    device_for: Any,
) -> None:
    switch = entity_registry.async_get_or_create("switch", "mqtt", "0x1_switch")
    flow = entity_registry.async_get_or_create(
        "sensor", "mqtt", "0x1_flow", original_device_class="volume_flow_rate"
    )
    status = entity_registry.async_get_or_create(
        "sensor", "mqtt", "0x1_current_device_status"
    )
    battery = entity_registry.async_get_or_create(
        "sensor", "mqtt", "0x1_battery", original_device_class="battery"
    )
    device_id = device_for(
        [switch.entity_id, flow.entity_id, status.entity_id, battery.entity_id],
        identifiers={("mqtt", "zigbee2mqtt_0x1")},
        manufacturer="SONOFF",
        model="Zigbee smart water valve",
        model_id="SWV",
        name="Ventil Vorgarten",
    )
    suggestion = suggest(hass, device_id, load_builtin_profiles())
    assert suggestion.profile is not None
    assert suggestion.profile.id == "sonoff_swv"
    assert suggestion.driver == "zigbee2mqtt"
    assert suggestion.friendly_name == "Ventil Vorgarten"
    assert suggestion.entities == {
        ValveRole.VALVE: switch.entity_id,
        ValveRole.FLOW: flow.entity_id,
        ValveRole.STATUS: status.entity_id,
        ValveRole.BATTERY: battery.entity_id,
    }


async def test_discovery_generic_valve(
    hass: HomeAssistant, entity_registry: er.EntityRegistry, device_for: Any
) -> None:
    valve = entity_registry.async_get_or_create("valve", "acme", "v")
    device_id = device_for([valve.entity_id], manufacturer="ACME", model="Ventil")
    suggestion = suggest(hass, device_id, load_builtin_profiles())
    assert suggestion.profile is None
    assert suggestion.driver == "ha_valve"
    assert suggestion.entities == {ValveRole.VALVE: valve.entity_id}


# Phase 2: Berechnung und Sensoren ---------------------------------------------


async def test_zone_calculation_section(
    hass: HomeAssistant,
    setup: Any,
    sim: SimValves,
    mock_config_entry: MockConfigEntry,
    entity_registry: er.EntityRegistry,
) -> None:
    smart = entity_registry.async_get_or_create("sensor", "smart_irrigation", "rasen")
    await setup(make_model(1))
    result = await _menu(hass, mock_config_entry, "zones", "edit_zone")
    result = await hass.config_entries.options.async_configure(
        result["flow_id"], {"item": "z1"}
    )
    base = {
        "name": "Rasen",
        "valve": "v1",
        "duration": 10,
        "max_duration": 30,
        "priority": 0,
        "enabled": True,
    }
    result = await hass.config_entries.options.async_configure(
        result["flow_id"],
        {
            **base,
            "calculation": {
                "zone_type": "sprinkler",
                "area_m2": 47.5,
                "plant_type": "lawn",
                "kc": 0,
                "soil_type": "clay_loam",
                "root_depth_cm": 0,
                "efficiency_pct": 0,
                "duration_mode": "calculated",
            },
        },
    )
    assert result["type"] is FlowResultType.CREATE_ENTRY
    await hass.async_block_till_done()
    zone = _model(hass, mock_config_entry).zones[0]
    assert zone.type.value == "sprinkler"
    assert zone.area_m2 == 47.5
    assert (zone.plant_type, zone.kc) == ("lawn", 0.8)  # 0 = nach Pflanzenart
    assert (zone.root_depth_m, zone.efficiency) == (None, None)
    assert zone.duration_mode.value == "calculated"

    # Dauer aus Smart Irrigation; ohne Entität gibt es einen Fehler.
    result = await _menu(hass, mock_config_entry, "zones", "edit_zone")
    result = await hass.config_entries.options.async_configure(
        result["flow_id"], {"item": "z1"}
    )
    calc = {
        "zone_type": "sprinkler",
        "area_m2": 47.5,
        "plant_type": "lawn",
        "kc": 0.9,
        "soil_type": "loam",
        "root_depth_cm": 25,
        "efficiency_pct": 70,
        "duration_mode": "entity",
    }
    result = await hass.config_entries.options.async_configure(
        result["flow_id"], {**base, "calculation": calc}
    )
    assert result["errors"] == {"base": "invalid"}
    assert "Entität" in result["description_placeholders"]["error"]
    result = await hass.config_entries.options.async_configure(
        result["flow_id"],
        {**base, "calculation": {**calc, "duration_entity": smart.entity_id}},
    )
    assert result["type"] is FlowResultType.CREATE_ENTRY
    await hass.async_block_till_done()
    zone = _model(hass, mock_config_entry).zones[0]
    assert (zone.kc, zone.root_depth_m, zone.efficiency) == (0.9, 0.25, 0.7)
    assert zone.duration_entity is not None
    assert zone.duration_entity.unique_id == "rasen"


async def test_add_and_remove_sensors(
    hass: HomeAssistant,
    setup: Any,
    sim: SimValves,
    mock_config_entry: MockConfigEntry,
    entity_registry: er.EntityRegistry,
) -> None:
    soil = entity_registry.async_get_or_create("sensor", "test", "soil")
    rain = entity_registry.async_get_or_create("sensor", "test", "rain")
    await setup(make_model(1))
    for name, kind, entity_id, zones in (
        ("Boden Beet", "soil_moisture", soil.entity_id, ["z1"]),
        ("Regen", "rain_mm", rain.entity_id, []),
    ):
        result = await _menu(hass, mock_config_entry, "sensors", "add_sensor")
        result = await hass.config_entries.options.async_configure(
            result["flow_id"],
            {
                "name": name,
                "kind": kind,
                "entity": entity_id,
                "zones": zones,
                "field_capacity_pct": 38,
                "wilting_point_pct": 14,
            },
        )
        assert result["type"] is FlowResultType.CREATE_ENTRY
        await hass.async_block_till_done()
    sensors = _model(hass, mock_config_entry).sensors
    assert [(s.id, s.kind.value, s.zone_ids) for s in sensors] == [
        ("boden_beet", "soil_moisture", ["z1"]),
        ("regen", "rain_mm", []),
    ]
    assert sensors[0].field_capacity_pct == 38

    # Feldkapazität unter dem Welkepunkt: Fehler.
    result = await _menu(hass, mock_config_entry, "sensors", "add_sensor")
    result = await hass.config_entries.options.async_configure(
        result["flow_id"],
        {
            "name": "Falsch",
            "kind": "soil_moisture",
            "entity": soil.entity_id,
            "zones": ["z1"],
            "field_capacity_pct": 10,
            "wilting_point_pct": 20,
        },
    )
    assert result["errors"] == {"base": "invalid"}

    result = await _menu(hass, mock_config_entry, "sensors", "remove_sensor")
    result = await hass.config_entries.options.async_configure(
        result["flow_id"], {"item": "regen"}
    )
    await hass.async_block_till_done()
    assert [s.id for s in _model(hass, mock_config_entry).sensors] == ["boden_beet"]
