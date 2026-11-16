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
- Seite „Zeitplan“ im Panel: Wochenansicht aller Programme (nächste 7 Tage, in der Zeitzone von Home Assistant), Programm-Karten mit Ablauf, nächstem Start und letztem Ergebnis; Programme bearbeiten (Zonen, Reihenfolge, Startzeit oder „fertig bis“ mit Sonnenzeit, Wochentage, Wetter-Überspringen), neu anlegen und löschen (nicht während gegossen wird); „Jetzt starten“ reiht nur ein.
- Ereignisse für eigene Automationen: `irrigation_planner_run_started`, `irrigation_planner_run_finished` (mit Ergebnis und Sekunden), `irrigation_planner_program_started`, `irrigation_planner_program_skipped` (mit Grund). Die Zeitplan-Seite zeigt sie zusammen mit den Entitäten je Programm.
- WebSocket-Befehle `irrigation_planner/programs/get`, `programs/save`, `programs/create`, `programs/delete` (Ändern nur für Admins).
- Wasser-Ansichten als Kachelraster über das ganze Grundstück (Tropfen-Knopf): „Geplante Gießmenge“ (mm im nächsten geplanten Durchgang), „Bodenfeuchte jetzt“ und „Bodenfeuchte nach dem Gießen“ (Füllstand des Wasserkontos: trocken – halb – voll – zu nass). Nicht bewässerte Teile des Grundstücks grau, Zonen ohne Wert schraffiert; Legende mit Erklärung der Rechnung. Ersetzt die bisherige Nässekarte; gezeichnet als SVG-Kacheln statt als Bild.
- Zustand je Zone enthält `capacity_mm` (nutzbare Feldkapazität).
- „Geplante Gießmenge“ rechnet mit der wirklich geplanten Dauer (bei berechneter Dauer ohne Bedarf 0 mm statt der Dauer von Hand).
- Zuleitungen vom Wasserhahn zu den Ventilen („Zuleitung“ im Grundriss): rastet an Hahn, Ventilen und überall auf bestehenden Zuleitungen ein; Abzweige (T-Stücke) werden als Punkt angezeigt.
- Beim Öffnen und mit „Einpassen“ füllt das Grundstück (Grundstücksgrenze) den Plan mit etwas Rand; ohne Grenze alles Gezeichnete.
- Grundriss-Formen sperren (Schloss in der Liste, „Alle sperren“): gesperrte Formen lassen sich im Plan nicht anfassen oder verschieben, Klicks gehen zum Plan darunter. Gespeichert als `Feature.locked`.
- Leitung Ventil → Zone direkt anfassen: Zone oder Ventil auswählen, die Linie ziehen, dort entsteht ein Knick.
- Nach „Mitte hier festlegen“ erinnert der Hinweis ans Speichern.
- Behoben: Beim Zeichnen von Grundriss-Linien (z. B. Grundstücksgrenze) war die Fläche schwarz gefüllt.
- Nässekarte: Zonen ohne Wert sind schraffiert und nennen im Plan und in der Legende den Grund (kein Ventil, Durchfluss unbekannt, keine Fläche, keine Gießdauer).
- Durchfluss eines Ventils von Hand eintragen (bei der Zone unter „Ventil“), z. B. ohne Durchflusssensor. Mit Sensor wird der Wert weiter gelernt.
- Leitung vom Ventil zur Zone mit Knicken: an der Mitte der Linie ziehen fügt einen Punkt ein, Doppelklick löscht ihn; Ecken werden rund gezeichnet („Leitung wieder gerade“ setzt zurück). Gespeichert als `Zone.valve_route`, auch in der Sicherung.
- „Automatik an/aus“ in der Kopfzeile lässt sich anklicken und schaltet die Automatik um (wie der Schalter „Automatik“).
- Grundstücksgrenze zeigt die eingeschlossene Fläche und den Umfang; auf der Seite „Flächen“ eine Kachel „Grundstück“ mit dem bewässerten Anteil.
- Art der Zone (Sprinkler, Beet/Tropfschlauch, Gießschlauch) direkt im Plan-Editor umstellen; danach startet das passende Zeichenwerkzeug. Bisher ging das nur unter Einstellungen → Integration → Konfigurieren.
- Seite „Betrieb“ im Panel: was gerade läuft (Restzeit, Fortschritt) und was wartet; „Überspringen“ schließt die laufende Zone und macht mit der nächsten weiter, „Herausnehmen“ streicht eine wartende Zone, „Programm abbrechen“ und „Alles stoppen“. Je Zone: zuletzt gegossen (Dauer, Liter, mm), Bedarf jetzt, nächster Start mit geplanter Dauer und Litern. Wetter und Wasserhaushalt der letzten 14 Tage (Verdunstung, Regen, gegossene Liter; auch als Tabelle). Verlauf mit Filter je Zone.
- Verlauf (`history.py`, eigener Speicher, ein Jahr): jeder Lauf mit geplanter und tatsächlicher Dauer, Wassermenge (gemessen über den Durchflusssensor, sonst aus dem gelernten Durchfluss geschätzt) und Millimetern auf der Fläche; dazu abgebrochene Läufe, gestartete und übersprungene Programme und Alarme.
- Dienste `cancel_zone` (Zone aus der Warteschlange nehmen oder schließen, danach geht es weiter) und `cancel_program`; WebSocket-Befehle `operation/subscribe`, `history/get`, `queue/cancel` (Abbrechen auch ohne Admin-Rechte, es schließt nur).
- Reiter „Übersicht“ heißt jetzt „Flächen“; auf dem Handy zeigen die Reiter nur Symbole.
- Wetterverlauf des Wasserhaushalts wird 60 statt 14 Tage aufbewahrt.
- Orten (Fadenkreuz-Knopf auf der Karte): holt einmal den Standort aus dem Browser und legt die Karte dorthin. Ist der Plan noch leer, wird der Standort zur Kartenmitte (Luftbild wird eingeschaltet). Beim Platzieren eines Ventils oder Sensors: „Mein Standort“. Kein Dauer-Orten, nichts wird gespeichert; Browser erlauben Orten nur über https.
- Gießschlauch als Linie mit Reichweite: kräftige Linie, darum der Umriss der Reichweite; Reichweite schon beim Zeichnen einstellbar und danach am Anfasser im Plan ziehen oder als Zahl eingeben.
- Nässekarte kräftiger eingefärbt (auch über dem Luftbild gut lesbar), Legende passend zu den Stufen.

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
