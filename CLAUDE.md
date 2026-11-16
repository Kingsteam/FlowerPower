# Bewässerungsplaner (`irrigation_planner`): Hinweise für Claude

Das Repo heißt **FlowerPower** (github.com/Kingsteam/FlowerPower, öffentlich). Die Erweiterung selbst heißt in Home Assistant weiterhin `irrigation_planner`.

Eigene Home-Assistant-Integration (HACS) für die Gartenbewässerung. Der Besitzer ist kein Entwickler: antworte auf Deutsch, in einfacher Sprache, und erkläre, was du änderst und warum.

**Dieses Repo ist öffentlich.** Alles, was hier landet (auch Commits, Tests, Bilder und die Git-Historie), kann jeder lesen. Deshalb gilt Regel 5 besonders streng.

## Zweck

Gartenplan, berechnete Gießdauer je Zone, ausfallsichere Ventilsteuerung, Überwachung des Durchflusses und Winterpause, unabhängig von der Hardware. Ziel und Architektur: `docs/KONZEPT.md`. Geplante Bedienung: `docs/HANDBUCH.md`.

Stand 0.3.0: **Phase 1 (MVP Backend) und Phase 2 (Berechnung) fertig.** Die Integration steuert Ventile über Dienste, Knöpfe und den Zeitplan; alles wird in der Oberfläche eingerichtet (Options-Flow mit Ventil-Assistent und Testlauf); Winterpause und Durchflussüberwachung sind eingebaut; die Gießdauer kann je Zone von Hand, berechnet (Wasserhaushalt nach FAO-56) oder aus einer Entität (z. B. Smart Irrigation) kommen. Phase 3 (Plan-Editor) läuft: Panel „Bewässerung“ in der Seitenleiste mit Luftbild (basemap.at in mehreren Ansichten, OpenStreetMap, Esri, eigene Adresse; Adresssuche; Deckkraft), eigenem Bild mit Maßstab oder Raster; Grundriss zum Abpausen (`Garden.features`, nur Orientierung, einzeln sperrbar über `Feature.locked`); Sprinkler und Beete zeichnen, Ventile und Sensoren platzieren; die gezeichnete Fläche ersetzt die Fläche von Hand. Noch nicht: Dashboard-Karte (Phase 4).

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
| `options_flow.py` | Einrichtung über die Oberfläche: Menü Ventile/Zonen/Programme/Wasserversorgungen/Sensoren/Einstellungen; Zonen-Dialog mit Abschnitt „Berechnung“ (`section`, 0 = automatisch); Ventil-Assistent (Gerät → Entitäten/Treiber/Profil → Treiber-Einstellungen → Zuordnen, optional Testlauf über `scheduler.async_hardware_test`). Jede Aktion: Kopie des Modells, `validate`, speichern, Neuladen. Speichern erst, nachdem das Testergebnis angezeigt wurde |
| `discovery.py` | Vorschlag für ein Gerät: Profil, Treiber, Entitäten je Rolle |
| `const.py` | Konstanten und Sicherheitsgrenzen |
| `model.py` | Datenklassen (Konzept Abschnitt 4), `GardenModel.validate()` prüft IDs, Bezüge, Geometrie und Hintergrund (`Garden.background`: none/image/map; Karte: Mitte, Zoom, Dienst aus `MAP_PROVIDERS` oder eigene https-Adresse); Bezüge über `device_id` + `EntityRef` (unique_id), nie über `entity_id` |
| `serialize.py` | Modell ↔ gespeichertes JSON, ausgeschrieben je Klasse; fehlende Felder bekommen Standardwerte |
| `store.py` | `Store`-Hülle, Schlüssel `irrigation_planner`, versioniert |
| `drivers/base.py` | `ValveDriver`, `Capability`, `SafetyLevel`, `validate_duration`, Haken `_async_after_open` |
| `drivers/ha.py` | `HassValveDriver`: Entitäten auflösen, `is_open`, **Sicherheits-Schließen** nach Ablauf (bei Gerätetimer + `FAILSAFE_GRACE_S`), `async_shutdown` schließt offene Ventile |
| `drivers/ha_switch.py`, `ha_valve.py`, `zigbee2mqtt.py`, `service_call.py` | die vier Treiber; `drivers/registry.py` baut sie (`create_driver`), nicht in `drivers/__init__.py` importieren (Kreisimport) |
| `profiles/` | Geräteprofile als YAML + Lader; `device_timer` ohne `{duration}` im Befehl wird abgelehnt |
| `diagnostics.py` | Diagnosedaten (Koordinaten geschwärzt) |
| `entity.py`, `sensor.py`, `binary_sensor.py`, `switch.py`, `button.py`, `number.py`, `select.py` | Entitäten; Geräte: Hauptgerät + je Zone + je Programm; Änderungen über `IrrigationPlannerData.async_model_changed()` (speichert und benachrichtigt). Keine Entität öffnet ein Ventil direkt: „Jetzt gießen“ reiht ein |
| `scheduler.py` | Warteschlange je Wasserversorgung (`IrrigationScheduler`): Platz erst frei, wenn das Ventil **nachweislich zu** ist; klemmt es, bleibt die Versorgung gesperrt und OFF wird jede Minute wiederholt; von außen offene Ventile zählen mit; Startprüfung schließt offene Ventile; Höchstdauer je Zone; `async_cancel_zone`/`async_cancel_program` (wartende streichen, laufende schließen, Schlange läuft weiter); Ereignisse `EVENT_RUN_STARTED`/`EVENT_RUN_FINISHED` für Automationen |
| `programs.py` | Ablaufplan (`build_plan`: Nacheinander, Abwechselnd mit Einziehzeit, Priorität), Zeitplan (`next_start`: Startzeit oder „fertig bis“, jeweils Uhrzeit oder Sonnenaufgang/-untergang mit `sun_offset_min`, Sonnenzeiten über `get_astral_event_date`; Wochentage oder alle N Tage; ohne Zeiten = Ende des Zeitfensters), Wetter-Überspringen, `ProgramManager` (prüft jede Minute, nur bei Automatik an und ohne Winterpause) |
| `services.py`, `services.yaml` | Dienste `run_zone` (reiht nur ein), `run_program`, `skip_next`, `stop_all`, `cancel_zone`, `cancel_program`, `release_zone`, `recalculate`, `reset_balance` |
| `watchdog.py` | Durchflussüberwachung (Konzept Abschnitt 7): Leck, zu hoch, kein Durchfluss/Wassermangel, zu niedrig, Durchfluss bei geschlossenem Ventil, zu viele offen; Alarme als Benachrichtigung + Ereignis `irrigation_planner_alarm`; Sperre bis `release_zone`; lernt den Durchfluss; ruht in der Winterpause. Grenzwerte in `const.py` |
| `season.py` | Winterpause: alles schließen und bestätigen, Zeitpläne aus, Geräte deaktivieren (nur wenn alles zu ist; gemerkt in `Settings.winter_disabled_devices`), beim Ende genau diese wieder aktivieren; automatisch nach Datum (Start-/Endtag) |
| `water_balance.py` | Rechenkern Phase 2, ohne Home Assistant: ET0 (FAO-56 Penman-Monteith, sonst Hargreaves), `PLANTS` (Kc, Wurzeltiefe), `SOILS` (nutzbare Feldkapazität), wirksamer Regen, Defizit, Liter, Dauer. Tests mit FAO-56-Beispielen |
| `balance.py` | `BalanceManager`: Wetter sammeln (10 min), Tagesabschluss beim ersten Messwert eines neuen Tages, Läufe verbuchen (`scheduler.async_add_run_listener`), Bodenfeuchte ersetzt Schätzung, Winter ruht und setzt zurück; `planned(zone)` liefert die Dauer nach Dauer-Art, gekürzt um `Settings.water_saving_pct` (Programme über `ProgramManager.balance`); eigener Store `irrigation_planner.balance`. Regensensor = Sensor `rain_mm` ohne Zonen |
| `geometry.py` | Plan in Metern (x Osten, y Süden), Winkel wie Kompass (0° Nord, im Uhrzeigersinn): Flächen (Kreissegment, Polygon, Schlauch = Linie in `polygon` + `radius_m` je Seite), `zone_area` (Zeichnung vor Fläche von Hand, nutzt `balance.py`), Punkt-in-Zone, Überlappung (Raster), Karten-Maßstab (Web-Mercator) und Umrechnung Geo ↔ Plan |
| `websocket_api.py` | Befehle für das Panel: `plan/get`, `plan/save` (nur Admin; nur Hintergrund, Geometrie, Art der Zone, Ventil, Leitung (`valve_route`), Pflanzen/Boden und Durchfluss von Hand; ganzes Modell wird vorher geprüft), `plan/subscribe` (Zustand je Zone inkl. `need_mm`, `capacity_mm`). Öffnet nie ein Ventil |
| `schedule_api.py` | Befehle für die Seite „Zeitplan“: `programs/get` (Vorschau 7 Tage, Entitäten, Ereignisliste), `programs/save` (nur Admin, prüft das ganze Modell, wirkt ohne Neuladen), `programs/create`/`delete` (nur Admin, lädt neu, abgelehnt solange gegossen wird). Feld heißt `program_id`, weil `id` in WebSocket-Nachrichten belegt ist. Öffnet nie ein Ventil |
| `operation_api.py` | Befehle für die Seite „Betrieb“: `operation/subscribe` (Warteschlange, Stand je Zone, 14 Tage Wetter/Wasser), `history/get`, `queue/cancel` (Zone, Programm oder alles; ohne Admin, schließt nur), `settings/automatic`, `settings/water_saving`, `balance/reset` (nur Admin) |
| `history.py` | `HistoryManager`: Verlauf je Lauf (Dauer, Liter gemessen über `watchdog.measured_liters` oder geschätzt, mm), abgebrochene Läufe (`scheduler.async_add_cancel_listener`), Programme, Alarme; eigener Store `irrigation_planner.history`, höchstens 3000 Einträge/1 Jahr |
| `geocode.py` | Adresssuche für das Luftbild: Home Assistant fragt Nominatim (OpenStreetMap) mit eigenem User-Agent, höchstens 1 Anfrage/s, nur auf Knopfdruck; nichts wird gespeichert. WebSocket `irrigation_planner/geocode` (nur Admin). Direkt aus dem Browser blockiert Nominatim (CORS) |
| `catalog.py` | Pflanzen- und Bodennamen (deutsch) und Wasserbedarf-Stufen für das Panel (`plan/get` → `catalog`); Werte aus `water_balance.py` |
| `backup.py` | Sichern/Wiederherstellen: WebSocket `export` und `import` (nur Admin; Art `drawing` = nur Zeichnung über IDs, `all` = alles ersetzen und Eintrag neu laden); Datei-Format `irrigation_planner`, `format_version` 1 |
| `panel.py` | Panel anmelden (`/bewaesserung`, statische Dateien unter `/irrigation_planner_static`), Bilder hochladen/ausliefern (`/api/irrigation_planner/image`, nur PNG/JPEG/WebP, Ordner `<config>/irrigation_planner/`) |
| `frontend/` | **gebautes** Panel (`irrigation-planner-panel.js`), nie von Hand ändern; CI prüft, dass es zum Quelltext passt |
| `frontend-src/` | Quelltext des Panels: TypeScript + Lit, Build mit Vite; `geometry.ts` (wie `geometry.py`, dazu Fangen, Messen, Kantenlängen; Tests mit vitest), `features.ts` (Grundriss-Arten wie `model.FEATURE_*`), `wetmap.ts` (Wasser-Ansichten als Kachelraster: geplante Gießmenge, Bodenfeuchte jetzt/nach dem Gießen; Stamm-Schatten), `operation.ts` (Seite „Betrieb“), `schedule.ts` (Seite „Zeitplan“, Zeiten in der Zeitzone von Home Assistant), `locate.ts` (Orten: einmalige Abfrage im Browser, nur https, nichts gespeichert), `geocode.ts`, `panel.ts`, `styles.ts`, `types.ts` |
| `strings.json`, `translations/` | Texte (en = `strings.json`, de) |
| `tests/` | pytest mit `pytest-homeassistant-custom-component`; `helpers.py` (simulierte Ventile `SimValves`, `make_model`), Fixtures `sim`, `setup`, `advance` in `conftest.py`; simulierte Ventile sind echte `switch`-Entitäten der Plattform `test`, mit Durchfluss- und Statussensor (`make_model(sensors=True)`) |
| `docs/` | `KONZEPT.md`, `HANDBUCH.md`, `bilder/`, `entwuerfe.html` |
| `devtools/testinstanz/` | simulierte Test-Home-Assistant-Instanz: `start.py`, Simulator `irrigation_sim` (10 Ventile, Bodenfeuchte, Wasserzähler, Störungen); nicht Teil der Auslieferung |

Neue Zonen/Programme brauchen ein Neuladen des Eintrags, damit ihre Entitäten entstehen.

## Tests und Prüfungen

Python 3.14 nötig. Die venv liegt außerhalb des Repos:

```bash
uv venv --python 3.14 ../venv && source ../venv/bin/activate
uv pip install -r requirements_test.txt
pytest
ruff check . && ruff format --check .
```

Zum Ausprobieren von Hand: einmalig `uv pip install -r devtools/testinstanz/requirements.txt`, dann `python devtools/testinstanz/start.py` (siehe `devtools/testinstanz/README.md`). Diese Instanz ist komplett simuliert; nie eine Kopie der echten Installation verwenden.

Panel (Node 22):

```bash
cd frontend-src && npm ci && npm test && npm run build   # schreibt custom_components/irrigation_planner/frontend/
```

Nach jeder Änderung in `frontend-src/` neu bauen und das Ergebnis mit committen. In der Testinstanz reicht danach ein Neuladen der Seite.

`requirements_test.txt` pinnt `pytest-homeassistant-custom-component`; die Version bestimmt, gegen welche Home-Assistant-Version getestet wird (0.13.375 → HA 2026.10.4). Bei neuen HA-Versionen anheben. Auf GitHub laufen zusätzlich `hassfest` und die HACS-Prüfung (`.github/workflows/`).

## Arbeitsweise

- Neue Funktionen immer mit Tests; jeder Treiber und jedes Profil bekommt Tests mit simulierten Entitäten.
- Moderne HA-Muster verwenden (`ConfigEntry.runtime_data`, Selektoren, keine YAML-Konfiguration).
- Version in `manifest.json` und `pyproject.toml` gemeinsam anheben und `CHANGELOG.md` pflegen.
- In `manifest.json` stehen `domain` und `name` zuerst, danach alle Schlüssel alphabetisch.

## Stolperfallen (aus der Entwicklung)

- Coroutinen, die auf die Uhr warten (Testlauf, Winterpause, Läufe), als Hintergrundaufgabe starten (`async_create_background_task`). Normale Aufgaben blockieren `async_block_till_done` in Tests und den Neustart.
- Endet ein Fortschrittsschritt sofort, reicht Home Assistant die Eingaben des vorigen Formulars an den nächsten Schritt weiter. Bestätigungsschritte dürfen solche Eingaben nicht als „Senden“ werten.
- Service-Handler und `async_call_later`-Rückrufe als `async def` oder mit `@callback` anlegen, sonst laufen sie in einem Nebenthread.
- Unterordnete Geräte mit `via_device_id` (Geräte-ID) anhängen; `via_device` ist veraltet.
- Schlüssel in `strings.json` (auch Auswahl-Optionen mit `translation_key`) nur `[a-z0-9-_]`, nicht mit `_` oder `-` beginnen/enden. Das prüft nur hassfest auf GitHub, nicht pytest.
