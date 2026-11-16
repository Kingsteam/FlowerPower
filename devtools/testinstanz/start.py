"""Startet die Testinstanz des Bewässerungsplaners.

Aufruf (aus dem Repo, mit aktivierter venv):

    python devtools/testinstanz/start.py [--daten PFAD] [--port 8123]

- Die Daten der Instanz liegen außerhalb des Repos (Standard:
  ``../testinstanz-daten`` neben dem Repo).
- ``custom_components/irrigation_planner`` und der Simulator werden
  verlinkt, Änderungen am Code gelten also nach einem Neustart sofort.
- Beim ersten Start wird die Ersteinrichtung automatisch erledigt: Benutzer
  ``test`` mit zufälligem Passwort (steht in ``zugang.txt`` im Datenordner).

Die Instanz ist komplett simuliert und verbindet sich mit keinem echten Gerät.
"""

from __future__ import annotations

import argparse
import datetime as dt
import itertools
import json
import math
from pathlib import Path
import secrets
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import webbrowser

HIER = Path(__file__).resolve().parent
REPO = HIER.parents[1]
CLIENT_ID = "http://localhost/"


def _anfrage(url: str, daten: dict | None = None, token: str | None = None) -> dict:
    """Schickt eine JSON-Anfrage an die lokale Instanz."""
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(daten).encode() if daten is not None else None
    req = urllib.request.Request(url, data=body, headers=headers)
    with urllib.request.urlopen(req, timeout=10) as antwort:
        text = antwort.read().decode()
    return json.loads(text) if text else {}


def _warten(basis: str, prozess: subprocess.Popen, sekunden: int = 180) -> None:
    """Wartet, bis die Instanz antwortet."""
    for _ in range(sekunden):
        if prozess.poll() is not None:
            sys.exit("Home Assistant hat sich beendet, siehe home-assistant.log")
        try:
            urllib.request.urlopen(f"{basis}/api/onboarding", timeout=2)
        except urllib.error.HTTPError:
            return
        except OSError:
            time.sleep(1)
            continue
        return
    sys.exit("Home Assistant antwortet nicht")


def _einrichten(basis: str, daten: Path) -> None:
    """Erledigt die Ersteinrichtung, falls sie noch fehlt."""
    try:
        schritte = _anfrage(f"{basis}/api/onboarding")
    except urllib.error.HTTPError as err:
        if err.code == 404:  # Ersteinrichtung ist schon erledigt
            return
        raise
    offen = {s["step"] for s in schritte if not s["done"]}
    if "user" not in offen:
        return
    passwort = secrets.token_urlsafe(12)
    code = _anfrage(
        f"{basis}/api/onboarding/users",
        {
            "client_id": CLIENT_ID,
            "name": "Test",
            "username": "test",
            "password": passwort,
            "language": "de",
        },
    )["auth_code"]
    form = urllib.parse.urlencode(
        {"grant_type": "authorization_code", "code": code, "client_id": CLIENT_ID}
    ).encode()
    with urllib.request.urlopen(f"{basis}/auth/token", data=form, timeout=10) as r:
        token = json.loads(r.read())["access_token"]
    _anfrage(f"{basis}/api/onboarding/core_config", {}, token)
    _anfrage(f"{basis}/api/onboarding/analytics", {}, token)
    _anfrage(
        f"{basis}/api/onboarding/integration",
        {"client_id": CLIENT_ID, "redirect_uri": f"{CLIENT_ID}?auth_callback=1"},
        token,
    )
    # Bewässerungsplaner gleich mit anlegen (Wetter = simuliertes Wetter).
    flow = _anfrage(
        f"{basis}/api/config/config_entries/flow",
        {"handler": "irrigation_planner"},
        token,
    )
    _anfrage(
        f"{basis}/api/config/config_entries/flow/{flow['flow_id']}",
        {
            "weather_entity": "weather.simuliertes_wetter",
            "window_start": "04:00:00",
            "window_end": "07:00:00",
        },
        token,
    )
    zugang = daten / "zugang.txt"
    zugang.write_text(f"Benutzer: test\nPasswort: {passwort}\n")
    zugang.chmod(0o600)


def _sim_ref(domain: str, unique_id: str) -> dict[str, str]:
    return {"domain": domain, "platform": "irrigation_sim", "unique_id": unique_id}


FLUSS = (4.5, 9.5, 6.0, 12.0, 12.0, 11.0, 10.0, 7.5, 5.0, 8.0)
BERECHNUNG = {
    1: {"area_m2": 12.6, "plant_type": "flower_bed", "kc": 0.9},
    2: {"area_m2": 9.0, "plant_type": "roses", "kc": 0.9},
    3: {"area_m2": 6.0, "plant_type": "pots", "kc": 1.1},
    4: {
        "area_m2": 47.5,
        "plant_type": "lawn",
        "kc": 0.8,
        "type": "sprinkler",
        "soil_type": "sandy_loam",
    },
    5: {
        "area_m2": 47.5,
        "plant_type": "lawn",
        "kc": 0.8,
        "type": "sprinkler",
        "soil_type": "sandy_loam",
    },
    6: {"area_m2": 16.0, "plant_type": "berries", "kc": 0.85},
    7: {"area_m2": 20.5, "plant_type": "hedge", "kc": 0.7, "soil_type": "sandy_loam"},
    8: {"area_m2": 6.4, "plant_type": "vegetables", "kc": 1.05},
    10: {"area_m2": 4.5, "plant_type": "herbs", "kc": 0.5},
}
for _werte in BERECHNUNG.values():
    _werte["duration_mode"] = "calculated"
# Zone 9 (Hortensien) bleibt bei der Dauer von Hand, damit beides zu sehen ist.
BERECHNUNG[9] = {"plant_type": "hydrangeas", "kc": 1.1}

# Phase 3: Zonen 1 bis 5 sind schon auf dem Plan gezeichnet (Meter, x nach
# Osten, y nach Süden); 6 bis 10 bleiben zum Ausprobieren leer.
PLAN = {
    1: {"polygon": [[-12, 6], [-3, 6], [-3, 7.4], [-12, 7.4]]},
    2: {"polygon": [[-12, -8], [-9, -8], [-9, -5], [-12, -5]]},
    3: {"polygon": [[4, -8], [10, -8], [10, -7], [4, -7]]},
    4: {"center": [-6.5, 0.5], "radius_m": 5.5, "start_angle_deg": 90, "arc_deg": 180},
    5: {"center": [4, 1], "radius_m": 5.5, "start_angle_deg": 270, "arc_deg": 180},
    # Beerenstreifen am Ostrand
    6: {"polygon": [[11.5, -4], [13.5, -4], [13.5, 4], [11.5, 4]]},
    # Gießschlauch an der Hecke entlang (0,4 m je Seite)
    7: {"type": "hose", "polygon": [[-13, 8.6], [12, 8.6]], "radius_m": 0.4},
    # Gießschlauch im Gemüsebeet am Westrand (mit Knick)
    8: {
        "type": "hose",
        "polygon": [[-14, -9.5], [-14, -4.5], [-13, -3.6]],
        "radius_m": 0.6,
    },
    # Hortensien vor dem Haus, Kräuter vor der Terrasse
    9: {"polygon": [[-8, -10.6], [-4.5, -10.6], [-4.5, -9.2], [-8, -9.2]]},
    10: {"polygon": [[6, -5.6], [10.5, -5.6], [10.5, -4.6], [6, -4.6]]},
}
# Leitung vom Ventil zur Zone mit Knicken (sonst gerade)
ROUTEN = {
    2: [[-1.8, -9.0], [-10.5, -9.0]],
    4: [[1.8, -8.4], [-6.5, -8.4]],
    6: [[-4.0, -3.6], [12.5, -3.6]],
    8: [[-2.0, -5.4], [-12.5, -5.4]],
}
# Ventile: Verteiler 1 am Haus (Ventile 1 bis 5), Verteiler 2 im Garten (6 bis 10)
VENTIL_ORT = {n: [-3 + 1.2 * n, -10.2] for n in range(1, 6)} | {
    n: [-4.0 + (n - 6), -4.5] for n in range(6, 11)
}
# Abgepauster Grundriss (nur Orientierung): Haus, Terrasse, Hecke, Baum, Hahn.
GRUNDRISS = [
    {
        "id": "boden_rasen",
        "kind": "soil",
        "points": [[-14, -4], [13, -4], [13, 9], [-14, 9]],
        "soil_type": "sandy_loam",
    },
    {
        "id": "haus",
        "kind": "building",
        "points": [[-8, -19], [8, -19], [8, -11], [-8, -11]],
        "label": "Wohnhaus",
    },
    {
        "id": "terrasse",
        "kind": "paving",
        "points": [[2, -11], [11, -11], [11, -6], [2, -6]],
    },
    {"id": "hecke", "kind": "hedge", "points": [[-14, 9.5], [13, 9.5]]},
    {
        "id": "grenze",
        "kind": "boundary",
        "points": [[-15, -21], [14, -21], [14, 10.5], [-15, 10.5], [-15, -21]],
    },
    {"id": "apfel", "kind": "tree", "points": [[9, 5.5]], "radius_m": 2.5},
    # Kirschbaum im Rasen: Der Stamm wirft beim Sprinkler einen Wasserschatten.
    {
        "id": "kirsche",
        "kind": "tree",
        "points": [[5.5, -1.5]],
        "radius_m": 1.5,
        "trunk_m": 0.5,
    },
    {"id": "hahn", "kind": "tap", "points": [[-1, -10.8]]},
    # Zuleitungen: Hahn → Verteiler am Haus → Abzweig zum Verteiler im Garten
    {"id": "zuleitung_hahn", "kind": "pipe", "points": [[-1, -10.8], [-1, -10.2]]},
    {
        "id": "verteiler_haus",
        "kind": "pipe",
        "points": [
            [-2.4, -10.2],
            [-1.8, -10.2],
            [-1, -10.2],
            [-0.6, -10.2],
            [0.6, -10.2],
            [1.8, -10.2],
            [3.0, -10.2],
        ],
    },
    {"id": "abzweig_garten", "kind": "pipe", "points": [[-1, -10.2], [-1, -4.5]]},
    {
        "id": "verteiler_garten",
        "kind": "pipe",
        "points": [
            [-4.4, -4.5],
            [-4, -4.5],
            [-3, -4.5],
            [-2, -4.5],
            [-1, -4.5],
            [0, -4.5],
        ],
    },
]
# Feste Teile des Grundrisses sind gesperrt (zum Ausprobieren des Schlosses).
for _form in GRUNDRISS:
    if _form["kind"] in ("building", "paving", "boundary", "hedge", "soil"):
        _form["locked"] = True
NAMEN = {
    6: "Beeren",
    7: "Schlauch Hecke",
    8: "Schlauch Gemüse",
    9: "Hortensien",
    10: "Kräuter",
    1: "Blumenbeet Süd",
    2: "Rosen",
    3: "Töpfe Terrasse",
    4: "Rasen West",
    5: "Rasen Ost",
}


def _beispielgarten() -> dict:
    """Gartenmodell mit den 10 simulierten Zonen.

    Zonen 1 bis 8: Treiber ``service_call`` mit Gerätetimer (wie ein Ventil, das
    selbst schließt). Zone 9: ``ha_switch``, Zone 10: ``ha_valve`` (nur Home
    Assistant überwacht die Zeit).
    """
    zonen, ventile = [], []
    for n in range(1, 11):
        rollen = {
            "flow": _sim_ref("sensor", f"zone_{n}_flow"),
            "volume": _sim_ref("sensor", f"zone_{n}_volume"),
            "status": _sim_ref("sensor", f"zone_{n}_status"),
            "battery": _sim_ref("sensor", f"zone_{n}_battery"),
        }
        if n <= 8:
            treiber = "service_call"
            optionen = {
                "open_service": "irrigation_sim.open_for",
                "open_data": {"zone": n, "duration": "{duration}"},
                "device_timer": True,
            }
            rollen["valve"] = _sim_ref("switch", f"zone_{n}_switch")
        elif n == 9:
            treiber, optionen = "ha_switch", {}
            rollen["valve"] = _sim_ref("switch", f"zone_{n}_switch")
        else:
            treiber, optionen = "ha_valve", {}
            rollen["valve"] = _sim_ref("valve", f"zone_{n}_valve")
        zonen.append(
            {
                "id": f"zone_{n}",
                "name": NAMEN.get(n, f"Zone {n}"),
                "type": "drip",
                "valve_id": f"ventil_{n}",
                "max_duration_s": 1800,
                "duration_s": 120 + 30 * n,
                # Phase 2: Zonen 1 bis 5 mit berechneter Dauer.
                **(BERECHNUNG.get(n, {})),
                **(PLAN.get(n, {})),
                "valve_route": ROUTEN.get(n, []),
            }
        )
        ventile.append(
            {
                "id": f"ventil_{n}",
                "name": f"Ventil {n}",
                "device_id": "",
                "driver": treiber,
                "driver_options": optionen,
                "entities": rollen,
                "zone_ids": [f"zone_{n}"],
                "water_supply_id": "hauswasser",
                # Durchfluss wie im Simulator (sonst erst nach dem ersten Lauf).
                "learned_flow_l_min": FLUSS[n - 1],
                "position": VENTIL_ORT[n],
                "safety_level": "device" if n <= 8 else "ha_only",
            }
        )
    return {
        "garden": {"features": GRUNDRISS},
        "zones": zonen,
        "valves": ventile,
        "water_supplies": [
            {
                "id": "hauswasser",
                "name": "Hauswasser (Test)",
                "valve_ids": [v["id"] for v in ventile],
                "max_open_valves": 1,
            }
        ],
        "programs": [
            {
                "id": "morgens",
                "name": "Morgenprogramm",
                "zone_ids": [f"zone_{n}" for n in range(1, 9)],
                "mode": "sequence",
                "pause_between_s": 20,
                # Fertig eine Stunde vor Sonnenaufgang (gut für die Pflanzen).
                "finish_by": "sunrise",
                "sun_offset_min": -60,
            },
            {
                "id": "rasen",
                "name": "Rasen abwechselnd",
                "zone_ids": ["zone_4", "zone_5", "zone_6", "zone_7"],
                "mode": "cycle_soak",
                "cycle_s": 120,
                "soak_s": 600,
                "pause_between_s": 10,
                "start_time": "21:00:00",
                "weekdays": [0, 2, 4],
            },
        ],
        "sensors": [
            {
                "id": f"boden_{n}",
                "name": f"Bodenfeuchte Zone {n}",
                "kind": "soil_moisture",
                "entity": _sim_ref("sensor", f"soil_{n}"),
                "zone_ids": [f"zone_{n}"],
                "position": {1: [-4, 6.7], 2: [-9.6, -7.4], 3: [9.4, -7.5]}[n],
                "field_capacity_pct": 45,
                "wilting_point_pct": 12,
            }
            for n in (1, 2, 3)
        ]
        + [
            {
                "id": "regen",
                "name": "Simulierter Regen",
                "kind": "rain_mm",
                "entity": {
                    "domain": "sensor",
                    "platform": "template",
                    "unique_id": "sim_rain",
                },
            }
        ],
    }


# Wasserhaushalt: wie viel mm im Wasserkonto fehlen (unterschiedlich trocken).
DEFIZIT = {1: 12, 2: 50, 3: 6, 4: 3, 5: 14, 6: 60, 7: 20, 8: 30, 9: 10, 10: 40}
# 14 Tage Wetter: Verdunstung ET0 und Regen in mm (ältester Tag zuerst).
WETTER = [
    (3.1, 0),
    (3.8, 0),
    (4.2, 0),
    (2.0, 8.5),
    (1.6, 12.0),
    (2.9, 0),
    (3.6, 0),
    (4.4, 0),
    (4.9, 0),
    (5.2, 0),
    (2.4, 2.0),
    (3.3, 0),
    (4.0, 0),
    (4.6, 0),
]


def _flaeche(zone: dict) -> float:
    """Fläche einer Zone in m² (wie geometry.py, vereinfacht)."""
    if zone.get("center") and zone.get("radius_m"):
        return math.pi * zone["radius_m"] ** 2 * zone.get("arc_deg", 360) / 360
    punkte = zone.get("polygon") or []
    if zone.get("type") == "hose" and len(punkte) >= 2:
        laenge = sum(math.dist(a, b) for a, b in itertools.pairwise(punkte))
        r = zone["radius_m"]
        return laenge * 2 * r + math.pi * r * r
    if len(punkte) >= 3:
        return (
            abs(
                sum(
                    a[0] * b[1] - b[0] * a[1]
                    for a, b in zip(punkte, punkte[1:] + punkte[:1], strict=True)
                )
            )
            / 2
        )
    return zone.get("area_m2") or 0.0


def _wasserhaushalt() -> dict:
    """Bilanz-Speicher: Defizit je Zone und die letzten 14 Tage."""
    heute = dt.date.today()
    return {
        "zones": {
            f"zone_{n}": {
                "deficit_mm": float(d),
                "measured": False,
                "last_irrigation_mm": 0.0,
            }
            for n, d in DEFIZIT.items()
        },
        "today": None,
        "history": [
            {
                "day": (heute - dt.timedelta(days=len(WETTER) - i)).isoformat(),
                "et0_mm": et0,
                "rain_mm": regen,
            }
            for i, (et0, regen) in enumerate(WETTER)
        ],
    }


def _verlauf(garten: dict) -> dict:
    """Verlauf der letzten Woche: Morgenprogramm, ein Regentag, ein Abbruch."""
    zonen = {z["id"]: z for z in garten["zones"]}
    fluss = {v["id"]: v["learned_flow_l_min"] for v in garten["valves"]}
    eintraege: list[dict] = []
    jetzt = dt.datetime.now(dt.UTC).replace(microsecond=0)
    for tage in range(7, 0, -1):
        start = (jetzt - dt.timedelta(days=tage)).replace(hour=3, minute=20, second=0)
        if tage == 4:
            eintraege.append(
                {
                    "at": start.isoformat(),
                    "kind": "program_skipped",
                    "program_id": "morgens",
                    "program_name": "Morgenprogramm",
                    "reason": "8,5 mm Regen erwartet",
                }
            )
            continue
        eintraege.append(
            {
                "at": start.isoformat(),
                "kind": "program_started",
                "program_id": "morgens",
                "program_name": "Morgenprogramm",
                "source": "schedule",
                "planned_s": 3600,
            }
        )
        moment = start
        for n in range(1, 9):
            zone = zonen[f"zone_{n}"]
            sekunden = 240 + 40 * n
            zustand, fehler = "done", None
            if tage == 2 and n == 5:
                sekunden, zustand = 95, "skipped"  # von Hand übersprungen
            liter = fluss[zone["valve_id"]] * sekunden / 60
            effizienz = 0.75 if zone.get("type") == "sprinkler" else 0.9
            flaeche = _flaeche(zone)
            eintraege.append(
                {
                    "at": moment.isoformat(),
                    "end": (moment + dt.timedelta(seconds=sekunden)).isoformat(),
                    "kind": "run",
                    "zone_id": zone["id"],
                    "zone_name": zone["name"],
                    "source": "program:morgens",
                    "source_text": "Programm Morgenprogramm",
                    "planned_s": 240 + 40 * n,
                    "seconds": sekunden,
                    "state": zustand,
                    "error": fehler,
                    "liters": round(liter, 1),
                    "measured": True,
                    "mm": round(liter * effizienz / flaeche, 1) if flaeche else None,
                }
            )
            moment += dt.timedelta(seconds=sekunden + 20)
    return {"entries": eintraege}


def _speichern(datei: Path, key: str, daten: dict, sichern: bool) -> None:
    if datei.exists():
        if not sichern:
            return
        datei.replace(datei.with_name(datei.name + ".bak"))
    datei.parent.mkdir(parents=True, exist_ok=True)
    datei.write_text(
        json.dumps(
            {"version": 1, "minor_version": 1, "key": key, "data": daten}, indent=2
        )
    )


def _garten_anlegen(daten: Path, neu: bool = False) -> None:
    """Legt den Beispielgarten an (Plan, Wasserhaushalt, Verlauf).

    Ohne ``neu`` nur, was noch fehlt. Mit ``neu`` wird alles ersetzt; die
    alten Dateien bleiben als ``.bak`` liegen.
    """
    speicher = daten / ".storage"
    garten = _beispielgarten()
    _speichern(speicher / "irrigation_planner", "irrigation_planner", garten, neu)
    _speichern(
        speicher / "irrigation_planner.balance",
        "irrigation_planner.balance",
        _wasserhaushalt(),
        neu,
    )
    _speichern(
        speicher / "irrigation_planner.history",
        "irrigation_planner.history",
        _verlauf(garten),
        neu,
    )


def main() -> None:
    """Richtet den Datenordner ein und startet Home Assistant."""
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--daten", type=Path, default=REPO.parent / "testinstanz-daten")
    parser.add_argument("--port", type=int, default=8123)
    parser.add_argument(
        "--oeffnen", action="store_true", help="danach den Browser öffnen"
    )
    parser.add_argument(
        "--beispiel-neu",
        action="store_true",
        help="Beispielgarten neu anlegen (eigener Garten wird als .bak gesichert)",
    )
    args = parser.parse_args()

    daten: Path = args.daten.resolve()
    if daten.is_relative_to(REPO):
        sys.exit("Der Datenordner darf nicht im Repo liegen")
    (daten / "custom_components").mkdir(parents=True, exist_ok=True)
    shutil.copy(HIER / "config" / "configuration.yaml", daten / "configuration.yaml")
    with (daten / "configuration.yaml").open("a") as datei:
        datei.write(f"\nhttp:\n  server_port: {args.port}\n")
    links = {
        "irrigation_planner": REPO / "custom_components" / "irrigation_planner",
        "irrigation_sim": HIER / "custom_components" / "irrigation_sim",
    }
    for name, ziel in links.items():
        link = daten / "custom_components" / name
        if link.is_symlink() or link.exists():
            link.unlink()
        link.symlink_to(ziel)
    _garten_anlegen(daten, neu=args.beispiel_neu)

    with (daten / "start.log").open("w") as log:
        prozess = subprocess.Popen(
            [sys.executable, "-m", "homeassistant", "-c", str(daten), "--skip-pip"],
            stdout=log,
            stderr=subprocess.STDOUT,
            # Nicht im Repo starten: Sonst findet Python dort ein anderes
            # custom_components-Paket (ohne den Simulator).
            cwd=daten,
        )
    basis = f"http://127.0.0.1:{args.port}"
    try:
        _warten(basis, prozess)
        _einrichten(basis, daten)
    except BaseException:
        prozess.terminate()
        raise
    print(f"Testinstanz läuft: {basis}")
    print(f"Zugang: {daten / 'zugang.txt'}")
    print((daten / "zugang.txt").read_text().strip())
    print("Beenden mit Ctrl+C.")
    if args.oeffnen:
        webbrowser.open(basis)
    try:
        prozess.wait()
    except KeyboardInterrupt:
        prozess.terminate()


if __name__ == "__main__":
    main()
