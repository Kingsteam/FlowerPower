# Bewässerungsplaner – Konzept für eine eigene Home-Assistant-Erweiterung

Arbeitstitel: **Bewässerungsplaner**, Domain `irrigation_planner`.
Stand: 12.11.2026. Das Konzept ist mit dem Besitzer abgestimmt; die offenen Fragen stehen am Ende.

> **Kopie.** Dieses Dokument ist eine Kopie des Konzepts aus dem privaten Haus-Repo (`projekte/bewaesserung/KONZEPT.md`), Stand 12.11.2026, ergänzt am 14.11.2026.
> Änderungen am Konzept zuerst dort abstimmen und dann hierher übernehmen.
> Zugangsdaten zur echten Home-Assistant-Installation gehören nicht in dieses Repo. Entwickelt wird gegen eine lokale Testinstanz (Abschnitt 12).

---

## 1. Ziel

Eine sauber gekapselte HACS-Integration mit eigener Oberfläche, die **mit beliebiger Bewässerungs-Hardware** funktioniert (siehe Abschnitt 3a). Sie ist nicht an die SONOFF-Ventile dieser Anlage gebunden. Alle Zuordnungen von Geräten und Ventilen erfolgen in der **Admin-Oberfläche**, ohne YAML. Die Erweiterung:

1. einen **Gartenplan** verwaltet. Grundlage ist ein importiertes SVG, PNG/JPG oder Satellitenbild, mit Maßstab.
2. auf dem Plan diese Objekte zeichnen und verwalten lässt:
   - **Sprinkler:** Position, Radius, Startwinkel, Öffnungswinkel (Kreissegment)
   - **Tropfschlauch-Beete** als Polygone
   - **Regen- und Bodenfeuchtesensoren** mit ihrer Position
   - **Ventile und Pumpen**, und welche Zonen sie versorgen
3. aus **Fläche, gemessenem Durchfluss, Bodenfeuchte und Wetter** die **Gießdauer** für jede Zone berechnet.
4. Ventile **ausfallsicher** steuert. Die Dauer wird mit dem Öffnungsbefehl ans Ventil geschickt, und das Ventil schließt von selbst, auch wenn Home Assistant oder MQTT ausfallen.
5. regelmäßig den **Durchfluss prüft** und meldet, wenn etwas nicht stimmt: ein undichtes Ventil, ein gelöster Schlauch, kein Wasser.
6. eine **Winterpause** hat. Dabei werden die zugehörigen Geräte in Home Assistant deaktiviert und alle Zeitpläne ausgesetzt.
7. eine **Steuerung fürs Dashboard** mitbringt: eine eigene Karte mit Plan und Live-Status.

## 2. Bestehende Anlage (ausgelesen am 12.11.2026)

**Ventile:** SONOFF „Zigbee smart water valve“ (SWV), angebunden über Zigbee2MQTT 2.14.3. Batterie 4× AA.
Jedes Ventil liefert: `flow` (m³/h), `current_device_status` (`normal_state` / `water_shortage` / `water_leakage`), `real_time_irrigation_volume` (L), `real_time_irrigation_duration` (s), `daily_irrigation_volume`, `cyclic_timed_irrigation`, `cyclic_quantitative_irrigation` und `auto_close_when_water_shortage`.

| Zone (Z2M-Name) | HA-Schalter | Status | zuletzt gemessen |
|---|---|---|---|
| Bewässerung Vorgarten | `switch.bewasserung_vorgarten` | ok | 45 L in 600 s → **4,5 L/min** |
| Bewässerung Vorgarten Rosen | `switch.bewasserung_vorgarten_rosen` | ok | 96 L in 600 s → **9,6 L/min** |
| Bewässerung Terrasse 2 | `switch.bewasserung_terrasse_2` | ok | 20 L in 205 s → **5,9 L/min** |
| Bewässerung Wiese 4 | `switch.bewasserung_wiese_4` | ok | – |
| Bewässerung Wiese 1 / 2 / 3 | `switch.bewasserung_wiese_1/2/3` | **nicht erreichbar** | – |
| Bewässerung Wiese Seitenbeet | `switch.bewasserung_wiese_seitenbeet` | **nicht erreichbar** | – |
| Bewässerung Hochbeet | `switch.bewasserung_hochbeet` | **nicht erreichbar** | – |
| Bewässerung Terrasse | `switch.bewasserung_terrasse` | **nicht erreichbar** | – |

**Geklärt (14.11.2026):** Alle 10 Ventile sind in Gebrauch. Die als „nicht erreichbar“ markierten haben über den Winter nur keine Batterien. Alle Ventile tragen in Home Assistant das Label `pausiert`. Für die Winterpause (Abschnitt 8) heißt das: Ventile ohne Batterie sind im Winter der Normalfall und dürfen keinen Alarm auslösen.

**Heutige Steuerung:**
- Die HACS-Erweiterung **Smart Irrigation** berechnet die Sekunden pro Zone (`sensor.smart_irrigation_<zone>`).
- Keine Pumpe; alle Ventile hängen an der Hauswasserleitung und dürfen nur einzeln öffnen.
- 12 fast gleiche Skripte schicken per `mqtt.publish` an `zigbee2mqtt/<Name>/set` den Befehl `{"state":"ON","on_time":<s>}`, warten auf das Schließen (über Geräte-ID) und setzen dann den Wasserhaushalt zurück.
- Das Skript `script.bewasserung_durchfuhren` ruft sie der Reihe nach auf.
- Smart Irrigation will im November rund 1 Stunde pro Zone gießen, weil sich ein Defizit von etwa 29 mm angesammelt hat. Eine Winterpause fehlt also.

**Wetter:** `weather.zamg_wien_hohe_warte` (GeoSphere Austria), `weather.openweathermap`, `weather.forecast_home` (Met.no), `sensor.openweathermap_rain`.

**Sensoren:** 5 Bodenfeuchtesensoren über Zigbee2MQTT: Tuya „Soil sensor“ in Vorgarten, Vorgarten Rosen, Hochbeet und Terrasse, dazu „Sensor Wiese“. Wiese wird in Zigbee2MQTT als *Automatically generated definition* geführt, ist also kein offiziell unterstütztes Modell. Alle laufen mit 2× AAA und sind im Winter ohne Batterie (Label `pausiert`). In Home Assistant haben sie derzeit nur noch die Entitäten von Battery Notes; die Messwerte erscheinen erst wieder, wenn sie sich melden. Einen Regensensor gibt es nicht. Die Erweiterung muss auch ohne Boden- und Regensensoren funktionieren.

## 3. Architektur

Ein HACS-Repo mit Backend und Frontend:

```
custom_components/irrigation_planner/
  __init__.py          Einrichtung, Panel registrieren, Dienste
  config_flow.py       Ersteinrichtung (Wetterquelle, Zeitfenster, Benachrichtigung)
  store.py             Gartenmodell speichern (HA Store, .storage/irrigation_planner)
  model.py             Datenklassen: Garden, Zone, Valve, Pump, Sensor
  geometry.py          Flächen: Kreissegment, Polygon, Überlappungen
  water_balance.py     Verdunstung (ET0), Wasserhaushalt je Zone, Bedarf → Liter → Dauer
  scheduler.py         Warteschlange, Zeitfenster, Pumpen- und Druckgrenzen
  drivers/             Treiberschicht (siehe 3a)
    base.py            abstrakte Klasse ValveDriver + Fähigkeiten
    ha_valve.py        beliebige HA-valve-Entität
    ha_switch.py       beliebige HA-switch-Entität
    zigbee2mqtt.py     Z2M-Geräte mit Gerätetimer (on_time u. a.)
    service_call.py    Integrationen mit eigenem „Zone X für N Minuten“-Dienst
  profiles/            Geräteprofile als YAML (SONOFF SWV, Tuya/GiEX, ESPHome Sprinkler …)
  discovery.py         Geräte erkennen, Entitäten zuordnen, Profil vorschlagen
  watchdog.py          Prüfung des Durchflusses, Höchstlaufzeit, Alarme
  season.py            Winterpause: Geräte deaktivieren und reaktivieren, Zeitpläne pausieren
  sensor.py / switch.py / binary_sensor.py / button.py / select.py
  websocket_api.py     Schnittstelle für Panel und Karte
  frontend/            fertig gebautes JS (Panel + Lovelace-Karte)
frontend-src/          TypeScript + Lit; Build mit Vite/Rollup
tests/                 pytest-homeassistant-custom-component
```

**Panel „Bewässerung“** in der Seitenleiste: Editor für den Plan, Zonen, Zuordnungen und den Verlauf.
**Lovelace-Karte** `custom:irrigation-planner-card`: der Plan mit Live-Status und Bedienknöpfen.

## 3a. Unabhängigkeit von der Hardware

Die Erweiterung kennt keine bestimmte Hardware, sondern **Rollen**. Jede Rolle kann eine beliebige Home-Assistant-Entität übernehmen:

| Rolle | geeignete Entitäten |
|---|---|
| Ventil / Zone | `valve.*`, `switch.*`, Zone eines Bewässerungscomputers über einen Dienst |
| Durchfluss | `sensor` mit `device_class: volume_flow_rate` (L/min, m³/h …; Einheiten werden umgerechnet) |
| Volumen / Wasserzähler | `sensor` mit `device_class: water` oder `volume` |
| Bodenfeuchte | `sensor` mit `device_class: moisture` (%) |
| Regen | `binary_sensor` (moisture/Regen), `sensor` mit `precipitation` oder `precipitation_intensity` |
| Gerätestatus / Störung | `sensor` oder `binary_sensor` (z. B. `problem`); die Zuordnung der Werte kommt aus dem Profil |
| Batterie | `sensor` mit `device_class: battery` |
| Wetter | jede `weather`-Entität |

**Treiber** steuern ein Ventil. Jeder Treiber meldet seine **Fähigkeiten**:

| Fähigkeit | Bedeutung |
|---|---|
| `device_timer` | Das Gerät schließt selbst nach einer mitgeschickten Dauer. Das ist die sicherste Stufe. |
| `volume_mode` | Das Gerät kann auch „N Liter“ statt „N Sekunden“. |
| `flow` / `volume` | Es misst Durchfluss bzw. Menge. |
| `status` | Es meldet Wassermangel oder ein Leck. |
| `position` | Es kann teilweise öffnen. |

Mitgelieferte Treiber:
1. **Generische HA-Entität** (`valve`/`switch`): öffnen und schließen. Nur Home Assistant überwacht die Zeit.
2. **Zigbee2MQTT:** schickt die Dauer direkt ans Gerät, sofern das Gerät sie unterstützt (`on_time`, gerätespezifische Countdown- oder Timer-Attribute laut Profil).
3. **Dienstaufruf:** für Integrationen, die einen eigenen Dienst „Zone X für N Minuten“ anbieten, z. B. Bewässerungscomputer oder ESPHome `sprinkler`. Die Dauer läuft dann auf dem Gerät.

**Geräteprofile** sind deklarative YAML-Dateien. Ein Profil beschreibt:
- woran man das Gerät erkennt (Hersteller und Modell aus dem Geräteverzeichnis)
- welcher Treiber passt
- wie der Timer-Befehl aussieht
- wie die Statuswerte zu deuten sind (z. B. `water_leakage` → Leck)

Neue Hardware braucht so **kein neues Python**, nur ein Profil. Profile kann man auch in der Oberfläche anlegen oder importieren. Mitgeliefert werden Profile für SONOFF SWV, gängige Tuya- und GiEX-Ventile sowie ESPHome Sprinkler. Weitere folgen nach Bedarf.

**Sicherheitsstufe sichtbar machen:** Jedes Ventil zeigt in der Oberfläche an, wie sicher es ist:
- 🟢 „Gerät schließt selbst“
- 🟡 „Nur Home Assistant überwacht die Zeit“

Bei 🟡 weist die Oberfläche darauf hin, dass ein Absturz von Home Assistant das Ventil offen lassen kann. Empfohlen wird dann ein Gerät mit eigenem Timer, oder eine Absicherung auf dem Gerät selbst, z. B. eine Höchstlaufzeit in ESPHome.

### Zuordnung in der Admin-Oberfläche

Ein **Assistent „Ventil hinzufügen“**:
1. Ein Gerät aus dem Geräteverzeichnis von Home Assistant wählen. Es gibt Suche und Filter, Geräte mit `valve`/`switch` stehen oben.
2. Die Erweiterung **erkennt die Entitäten des Geräts** (Ventil, Durchfluss, Batterie, Status) und **schlägt Profil und Treiber vor**. Alles lässt sich von Hand überschreiben.
3. **Testlauf:** 10 s öffnen, dabei den Durchfluss prüfen und den Gerätetimer testen (das Ventil muss ohne OFF-Befehl schließen). Das Ergebnis bestimmt die Sicherheitsstufe.
4. Das Ventil einer **Wasserversorgung** und einer oder mehreren **Zonen** zuordnen. Zonen und Geräte lassen sich auf dem Plan per Drag & Drop platzieren.

Genauso funktionieren **Sensoren** (Bodenfeuchte, Regen, Wasserzähler) und **Wetterquellen**: Gerät oder Entität wählen, Rolle zuweisen, auf dem Plan platzieren, Zonen zuordnen.

Eine **Übersichtsseite „Geräte“** zeigt alle zugeordneten Geräte mit Status, Batterie, letzter Meldung, Sicherheitsstufe und der Zone, die sie versorgen. Dort lassen sich Geräte auch tauschen. Wird ein Ventil neu angelernt, bekommt es eine neue Entität; man wählt dann einfach das neue Gerät aus, und Verlauf und gelernter Durchfluss bleiben erhalten.

## 4. Datenmodell

- **Garten:** Hintergrundbild, Maßstab (zwei Punkte anklicken + echten Abstand in m eingeben), Nordrichtung, optional Geokoordinaten.
- **Zone:**
  - Typ `sprinkler` (Mittelpunkt, Radius m, Startwinkel, Öffnungswinkel) oder `drip` (Polygon)
  - Pflanzentyp und Kc-Faktor (Rasen, Beet, Hochbeet, Rosen …), Bodenart, Wurzeltiefe
  - Ventil, Priorität, Höchstdauer, Cycle & Soak (in Intervallen gießen) ja/nein
- **Ventil:** Geräte-ID, Treiber und Profil, zugeordnete Entitäten je Rolle (Ventil, Durchfluss, Volumen, Status, Batterie), Fähigkeiten, Sicherheitsstufe, versorgte Zone(n) und Wasserversorgung. Der Bezug läuft **über die Geräte-ID und die eindeutige ID der Entität**, nicht über `entity_id`, damit Umbenennungen nichts kaputt machen.
- **Wasserversorgung:** z. B. „Hauswasserleitung Garten“. Dazu gehören die versorgten Ventile, wie viele gleichzeitig offen sein dürfen (Standard **1**), optional ein höchster Gesamtdurchfluss (L/min) und ein optionaler Wasserzähler. Eine Pumpe gibt es derzeit **nicht**. Das Modell erlaubt sie optional (Schalter, Vor- und Nachlauf), sie spielt in Phase 1 aber keine Rolle.
- **Programm:** eine benannte Abfolge von Zonen mit Zeitplan und Ablaufmodus (siehe Abschnitt 6a).
- **Sensor:** Regen (binär oder mm), Bodenfeuchte (%), Position, zugeordnete Zone(n).
- **Wetterquelle:** HA-`weather`-Entität. Wahlweise mehrere, mit Rangfolge.

## 5. Berechnung

1. **Fläche:**
   - Kreissegment `A = π·r²·(Öffnungswinkel/360°)`
   - Polygon nach der Gaußschen Trapezformel (Pixel × Maßstab² → m²)
   - Überlappungen von Sprinklern werden berücksichtigt: die effektive Niederschlagsmenge je Teilfläche.
2. **Bedarf (mm):**
   - Verdunstung **ET0** nach FAO-56 (Penman-Monteith) aus Temperatur, Luftfeuchte, Wind und Strahlung bzw. Bewölkung. Fehlen Werte, nach Hargreaves.
   - Je Zone `ETc = ET0 · Kc`.
   - Wasserhaushalt je Zone: `+ wirksamer Regen + Bewässerung − ETc`, gedeckelt durch die nutzbare Feldkapazität (Bodenart × Wurzeltiefe).
   - Regen aus der Vorhersage der nächsten 24 h verschiebt den Lauf.
   - Bodenfeuchte, wenn vorhanden, korrigiert den Wasserhaushalt bzw. überschreibt ihn.
3. **Liter:** 1 mm auf 1 m² = 1 L, also `Liter = Bedarf_mm · Fläche_m² / Effizienz`. Effizienz z. B. Tropfschlauch 0,9, Sprinkler 0,75.
4. **Dauer:** `Dauer = Liter / Durchfluss`.
   - Der Durchfluss wird **aus echten Läufen gelernt**: gleitender Mittelwert aus Volumen und Dauer. Startwert ist der Herstellerwert oder eine erste Messung.
   - Danach wird die Dauer auf die Höchstdauer und das Zeitfenster begrenzt.
5. Alternativ kann **Smart Irrigation** als Quelle dienen. Das erleichtert die Migration; später übernimmt das eigene Modell.

## 6. Ausfallsichere Ventilsteuerung (wichtigste Anforderung)

Allgemein: Kann der Treiber `device_timer`, wird die Dauer **immer** ans Gerät mitgeschickt. Die folgenden Punkte gelten für das Profil **SONOFF SWV (Zigbee2MQTT)** der bestehenden Anlage und sind das Muster für andere Profile.

- **Öffnen immer mit Dauer**, die das Gerät selbst überwacht: `zigbee2mqtt/<Name>/set` → `{"state":"ON","on_time":<s>}`. Z2M setzt das als *On with timed off* um, und der Timer läuft **im Ventil**.
- **Vor der ersten Nutzung auf echter Hardware prüfen**, ob das SWV den Timer wirklich selbst einhält:
  - `on_time: 60` senden, sofort Zigbee2MQTT stoppen und prüfen, ob das Ventil nach 60 s schließt.
  - Wenn nicht: die gerätegesteuerte Funktion `cyclic_timed_irrigation` mit `total_number: 1` und `irrigation_duration` verwenden und genauso testen.
- **Zusätzliche Absicherung in Home Assistant:**
  - nach Ablauf ein explizites `OFF` senden und es wiederholen, bis das Ventil als geschlossen gemeldet wird
  - eine **harte Höchstdauer** je Zone
  - beim Start von Home Assistant alle Ventile auf „geschlossen“ prüfen
  - vor dem Start prüfen, ob die Z2M-Bridge online ist und die Batterie reicht
- **Nie offen ohne Dauer:** Auch ein manueller Start aus dem Dashboard schickt immer eine Dauer mit.
- `auto_close_when_water_shortage` bleibt an.

## 6a. Ablauf und Zeitplanung

**Grundregel:** An der Hauswasserleitung ist **immer nur ein Ventil gleichzeitig offen**. Das lässt sich je Wasserversorgung einstellen, Standard ist 1. Die Warteschlange setzt diese Regel immer durch, auch bei manuellen Starts: Ein Start während eines Laufs wird eingereiht und nicht parallel ausgeführt.

**Ablaufmodi je Programm** (in der Admin-Oberfläche wählbar):

| Modus | Ablauf | Wofür |
|---|---|---|
| **Sequenz** | Zone A komplett, dann B, dann C … | Standard, einfach |
| **Abwechselnd** (Cycle & Soak) | A 5 min → B 5 min → C 5 min → A 5 min … bis jede Zone ihre Gesamtmenge hat | Wasser zieht besser ein, weniger Abfluss bei Rasen, Hang oder lehmigem Boden |
| **Nach Priorität** | Zonen mit höchstem Bedarf zuerst; wenn das Zeitfenster nicht reicht, fallen die niedrigen Prioritäten weg | knappe Zeitfenster |

**Einstellbar je Programm:**
- Reihenfolge der Zonen (per Drag & Drop)
- Pause zwischen zwei Ventilen (Druck soll sich erholen, Standard 10–30 s)
- Länge und Pause der Gießphasen beim Modus „Abwechselnd“
- Zeitfenster (z. B. 04:00–07:00): Startzeit **oder** „fertig bis“. Bei „fertig bis“ wird die Startzeit aus der Gesamtdauer rückwärts berechnet.
- Wochentage oder Intervall, Überspringen bei Regen, Frost, Wind oder Winterpause

**Integration in Home Assistant:** Beides ist möglich, man muss sich nicht entscheiden.
1. **Eingebauter Zeitplan** in der Admin-Oberfläche: der Normalfall, ohne YAML.
2. **Von außen steuerbar:** Jedes Programm hat einen Dienst `irrigation_planner.run_program` und eine `button`-Entität. Ein HA-`schedule`-Helfer kann als Zeitplanquelle gewählt werden, und Automationen können Programme starten, überspringen oder stoppen. So lässt sich die Erweiterung z. B. an Anwesenheit oder einen eigenen Kalender koppeln.

**Planvorschau:** In der Admin-Oberfläche gibt es eine Zeitleiste für die nächsten Läufe mit Zone, Uhrzeit, Dauer und voraussichtlichen Litern. Darin sieht man auch, *warum* ein Lauf übersprungen wird (z. B. „8 mm Regen erwartet“).

## 7. Überwachung des Durchflusses

Die Prüfung läuft regelmäßig (z. B. alle 5 min), nach jedem Lauf und bei jeder Änderung des Durchflusses:

| Situation | Bedeutung | Reaktion |
|---|---|---|
| Ventil zu, Durchfluss > 0 | Ventil dichtet nicht ab oder hängt | Alarm, OFF erneut senden |
| Ventil offen, Durchfluss ≫ gelernter Wert | Schlauch gelöst oder geplatzt | sofort schließen, Alarm |
| Ventil offen, Durchfluss ≪ gelernter Wert | Verstopfung, Knick oder Druck zu gering | Warnung, nach Grenzwert schließen |
| Ventil offen, Durchfluss 0 / `water_shortage` | kein Wasser, Hahn zu | schließen, Alarm |
| zwei Ventile derselben Versorgung offen | Fehler in der Ablaufsteuerung oder manuell geöffnet | das später geöffnete schließen, Warnung |
| `water_leakage` vom Gerät | Gerät meldet ein Leck | schließen, Alarm |

**Grenze:** Ein Durchflussmesser im Ventil sieht nur Wasser, das **durch dieses Ventil** fließt. Ein Leck **vor** den Ventilen, etwa zwischen Hahn und Verteiler, erkennt er nicht. Dafür bräuchte es einen Wasserzähler oder Durchflussmesser in der Zuleitung. Er ist als optionaler Sensor im Modell vorgesehen.

## 8. Winterpause

- Auslöser: manuell, nach Datum (z. B. 1.11. bis 31.3.) und/oder nach Frostprognose.
- Ablauf beim Einwintern:
  1. alle Ventile schließen und prüfen
  2. Zeitpläne pausieren
  3. die zugeordneten Geräte im Gerätebereich auf `disabled_by: user` setzen
  4. eine Benachrichtigung schicken
- Ablauf beim Auswintern:
  1. Geräte reaktivieren
  2. auf die Rückmeldung der Ventile warten
  3. einen Testlauf mit kurzer Dauer pro Zone und Prüfung des Durchflusses
  4. den Wasserhaushalt zurücksetzen
- Während der Pause ruht die Berechnung, damit sich kein Defizit wie heute ansammelt. Die Batterie-Überwachung ist ausgesetzt.

## 9. Entitäten und Dienste

- **Je Zone:**
  - `sensor` Bedarf (mm), geplante Dauer, gelernter Durchfluss, letzter Lauf, Verbrauch (L, für das Energie-Dashboard als Wasser)
  - `switch` Zone aktiv
  - `button` jetzt gießen
- **Global:**
  - `sensor` Status (bereit / läuft / pausiert / Fehler), aktive Zone, Restzeit
  - `binary_sensor` Leck bzw. Problem
  - `switch` Winterpause, Automatik
  - `button` alles stoppen
- **Je Programm:** `button` starten, `switch` aktiv, `sensor` nächster Lauf und geschätzte Dauer
- **Dienste:** `irrigation_planner.run_zone`, `run_program`, `stop_all`, `skip_next`, `set_winter_mode`, `recalculate`

## 10. Oberfläche

- **Plan-Editor (Panel):**
  - SVG, PNG oder JPG hochladen; Maßstab kalibrieren
  - Werkzeuge für Sprinkler (Mittelpunkt ziehen, Radius und Winkel mit Anfassern), Polygon, Sensor
  - Zuordnung über Seitenleiste, Fläche und Bedarf werden live angezeigt
- **Satellitenbild:** Am einfachsten importierst du einen eigenen Screenshot als Bild. Optional gibt es eine Kachel-Ebene. Lizenz und Nutzungsbedingungen des Anbieters prüfen; nichts fest einbauen, was die Bedingungen verletzt.
- **Dashboard-Karte:**
  - Plan mit Zonen nach Zustand eingefärbt (Bedarf, läuft, Fehler); laufende Zonen sind animiert
  - Tippen auf eine Zone zeigt Details und „Jetzt X min gießen“
  - Start/Stop für alles, Winterpause-Schalter, nächster geplanter Lauf

## 11. Phasen

1. **MVP Backend:** Treiberschicht (generische Entität, Zigbee2MQTT, Dienstaufruf), Profil SONOFF SWV, Assistent „Ventil hinzufügen“ mit Testlauf, Zonen über die Oberfläche anlegen (noch ohne Plan), ausfallsichere Ventilsteuerung mit Hardwaretest, Warteschlange mit „ein Ventil gleichzeitig“, Programme mit Sequenz und Abwechselnd, Zeitplan, Überwachung des Durchflusses, Winterpause. Tests mit einem simulierten Ventil.
2. **Berechnung:** ET0, Wasserhaushalt, gelernter Durchfluss; optional Smart Irrigation als Quelle.
3. **Plan-Editor** im Panel, Flächen aus der Geometrie.
4. **Dashboard-Karte.**
5. **Migration:** Die bestehenden 12 Skripte ablösen und Smart Irrigation optional deinstallieren. HACS-Veröffentlichung (privat oder öffentlich).

## 12. Entwicklung und Tests

- Lokale Test-Instanz von Home Assistant auf dem Mac (Docker oder `hass` in einer venv) mit simuliertem MQTT und simulierten Ventilen. Nie direkt gegen die echte Anlage entwickeln.
- `pytest-homeassistant-custom-component` für das Backend, `vitest` für Geometrie und Frontend-Logik, Playwright für Panel und Karte.
- GitHub Actions: `hassfest`, HACS-Prüfung, Tests.
- Jeder Treiber und jedes mitgelieferte Profil bekommt Tests mit simulierten Entitäten; für neue Profile gibt es einen Testrahmen.
- Test mit echter Hardware nur mit kurzen Dauern (30–60 s) und dem Ausfalltest aus Abschnitt 6.

## 13. Offene Fragen an den Besitzer

1. ~~Welche Ventile sind real vorhanden?~~ **Geklärt:** alle 10; im Winter ohne Batterien.
2. ~~Pumpe? Gleichzeitig offene Ventile?~~ **Geklärt:** keine Pumpe, alles an der Hauswasserleitung, nie mehrere Ventile gleichzeitig, sondern nacheinander oder abwechselnd (einstellbar).
3. Welche Sprinkler-Typen (Kreisregner, Viereckregner, Versenkregner) und welche Tropfschläuche (L/h pro m)?
4. Bevorzugtes Zeitfenster zum Gießen?
5. Sollen Bodenfeuchte- oder Regensensoren dazukommen? Welche Hardware ist geplant?
6. Benachrichtigung über die Companion App auf welches Gerät?
7. Soll das Repo privat bleiben oder später öffentlich über HACS geteilt werden?
