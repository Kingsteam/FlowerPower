"""Treiber für Zigbee2MQTT-Geräte.

Schickt die Dauer direkt ans Gerät, z. B. ``{"state":"ON","on_time":600}``
an ``zigbee2mqtt/<Name>/set``. Der Timer läuft dann im Ventil, und es
schließt auch ohne Home Assistant oder MQTT von selbst.

Der Befehl kommt aus dem Geräteprofil (oder aus ``driver_options``). Ohne
beides wird ``on_time`` trotzdem mitgeschickt, die Sicherheitsstufe bleibt
aber gelb, bis ein Profil oder der Testlauf den Gerätetimer bestätigt.
"""

from __future__ import annotations

import json
from typing import Any, Final

from homeassistant.components import mqtt
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import HomeAssistantError

from ..model import Valve
from ..profiles import Profile, contains_placeholder, fill_placeholder
from .base import Capability
from .ha import HassValveDriver

DEFAULT_BASE_TOPIC: Final = "zigbee2mqtt"
DEFAULT_OPEN_PAYLOAD: Final = {"state": "ON", "on_time": "{duration}"}
DEFAULT_CLOSE_PAYLOAD: Final = {"state": "OFF"}

OPT_FRIENDLY_NAME: Final = "friendly_name"
OPT_BASE_TOPIC: Final = "base_topic"
OPT_OPEN_PAYLOAD: Final = "open_payload"
OPT_CLOSE_PAYLOAD: Final = "close_payload"


OPT_DEVICE_TIMER: Final = "device_timer"


def _timer_confirmed(valve: Valve, profile: Profile | None) -> bool:
    """Gerätetimer bestätigt? Ein Testlauf-Ergebnis (Option) hat Vorrang."""
    if OPT_DEVICE_TIMER in valve.driver_options:
        return bool(valve.driver_options[OPT_DEVICE_TIMER])
    return Capability.DEVICE_TIMER in valve.capabilities or (
        profile is not None and Capability.DEVICE_TIMER in profile.capabilities
    )


class Zigbee2MqttDriver(HassValveDriver):
    """Schaltet über ``<base_topic>/<friendly_name>/set``."""

    name = "zigbee2mqtt"

    def __init__(
        self, hass: HomeAssistant, valve: Valve, profile: Profile | None = None
    ) -> None:
        """Prüft die Einstellungen und legt die Befehle fest."""
        options = valve.driver_options
        friendly_name = options.get(OPT_FRIENDLY_NAME)
        base_topic = options.get(OPT_BASE_TOPIC, DEFAULT_BASE_TOPIC)
        for label, value in (
            ("friendly_name", friendly_name),
            ("base_topic", base_topic),
        ):
            if not isinstance(value, str) or not value.strip("/"):
                raise ValueError(f"{valve.name}: Zigbee2MQTT braucht {label}")
            if "+" in value or "#" in value:
                raise ValueError(f"{valve.name}: {label} darf kein + oder # enthalten")
        self.topic = f"{base_topic.strip('/')}/{friendly_name}/set"

        def pick(key: str, profile_value: Any, default: dict[str, Any]) -> Any:
            if key in options:
                return options[key]
            return profile_value if profile_value is not None else default

        self.open_payload = pick(
            OPT_OPEN_PAYLOAD,
            profile.open_payload if profile else None,
            DEFAULT_OPEN_PAYLOAD,
        )
        self.close_payload = pick(
            OPT_CLOSE_PAYLOAD,
            profile.close_payload if profile else None,
            DEFAULT_CLOSE_PAYLOAD,
        )
        if not isinstance(self.open_payload, dict) or not isinstance(
            self.close_payload, dict
        ):
            raise ValueError(f"{valve.name}: Befehle müssen JSON-Objekte sein")
        timer_known = _timer_confirmed(valve, profile)
        if timer_known and not contains_placeholder(self.open_payload):
            # Sicherheitsregel 1: Kann das Gerät einen Timer, MUSS die Dauer mit.
            raise ValueError(
                f"{valve.name}: Gerät hat einen Timer, der Öffnungsbefehl "
                "muss {duration} enthalten"
            )
        super().__init__(hass, valve, profile)

    def _device_timer(self) -> bool:
        """Gerätetimer nur, wenn die Dauer im Befehl steckt UND bestätigt ist."""
        return _timer_confirmed(self.valve, self.profile) and contains_placeholder(
            self.open_payload
        )

    async def _publish(self, payload: dict[str, Any]) -> None:
        if not await mqtt.async_wait_for_mqtt_client(self.hass):
            raise HomeAssistantError(f"{self.valve.name}: MQTT ist nicht verbunden")
        await mqtt.async_publish(self.hass, self.topic, json.dumps(payload), qos=1)

    async def _async_open(self, duration_s: int) -> None:
        """Öffnet mit Dauer im Befehl."""
        await self._publish(fill_placeholder(self.open_payload, duration_s))

    async def _async_close(self) -> None:
        """Schließt."""
        await self._publish(self.close_payload)
