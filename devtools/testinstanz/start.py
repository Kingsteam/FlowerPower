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
import json
from pathlib import Path
import secrets
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

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


def main() -> None:
    """Richtet den Datenordner ein und startet Home Assistant."""
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--daten", type=Path, default=REPO.parent / "testinstanz-daten")
    parser.add_argument("--port", type=int, default=8123)
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
    try:
        prozess.wait()
    except KeyboardInterrupt:
        prozess.terminate()


if __name__ == "__main__":
    main()
