# Bewässerungsplaner (`irrigation_planner`): Hinweise für Claude

Das Repo heißt **FlowerPower** (github.com/Kingsteam/FlowerPower, öffentlich). Die Erweiterung selbst heißt in Home Assistant weiterhin `irrigation_planner`.

Eigene Home-Assistant-Integration (HACS) für die Gartenbewässerung. Der Besitzer ist kein Entwickler: antworte auf Deutsch, in einfacher Sprache, und erkläre, was du änderst und warum.

**Dieses Repo ist öffentlich.** Alles, was hier landet (auch Commits, Tests, Bilder und die Git-Historie), kann jeder lesen. Deshalb gilt Regel 5 besonders streng.

## Zweck

Gartenplan, berechnete Gießdauer je Zone, ausfallsichere Ventilsteuerung, Überwachung des Durchflusses und Winterpause, unabhängig von der Hardware. Ziel und Architektur: `docs/KONZEPT.md`. Geplante Bedienung: `docs/HANDBUCH.md`.

Stand: Phase 1, Schritte 1–6 fertig (Speichern, Treiber und Profile, Warteschlange, Programme mit Zeitplan, Entitäten, Durchflussüberwachung). **Die Integration steuert Ventile** über Dienste, Knöpfe und den Zeitplan. Ventile und Zonen lassen sich noch nicht in der Oberfläche anlegen (Schritt 7).

## Sicherheitsregeln (nicht verhandelbar)

1. **Nie ein Ventil ohne Dauer öffnen.** Jede Öffnung läuft über `ValveDriver.async_open(duration_s)`, das eine positive ganze Dauer verlangt (`drivers/base.py`, sonst `ValueError`). Treiber implementieren `_async_open` und dürfen `async_open` nicht überschreiben. Unterstützt das Gerät einen Gerätetimer (`Capability.DEVICE_TIMER`), **muss die Dauer ans Gerät mitgeschickt werden** (z. B. Zigbee2MQTT `{"state":"ON","on_time":<s>}`), damit es auch ohne Home Assistant schließt. Das gilt auch für manuelle Starts.
2. **Nur ein Ventil je Wasserversorgung gleichzeitig offen.** Standard `max_open_valves = 1`. Die Warteschlange (`scheduler.py`) setzt das hart durch, auch bei manuellen Starts: Ein Start während eines Laufs wird eingereiht, nie parallel ausgeführt. Diese Grenze nicht aufweichen, auch nicht „nur zum Testen“.
3. **Hardwaretests nur mit 10–60 s** (`HARDWARE_TEST_MIN_S`/`HARDWARE_TEST_MAX_S`), und nur, wenn der Besitzer es ausdrücklich möchte.
4. **Nie gegen die echte Installation entwickeln.** Nur gegen eine lokale Testinstanz oder simulierte Entitäten/Ventile (Tests mit `pytest-homeassistant-custom-component`).
5. **Keine Geheimnisse und keine persönlichen Daten ins Repo:** keine Tokens, keine URLs mit Geheimnissen (Webhooks, Nabu-Casa-Adressen), keine IP-Adressen, Namen, Adressen oder Koordinaten des Besitzers. Auch nicht in Tests, Commits oder Beispielen.
6. Sicherheitsgrenzen in `const.py` (`MIN_VALVE_DURATION_S`, `MAX_VALVE_DURATION_S`, `DEFAULT_MAX_OPEN_VALVES`) nur nach Rücksprache ändern. Tests, die diese Regeln prüfen, nie abschwächen, überspringen oder löschen.

## Hauswissen

Das Wissen über die konkrete Anlage des Besitzers liegt im separaten privaten Repo `Kingsteam/.homeassistant` (`projekte/bewaesserung/`). Von dort werden nur Konzept und Handbuch nach `docs/` übernommen, und zwar ohne echte Entitätsnamen, Wetterstation, Ort oder andere persönliche Angaben; sonst nichts in dieses Repo kopieren. Die Integration selbst darf keine hausspezifischen Namen, Entitäten oder Werte fest eingebaut haben.

## Aufbau

| Pfad | Inhalt |
|---|---|
| `custom_components/irrigation_planner/__init__.py` | `async_setup_entry`/`async_unload_entry`, `entry.runtime_data` (`IrrigationPlannerData`), Typ `IrrigationPlannerConfigEntry` |
| `config_flow.py` | Einrichtung: Wetterquelle (optional), Zeitfenster; nur eine Instanz |
| `const.py` | Konstanten und Sicherheitsgrenzen |
| `model.py` | Datenklassen (Konzept Abschnitt 4), `GardenModel.validate()` prüft IDs und Bezüge; Bezüge über `device_id` + `EntityRef` (unique_id), nie über `entity_id` |
| `serialize.py` | Modell ↔ gespeichertes JSON, ausgeschrieben je Klasse; fehlende Felder bekommen Standardwerte |
| `store.py` | `Store`-Hülle, Schlüssel `irrigation_planner`, versioniert |
| `drivers/base.py` | `ValveDriver`, `Capability`, `SafetyLevel`, `validate_duration`, Haken `_async_after_open` |
| `drivers/ha.py` | `HassValveDriver`: Entitäten auflösen, `is_open`, **Sicherheits-Schließen** nach Ablauf (bei Gerätetimer + `FAILSAFE_GRACE_S`), `async_shutdown` schließt offene Ventile |
| `drivers/ha_switch.py`, `ha_valve.py`, `zigbee2mqtt.py`, `service_call.py` | die vier Treiber; `drivers/registry.py` baut sie (`create_driver`), nicht in `drivers/__init__.py` importieren (Kreisimport) |
| `profiles/` | Geräteprofile als YAML + Lader; `device_timer` ohne `{duration}` im Befehl wird abgelehnt |
| `diagnostics.py` | Diagnosedaten (Koordinaten geschwärzt) |
| `entity.py`, `sensor.py`, `binary_sensor.py`, `switch.py`, `button.py`, `number.py`, `select.py` | Entitäten; Geräte: Hauptgerät + je Zone + je Programm; Änderungen über `IrrigationPlannerData.async_model_changed()` (speichert und benachrichtigt). Keine Entität öffnet ein Ventil direkt: „Jetzt gießen“ reiht ein |
| `scheduler.py` | Warteschlange je Wasserversorgung (`IrrigationScheduler`): Platz erst frei, wenn das Ventil **nachweislich zu** ist; klemmt es, bleibt die Versorgung gesperrt und OFF wird jede Minute wiederholt; von außen offene Ventile zählen mit; Startprüfung schließt offene Ventile; Höchstdauer je Zone |
| `programs.py` | Ablaufplan (`build_plan`: Nacheinander, Abwechselnd mit Einziehzeit, Priorität), Zeitplan (`next_start`: Startzeit oder „fertig bis“, Wochentage oder alle N Tage; ohne Zeiten = Ende des Zeitfensters), Wetter-Überspringen, `ProgramManager` (prüft jede Minute, nur bei Automatik an und ohne Winterpause) |
| `services.py`, `services.yaml` | Dienste `run_zone` (reiht nur ein), `run_program`, `skip_next`, `stop_all` |
| `watchdog.py` | Durchflussüberwachung (Konzept Abschnitt 7): Leck, zu hoch, kein Durchfluss/Wassermangel, zu niedrig, Durchfluss bei geschlossenem Ventil, zu viele offen; Alarme als Benachrichtigung + Ereignis `irrigation_planner_alarm`; Sperre bis `release_zone`; lernt den Durchfluss; ruht in der Winterpause. Grenzwerte in `const.py` |
| `geometry.py`, `water_balance.py`, `season.py`, `websocket_api.py` | nur Platzhalter mit Docstring |
| `strings.json`, `translations/` | Texte (en = `strings.json`, de) |
| `tests/` | pytest mit `pytest-homeassistant-custom-component`; `helpers.py` (simulierte Ventile `SimValves`, `make_model`), Fixtures `sim`, `setup`, `advance` in `conftest.py`; simulierte Ventile sind echte `switch`-Entitäten der Plattform `test`, mit Durchfluss- und Statussensor (`make_model(sensors=True)`) |
| `docs/` | `KONZEPT.md`, `HANDBUCH.md`, `bilder/`, `entwuerfe.html` |
| `devtools/testinstanz/` | simulierte Test-Home-Assistant-Instanz: `start.py`, Simulator `irrigation_sim` (10 Ventile, Bodenfeuchte, Wasserzähler, Störungen); nicht Teil der Auslieferung |

Noch nicht angelegt (siehe Konzept Abschnitt 3): `discovery.py`, `frontend/`, `frontend-src/`. Neue Zonen/Programme brauchen ein Neuladen des Eintrags, damit ihre Entitäten entstehen.

## Tests und Prüfungen

Python 3.14 nötig. Die venv liegt außerhalb des Repos:

```bash
uv venv --python 3.14 ../venv && source ../venv/bin/activate
uv pip install -r requirements_test.txt
pytest
ruff check . && ruff format --check .
```

Zum Ausprobieren von Hand: `python devtools/testinstanz/start.py` (siehe `devtools/testinstanz/README.md`). Diese Instanz ist komplett simuliert; nie eine Kopie der echten Installation verwenden.

`requirements_test.txt` pinnt `pytest-homeassistant-custom-component`; die Version bestimmt, gegen welche Home-Assistant-Version getestet wird (0.13.375 → HA 2026.10.4). Bei neuen HA-Versionen anheben. Auf GitHub laufen zusätzlich `hassfest` und die HACS-Prüfung (`.github/workflows/`).

## Arbeitsweise

- Neue Funktionen immer mit Tests; jeder Treiber und jedes Profil bekommt Tests mit simulierten Entitäten.
- Moderne HA-Muster verwenden (`ConfigEntry.runtime_data`, Selektoren, keine YAML-Konfiguration).
- Version in `manifest.json` und `pyproject.toml` gemeinsam anheben und `CHANGELOG.md` pflegen.
- In `manifest.json` stehen `domain` und `name` zuerst, danach alle Schlüssel alphabetisch.
