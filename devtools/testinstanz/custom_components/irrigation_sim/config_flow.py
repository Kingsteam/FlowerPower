"""Einrichtung des Simulators (ohne Eingaben)."""

from __future__ import annotations

from typing import Any

from homeassistant.config_entries import ConfigFlow, ConfigFlowResult

from .const import DOMAIN

TITLE = "Ventil-Simulator (nur Test)"


class SimConfigFlow(ConfigFlow, domain=DOMAIN):
    """Legt genau einen Simulator an."""

    VERSION = 1

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Einrichtung über die Oberfläche."""
        if user_input is None:
            return self.async_show_form(step_id="user")
        return self.async_create_entry(title=TITLE, data={})

    async def async_step_import(self, import_data: dict[str, Any]) -> ConfigFlowResult:
        """Einrichtung aus ``configuration.yaml``."""
        return self.async_create_entry(title=TITLE, data={})
