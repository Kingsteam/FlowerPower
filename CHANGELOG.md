# Änderungen

Alle wichtigen Änderungen an diesem Projekt stehen hier.
Das Format folgt [Keep a Changelog](https://keepachangelog.com/de/1.1.0/), die Versionen folgen [Semantic Versioning](https://semver.org/lang/de/).

## [Unveröffentlicht]

### Neu
- Geometrie des Gartenplans (`geometry.py`): Flächen von Sprinklern und Beeten, Überlappungen, Maßstab von Kartenkacheln.
- Modell: Hintergrund des Plans (leer, Bild mit Maßstab oder Luftbild eines Kartendienstes), Position von Ventilen; Prüfung von Radius, Öffnungswinkel und Beet-Punkten.
- Die Berechnung nimmt die Fläche aus der Zeichnung, sonst die Fläche von Hand.
- Panel „Bewässerung“ in der Seitenleiste (Plan-Editor): Luftbild von basemap.at oder Esri (live im Browser geladen, gespeichert werden nur Mitte und Zoom), eigene Kartenadresse, eigenes Bild mit Maßstab aus zwei Punkten oder Raster; Sprinkler (Mittelpunkt, Reichweite, Richtung und Bogen mit Anfassern) und Beete (Ecken) zeichnen, Ventile und Sensoren platzieren, Rückgängig, Zustand der Zonen live (läuft, wartet, gesperrt), „Jetzt gießen“ (reiht nur ein).
- WebSocket-Befehle `irrigation_planner/plan/get`, `plan/save`, `plan/subscribe`; Hochladen von Hintergrundbildern.

- Adresssuche für das Luftbild (Lupe auf der Karte, öffnet sich beim ersten Einrichten von selbst): Home Assistant fragt OpenStreetMap (Nominatim), der Treffer wird zur Kartenmitte oder angezeigt; die Adresse wird nicht gespeichert.
- Kartenansicht umschalten (Ebenen-Knopf auf der Karte): Luftbild, Luftbild mit Straßen, Karte, Karte grau (basemap.at), OpenStreetMap, Esri Satellit.
- Entfernen einer Zeichnung oder eines Ventils/Sensors zeigt einen Hinweis mit „Rückgängig“; „Rückgängig“ geht auch nach dem Speichern und nach „Verwerfen“.
- Zeitplan mit Sonnenaufgang oder Sonnenuntergang: „Start bei Sonnenereignis“ oder „Fertig bis Sonnenereignis“, mit Versatz in Minuten (z. B. fertig 60 min vor Sonnenaufgang). Die Sonnenzeiten kommen vom Standort in Home Assistant.
- Grundriss zum Abpausen (Reiter „Grundriss“): Flächen (Gebäude, Terrasse/Weg, Teich/Pool, sonstige), Linien (Zaun, Hecke, Grundstücksgrenze, Leitung), Baum/Strauch, Wasserhahn, Beschriftung. Gespeichert in Metern, scharf in jeder Zoomstufe; nur zur Orientierung.
- Regler „Luftbild sichtbar“ (0–100 %), Einrasten an Ecken (Alt-Taste: aus), Messwerkzeug, Seitenlängen als Zahl eintippen (auch bei Beeten), näherer Zoom nach der Adresssuche.
- Sichern und Wiederherstellen (Menü ⋮ im Plan-Editor): Sicherung als JSON-Datei herunterladen und wieder einspielen, wahlweise nur die Zeichnung oder alles. Wird vorher vollständig geprüft.
- Neue Zonenart „Gießschlauch“: eine Linie mit bewässerter Breite je Seite; Fläche = Länge mal Breite plus runde Enden. Im Editor zeichnen wie eine Linie.
- Ventil einer Zone direkt im Plan-Editor wählen; gestrichelte Verbindungslinie von der Zone zum Ventil.
- Grundriss-Flächen nur noch leicht eingefärbt, damit das Luftbild sichtbar bleibt.
- Seite „Übersicht“: bewässerte Fläche gesamt und je Art, Wasser pro Durchgang, Überschneidungen, Tabellen je Zone (Fläche, Dauer, Liter, mm, Bedarf) und je Ventil (Durchfluss, Regenrate), offene Punkte.
- Nässekarte (Tropfen-Knopf auf der Karte): wie viel Wasser pro Durchgang wo ankommt, Überlappungen doppelt, Wasserschatten hinter dicken Baumstämmen; Sensorwerte (Bodenfeuchte farbig) im Plan.
- Bäume im Grundriss mit Stammdurchmesser.
- Pflanzen und Boden im Plan-Editor: je Zone „Was wächst hier?“, Wasserbedarf in fünf Stufen (sehr wenig bis sehr viel), Bodenart; Pflanzenkatalog um Stauden, Bodendecker, Hecke, Obstbäume, Beeren, Erdbeeren, Tomaten, Kräuter, Steingarten und Hortensien erweitert.
- Bodenflächen im Grundriss (mit Bodenart); Zonen übernehmen den Boden mit einem Klick; Bodenansicht färbt Zonen nach Bodenart.
- Testinstanz auf dem eigenen Mac mit einer Zeile im Terminal (`devtools/testinstanz/mac-start.sh`).

### Behoben
- Die Vorlage `configuration.yaml` der Testinstanz fehlte im Repo (wurde von `.gitignore` ausgeblendet).

## [0.3.0] – 2026-11-16

Phase 2 (Berechnung) fertig.

### Neu
- Oberfläche: Zonen-Dialog mit Abschnitt „Berechnung der Gießdauer“ (Art, Fläche, Pflanzen, Pflanzenfaktor, Boden, Wurzeltiefe, Effizienz, Dauer-Art, Entität); neues Menü „Sensoren“ (Regen, Bodenfeuchte).
- Testinstanz: Beispielgarten mit berechneten Zonen, Bodenfeuchte- und Regensensor.

### Geändert
- „Gießdauer“ heißt jetzt „Gießdauer von Hand“ (gilt bei Dauer-Art „von Hand“ und als Rückfall).
- Berechnete Dauer wird angewendet: Programme und „Jetzt gießen“ nutzen je Zone die Dauer nach ihrer Dauer-Art (von Hand, berechnet, aus Entität wie Smart Irrigation). Zonen unter 1 mm Bedarf entfallen; ohne gelernten Durchfluss gilt die Dauer von Hand. „Nach Priorität“ sortiert bei Gleichstand nach Bedarf.
- Regenvorhersage: Sind in den nächsten 24 h mindestens 5 mm angesagt, wird ein geplanter Lauf übersprungen.
- Anzeigen je Zone „Wasserbedarf“ (mm) und „Geplante Dauer“, dazu „Verdunstung (ET0) gestern“. Dienste `recalculate` und `reset_balance`.
- Wasserhaushalt im Betrieb (`balance.py`): sammelt alle 10 Minuten Temperatur, Luftfeuchte, Wind (Wetter-Entität) und Regen (Regensensor), schließt nach Mitternacht den Tag ab (ET0, je Zone Defizit fortschreiben), verbucht jede Bewässerung, nutzt Bodenfeuchtesensoren, ruht in der Winterpause und beginnt danach bei 0. Eigener Speicher `.storage/irrigation_planner.balance`.
- Rechenkern für Phase 2 (`water_balance.py`): Verdunstung ET0 nach FAO-56 Penman-Monteith (Strahlung aus dem Temperaturunterschied geschätzt), sonst Hargreaves; Pflanzenfaktoren, Bodenarten, nutzbare Feldkapazität, wirksamer Regen, Bedarf → Liter → Dauer. Geprüft mit den Rechenbeispielen aus FAO-56.
- Zonen: Fläche, Effizienz und Dauer-Art (von Hand, berechnet, aus einer Entität); Bodenfeuchtesensoren: Feldkapazität und Welkepunkt.

## [0.2.0] – 2026-11-16

Phase 1 (MVP Backend) fertig.

### Neu
- Einrichtung über die Oberfläche (Einstellungen → Bewässerungsplaner → Konfigurieren): Ventile, Zonen, Programme, Wasserversorgungen und Einstellungen anlegen, ändern, löschen. Assistent „Ventil hinzufügen“ mit Geräteerkennung (Profil, Treiber, Entitäten) und optionalem Testlauf (10 s, über die Warteschlange), der die Sicherheitsstufe bestimmt.
- Winterpause nach Konzept: alles schließen und bestätigen, Zeitpläne aus, zugeordnete Geräte deaktivieren (nur wenn alles zu ist) und beim Ende genau diese wieder aktivieren; optional automatisch nach Datum.
- Überwachung des Durchflusses (`watchdog.py`): Leck, Durchfluss zu hoch (Schlauch gelöst), kein Durchfluss oder Wassermangel, Durchfluss zu niedrig, Durchfluss bei geschlossenem Ventil, zu viele Ventile offen. Reaktion: Ventil schließen, Benachrichtigung, Ereignis `irrigation_planner_alarm`; bei Leck und zu hohem Durchfluss bleibt die Zone gesperrt, bis sie mit „Zone freigeben“ (Knopf oder Dienst `release_zone`) wieder freigegeben wird. In der Winterpause ruht die Überwachung.
- Der Durchfluss jedes Ventils wird aus ungestörten Läufen gelernt (gleitender Mittelwert).
- Entitäten: Status, aktive Zone, Ende des Laufs, Warteschlange, Problem-Melder, Schalter Automatik und Winterpause, Knöpfe Alles stoppen und Zone überspringen; je Zone Zustand, letzter Lauf, Zone aktiv, Gießdauer, Jetzt gießen; je Programm nächster Lauf, geschätzte Dauer, Programm aktiv, Ablauf, Programm starten. Änderungen werden gespeichert.
- Winterpause-Schalter beendet alle Läufe und schließt alle Ventile.
- Programme (`programs.py`): Abläufe „Nacheinander“, „Abwechselnd“ (Gießphasen reihum, mit Einziehzeit) und „Nach Priorität“; Pause zwischen den Ventilen. Zeitplan mit Startzeit oder „fertig bis“, Wochentagen oder „alle N Tage“. Überspringen bei Regen, Frost oder Wind (Wetter-Entität). Automatisch nur, wenn „Automatik“ an und keine Winterpause ist.
- Zonen haben eine Gießdauer (vorerst von Hand), das Modell globale Einstellungen (Automatik, Winterpause).
- Dienste `run_program` und `skip_next`.
- Warteschlange (`scheduler.py`): je Wasserversorgung höchstens `max_open_valves` Ventile offen (Standard 1), auch bei Starts von Hand. Ein Platz wird erst frei, wenn das Ventil nachweislich zu ist; schließt es nicht, bleibt die Versorgung gesperrt und das Schließen wird jede Minute wiederholt. Von außen geöffnete Ventile zählen mit. Beim Start werden offene Ventile geschlossen. Laufzeiten werden auf die Höchstdauer der Zone begrenzt.
- Dienste `irrigation_planner.run_zone` und `irrigation_planner.stop_all`.
- Testinstanz: Beispielgarten mit den 10 simulierten Zonen.
- Datenmodell wird gespeichert und geladen (`serialize.py`). Beim Laden werden IDs und alle Bezüge geprüft; defekte Daten stoppen die Einrichtung, statt still überschrieben zu werden.
- Treiber `ha_switch`, `ha_valve`, `zigbee2mqtt` und `service_call`. Jeder Treiber plant nach dem Öffnen selbst ein Schließen ein; der Zigbee2MQTT-Treiber schickt die Dauer immer mit (`on_time`).
- Geräteprofile als YAML, mitgeliefert: SONOFF SWV (Zigbee2MQTT). Profile mit Gerätetimer, deren Befehl keine Dauer enthält, werden abgelehnt.
- `devtools/testinstanz/`: simulierte Test-Home-Assistant-Instanz mit Ventil-Simulator (10 Ventile mit und ohne Gerätetimer, Durchfluss, Bodenfeuchte, Wasserzähler, auslösbare Störungen) und Startskript.

### Geändert
- Zonen- und Programmgeräte hängen über `via_device_id` am Hauptgerät (die alte Schreibweise ist in Home Assistant veraltet).
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
