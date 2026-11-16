# Bewässerungsplaner (`irrigation_planner`): Hinweise für Claude

Das Repo heißt **FlowerPower** (github.com/Kingsteam/FlowerPower, öffentlich). Die Erweiterung selbst heißt in Home Assistant weiterhin `irrigation_planner`.

Eigene Home-Assistant-Integration (HACS) für die Gartenbewässerung. Der Besitzer ist kein Entwickler: antworte auf Deutsch, in einfacher Sprache, und erkläre, was du änderst und warum.

**Dieses Repo ist öffentlich.** Alles, was hier landet (auch Commits, Tests, Bilder und die Git-Historie), kann jeder lesen. Deshalb gilt Regel 5 besonders streng.

## Zweck

Gartenplan, berechnete Gießdauer je Zone, ausfallsichere Ventilsteuerung, Überwachung des Durchflusses und Winterpause, unabhängig von der Hardware. Ziel und Architektur: `docs/KONZEPT.md`. Geplante Bedienung: `docs/HANDBUCH.md`.

Stand 0.1.0: **Grundgerüst, steuert noch nichts.** Es gibt keine Plattformen, keine Dienste und keine Ventilsteuerung.

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
| `model.py` | Datenklassen (Konzept Abschnitt 4); Bezüge über `device_id` + `EntityRef` (unique_id), nie über `entity_id` |
| `store.py` | `Store`-Hülle, Schlüssel `irrigation_planner`, versioniert |
| `drivers/base.py` | `ValveDriver`, `Capability`, `SafetyLevel`, `validate_duration` |
| `diagnostics.py` | Diagnosedaten (Koordinaten geschwärzt) |
| `geometry.py`, `water_balance.py`, `scheduler.py`, `watchdog.py`, `season.py`, `websocket_api.py` | nur Platzhalter mit Docstring |
| `strings.json`, `translations/` | Texte (en = `strings.json`, de) |
| `tests/` | pytest mit `pytest-homeassistant-custom-component` |
| `docs/` | `KONZEPT.md`, `HANDBUCH.md`, `bilder/`, `entwuerfe.html` |

Noch nicht angelegt (siehe Konzept Abschnitt 3): weitere Treiber (`ha_valve`, `ha_switch`, `zigbee2mqtt`, `service_call`), `profiles/`, `discovery.py`, Plattformen (`sensor`, `switch`, `binary_sensor`, `button`, `select`), `frontend/`, `frontend-src/`. Sobald es Plattformen gibt: `PLATFORMS` definieren und `async_forward_entry_setups`/`async_unload_platforms` verwenden.

## Tests und Prüfungen

Python 3.14 nötig. Die venv liegt außerhalb des Repos:

```bash
uv venv --python 3.14 ../venv && source ../venv/bin/activate
uv pip install -r requirements_test.txt
pytest
ruff check . && ruff format --check .
```

`requirements_test.txt` pinnt `pytest-homeassistant-custom-component`; die Version bestimmt, gegen welche Home-Assistant-Version getestet wird (0.13.375 → HA 2026.10.4). Bei neuen HA-Versionen anheben. Auf GitHub laufen zusätzlich `hassfest` und die HACS-Prüfung (`.github/workflows/`).

## Arbeitsweise

- Neue Funktionen immer mit Tests; jeder Treiber und jedes Profil bekommt Tests mit simulierten Entitäten.
- Moderne HA-Muster verwenden (`ConfigEntry.runtime_data`, Selektoren, keine YAML-Konfiguration).
- Version in `manifest.json` und `pyproject.toml` gemeinsam anheben und `CHANGELOG.md` pflegen.
- In `manifest.json` stehen `domain` und `name` zuerst, danach alle Schlüssel alphabetisch.
