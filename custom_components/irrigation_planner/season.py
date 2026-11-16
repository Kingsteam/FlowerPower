"""Winterpause (Konzept, Abschnitt 8).

Einwintern:

1. alle Läufe beenden, alle Ventile schließen und bestätigen
2. Zeitpläne aussetzen (Programme starten nicht, die Überwachung ruht)
3. die zugeordneten Geräte (Ventile, Sensoren) in Home Assistant
   deaktivieren, aber nur, wenn wirklich alles zu ist
4. eine Benachrichtigung schicken

Auswintern: genau die Geräte wieder aktivieren, die die Winterpause
deaktiviert hat, und eine Benachrichtigung mit dem Hinweis auf einen
Testlauf schicken.

Optional automatisch nach Datum (``Settings.winter_start``/``winter_end``,
MM-TT): Am Starttag beginnt die Pause, am Endtag endet sie. Dazwischen
kann man von Hand umschalten, ohne dass es am nächsten Tag zurückgestellt
wird.
"""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from homeassistant.components import persistent_notification
from homeassistant.core import CALLBACK_TYPE, HomeAssistant, callback
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers.event import async_track_time_change
from homeassistant.util import dt as dt_util

from .const import DOMAIN, LOGGER

if TYPE_CHECKING:
    from . import IrrigationPlannerData

# So lange wird beim Einwintern gewartet, bis alle Ventile bestätigt zu sind.
WINTER_CLOSE_TIMEOUT_S = 120
NOTIFICATION_ID = f"{DOMAIN}_winter"


class Season:
    """Schaltet die Winterpause."""

    def __init__(self, hass: HomeAssistant, data: IrrigationPlannerData) -> None:
        """Merkt sich die Laufzeitdaten."""
        self.hass = hass
        self.data = data
        self._unsub: CALLBACK_TYPE | None = None

    @callback
    def async_start(self) -> None:
        """Prüft jede Nacht, ob die Winterpause nach Datum beginnt oder endet."""
        self._unsub = async_track_time_change(
            self.hass, self._on_night, hour=0, minute=5, second=0
        )

    @callback
    def async_stop(self) -> None:
        """Beendet die Datumsprüfung."""
        if self._unsub is not None:
            self._unsub()
            self._unsub = None

    async def _on_night(self, now: datetime) -> None:
        settings = self.data.store.model.settings
        today = dt_util.as_local(now).strftime("%m-%d")
        if settings.winter_start == today and not settings.winter_mode:
            LOGGER.info("Winterpause beginnt laut Datum")
            await self.async_set(True)
        elif settings.winter_end == today and settings.winter_mode:
            LOGGER.info("Winterpause endet laut Datum")
            await self.async_set(False)

    def _device_ids(self) -> set[str]:
        model = self.data.store.model
        ids = {v.device_id for v in model.valves if v.device_id}
        ids |= {s.device_id for s in model.sensors if s.device_id}
        return ids

    async def async_set(self, on: bool) -> None:
        """Winterpause ein- oder ausschalten."""
        settings = self.data.store.model.settings
        if on == settings.winter_mode:
            return
        if on:
            await self._winter_on()
        else:
            self._winter_off()
        self.data.async_model_changed()

    async def _winter_on(self) -> None:
        settings = self.data.store.model.settings
        settings.winter_mode = True
        self.data.async_model_changed()
        scheduler = self.data.scheduler
        await scheduler.async_stop_all()
        all_closed = await scheduler.async_wait_idle(WINTER_CLOSE_TIMEOUT_S)
        steps = [
            "Alle Läufe beendet und Ventile geschlossen"
            if all_closed
            else "ACHTUNG: Nicht alle Ventile sind bestätigt zu",
            "Zeitpläne pausiert, Überwachung ruht",
        ]
        if all_closed:
            registry = dr.async_get(self.hass)
            disabled = []
            for device_id in sorted(self._device_ids()):
                device = registry.async_get(device_id)
                if device is None or device.disabled_by is not None:
                    continue
                registry.async_update_device(
                    device_id, disabled_by=dr.DeviceEntryDisabler.USER
                )
                disabled.append(device_id)
            settings.winter_disabled_devices = disabled
            steps.append(f"{len(disabled)} Geräte in Home Assistant deaktiviert")
        else:
            steps.append(
                "Geräte bleiben aktiv, bis alle Ventile zu sind. Bitte prüfen!"
            )
        LOGGER.info("Winterpause aktiv: %s", "; ".join(steps))
        persistent_notification.async_create(
            self.hass,
            "\n".join(f"- {step}" for step in steps),
            title="Bewässerung: Winterpause aktiv",
            notification_id=NOTIFICATION_ID,
        )

    @callback
    def _winter_off(self) -> None:
        settings = self.data.store.model.settings
        registry = dr.async_get(self.hass)
        enabled = 0
        for device_id in settings.winter_disabled_devices:
            device = registry.async_get(device_id)
            if device is not None and device.disabled_by is dr.DeviceEntryDisabler.USER:
                registry.async_update_device(device_id, disabled_by=None)
                enabled += 1
        settings.winter_disabled_devices = []
        settings.winter_mode = False
        # Über den Winter wurde nicht gerechnet: mit vollem Boden neu beginnen.
        self.data.balance.async_reset()
        LOGGER.info("Winterpause beendet, %s Geräte wieder aktiviert", enabled)
        persistent_notification.async_create(
            self.hass,
            f"- {enabled} Geräte wieder aktiviert\n"
            "- Zeitpläne laufen wieder (wenn die Automatik an ist)\n"
            "- Wasserhaushalt aller Zonen auf 0 gesetzt\n"
            "- Sobald sich die Ventile melden: je Zone einen kurzen Testlauf "
            "machen (Einstellungen → Bewässerungsplaner → Konfigurieren → "
            "Ventil ändern)",
            title="Bewässerung: Winterpause beendet",
            notification_id=NOTIFICATION_ID,
        )
