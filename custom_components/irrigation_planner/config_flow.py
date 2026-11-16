"""Ersteinrichtung des Bewässerungsplaners."""

from __future__ import annotations

from typing import Any

from homeassistant.config_entries import (
    ConfigEntry,
    ConfigFlow,
    ConfigFlowResult,
    OptionsFlow,
)
from homeassistant.core import callback
from homeassistant.helpers.selector import (
    EntitySelector,
    EntitySelectorConfig,
    TimeSelector,
)
import voluptuous as vol

from .const import (
    CONF_MAX_OPEN_VALVES,
    CONF_WEATHER_ENTITY,
    CONF_WINDOW_END,
    CONF_WINDOW_START,
    DEFAULT_MAX_OPEN_VALVES,
    DEFAULT_WINDOW_END,
    DEFAULT_WINDOW_START,
    DOMAIN,
    NAME,
)

STEP_USER_SCHEMA = vol.Schema(
    {
        vol.Optional(CONF_WEATHER_ENTITY): EntitySelector(
            EntitySelectorConfig(domain="weather")
        ),
        vol.Required(CONF_WINDOW_START, default=DEFAULT_WINDOW_START): TimeSelector(),
        vol.Required(CONF_WINDOW_END, default=DEFAULT_WINDOW_END): TimeSelector(),
    }
)


class IrrigationPlannerConfigFlow(ConfigFlow, domain=DOMAIN):
    """Config-Flow: nur eine Instanz, ein Formular."""

    VERSION = 1
    MINOR_VERSION = 1

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: ConfigEntry) -> OptionsFlow:
        """Einrichtung von Ventilen, Zonen, Programmen (siehe options_flow.py)."""
        from .options_flow import IrrigationPlannerOptionsFlow

        return IrrigationPlannerOptionsFlow()

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Erster und einziger Schritt."""
        if self._async_current_entries():
            return self.async_abort(reason="single_instance_allowed")

        errors: dict[str, str] = {}
        if user_input is not None:
            if user_input[CONF_WINDOW_START] == user_input[CONF_WINDOW_END]:
                errors["base"] = "window_empty"
            else:
                # Die Grenze "Ventile gleichzeitig offen" ist fest 1 und wird
                # hier nur gespeichert, nicht abgefragt.
                data = {**user_input, CONF_MAX_OPEN_VALVES: DEFAULT_MAX_OPEN_VALVES}
                return self.async_create_entry(title=NAME, data=data)

        return self.async_show_form(
            step_id="user",
            data_schema=self.add_suggested_values_to_schema(
                STEP_USER_SCHEMA, user_input
            ),
            errors=errors,
            description_placeholders={"max_open_valves": str(DEFAULT_MAX_OPEN_VALVES)},
        )
