# Testinstanz

Eine eigene, **komplett simulierte** Home-Assistant-Instanz zum Ausprobieren des Bewässerungsplaners. Sie ist absichtlich **keine Kopie** der echten Installation: keine Zugangsdaten, keine echten Geräte, keine Cloud. Nichts darin kann ein echtes Ventil öffnen.

## Starten

```bash
source ../venv/bin/activate          # venv aus CLAUDE.md
uv pip install -r devtools/testinstanz/requirements.txt   # einmalig
python devtools/testinstanz/start.py
```

Dann <http://127.0.0.1:8123> öffnen. Benutzer und Passwort stehen in `../testinstanz-daten/zugang.txt`. Der Datenordner liegt außerhalb des Repos und kann jederzeit gelöscht werden; beim nächsten Start entsteht eine frische Instanz.

Beim ersten Start erledigt das Skript die Ersteinrichtung und legt den Bewässerungsplaner an (Wetter: „Simuliertes Wetter“). Der Code des Bewässerungsplaners ist verlinkt: nach einer Änderung Home Assistant neu starten.

Fehlermeldungen zu `ffmpeg`, `conversation`, `camera` usw. im Log sind harmlos. Diese Teile von Home Assistant werden hier nicht gebraucht.

## Was simuliert wird

Die Hilfs-Integration `irrigation_sim` (nur hier, wird nicht ausgeliefert) legt an:

| Gerät | Entitäten |
|---|---|
| **Simuliertes Ventil Zone 1–10** | Ventil (Zonen 1–9 als `switch`, Zone 10 als `valve`), Durchfluss (L/min), Menge gesamt, Menge und Dauer des letzten Laufs, Gerätestatus (`normal_state`/`water_shortage`/`water_leakage`), Batterie |
| **Simulierter Bodenfeuchtesensor** Zone 1, 2, 3, 5, 8 | Bodenfeuchte (%), trocknet langsam aus und steigt beim Gießen |
| **Simulierter Wasserzähler Zuleitung** | Durchfluss und Zählerstand (Summe aller Ventile) |
| Wetter | `weather.simuliertes_wetter` und `sensor.simulierter_regen`, gesteuert über die Regler `input_number.sim_*` und `input_select.sim_wetterlage` |

**Gerätetimer:** Zonen 1–8 haben einen eigenen Timer (wie ein Zigbee-Ventil mit `on_time`): Mit `irrigation_sim.open_for` geöffnet, schließen sie nach Ablauf von selbst. Zonen 9 und 10 haben keinen: Dort muss Home Assistant schließen (Sicherheitsstufe 🟡). Ein einfaches Einschalten des Schalters öffnet ohne Dauer, wie ein gewöhnlicher Schalter.

## Dienste zum Testen

| Dienst | Wirkung |
|---|---|
| `irrigation_sim.open_for` (`zone`, `duration`) | Zone für N Sekunden öffnen („Zone X für N Minuten“-Dienst eines Bewässerungscomputers) |
| `irrigation_sim.set_fault` (`zone`, `fault`) | Störung auslösen: `leak`, `shortage`, `burst` (doppelter Durchfluss), `clogged` (30 %), `stuck_open` (ignoriert Schließbefehle), `dripping` (tropft im geschlossenen Zustand), `unreachable`; `none` hebt sie auf |
| `irrigation_sim.set_battery` (`zone`, `level`) | Batteriestand setzen |

Damit lassen sich alle Fälle der Durchflussüberwachung (Konzept, Abschnitt 7) von Hand durchspielen.
