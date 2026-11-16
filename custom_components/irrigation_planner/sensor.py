"""Sensoren: Status, aktive Zone, Laufende, Warteschlange, Zonen, Programme."""

from __future__ import annotations

from datetime import datetime

from homeassistant.components.sensor import SensorDeviceClass, SensorEntity
from homeassistant.const import UnitOfLength, UnitOfTime
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from . import IrrigationPlannerConfigEntry
from .entity import PlannerEntity, ProgramEntity, ZoneEntity, main_device
from .programs import plan_total_s
from .scheduler import RunState

GLOBAL_STATES = ["ready", "running", "paused", "winter", "error"]
ZONE_STATES = ["idle", "queued", "running", "locked", "disabled", "error"]
_ACTIVE = (RunState.OPENING, RunState.RUNNING, RunState.CLOSING, RunState.PAUSE)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: IrrigationPlannerConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Legt die Sensoren an."""
    model = entry.runtime_data.store.model
    entities: list[SensorEntity] = [
        StatusSensor(entry),
        ActiveZoneSensor(entry),
        RunEndSensor(entry),
        QueueSensor(entry),
    ]
    entities.append(Et0Sensor(entry))
    for zone in model.zones:
        entities += [
            ZoneStateSensor(entry, zone),
            ZoneLastRunSensor(entry, zone),
            ZoneNeedSensor(entry, zone),
            ZonePlannedSensor(entry, zone),
        ]
    for program in model.programs:
        entities += [
            NextRunSensor(entry, program),
            ProgramDurationSensor(entry, program),
        ]
    async_add_entities(entities)


class StatusSensor(PlannerEntity, SensorEntity):
    """Gesamtstatus."""

    _attr_device_class = SensorDeviceClass.ENUM
    _attr_options = GLOBAL_STATES

    def __init__(self, entry: IrrigationPlannerConfigEntry) -> None:
        """Legt den Sensor an."""
        super().__init__(entry, "status", main_device(entry))

    @property
    def native_value(self) -> str:
        """Bereit, läuft, pausiert, Winterpause oder Fehler."""
        data = self.data
        settings = data.store.model.settings
        if data.problems:
            return "error"
        if any(r.state in _ACTIVE for r in data.scheduler.runs()):
            return "running"
        if settings.winter_mode:
            return "winter"
        if not settings.automatic:
            return "paused"
        return "ready"


class ActiveZoneSensor(PlannerEntity, SensorEntity):
    """Name der Zone, die gerade gießt."""

    def __init__(self, entry: IrrigationPlannerConfigEntry) -> None:
        """Legt den Sensor an."""
        super().__init__(entry, "active_zone", main_device(entry))

    @property
    def native_value(self) -> str | None:
        """Zonennamen, durch Komma getrennt (bei mehreren Versorgungen)."""
        names = {z.id: z.name for z in self.data.store.model.zones}
        running = [
            names.get(r.zone_id, r.zone_id)
            for r in self.data.scheduler.runs()
            if r.state in (RunState.OPENING, RunState.RUNNING)
        ]
        return ", ".join(running) or None


class RunEndSensor(PlannerEntity, SensorEntity):
    """Wann der aktuelle Lauf endet (die Oberfläche zeigt die Restzeit)."""

    _attr_device_class = SensorDeviceClass.TIMESTAMP

    def __init__(self, entry: IrrigationPlannerConfigEntry) -> None:
        """Legt den Sensor an."""
        super().__init__(entry, "run_end", main_device(entry))

    @property
    def native_value(self) -> datetime | None:
        """Ende des laufenden Laufs."""
        ends = [
            r.ends_at
            for r in self.data.scheduler.runs()
            if r.state is RunState.RUNNING and r.ends_at
        ]
        return min(ends) if ends else None


class QueueSensor(PlannerEntity, SensorEntity):
    """Wie viele Läufe warten."""

    def __init__(self, entry: IrrigationPlannerConfigEntry) -> None:
        """Legt den Sensor an."""
        super().__init__(entry, "queue", main_device(entry))

    @property
    def native_value(self) -> int:
        """Anzahl wartender Läufe."""
        return sum(1 for r in self.data.scheduler.runs() if r.state is RunState.QUEUED)


class ZoneStateSensor(ZoneEntity, SensorEntity):
    """Zustand einer Zone."""

    _attr_device_class = SensorDeviceClass.ENUM
    _attr_options = ZONE_STATES

    def __init__(self, entry: IrrigationPlannerConfigEntry, zone) -> None:
        """Legt den Sensor an."""
        super().__init__(entry, "zone_state", zone)

    @property
    def native_value(self) -> str:
        """Bereit, wartet, läuft, gesperrt, deaktiviert oder Fehler."""
        scheduler = self.data.scheduler
        if scheduler.zone_stuck(self.zone_id):
            return "error"
        if self.zone_id in scheduler.locked_zones:
            return "locked"
        if not self.zone.enabled:
            return "disabled"
        if scheduler.active_run(self.zone_id) is not None:
            return "running"
        if any(r.zone_id == self.zone_id for r in scheduler.runs()):
            return "queued"
        return "idle"

    @property
    def extra_state_attributes(self) -> dict[str, str]:
        """Grund einer Sperre."""
        reason = self.data.scheduler.locked_zones.get(self.zone_id)
        return {"reason": reason} if reason else {}


class ZoneLastRunSensor(ZoneEntity, SensorEntity):
    """Ende des letzten Laufs einer Zone."""

    _attr_device_class = SensorDeviceClass.TIMESTAMP

    def __init__(self, entry: IrrigationPlannerConfigEntry, zone) -> None:
        """Legt den Sensor an."""
        super().__init__(entry, "last_run", zone)

    @property
    def native_value(self) -> datetime | None:
        """Zeitpunkt."""
        run = self.data.scheduler.last_runs.get(self.zone_id)
        return run.ends_at if run else None

    @property
    def extra_state_attributes(self) -> dict[str, object]:
        """Ergebnis und Dauer des letzten Laufs."""
        run = self.data.scheduler.last_runs.get(self.zone_id)
        if run is None:
            return {}
        return {
            "result": run.state.value,
            "duration_s": run.duration_s,
            "source": run.source,
        }


class NextRunSensor(ProgramEntity, SensorEntity):
    """Nächster automatischer Start eines Programms."""

    _attr_device_class = SensorDeviceClass.TIMESTAMP

    def __init__(self, entry: IrrigationPlannerConfigEntry, program) -> None:
        """Legt den Sensor an."""
        super().__init__(entry, "next_run", program)

    @property
    def native_value(self) -> datetime | None:
        """Zeitpunkt (leer, wenn nichts geplant ist)."""
        return self.data.programs.next_start(self.program)

    @property
    def extra_state_attributes(self) -> dict[str, object]:
        """Letztes Ergebnis und ob der nächste Start übersprungen wird."""
        programs = self.data.programs
        attrs: dict[str, object] = {
            "skip_next": programs.skip_next_pending(self.program_id)
        }
        if (result := programs.results.get(self.program_id)) is not None:
            attrs["last_result"] = result.reason
            attrs["last_started"] = result.started
        return attrs


class ProgramDurationSensor(ProgramEntity, SensorEntity):
    """Geschätzte Dauer eines Programms."""

    _attr_device_class = SensorDeviceClass.DURATION
    _attr_native_unit_of_measurement = UnitOfTime.MINUTES
    _attr_suggested_display_precision = 0

    def __init__(self, entry: IrrigationPlannerConfigEntry, program) -> None:
        """Legt den Sensor an."""
        super().__init__(entry, "program_duration", program)

    @property
    def native_value(self) -> float:
        """Minuten inklusive Pausen."""
        return round(plan_total_s(self.data.programs.plan(self.program)) / 60, 1)


class Et0Sensor(PlannerEntity, SensorEntity):
    """Verdunstung (ET0) des letzten abgeschlossenen Tages."""

    _attr_native_unit_of_measurement = UnitOfLength.MILLIMETERS
    _attr_suggested_display_precision = 1

    def __init__(self, entry: IrrigationPlannerConfigEntry) -> None:
        """Legt den Sensor an."""
        super().__init__(entry, "et0", main_device(entry))

    @property
    def native_value(self) -> float | None:
        """Mm des letzten Tages."""
        history = self.data.balance.history
        return round(history[-1].et0_mm, 2) if history else None

    @property
    def extra_state_attributes(self) -> dict[str, object]:
        """Tag, Regen und die letzten Tage."""
        history = self.data.balance.history
        if not history:
            return {}
        return {
            "day": history[-1].day,
            "rain_mm": round(history[-1].rain_mm, 1),
            "history": [
                {
                    "day": h.day,
                    "et0_mm": round(h.et0_mm, 1),
                    "rain_mm": round(h.rain_mm, 1),
                }
                for h in history[-7:]
            ],
        }


class ZoneNeedSensor(ZoneEntity, SensorEntity):
    """Wasserbedarf (Defizit) einer Zone in mm."""

    _attr_native_unit_of_measurement = UnitOfLength.MILLIMETERS
    _attr_suggested_display_precision = 1

    def __init__(self, entry: IrrigationPlannerConfigEntry, zone) -> None:
        """Legt den Sensor an."""
        super().__init__(entry, "need", zone)

    @property
    def native_value(self) -> float:
        """Defizit in mm."""
        return round(self.data.balance.deficit_mm(self.zone), 2)

    @property
    def extra_state_attributes(self) -> dict[str, object]:
        """Bodenspeicher und ob gemessen."""
        from .balance import zone_taw

        balance = self.data.balance.balance(self.zone_id)
        return {
            "soil_storage_mm": round(zone_taw(self.zone), 1),
            "measured": balance.measured,
            "last_irrigation_mm": round(balance.last_irrigation_mm, 1),
        }


class ZonePlannedSensor(ZoneEntity, SensorEntity):
    """Geplante Gießdauer einer Zone (nach ihrer Dauer-Art)."""

    _attr_device_class = SensorDeviceClass.DURATION
    _attr_native_unit_of_measurement = UnitOfTime.MINUTES
    _attr_suggested_display_precision = 1

    def __init__(self, entry: IrrigationPlannerConfigEntry, zone) -> None:
        """Legt den Sensor an."""
        super().__init__(entry, "planned_duration", zone)

    @property
    def native_value(self) -> float:
        """Minuten (0 = kein Bedarf)."""
        return round(self.data.balance.planned(self.zone).seconds / 60, 2)

    @property
    def extra_state_attributes(self) -> dict[str, object]:
        """Herkunft, Liter, Dauer-Art."""
        planned = self.data.balance.planned(self.zone)
        attrs: dict[str, object] = {
            "reason": planned.reason,
            "mode": self.zone.duration_mode.value,
        }
        if planned.liters is not None:
            attrs["liters"] = round(planned.liters, 1)
        return attrs
