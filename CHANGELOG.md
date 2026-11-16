# Änderungen

Alle wichtigen Änderungen an diesem Projekt stehen hier.
Das Format folgt [Keep a Changelog](https://keepachangelog.com/de/1.1.0/), die Versionen folgen [Semantic Versioning](https://semver.org/lang/de/).

## [Unveröffentlicht]

### Neu
- Datenmodell wird gespeichert und geladen (`serialize.py`). Beim Laden werden IDs und alle Bezüge geprüft; defekte Daten stoppen die Einrichtung, statt still überschrieben zu werden.
- Treiber `ha_switch`, `ha_valve`, `zigbee2mqtt` und `service_call`. Jeder Treiber plant nach dem Öffnen selbst ein Schließen ein; der Zigbee2MQTT-Treiber schickt die Dauer immer mit (`on_time`).
- Geräteprofile als YAML, mitgeliefert: SONOFF SWV (Zigbee2MQTT). Profile mit Gerätetimer, deren Befehl keine Dauer enthält, werden abgelehnt.
- `devtools/testinstanz/`: simulierte Test-Home-Assistant-Instanz mit Ventil-Simulator (10 Ventile mit und ohne Gerätetimer, Durchfluss, Bodenfeuchte, Wasserzähler, auslösbare Störungen) und Startskript.

### Geändert
- Repo ist öffentlich: MIT-Lizenz ergänzt, damit die HACS-Prüfung durchläuft.
- `docs/`: echte Entitätsnamen und Wetterstation durch neutrale Angaben ersetzt; Dashboard-Entwurf neu gerendert.

## [0.1.0] – 2026-11-15

### Neu
- Grundgerüst der Integration `irrigation_planner` („Bewässerungsplaner“). Sie steuert noch nichts.
- Einrichtungsdialog: Wetterquelle (optional), Zeitfenster zum Gießen; nur eine Instanz möglich. Die Grenze „1 Ventil gleichzeitig je Wasserversorgung“ ist fest eingestellt.
- Datenmodell als Datenklassen: Garten, Zone, Ventil, Wasserversorgung, Pumpe, Programm, Sensor.
- Speicherung in `.storage/irrigation_planner` (versioniert).
- Basisklasse `ValveDriver`: öffnet nur mit einer Dauer von 1 s bis 4 h, sonst Fehler.
- Diagnosedaten.
- Tests, ruff, GitHub-Prüfungen (hassfest, HACS, pytest).
- Konzept und Handbuch-Entwurf unter `docs/`.
