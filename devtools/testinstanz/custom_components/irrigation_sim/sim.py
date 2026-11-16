"""Physik des Simulators: Ventile, Durchfluss, Menge, Bodenfeuchte.

Keine Verbindung nach außen. Alles läuft nur im Speicher der Testinstanz.
"""

from __future__ import annotations

from collections.abc import Callable

from homeassistant.core import CALLBACK_TYPE, HomeAssistant, callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.event import async_call_later

from .const import DRIP_L_MIN, LOGGER, TICK_S, Fault, ZoneSpec


class SimValve:
    """Ein simuliertes Bewässerungsventil."""

    def __init__(self, hass: HomeAssistant, spec: ZoneSpec) -> None:
        """Legt das Ventil geschlossen und ohne Störung an."""
        self.hass = hass
        self.spec = spec
        self.is_open = False
        self.fault = Fault.NONE
        self.battery = 100
        self.total_l = 0.0
        self.run_l = 0.0
        self.run_s = 0.0
        self.moisture = 35.0 if spec.soil_sensor else None
        self._timer: CALLBACK_TYPE | None = None
        self._listeners: list[Callable[[], None]] = []

    @property
    def name(self) -> str:
        """Anzeigename."""
        return f"Zone {self.spec.number}"

    @property
    def available(self) -> bool:
        """Gibt an, ob das Gerät antwortet."""
        return self.fault is not Fault.UNREACHABLE

    @property
    def status(self) -> str:
        """Gerätestatus wie beim SONOFF SWV."""
        if self.fault is Fault.LEAK:
            return "water_leakage"
        if self.fault is Fault.SHORTAGE:
            return "water_shortage"
        return "normal_state"

    @property
    def flow_l_min(self) -> float:
        """Aktueller Durchfluss in L/min."""
        if not self.is_open:
            return DRIP_L_MIN if self.fault is Fault.DRIPPING else 0.0
        factor = {
            Fault.SHORTAGE: 0.0,
            Fault.BURST: 2.0,
            Fault.CLOGGED: 0.3,
        }.get(self.fault, 1.0)
        return round(self.spec.flow_l_min * factor, 2)

    @callback
    def add_listener(self, update: Callable[[], None]) -> CALLBACK_TYPE:
        """Meldet eine Entität für Zustandsänderungen an."""
        self._listeners.append(update)
        return lambda: self._listeners.remove(update)

    @callback
    def notify(self) -> None:
        """Informiert alle Entitäten."""
        for update in list(self._listeners):
            update()

    def _check_reachable(self) -> None:
        if not self.available:
            raise HomeAssistantError(f"{self.name} ist nicht erreichbar")

    @callback
    def open(self, on_time: int | None = None) -> None:
        """Öffnet das Ventil.

        Mit ``on_time`` und Gerätetimer schließt das Ventil nach Ablauf von
        selbst, so wie ein Zigbee-Ventil mit ``on_time``. Ohne Gerätetimer
        wird ``on_time`` ignoriert: Dann muss Home Assistant schließen.
        """
        self._check_reachable()
        self._cancel_timer()
        if not self.is_open:
            self.run_l = 0.0
            self.run_s = 0.0
        self.is_open = True
        if on_time is not None and self.spec.device_timer:
            self._timer = async_call_later(self.hass, on_time, self._timer_done)
        LOGGER.info("%s offen (on_time=%s)", self.name, on_time)
        self.notify()

    @callback
    def close(self) -> None:
        """Schließt das Ventil (außer bei der Störung „hängt offen“)."""
        self._check_reachable()
        if self.fault is Fault.STUCK_OPEN:
            LOGGER.warning("%s ignoriert den Schließbefehl (Störung)", self.name)
            return
        self._cancel_timer()
        self.is_open = False
        LOGGER.info("%s zu", self.name)
        self.notify()

    @callback
    def set_fault(self, fault: Fault) -> None:
        """Setzt eine Störung (oder ``Fault.NONE``)."""
        self.fault = fault
        self.notify()

    @callback
    def set_battery(self, level: int) -> None:
        """Setzt den Batteriestand."""
        self.battery = level
        self.notify()

    @callback
    def _timer_done(self, _now: object) -> None:
        self._timer = None
        if self.fault is Fault.STUCK_OPEN:
            return
        self.is_open = False
        LOGGER.info("%s hat sich selbst geschlossen (Gerätetimer)", self.name)
        self.notify()

    def _cancel_timer(self) -> None:
        if self._timer is not None:
            self._timer()
            self._timer = None

    @callback
    def tick(self, seconds: float) -> None:
        """Schreibt Menge und Bodenfeuchte fort."""
        liters = self.flow_l_min * seconds / 60
        self.total_l += liters
        if self.is_open:
            self.run_l += liters
            self.run_s += seconds
        if self.moisture is not None:
            # trocknet langsam aus, Wasser hebt die Feuchte
            self.moisture -= 0.5 * seconds / 3600
            self.moisture += liters * 0.05
            self.moisture = min(max(self.moisture, 5.0), 60.0)
        self.notify()

    @callback
    def shutdown(self) -> None:
        """Räumt Timer auf."""
        self._cancel_timer()


class Simulator:
    """Alle simulierten Ventile und der gemeinsame Takt."""

    def __init__(self, hass: HomeAssistant, specs: tuple[ZoneSpec, ...]) -> None:
        """Legt alle Ventile an."""
        self.hass = hass
        self.valves = [SimValve(hass, spec) for spec in specs]
        self.supply_total_l = 0.0
        self._listeners: list[Callable[[], None]] = []

    @property
    def supply_flow_l_min(self) -> float:
        """Durchfluss in der Zuleitung (Summe aller Ventile)."""
        return round(sum(v.flow_l_min for v in self.valves), 2)

    @callback
    def add_listener(self, update: Callable[[], None]) -> CALLBACK_TYPE:
        """Meldet eine Entität der Zuleitung an."""
        self._listeners.append(update)
        return lambda: self._listeners.remove(update)

    @callback
    def tick(self, _now: object = None) -> None:
        """Ein Takt für alle Ventile."""
        self.supply_total_l += self.supply_flow_l_min * TICK_S / 60
        for valve in self.valves:
            valve.tick(TICK_S)
        for update in list(self._listeners):
            update()

    @callback
    def shutdown(self) -> None:
        """Räumt alle Timer auf."""
        for valve in self.valves:
            valve.shutdown()
