<p align="center"><img src="docs/bilder/logo.png" alt="FlowerPower" width="200"></p>

# Bewässerungsplaner

Eine Erweiterung (Integration) für Home Assistant, die den Garten automatisch und sicher bewässern soll: mit Gartenplan, berechneter Gießdauer pro Zone, Überwachung des Durchflusses und Winterpause. Sie soll mit beliebiger Bewässerungs-Hardware funktionieren.

Domain: `irrigation_planner` · Version: 0.3.0

## Stand

> **Phase 1 und 2 fertig: Die Erweiterung steuert Ventile und berechnet die Gießdauer.** Sie ist noch nicht an echter Hardware erprobt. Vor dem ersten echten Einsatz: Testlauf je Ventil (10 s) im Assistenten.

Was es gibt:
- **Einrichtung über die Oberfläche:** Ventile (Assistent mit Geräteerkennung und Testlauf), Zonen, Programme, Wasserversorgungen
- **Treiber** für Schalter, Ventil-Entitäten, Zigbee2MQTT (Dauer geht immer mit ans Gerät) und Dienstaufrufe; Profil für SONOFF SWV
- **Warteschlange:** je Wasserversorgung immer nur ein Ventil offen (einstellbar), das nächste erst, wenn das vorige nachweislich zu ist
- **Programme** (nacheinander, abwechselnd, nach Priorität) mit Zeitplan und Überspringen bei Regen, Frost oder Wind
- **Überwachung des Durchflusses:** Leck, Schlauch gelöst, kein Wasser, Ventil dichtet nicht, mit Alarm und Sperre der Zone
- **Winterpause**, von Hand oder nach Datum
- **Berechnete Gießdauer** je Zone: Verdunstung (FAO-56) aus dem Wetter, Wasserhaushalt mit Regen und Bodenfeuchte, Bedarf → Liter → Dauer; Regenvorhersage verschiebt Läufe; alternativ die Dauer aus Smart Irrigation
- Anzeigen, Schalter und Knöpfe in Home Assistant; Dienste `run_zone`, `run_program`, `skip_next`, `stop_all`, `release_zone`, `recalculate`, `reset_balance`

Noch nicht: Gartenplan-Editor (Phase 3; bis dahin trägst du die Fläche je Zone von Hand ein), Dashboard-Karte (Phase 4). Details im [Konzept](docs/KONZEPT.md) und im [Handbuch (Entwurf)](docs/HANDBUCH.md).

## Installation (später, über HACS)

Sobald es eine erste nutzbare Version gibt:

1. In HACS oben rechts auf die drei Punkte, dann **Benutzerdefinierte Repositories**.
2. Die Adresse `https://github.com/Kingsteam/FlowerPower` eintragen, Typ **Integration**.
3. „Bewässerungsplaner“ herunterladen und Home Assistant neu starten.
4. **Einstellungen → Geräte & Dienste → Integration hinzufügen → Bewässerungsplaner.**

Weil das Repo privat ist, braucht HACS dafür Zugriff auf das Repo.

Voraussetzung: Home Assistant 2026.11 oder neuer.

## Für die Entwicklung

Nie gegen die echte Anlage entwickeln. Getestet wird mit simulierten Geräten.

Du brauchst Python 3.14 (z. B. über [uv](https://docs.astral.sh/uv/): `uv python install 3.14`).

```bash
# einmalig: virtuelle Umgebung außerhalb des Repos anlegen
uv venv --python 3.14 ../venv
source ../venv/bin/activate
uv pip install -r requirements_test.txt

# Tests und Prüfungen
pytest
ruff check .
ruff format --check .
```

Auf GitHub laufen bei jedem Push die gleichen Prüfungen, dazu `hassfest` (prüft die Integration nach den Regeln von Home Assistant) und die HACS-Prüfung.

## Aufbau

```
custom_components/irrigation_planner/   die Integration
  __init__.py       Einrichten und Entladen
  config_flow.py    Einrichtungsdialog
  const.py          Konstanten und Sicherheitsgrenzen
  model.py          Datenmodell
  store.py          Speicherung (.storage/irrigation_planner)
  drivers/base.py   Basis für Ventiltreiber (nie öffnen ohne Dauer)
  diagnostics.py    Diagnosedaten
  geometry.py, water_balance.py, scheduler.py,
  watchdog.py, season.py, websocket_api.py   Platzhalter für später
tests/              automatische Tests
docs/               Konzept und Handbuch
```

## Lizenz

MIT, siehe [LICENSE](LICENSE).
