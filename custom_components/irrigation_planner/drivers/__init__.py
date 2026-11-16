"""Treiberschicht: steuert Ventile unabhängig von der Hardware.

Treiber (Konzept, Abschnitt 3a):

- ``ha_valve``: beliebige ``valve``-Entität
- ``ha_switch``: beliebige ``switch``-Entität
- ``zigbee2mqtt``: Zigbee2MQTT-Geräte mit Gerätetimer (``on_time`` u. a.)
- ``service_call``: Integrationen mit eigenem Dienst „Zone X für N Minuten“

Treiber erzeugt ``registry.create_driver``. Es wird hier bewusst nicht
importiert, damit ``model.py`` die Basisklasse ohne Kreisimport laden kann.
"""

from .base import Capability, SafetyLevel, ValveDriver, validate_duration

__all__ = ["Capability", "SafetyLevel", "ValveDriver", "validate_duration"]
