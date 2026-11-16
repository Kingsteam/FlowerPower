#!/bin/bash
# Testinstanz des Bewässerungsplaners auf dem eigenen Mac (oder Linux) starten.
#
# Aufruf im Terminal (eine Zeile):
#   curl -fsSL https://raw.githubusercontent.com/Kingsteam/FlowerPower/main/devtools/testinstanz/mac-start.sh | bash
#
# Was passiert:
# - Alles landet im Ordner ~/FlowerPower-Test (zum Entfernen einfach löschen).
# - uv (Python-Werkzeug) wird installiert, falls es fehlt; es lädt Python 3.14.
# - Der aktuelle Stand von GitHub wird heruntergeladen (jedes Mal neu).
# - Home Assistant startet komplett simuliert, ohne Verbindung zu echten Geräten.
# Beenden mit Ctrl+C. Beim nächsten Aufruf bleiben Benutzer und Garten erhalten.
set -euo pipefail

ZIEL="${FLOWERPOWER_TEST:-$HOME/FlowerPower-Test}"
QUELLE="${FLOWERPOWER_QUELLE:-https://github.com/Kingsteam/FlowerPower/archive/refs/heads/main.zip}"
mkdir -p "$ZIEL"
cd "$ZIEL"

export PATH="$HOME/.local/bin:$PATH"
if ! command -v uv >/dev/null 2>&1; then
  echo "==> Installiere uv (Python-Werkzeug) …"
  curl -LsSf https://astral.sh/uv/install.sh | sh
fi

echo "==> Lade den aktuellen Stand von GitHub …"
curl -fsSL "$QUELLE" -o code.zip
rm -rf code entpackt
unzip -q code.zip -d entpackt
mv entpackt/* code
rm -rf code.zip entpackt

if [ ! -d venv ]; then
  echo "==> Lege Python 3.14 an …"
  uv venv --python 3.14 venv
fi
echo "==> Installiere Home Assistant (beim ersten Mal 5–10 Minuten) …"
VIRTUAL_ENV="$ZIEL/venv" uv pip install --quiet \
  -r code/requirements_test.txt \
  -r code/devtools/testinstanz/requirements.txt

echo "==> Starte die Testinstanz (der erste Start dauert 1–2 Minuten) …"
exec "$ZIEL/venv/bin/python" code/devtools/testinstanz/start.py \
  --daten "$ZIEL/daten" --oeffnen
