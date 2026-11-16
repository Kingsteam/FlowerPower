# Bewässerungsplaner

Eine Erweiterung (Integration) für Home Assistant, die den Garten automatisch und sicher bewässern soll: mit Gartenplan, berechneter Gießdauer pro Zone, Überwachung des Durchflusses und Winterpause. Sie soll mit beliebiger Bewässerungs-Hardware funktionieren.

Domain: `irrigation_planner` · Version: 0.1.0

## Stand

> **Grundgerüst, steuert noch nichts.**
> Die Erweiterung lässt sich installieren und einrichten. Sie öffnet aber noch kein Ventil, plant nichts und legt keine Entitäten an.

Was es schon gibt:
- Einrichtung in Home Assistant (Wetterquelle, Zeitfenster zum Gießen)
- das Datenmodell (Garten, Zonen, Ventile, Wasserversorgung, Programme, Sensoren) als leeres Gerüst
- die Grundlage für Ventiltreiber, die ein Ventil **nur mit Dauer** öffnen können
- automatische Tests

Was geplant ist, steht im [Konzept](docs/KONZEPT.md). Wie die fertige Erweiterung bedient werden soll, zeigt das [Handbuch (Entwurf)](docs/HANDBUCH.md).

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
