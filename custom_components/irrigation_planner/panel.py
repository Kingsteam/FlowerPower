"""Panel „Bewässerung“ in der Seitenleiste und Hintergrundbilder.

Das Panel ist fertig gebautes JavaScript aus ``frontend/`` (Quelltext in
``frontend-src/``). Hochgeladene Hintergrundbilder liegen im Konfigurations-
ordner unter ``irrigation_planner/`` und werden nur angemeldeten Benutzern
ausgeliefert. Erlaubt sind PNG, JPEG und WebP (kein SVG: Das könnte Skripte
enthalten).
"""

from __future__ import annotations

from http import HTTPStatus
from pathlib import Path
import re
import secrets

from aiohttp import web
from homeassistant.components import frontend, panel_custom
from homeassistant.components.http import HomeAssistantView, StaticPathConfig
from homeassistant.core import HomeAssistant

from .const import DOMAIN, LOGGER

PANEL_URL = "bewaesserung"
STATIC_URL = f"/{DOMAIN}_static"
FRONTEND_DIR = Path(__file__).parent / "frontend"
PANEL_FILE = "irrigation-planner-panel.js"
IMAGE_DIR = DOMAIN
MAX_IMAGE_BYTES = 15 * 1024 * 1024
IMAGE_TYPES = {"image/png": "png", "image/jpeg": "jpg", "image/webp": "webp"}
IMAGE_NAME = re.compile(r"^plan-[0-9a-f]{16}\.(png|jpg|webp)$")
_REGISTERED = f"{DOMAIN}_static_registered"


def image_dir(hass: HomeAssistant) -> Path:
    """Ordner für Hintergrundbilder."""
    return Path(hass.config.path(IMAGE_DIR))


async def async_register_panel(hass: HomeAssistant) -> None:
    """Statische Dateien, Bild-Ansichten und Panel anmelden."""
    if not hass.data.get(_REGISTERED):
        hass.data[_REGISTERED] = True
        await hass.http.async_register_static_paths(
            [StaticPathConfig(STATIC_URL, str(FRONTEND_DIR), cache_headers=False)]
        )
        hass.http.register_view(ImageUploadView())
        hass.http.register_view(ImageView())
    if PANEL_URL in hass.data.get(frontend.DATA_PANELS, {}):
        return
    version = await hass.async_add_executor_job(_file_version)
    await panel_custom.async_register_panel(
        hass,
        frontend_url_path=PANEL_URL,
        webcomponent_name="irrigation-planner-panel",
        sidebar_title="Bewässerung",
        sidebar_icon="mdi:sprinkler-variant",
        module_url=f"{STATIC_URL}/{PANEL_FILE}?v={version}",
        require_admin=False,
        config={},
    )


def _file_version() -> str:
    try:
        return str(int((FRONTEND_DIR / PANEL_FILE).stat().st_mtime))
    except OSError:
        LOGGER.warning("Panel-Datei fehlt: %s", FRONTEND_DIR / PANEL_FILE)
        return "0"


def async_remove_panel(hass: HomeAssistant) -> None:
    """Panel entfernen (beim Entladen)."""
    if PANEL_URL in hass.data.get(frontend.DATA_PANELS, {}):
        frontend.async_remove_panel(hass, PANEL_URL)


class ImageUploadView(HomeAssistantView):
    """Hintergrundbild hochladen (nur Admin)."""

    url = f"/api/{DOMAIN}/image"
    name = f"api:{DOMAIN}:image_upload"

    async def post(self, request: web.Request) -> web.Response:
        """Speichert das Bild und gibt seinen Namen zurück."""
        if not request["hass_user"].is_admin:
            return self.json_message("Nur für Admins", HTTPStatus.UNAUTHORIZED)
        hass: HomeAssistant = request.app["hass"]
        reader = await request.multipart()
        part = await reader.next()
        if part is None or getattr(part, "name", None) != "file":
            return self.json_message("Datei fehlt", HTTPStatus.BAD_REQUEST)
        suffix = IMAGE_TYPES.get(part.headers.get("Content-Type", ""))  # type: ignore[union-attr]
        if suffix is None:
            return self.json_message(
                "Nur PNG, JPEG oder WebP", HTTPStatus.UNSUPPORTED_MEDIA_TYPE
            )
        content = bytearray()
        while chunk := await part.read_chunk():  # type: ignore[union-attr]
            content += chunk
            if len(content) > MAX_IMAGE_BYTES:
                return self.json_message(
                    "Bild ist zu groß (höchstens 15 MB)",
                    HTTPStatus.REQUEST_ENTITY_TOO_LARGE,
                )
        name = f"plan-{secrets.token_hex(8)}.{suffix}"
        await hass.async_add_executor_job(_write, image_dir(hass), name, bytes(content))
        return self.json({"name": name})


def _write(folder: Path, name: str, content: bytes) -> None:
    folder.mkdir(parents=True, exist_ok=True)
    (folder / name).write_bytes(content)


class ImageView(HomeAssistantView):
    """Hintergrundbild ausliefern (angemeldete Benutzer)."""

    url = f"/api/{DOMAIN}/image/{{name}}"
    name = f"api:{DOMAIN}:image"

    async def get(self, request: web.Request, name: str) -> web.StreamResponse:
        """Liefert das Bild."""
        if not IMAGE_NAME.match(name):
            return self.json_message("Unbekanntes Bild", HTTPStatus.NOT_FOUND)
        path = image_dir(request.app["hass"]) / name
        if not path.is_file():
            return self.json_message("Unbekanntes Bild", HTTPStatus.NOT_FOUND)
        return web.FileResponse(path)
