<p align="center"><img src="docs/bilder/logo.png" alt="FlowerPower" width="200"></p>

# Bewässerungsplaner

Eine Erweiterung (Integration) für Home Assistant, die den Garten automatisch und sicher bewässern soll: mit Gartenplan, berechneter Gießdauer pro Zone, Überwachung des Durchflusses und Winterpause. Sie soll mit beliebiger Bewässerungs-Hardware funktionieren.

Domain: `irrigation_planner` · Version: 0.6.0

> ⚠️ **Noch nicht mit echter Hardware getestet.** Alles ist mit simulierten Ventilen und Sensoren erprobt (automatische Tests und eine simulierte Test-Instanz), aber noch nicht mit echten Ventilen. Wer es ausprobiert: zuerst **ein** Ventil einrichten, einen kurzen Testlauf machen und dabei bleiben, bis klar ist, dass das Ventil selbst schließt.

## Was es gibt

- **Einrichtung über die Oberfläche:** Ventile (Assistent mit Geräteerkennung und Testlauf), Zonen, Programme, Wasserversorgungen, Sensoren
- **Treiber** für Schalter, Ventil-Entitäten, Zigbee2MQTT (die Dauer geht immer mit ans Gerät) und Dienstaufrufe; Geräteprofil für SONOFF SWV
- **Sicherheit:** kein Ventil ohne Dauer; je Wasserversorgung nur ein Ventil gleichzeitig offen; das nächste erst, wenn das vorige nachweislich zu ist
- **Programme** (nacheinander, abwechselnd mit Einziehzeit, nach Bedarf) mit Zeitplan, auch relativ zu Sonnenaufgang/-untergang, und Überspringen bei Regen, Frost oder Wind
- **Berechnete Gießdauer** je Zone: Wasserhaushalt nach FAO-56 aus dem Wetter, mit Regen und Bodenfeuchte; alternativ von Hand oder aus Smart Irrigation; **Wassersparen** um 0–50 %
- **Überwachung des Durchflusses:** Leck, Schlauch gelöst, kein Wasser, Ventil dichtet nicht, mit Alarm und Sperre der Zone
- **Winterpause**, von Hand oder nach Datum
- **Panel „Bewässerung“** in der Seitenleiste:
  - **Plan:** Luftbild mit Adresssuche, Grundriss (sperrbar), Zonen (Sprinkler, Beet, Gießschlauch), Ventile, Zuleitungen mit Abzweigen, Wasser-Ansichten als Raster, Animation beim Gießen
  - **Betrieb:** was läuft, abbrechen, Verlauf mit Litern, Wetter der letzten 14 Tage
  - **Flächen**
  - **Zeitplan**
  - **Geräte:** Ventile und Sensoren in einer Tabelle anlegen und ändern; Gerät wählen, der Rest wird vorgeschlagen; Testlauf
- **Dashboard-Karte „Bewässerung“** (wird automatisch geladen)
- Dienste und Ereignisse für eigene Automationen

Wie man es bedient, steht im [Handbuch](docs/HANDBUCH.md), die Hintergründe im [Konzept](docs/KONZEPT.md), alle Änderungen im [CHANGELOG](CHANGELOG.md).

<p align="center"><img src="docs/bilder/10-plan.png" alt="Plan-Editor" width="720"></p>

## Installation

Voraussetzung: Home Assistant 2026.11 oder neuer.

1. **Einstellungen → Marketplace**, ein eigenes Repository hinzufügen, GitHub-Link `Kingsteam/FlowerPower`. (Home Assistant fragt dabei nach der Verbindung zu GitHub.)
2. **Bewässerungsplaner** herunterladen und Home Assistant neu starten.
3. **Einstellungen → Geräte & Dienste → Integration hinzufügen → Bewässerungsplaner.**

Zum Ausprobieren ohne echte Anlage gibt es eine komplett simulierte Test-Instanz, auf dem Mac mit einer Zeile im Terminal: siehe [devtools/testinstanz](devtools/testinstanz/README.md).

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
custom_components/irrigation_planner/   die Integration (Python)
  drivers/, profiles/    Ventiltreiber und Geräteprofile
  scheduler.py           Warteschlange (Sicherheitsregeln)
  programs.py            Programme und Zeitplan
  balance.py, water_balance.py   Wasserhaushalt
  watchdog.py            Durchflussüberwachung
  *_api.py               Schnittstelle für Panel und Karte
  frontend/              gebautes Panel und Dashboard-Karte
  brand/                 Logo
frontend-src/            Quelltext von Panel und Karte (TypeScript, Lit)
tests/                   automatische Tests
devtools/testinstanz/    simulierte Test-Instanz
docs/                    Handbuch und Konzept
```

Eine ausführliche Übersicht aller Dateien steht in [CLAUDE.md](CLAUDE.md).

## Lizenz

MIT, siehe [LICENSE](LICENSE).
