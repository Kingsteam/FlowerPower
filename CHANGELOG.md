# Änderungen

Alle wichtigen Änderungen an diesem Projekt stehen hier.
Das Format folgt [Keep a Changelog](https://keepachangelog.com/de/1.1.0/), die Versionen folgen [Semantic Versioning](https://semver.org/lang/de/).

## [Unveröffentlicht]

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
