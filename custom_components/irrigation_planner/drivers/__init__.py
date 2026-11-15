"""Treiberschicht: steuert Ventile unabhängig von der Hardware.

Geplante Treiber (Konzept, Abschnitt 3a), noch nicht gebaut:

- ``ha_valve``: beliebige ``valve``-Entität
- ``ha_switch``: beliebige ``switch``-Entität
- ``zigbee2mqtt``: Zigbee2MQTT-Geräte mit Gerätetimer (``on_time`` u. a.)
- ``service_call``: Integrationen mit eigenem Dienst „Zone X für N Minuten“
"""

from .base import Capability, SafetyLevel, ValveDriver, validate_duration

__all__ = ["Capability", "SafetyLevel", "ValveDriver", "validate_duration"]
