"""Einrichtung über die Oberfläche (Einstellungen → Bewässerungsplaner → Konfigurieren).

Menü: Ventile, Zonen, Programme, Wasserversorgungen, Einstellungen. Jede
Aktion arbeitet auf einer Kopie des Modells, prüft sie (``validate``),
speichert und lädt den Bewässerungsplaner neu. Abbrechen ändert nichts.

Assistent „Ventil hinzufügen“ (Konzept, Abschnitt 3a):

1. Gerät wählen
2. Entitäten, Treiber und Profil prüfen (Vorschlag aus ``discovery.py``)
3. Treiber-Einstellungen (nur Zigbee2MQTT und Dienstaufruf)
4. Wasserversorgung und Zone zuordnen, auf Wunsch Testlauf (10 s)
5. Testlauf: über die Warteschlange, prüft, ob das Gerät selbst schließt
"""

from __future__ import annotations

import asyncio
import copy
from typing import Any

from homeassistant.config_entries import ConfigEntryState, ConfigFlowResult, OptionsFlow
from homeassistant.data_entry_flow import section
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.selector import (
    BooleanSelector,
    DeviceSelector,
    DeviceSelectorConfig,
    EntityFilterSelectorConfig,
    EntitySelector,
    EntitySelectorConfig,
    NumberSelector,
    NumberSelectorConfig,
    NumberSelectorMode,
    ObjectSelector,
    SelectOptionDict,
    SelectSelector,
    SelectSelectorConfig,
    SelectSelectorMode,
    TextSelector,
    TimeSelector,
)
from homeassistant.util import slugify
import voluptuous as vol

from .const import (
    CONF_WEATHER_ENTITY,
    CONF_WINDOW_END,
    CONF_WINDOW_START,
    HARDWARE_TEST_MIN_S,
    MAX_VALVE_DURATION_S,
)
from .discovery import Suggestion, suggest
from .drivers.base import Capability, SafetyLevel
from .drivers.registry import DRIVERS, create_driver
from .model import (
    DurationMode,
    EntityRef,
    GardenModel,
    Program,
    ProgramMode,
    Sensor,
    SensorKind,
    Valve,
    ValveRole,
    WaterSupply,
    Zone,
    ZoneType,
)
from .scheduler import HardwareTestResult, QueueError
from .serialize import model_from_dict, model_to_dict
from .watchdog import Watchdog
from .water_balance import DEFAULT_SOIL, PLANTS, SOILS

NEW = "__new__"
NONE = "__none__"
# Für übersetzte Auswahllisten: Schlüssel dürfen nicht mit _ beginnen (hassfest).
PLANT_NONE = "none"
TIMER_DRIVERS = ("zigbee2mqtt", "service_call")
ROLE_FILTERS: dict[ValveRole, EntitySelectorConfig] = {
    ValveRole.VALVE: EntitySelectorConfig(domain=["switch", "valve"]),
    ValveRole.FLOW: EntitySelectorConfig(domain="sensor"),
    ValveRole.VOLUME: EntitySelectorConfig(domain="sensor"),
    ValveRole.STATUS: EntitySelectorConfig(domain=["sensor", "binary_sensor"]),
    ValveRole.BATTERY: EntitySelectorConfig(domain="sensor", device_class="battery"),
}


def _select(options: list[tuple[str, str]], **kwargs: Any) -> SelectSelector:
    return SelectSelector(
        SelectSelectorConfig(
            options=[SelectOptionDict(value=v, label=label) for v, label in options],
            mode=SelectSelectorMode.DROPDOWN,
            **kwargs,
        )
    )


def _translated(key: str, values: list[str], **kwargs: Any) -> SelectSelector:
    return SelectSelector(
        SelectSelectorConfig(
            options=values,
            translation_key=key,
            mode=SelectSelectorMode.DROPDOWN,
            **kwargs,
        )
    )


def _number(
    minimum: float, maximum: float, step: float, unit: str | None = None
) -> NumberSelector:
    config = NumberSelectorConfig(
        min=minimum, max=maximum, step=step, mode=NumberSelectorMode.BOX
    )
    if unit:
        config["unit_of_measurement"] = unit
    return NumberSelector(config)


def _minutes(max_minutes: float = MAX_VALVE_DURATION_S / 60) -> NumberSelector:
    return NumberSelector(
        NumberSelectorConfig(
            min=0,
            max=max_minutes,
            step=0.5,
            unit_of_measurement="min",
            mode=NumberSelectorMode.BOX,
        )
    )


def _seconds(minimum: int, maximum: int) -> NumberSelector:
    return NumberSelector(
        NumberSelectorConfig(
            min=minimum,
            max=maximum,
            step=1,
            unit_of_measurement="s",
            mode=NumberSelectorMode.BOX,
        )
    )


def _unique_id(name: str, taken: set[str]) -> str:
    base = slugify(name) or "eintrag"
    candidate, n = base, 2
    while candidate in taken:
        candidate, n = f"{base}_{n}", n + 1
    return candidate


class IrrigationPlannerOptionsFlow(OptionsFlow):
    """Menü zum Anlegen, Ändern und Löschen."""

    def __init__(self) -> None:
        """Startet ohne Entwurf."""
        self._model: GardenModel | None = None
        self._edit_id: str | None = None
        self._valve: Valve | None = None
        self._suggestion: Suggestion | None = None
        self._run_test = False
        self._test_task: asyncio.Task[HardwareTestResult] | None = None
        self._test_result: HardwareTestResult | None = None
        self._result_shown = False

    # Hilfen -----------------------------------------------------------------

    @property
    def model(self) -> GardenModel:
        """Arbeitskopie des Modells."""
        if self._model is None:
            data = self.config_entry.runtime_data.store.model
            self._model = model_from_dict(model_to_dict(data))
        return self._model

    async def _save(self) -> ConfigFlowResult:
        """Prüft, speichert und lädt neu."""
        store = self.config_entry.runtime_data.store
        store.model = self.model
        await store.async_save()
        self.hass.config_entries.async_schedule_reload(self.config_entry.entry_id)
        return self.async_create_entry(data=dict(self.config_entry.options))

    def _valid(self) -> str | None:
        """Fehlermeldung, wenn das Modell nicht stimmt."""
        try:
            self.model.validate()
        except ValueError as err:
            return str(err)
        return None

    def _taken(self) -> set[str]:
        m = self.model
        return {x.id for x in (*m.zones, *m.valves, *m.programs, *m.water_supplies)}

    def _choices(self, items: list[Any]) -> list[tuple[str, str]]:
        return [(item.id, item.name) for item in items]

    def _pick_form(self, step_id: str, items: list[Any]) -> ConfigFlowResult:
        if not items:
            return self.async_abort(reason="nothing_to_select")
        return self.async_show_form(
            step_id=step_id,
            data_schema=vol.Schema(
                {vol.Required("item"): _select(self._choices(items))}
            ),
        )

    # Menüs ------------------------------------------------------------------

    async def async_step_init(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Hauptmenü."""
        if self.config_entry.state is not ConfigEntryState.LOADED:
            return self.async_abort(reason="not_loaded")
        return self.async_show_menu(
            step_id="init",
            menu_options=[
                "valves",
                "zones",
                "programs",
                "supplies",
                "sensors",
                "settings",
            ],
        )

    async def async_step_valves(self, user_input: Any = None) -> ConfigFlowResult:
        """Menü Ventile."""
        return self.async_show_menu(
            step_id="valves", menu_options=["add_valve", "edit_valve", "remove_valve"]
        )

    async def async_step_zones(self, user_input: Any = None) -> ConfigFlowResult:
        """Menü Zonen."""
        return self.async_show_menu(
            step_id="zones", menu_options=["add_zone", "edit_zone", "remove_zone"]
        )

    async def async_step_programs(self, user_input: Any = None) -> ConfigFlowResult:
        """Menü Programme."""
        return self.async_show_menu(
            step_id="programs",
            menu_options=["add_program", "edit_program", "remove_program"],
        )

    async def async_step_supplies(self, user_input: Any = None) -> ConfigFlowResult:
        """Menü Wasserversorgungen."""
        return self.async_show_menu(
            step_id="supplies",
            menu_options=["add_supply", "edit_supply", "remove_supply"],
        )

    # Ventil: Assistent ------------------------------------------------------

    async def async_step_add_valve(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Schritt 1: Gerät wählen."""
        errors: dict[str, str] = {}
        if user_input is not None:
            profiles = self.config_entry.runtime_data.profiles
            try:
                self._suggestion = suggest(self.hass, user_input["device"], profiles)
            except ValueError:
                errors["base"] = "device_not_found"
            else:
                self._edit_id = None
                self._valve = Valve(
                    id="",
                    name=self._suggestion.name,
                    device_id=user_input["device"],
                    driver=self._suggestion.driver,
                    profile=self._suggestion.profile.id
                    if self._suggestion.profile
                    else None,
                )
                return await self.async_step_valve_entities()
        return self.async_show_form(
            step_id="add_valve",
            data_schema=vol.Schema(
                {
                    vol.Required("device"): DeviceSelector(
                        DeviceSelectorConfig(
                            entity=EntityFilterSelectorConfig(
                                domain=["switch", "valve"]
                            )
                        )
                    )
                }
            ),
            errors=errors,
        )

    async def async_step_edit_valve(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Ventil zum Ändern wählen."""
        if user_input is None:
            return self._pick_form("edit_valve", self.model.valves)
        valve = next(v for v in self.model.valves if v.id == user_input["item"])
        self._edit_id = valve.id
        self._valve = copy.deepcopy(valve)
        self._suggestion = None
        return await self.async_step_valve_entities()

    def _ref(self, entity_id: str) -> EntityRef | None:
        entry = er.async_get(self.hass).async_get(entity_id)
        if entry is None:
            return None
        return EntityRef(
            domain=entry.domain, platform=entry.platform, unique_id=entry.unique_id
        )

    def _entity_id(self, ref: EntityRef | None) -> str | None:
        if ref is None:
            return None
        return er.async_get(self.hass).async_get_entity_id(
            ref.domain, ref.platform, ref.unique_id
        )

    async def async_step_valve_entities(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Schritt 2: Name, Treiber, Profil, Entitäten."""
        assert self._valve is not None
        valve = self._valve
        errors: dict[str, str] = {}
        if user_input is not None:
            registry = er.async_get(self.hass)
            refs: dict[ValveRole, EntityRef] = {}
            for role in ValveRole:
                entity_id = user_input.get(role.value)
                if not entity_id:
                    continue
                entry = registry.async_get(entity_id)
                if entry is None:
                    errors[role.value] = "entity_no_unique_id"
                    continue
                refs[role] = EntityRef(
                    domain=entry.domain,
                    platform=entry.platform,
                    unique_id=entry.unique_id,
                )
            profile = user_input.get("profile", NONE)
            profiles = self.config_entry.runtime_data.profiles
            if profile != NONE and profiles[profile].driver != user_input["driver"]:
                errors["profile"] = "profile_driver_mismatch"
            if not errors:
                valve.name = user_input["name"]
                valve.driver = user_input["driver"]
                valve.profile = None if profile == NONE else profile
                valve.entities = refs
                if valve.driver in TIMER_DRIVERS:
                    return await self.async_step_valve_driver()
                valve.driver_options = {}
                return await self.async_step_valve_assign()

        suggested = dict(self._suggestion.entities) if self._suggestion else {}
        for role, ref in valve.entities.items():
            if (entity_id := self._entity_id(ref)) is not None:
                suggested[role] = entity_id
        profiles = self.config_entry.runtime_data.profiles
        schema: dict[Any, Any] = {
            vol.Required("name", default=valve.name): TextSelector(),
            vol.Required("driver", default=valve.driver): _translated(
                "driver", sorted(DRIVERS)
            ),
            vol.Required("profile", default=valve.profile or NONE): _select(
                [(NONE, "(keins)"), *((p.id, p.name) for p in profiles.values())]
            ),
        }
        for role in ValveRole:
            key = (
                vol.Required(role.value)
                if role is ValveRole.VALVE
                else vol.Optional(role.value)
            )
            schema[key] = EntitySelector(ROLE_FILTERS[role])
        data_schema = self.add_suggested_values_to_schema(
            vol.Schema(schema), {r.value: e for r, e in suggested.items()}
        )
        return self.async_show_form(
            step_id="valve_entities",
            data_schema=data_schema,
            errors=errors,
            description_placeholders={
                "profile": self._suggestion.profile.name
                if self._suggestion and self._suggestion.profile
                else "(keins)"
            },
        )

    async def async_step_valve_driver(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Schritt 3: Einstellungen für Zigbee2MQTT oder Dienstaufruf."""
        assert self._valve is not None
        valve = self._valve
        opts = valve.driver_options
        if user_input is not None:
            new = {k: v for k, v in user_input.items() if v not in (None, "", {})}
            # Ergebnis eines früheren Testlaufs behalten.
            if "device_timer" in opts and valve.driver == "zigbee2mqtt":
                new.setdefault("device_timer", opts["device_timer"])
            valve.driver_options = new
            return await self.async_step_valve_assign()

        if valve.driver == "zigbee2mqtt":
            default_name = opts.get("friendly_name") or (
                self._suggestion.friendly_name if self._suggestion else valve.name
            )
            schema = vol.Schema(
                {
                    vol.Required(
                        "friendly_name", default=default_name or valve.name
                    ): TextSelector(),
                    vol.Required(
                        "base_topic", default=opts.get("base_topic", "zigbee2mqtt")
                    ): TextSelector(),
                }
            )
        else:
            schema = vol.Schema(
                {
                    vol.Required(
                        "open_service", default=opts.get("open_service", "")
                    ): TextSelector(),
                    vol.Required(
                        "open_data",
                        default=opts.get("open_data", {"duration": "{duration}"}),
                    ): ObjectSelector(),
                    vol.Required(
                        "duration_unit", default=opts.get("duration_unit", "s")
                    ): _translated("duration_unit", ["s", "min"]),
                    vol.Optional(
                        "close_service", default=opts.get("close_service", "")
                    ): TextSelector(),
                    vol.Optional(
                        "close_data", default=opts.get("close_data", {})
                    ): ObjectSelector(),
                    vol.Required(
                        "device_timer", default=bool(opts.get("device_timer", False))
                    ): BooleanSelector(),
                }
            )
        return self.async_show_form(
            step_id="valve_driver",
            data_schema=schema,
            description_placeholders={"placeholder": "{duration}"},
        )

    async def async_step_valve_assign(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Schritt 4: Wasserversorgung, Zone, Testlauf."""
        assert self._valve is not None
        valve = self._valve
        model = self.model
        errors: dict[str, str] = {}
        placeholders = {"error": "", "seconds": str(HARDWARE_TEST_MIN_S)}
        if user_input is not None:
            draft = copy.deepcopy(model)
            valve_id = self._apply_valve(draft, valve, user_input)
            try:
                draft.validate()
                create_driver(
                    self.hass,
                    next(v for v in draft.valves if v.id == valve_id),
                    self.config_entry.runtime_data.profiles,
                )
            except ValueError as err:
                errors["base"] = "invalid"
                placeholders["error"] = str(err)
            else:
                self._model = draft
                self._edit_id = valve_id
                self._valve = next(v for v in draft.valves if v.id == valve_id)
                if user_input.get("run_test"):
                    return await self.async_step_valve_test()
                self._valve.safety_level = create_driver(
                    self.hass, self._valve, self.config_entry.runtime_data.profiles
                ).safety_level
                return await self._save()

        supplies = [(s.id, s.name) for s in model.water_supplies]
        default_supply = valve.water_supply_id or (supplies[0][0] if supplies else NEW)
        new_valve = self._edit_id is None
        schema: dict[Any, Any] = {
            vol.Required("water_supply", default=default_supply): _select(
                [*supplies, (NEW, "Neu: Hauswasser")]
            ),
        }
        if new_valve:
            schema[vol.Required("create_zone", default=True)] = BooleanSelector()
            schema[vol.Optional("zone_name", default=valve.name)] = TextSelector()
            schema[vol.Optional("zone_duration", default=10)] = _minutes()
        schema[vol.Required("run_test", default=False)] = BooleanSelector()
        return self.async_show_form(
            step_id="valve_assign",
            data_schema=vol.Schema(schema),
            errors=errors,
            description_placeholders=placeholders,
        )

    def _apply_valve(
        self, model: GardenModel, valve: Valve, user_input: dict[str, Any]
    ) -> str:
        """Übernimmt den Entwurf ins Modell (Versorgung, Zone, IDs); gibt die ID zurück."""
        valve = copy.deepcopy(valve)
        taken = {
            x.id
            for x in (
                *model.zones,
                *model.valves,
                *model.programs,
                *model.water_supplies,
            )
        }
        if self._edit_id is None:
            valve.id = _unique_id(valve.name, taken)
            taken.add(valve.id)
            model.valves.append(valve)
        else:
            model.valves = [valve if v.id == valve.id else v for v in model.valves]
        supply_id = user_input["water_supply"]
        if supply_id == NEW:
            supply_id = _unique_id("hauswasser", taken)
            taken.add(supply_id)
            model.water_supplies.append(WaterSupply(id=supply_id, name="Hauswasser"))
        for supply in model.water_supplies:
            if valve.id in supply.valve_ids and supply.id != supply_id:
                supply.valve_ids.remove(valve.id)
            if supply.id == supply_id and valve.id not in supply.valve_ids:
                supply.valve_ids.append(valve.id)
        valve.water_supply_id = supply_id
        if user_input.get("create_zone"):
            zone_name = user_input.get("zone_name") or valve.name
            zone = Zone(
                id=_unique_id(zone_name, taken),
                name=zone_name,
                type=ZoneType.DRIP,
                valve_id=valve.id,
                duration_s=round(float(user_input.get("zone_duration") or 0) * 60)
                or None,
            )
            model.zones.append(zone)
            valve.zone_ids.append(zone.id)
        return valve.id

    async def async_step_valve_test(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Schritt 5: Testlauf über die Warteschlange (Fortschrittsanzeige)."""
        assert self._valve is not None
        if self._test_task is None:
            data = self.config_entry.runtime_data
            test_valve = copy.deepcopy(self._valve)
            if test_valve.driver in TIMER_DRIVERS:
                # Für den Test: Gerätetimer annehmen, damit Home Assistant
                # nicht schon nach Ablauf schließt und man sieht, ob das
                # Gerät es selbst tut.
                test_valve.driver_options["device_timer"] = True
            driver = create_driver(self.hass, test_valve, data.profiles)
            watchdog = Watchdog(
                self.hass, data.store, data.scheduler, {test_valve.id: driver}
            )
            # Hintergrundaufgabe: Der Test wartet auf die Uhr, darauf soll
            # Home Assistant beim Warten auf Aufgaben nicht hängen bleiben.
            self._test_task = self.hass.async_create_background_task(
                data.scheduler.async_hardware_test(
                    driver,
                    test_valve.water_supply_id,
                    HARDWARE_TEST_MIN_S,
                    lambda: watchdog.flow_l_min(test_valve.id),
                ),
                "irrigation_planner Testlauf",
            )
        if not self._test_task.done():
            return self.async_show_progress(
                step_id="valve_test",
                progress_action="hardware_test",
                progress_task=self._test_task,
                description_placeholders={"seconds": str(HARDWARE_TEST_MIN_S)},
            )
        try:
            self._test_result = self._test_task.result()
        except QueueError as err:
            self._test_result = HardwareTestResult(opened=False, error=str(err))
        return self.async_show_progress_done(next_step_id="valve_test_result")

    async def async_step_valve_test_result(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Ergebnis anzeigen und speichern."""
        assert self._valve is not None
        assert self._test_result is not None
        result = self._test_result
        valve = self._valve
        # Nur übernehmen, wenn das Ergebnis wirklich angezeigt wurde: Endet der
        # Test sofort, reicht Home Assistant die Eingaben des vorigen Formulars
        # weiter, und die dürfen nicht als „Senden“ zählen.
        if user_input is not None and self._result_shown:
            if result.opened and valve.driver in TIMER_DRIVERS:
                valve.driver_options["device_timer"] = bool(result.device_closed)
            caps = set(valve.capabilities) - {Capability.DEVICE_TIMER}
            if result.device_closed:
                caps.add(Capability.DEVICE_TIMER)
            valve.capabilities = frozenset(caps)
            valve.safety_level = (
                SafetyLevel.DEVICE if result.device_closed else SafetyLevel.HA_ONLY
            )
            if result.flow_l_min and valve.learned_flow_l_min is None:
                valve.learned_flow_l_min = round(result.flow_l_min, 2)
            return await self._save()

        if not result.opened:
            outcome = f"Das Ventil hat nicht geöffnet: {result.error}"
        elif result.device_closed:
            outcome = "🟢 Gerät schließt selbst."
        elif result.device_closed is False:
            outcome = (
                "🟡 Das Gerät hat NICHT selbst geschlossen; Home Assistant hat "
                "geschlossen. Nur Home Assistant überwacht die Zeit."
            )
        else:
            outcome = (
                "🟡 Nur Home Assistant überwacht die Zeit (Treiber ohne Gerätetimer)."
            )
        flow = (
            f"{result.flow_l_min:.1f} L/min"
            if result.flow_l_min is not None
            else "kein Messwert"
        )
        closed = "ja" if result.closed_ok else "NEIN! Bitte sofort von Hand prüfen!"
        self._result_shown = True
        return self.async_show_form(
            step_id="valve_test_result",
            data_schema=vol.Schema({}),
            description_placeholders={
                "outcome": outcome,
                "flow": flow,
                "closed": closed,
            },
        )

    async def async_step_remove_valve(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Ventil löschen (Zonen bleiben, ohne Ventil)."""
        if user_input is None:
            return self._pick_form("remove_valve", self.model.valves)
        valve_id = user_input["item"]
        model = self.model
        model.valves = [v for v in model.valves if v.id != valve_id]
        for zone in model.zones:
            if zone.valve_id == valve_id:
                zone.valve_id = None
        for supply in model.water_supplies:
            supply.valve_ids = [v for v in supply.valve_ids if v != valve_id]
        return await self._save()

    # Zonen ------------------------------------------------------------------

    def _zone_schema(self, zone: Zone) -> vol.Schema:
        valves = [(NONE, "(keins)"), *self._choices(self.model.valves)]
        calc_schema = vol.Schema(
            {
                vol.Required("zone_type", default=zone.type.value): _translated(
                    "zone_type", [t.value for t in ZoneType]
                ),
                vol.Required("area_m2", default=zone.area_m2 or 0): _number(
                    0, 2000, 0.1, "m²"
                ),
                vol.Required(
                    "plant_type", default=zone.plant_type or PLANT_NONE
                ): _translated("plant_type", [PLANT_NONE, *PLANTS]),
                vol.Required("kc", default=self._kc_default(zone)): _number(
                    0, 1.5, 0.05
                ),
                vol.Required(
                    "soil_type", default=zone.soil_type or DEFAULT_SOIL
                ): _translated("soil_type", list(SOILS)),
                vol.Required(
                    "root_depth_cm", default=round((zone.root_depth_m or 0) * 100)
                ): _number(0, 150, 5, "cm"),
                vol.Required(
                    "efficiency_pct", default=round((zone.efficiency or 0) * 100)
                ): _number(0, 100, 5, "%"),
                vol.Required(
                    "duration_mode", default=zone.duration_mode.value
                ): _translated("duration_mode", [m.value for m in DurationMode]),
                vol.Optional("duration_entity"): EntitySelector(
                    EntitySelectorConfig(domain=["sensor", "input_number", "number"])
                ),
            }
        )
        calc_defaults = {}
        if (entity_id := self._entity_id(zone.duration_entity)) is not None:
            calc_defaults["duration_entity"] = entity_id
        return vol.Schema(
            {
                vol.Required("name", default=zone.name): TextSelector(),
                vol.Required("valve", default=zone.valve_id or NONE): _select(valves),
                vol.Required(
                    "duration", default=(zone.duration_s or 0) / 60
                ): _minutes(),
                vol.Required(
                    "max_duration", default=(zone.max_duration_s or 0) / 60
                ): _minutes(),
                vol.Required("priority", default=zone.priority): NumberSelector(
                    NumberSelectorConfig(min=0, max=10, mode=NumberSelectorMode.BOX)
                ),
                vol.Required("enabled", default=zone.enabled): BooleanSelector(),
                vol.Optional("calculation"): section(
                    self.add_suggested_values_to_schema(calc_schema, calc_defaults),
                    {"collapsed": zone.duration_mode is DurationMode.MANUAL},
                ),
            }
        )

    @staticmethod
    def _kc_default(zone: Zone) -> float:
        """0 = „automatisch nach Pflanzenart“, sonst der eigene Wert."""
        automatic = PLANTS[zone.plant_type][0] if zone.plant_type in PLANTS else 1.0
        return 0 if zone.kc == automatic else zone.kc

    def _apply_zone(self, zone: Zone, user_input: dict[str, Any]) -> None:
        old_valve = zone.valve_id
        zone.name = user_input["name"]
        zone.valve_id = None if user_input["valve"] == NONE else user_input["valve"]
        zone.duration_s = round(float(user_input["duration"]) * 60) or None
        zone.max_duration_s = round(float(user_input["max_duration"]) * 60) or None
        zone.priority = int(user_input["priority"])
        zone.enabled = bool(user_input["enabled"])
        calc = user_input.get("calculation") or {}
        if calc:
            zone.type = ZoneType(calc["zone_type"])
            zone.area_m2 = float(calc["area_m2"]) or None
            plant = calc["plant_type"]
            zone.plant_type = None if plant == PLANT_NONE else plant
            kc = float(calc["kc"])
            # 0 = Pflanzenfaktor der gewählten Pflanzenart übernehmen.
            zone.kc = kc or (PLANTS[plant][0] if plant in PLANTS else 1.0)
            zone.soil_type = calc["soil_type"]
            zone.root_depth_m = (float(calc["root_depth_cm"]) / 100) or None
            zone.efficiency = (float(calc["efficiency_pct"]) / 100) or None
            zone.duration_mode = DurationMode(calc["duration_mode"])
            entity_id = calc.get("duration_entity")
            zone.duration_entity = self._ref(entity_id) if entity_id else None
        for valve in self.model.valves:
            if valve.id == old_valve and zone.id in valve.zone_ids:
                valve.zone_ids.remove(zone.id)
            if valve.id == zone.valve_id and zone.id not in valve.zone_ids:
                valve.zone_ids.append(zone.id)

    async def _zone_form(
        self, step_id: str, zone: Zone, user_input: dict[str, Any] | None, new: bool
    ) -> ConfigFlowResult:
        errors: dict[str, str] = {}
        placeholders = {"error": ""}
        if user_input is not None:
            if new:
                # Erst die ID, dann zuordnen (sonst hängt eine leere ID am Ventil).
                zone.id = _unique_id(user_input["name"], self._taken())
                self.model.zones.append(zone)
            self._apply_zone(zone, user_input)
            if (error := self._valid()) is None:
                return await self._save()
            errors["base"] = "invalid"
            placeholders["error"] = error
            self._model = None  # Entwurf verwerfen
        return self.async_show_form(
            step_id=step_id,
            data_schema=self._zone_schema(zone),
            errors=errors,
            description_placeholders=placeholders,
        )

    async def async_step_add_zone(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Zone anlegen."""
        zone = Zone(id="", name=(user_input or {}).get("name", ""), type=ZoneType.DRIP)
        return await self._zone_form("add_zone", zone, user_input, new=True)

    async def async_step_edit_zone(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Zone zum Ändern wählen."""
        if user_input is None:
            return self._pick_form("edit_zone", self.model.zones)
        self._edit_id = user_input["item"]
        return await self.async_step_edit_zone_form()

    async def async_step_edit_zone_form(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Zone ändern."""
        zone = next(z for z in self.model.zones if z.id == self._edit_id)
        return await self._zone_form("edit_zone_form", zone, user_input, new=False)

    async def async_step_remove_zone(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Zone löschen (auch aus Programmen und Sensoren)."""
        if user_input is None:
            return self._pick_form("remove_zone", self.model.zones)
        zone_id = user_input["item"]
        model = self.model
        model.zones = [z for z in model.zones if z.id != zone_id]
        for item in (*model.valves, *model.programs, *model.sensors):
            item.zone_ids = [z for z in item.zone_ids if z != zone_id]
        return await self._save()

    # Programme --------------------------------------------------------------

    def _program_schema(self, program: Program) -> vol.Schema:
        if program.start_time:
            schedule, at = "start_time", program.start_time
        elif program.finish_by:
            schedule, at = "finish_by", program.finish_by
        else:
            schedule, at = "window", "07:00:00"
        return vol.Schema(
            {
                vol.Required("name", default=program.name): TextSelector(),
                vol.Required("zones", default=program.zone_ids): _select(
                    self._choices(self.model.zones), multiple=True
                ),
                vol.Required("mode", default=program.mode.value): _translated(
                    "program_mode", [m.value for m in ProgramMode]
                ),
                vol.Required(
                    "pause_between", default=program.pause_between_s
                ): _seconds(0, 600),
                vol.Required("cycle", default=(program.cycle_s or 300) / 60): _minutes(
                    60
                ),
                vol.Required("soak", default=(program.soak_s or 0) / 60): _minutes(240),
                vol.Required("schedule", default=schedule): _translated(
                    "schedule", ["window", "start_time", "finish_by", "manual"]
                ),
                vol.Required("time", default=at): TimeSelector(),
                vol.Optional(
                    "weekdays", default=[str(d) for d in program.weekdays]
                ): _translated("weekday", [str(d) for d in range(7)], multiple=True),
                vol.Required(
                    "interval_days", default=program.interval_days or 0
                ): NumberSelector(
                    NumberSelectorConfig(min=0, max=30, mode=NumberSelectorMode.BOX)
                ),
                vol.Required(
                    "skip_on_rain", default=program.skip_on_rain
                ): BooleanSelector(),
                vol.Required(
                    "skip_on_frost", default=program.skip_on_frost
                ): BooleanSelector(),
                vol.Required(
                    "skip_on_wind", default=program.skip_on_wind
                ): BooleanSelector(),
                vol.Required("enabled", default=program.enabled): BooleanSelector(),
            }
        )

    def _apply_program(self, program: Program, user_input: dict[str, Any]) -> None:
        program.name = user_input["name"]
        program.zone_ids = list(user_input["zones"])
        program.mode = ProgramMode(user_input["mode"])
        program.pause_between_s = int(user_input["pause_between"])
        program.cycle_s = round(float(user_input["cycle"]) * 60) or None
        program.soak_s = round(float(user_input["soak"]) * 60) or None
        schedule = user_input["schedule"]
        program.start_time = user_input["time"] if schedule == "start_time" else None
        program.finish_by = user_input["time"] if schedule == "finish_by" else None
        if schedule == "manual":
            # Ohne Zeit würde das Ende des Zeitfensters gelten: deaktivieren
            # des Zeitplans heißt hier „Programm nicht automatisch starten“.
            program.enabled = False
        else:
            program.enabled = bool(user_input["enabled"])
        program.weekdays = sorted(int(d) for d in user_input.get("weekdays", []))
        program.interval_days = int(user_input["interval_days"]) or None
        program.skip_on_rain = bool(user_input["skip_on_rain"])
        program.skip_on_frost = bool(user_input["skip_on_frost"])
        program.skip_on_wind = bool(user_input["skip_on_wind"])

    async def _program_form(
        self,
        step_id: str,
        program: Program,
        user_input: dict[str, Any] | None,
        new: bool,
    ) -> ConfigFlowResult:
        errors: dict[str, str] = {}
        placeholders = {"error": ""}
        if user_input is not None:
            self._apply_program(program, user_input)
            if new:
                program.id = _unique_id(program.name, self._taken())
                self.model.programs.append(program)
            if (error := self._valid()) is None:
                return await self._save()
            errors["base"] = "invalid"
            placeholders["error"] = error
            self._model = None
        return self.async_show_form(
            step_id=step_id,
            data_schema=self._program_schema(program),
            errors=errors,
            description_placeholders=placeholders,
        )

    async def async_step_add_program(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Programm anlegen."""
        program = Program(id="", name="", finish_by=None)
        return await self._program_form("add_program", program, user_input, new=True)

    async def async_step_edit_program(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Programm zum Ändern wählen."""
        if user_input is None:
            return self._pick_form("edit_program", self.model.programs)
        self._edit_id = user_input["item"]
        return await self.async_step_edit_program_form()

    async def async_step_edit_program_form(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Programm ändern."""
        program = next(p for p in self.model.programs if p.id == self._edit_id)
        return await self._program_form("edit_program_form", program, user_input, False)

    async def async_step_remove_program(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Programm löschen."""
        if user_input is None:
            return self._pick_form("remove_program", self.model.programs)
        self.model.programs = [
            p for p in self.model.programs if p.id != user_input["item"]
        ]
        return await self._save()

    # Wasserversorgungen -----------------------------------------------------

    def _supply_schema(self, supply: WaterSupply) -> vol.Schema:
        return vol.Schema(
            {
                vol.Required("name", default=supply.name): TextSelector(),
                vol.Required(
                    "max_open_valves", default=supply.max_open_valves
                ): NumberSelector(
                    NumberSelectorConfig(min=1, max=4, mode=NumberSelectorMode.BOX)
                ),
            }
        )

    async def _supply_form(
        self,
        step_id: str,
        supply: WaterSupply,
        user_input: dict[str, Any] | None,
        new: bool,
    ) -> ConfigFlowResult:
        if user_input is not None:
            supply.name = user_input["name"]
            supply.max_open_valves = max(1, int(user_input["max_open_valves"]))
            if new:
                supply.id = _unique_id(supply.name, self._taken())
                self.model.water_supplies.append(supply)
            return await self._save()
        return self.async_show_form(
            step_id=step_id, data_schema=self._supply_schema(supply)
        )

    async def async_step_add_supply(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Wasserversorgung anlegen (Standard: 1 Ventil gleichzeitig)."""
        return await self._supply_form(
            "add_supply", WaterSupply(id="", name=""), user_input, True
        )

    async def async_step_edit_supply(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Wasserversorgung zum Ändern wählen."""
        if user_input is None:
            return self._pick_form("edit_supply", self.model.water_supplies)
        self._edit_id = user_input["item"]
        return await self.async_step_edit_supply_form()

    async def async_step_edit_supply_form(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Wasserversorgung ändern."""
        supply = next(s for s in self.model.water_supplies if s.id == self._edit_id)
        return await self._supply_form("edit_supply_form", supply, user_input, False)

    async def async_step_remove_supply(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Wasserversorgung löschen (Ventile teilen sich dann die Grenze 1)."""
        if user_input is None:
            return self._pick_form("remove_supply", self.model.water_supplies)
        supply_id = user_input["item"]
        model = self.model
        model.water_supplies = [s for s in model.water_supplies if s.id != supply_id]
        for valve in model.valves:
            if valve.water_supply_id == supply_id:
                valve.water_supply_id = None
        return await self._save()

    # Sensoren ---------------------------------------------------------------

    async def async_step_sensors(self, user_input: Any = None) -> ConfigFlowResult:
        """Menü Sensoren (Regen, Bodenfeuchte)."""
        return self.async_show_menu(
            step_id="sensors", menu_options=["add_sensor", "remove_sensor"]
        )

    async def async_step_add_sensor(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Regen- oder Bodenfeuchtesensor hinzufügen."""
        errors: dict[str, str] = {}
        placeholders = {"error": ""}
        if user_input is not None:
            ref = self._ref(user_input["entity"])
            if ref is None:
                errors["entity"] = "entity_no_unique_id"
            else:
                kind = SensorKind(user_input["kind"])
                sensor = Sensor(
                    id=_unique_id(user_input["name"], self._taken()),
                    name=user_input["name"],
                    kind=kind,
                    entity=ref,
                    zone_ids=list(user_input.get("zones", [])),
                    field_capacity_pct=float(user_input["field_capacity_pct"]),
                    wilting_point_pct=float(user_input["wilting_point_pct"]),
                )
                entry = er.async_get(self.hass).async_get(user_input["entity"])
                sensor.device_id = entry.device_id if entry else None
                self.model.sensors.append(sensor)
                if (error := self._valid()) is None:
                    return await self._save()
                errors["base"] = "invalid"
                placeholders["error"] = error
                self._model = None
        schema = vol.Schema(
            {
                vol.Required("name"): TextSelector(),
                vol.Required(
                    "kind", default=SensorKind.SOIL_MOISTURE.value
                ): _translated(
                    "sensor_kind",
                    [SensorKind.SOIL_MOISTURE.value, SensorKind.RAIN_MM.value],
                ),
                vol.Required("entity"): EntitySelector(
                    EntitySelectorConfig(domain="sensor")
                ),
                vol.Optional("zones", default=[]): _select(
                    self._choices(self.model.zones), multiple=True
                ),
                vol.Required("field_capacity_pct", default=35): _number(1, 100, 1, "%"),
                vol.Required("wilting_point_pct", default=12): _number(0, 99, 1, "%"),
            }
        )
        return self.async_show_form(
            step_id="add_sensor",
            data_schema=self.add_suggested_values_to_schema(schema, user_input or {}),
            errors=errors,
            description_placeholders=placeholders,
        )

    async def async_step_remove_sensor(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Sensor entfernen."""
        if user_input is None:
            return self._pick_form("remove_sensor", self.model.sensors)
        self.model.sensors = [
            s for s in self.model.sensors if s.id != user_input["item"]
        ]
        return await self._save()

    # Einstellungen ----------------------------------------------------------

    async def async_step_settings(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Wetter, Zeitfenster, Winterpause nach Datum."""
        entry = self.config_entry
        settings = self.model.settings
        errors: dict[str, str] = {}
        placeholders = {"error": ""}
        if user_input is not None:
            if user_input[CONF_WINDOW_START] == user_input[CONF_WINDOW_END]:
                errors["base"] = "window_empty"
            else:
                settings.winter_start = user_input.get("winter_start") or None
                settings.winter_end = user_input.get("winter_end") or None
                if (error := self._valid()) is not None:
                    errors["base"] = "invalid"
                    placeholders["error"] = error
                    self._model = None
                else:
                    data = {
                        **entry.data,
                        CONF_WINDOW_START: user_input[CONF_WINDOW_START],
                        CONF_WINDOW_END: user_input[CONF_WINDOW_END],
                    }
                    data.pop(CONF_WEATHER_ENTITY, None)
                    if user_input.get(CONF_WEATHER_ENTITY):
                        data[CONF_WEATHER_ENTITY] = user_input[CONF_WEATHER_ENTITY]
                    self.hass.config_entries.async_update_entry(entry, data=data)
                    return await self._save()
        schema = vol.Schema(
            {
                vol.Optional(CONF_WEATHER_ENTITY): EntitySelector(
                    EntitySelectorConfig(domain="weather")
                ),
                vol.Required(CONF_WINDOW_START): TimeSelector(),
                vol.Required(CONF_WINDOW_END): TimeSelector(),
                vol.Optional("winter_start"): TextSelector(),
                vol.Optional("winter_end"): TextSelector(),
            }
        )
        suggested = {
            CONF_WEATHER_ENTITY: entry.data.get(CONF_WEATHER_ENTITY),
            CONF_WINDOW_START: entry.data.get(CONF_WINDOW_START),
            CONF_WINDOW_END: entry.data.get(CONF_WINDOW_END),
            "winter_start": settings.winter_start,
            "winter_end": settings.winter_end,
        }
        return self.async_show_form(
            step_id="settings",
            data_schema=self.add_suggested_values_to_schema(schema, suggested),
            errors=errors,
            description_placeholders=placeholders,
        )
