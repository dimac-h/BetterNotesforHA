"""The Better Notes integration."""
from __future__ import annotations

import logging
import voluptuous as vol

from homeassistant.components.frontend import async_remove_panel
from homeassistant.components.panel_custom import async_register_panel
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, ServiceCall, SupportsResponse
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import config_validation as cv

from .const import (
    DOMAIN,
    SERVICE_CREATE_NOTE,
    SERVICE_UPDATE_NOTE,
    SERVICE_DELETE_NOTE,
    SERVICE_GET_NOTES,
    ATTR_NOTE_ID,
    ATTR_TITLE,
    ATTR_CONTENT,
    ATTR_COLOR,
    ATTR_PINNED,
    ATTR_TAGS,
    DEFAULT_COLOR,
    PANEL_TITLE,
    PANEL_ICON,
    PANEL_URL,
    PANEL_COMPONENT_NAME,
)
from .storage import NotesStorage

_LOGGER = logging.getLogger(__name__)

# Service schemas
CREATE_NOTE_SCHEMA = vol.Schema({
    vol.Required(ATTR_TITLE): cv.string,
    vol.Optional(ATTR_CONTENT, default=""): cv.string,
    vol.Optional(ATTR_COLOR, default=DEFAULT_COLOR): vol.Match(r'^#[0-9a-fA-F]{3}$|^#[0-9a-fA-F]{6}$'),
    vol.Optional(ATTR_PINNED, default=False): cv.boolean,
    vol.Optional(ATTR_TAGS, default=[]): [cv.string],
})

UPDATE_NOTE_SCHEMA = vol.Schema({
    vol.Required(ATTR_NOTE_ID): cv.string,
    vol.Optional(ATTR_TITLE): cv.string,
    vol.Optional(ATTR_CONTENT): cv.string,
    vol.Optional(ATTR_COLOR): vol.Match(r'^#[0-9a-fA-F]{3}$|^#[0-9a-fA-F]{6}$'),
    vol.Optional(ATTR_PINNED): cv.boolean,
    vol.Optional(ATTR_TAGS): [cv.string],
})

DELETE_NOTE_SCHEMA = vol.Schema({
    vol.Required(ATTR_NOTE_ID): cv.string,
})


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up Better Notes from a config entry."""
    hass.data.setdefault(DOMAIN, {})

    # Initialize storage
    storage = NotesStorage(hass)
    await storage.async_load()
    hass.data[DOMAIN]["storage"] = storage

    # Register frontend panel
    if not hass.data[DOMAIN].get("resources_registered"):
        await hass.http.async_register_static_paths([
            StaticPathConfig(
                url_path="/better_notes_panel",
                path=hass.config.path("custom_components/better_notes/www"),
                cache_headers=False,
            )
        ])
        hass.data[DOMAIN]["resources_registered"] = True

    await async_register_panel(
        hass,
        frontend_url_path=PANEL_URL,
        webcomponent_name=PANEL_COMPONENT_NAME,
        sidebar_title=PANEL_TITLE,
        sidebar_icon=PANEL_ICON,
        module_url="/better_notes_panel/better-notes-panel.js",
        embed_iframe=False,
        require_admin=False,
    )

    # Register services
    async def handle_create_note(call: ServiceCall) -> dict:
        """Handle the create note service."""
        note = await storage.async_create_note(
            title=call.data[ATTR_TITLE],
            content=call.data[ATTR_CONTENT],
            color=call.data[ATTR_COLOR],
            pinned=call.data[ATTR_PINNED],
            tags=call.data[ATTR_TAGS],
        )
        hass.bus.async_fire(f"{DOMAIN}_note_created", note)
        return note

    async def handle_update_note(call: ServiceCall) -> None:
        """Handle the update note service."""
        note = await storage.async_update_note(
            note_id=call.data[ATTR_NOTE_ID],
            title=call.data.get(ATTR_TITLE),
            content=call.data.get(ATTR_CONTENT),
            color=call.data.get(ATTR_COLOR),
            pinned=call.data.get(ATTR_PINNED),
            tags=call.data.get(ATTR_TAGS),
        )
        if note is None:
            raise HomeAssistantError(f"Note {call.data[ATTR_NOTE_ID]} not found")
        hass.bus.async_fire(f"{DOMAIN}_note_updated", note)

    async def handle_delete_note(call: ServiceCall) -> None:
        """Handle the delete note service."""
        success = await storage.async_delete_note(call.data[ATTR_NOTE_ID])
        if not success:
            raise HomeAssistantError(f"Note {call.data[ATTR_NOTE_ID]} not found")
        hass.bus.async_fire(
            f"{DOMAIN}_note_deleted",
            {ATTR_NOTE_ID: call.data[ATTR_NOTE_ID]}
        )

    async def handle_get_notes(call: ServiceCall) -> dict:
        """Handle the get notes service."""
        notes = await storage.async_get_all_notes()
        return {"notes": notes}

    hass.services.async_register(
        DOMAIN, SERVICE_CREATE_NOTE, handle_create_note,
        schema=CREATE_NOTE_SCHEMA,
        supports_response=SupportsResponse.OPTIONAL,
    )
    hass.services.async_register(
        DOMAIN, SERVICE_UPDATE_NOTE, handle_update_note, schema=UPDATE_NOTE_SCHEMA
    )
    hass.services.async_register(
        DOMAIN, SERVICE_DELETE_NOTE, handle_delete_note, schema=DELETE_NOTE_SCHEMA
    )
    hass.services.async_register(
        DOMAIN, SERVICE_GET_NOTES, handle_get_notes, supports_response=SupportsResponse.ONLY
    )

    _LOGGER.info("Better Notes integration setup complete")
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    # Remove services
    hass.services.async_remove(DOMAIN, SERVICE_CREATE_NOTE)
    hass.services.async_remove(DOMAIN, SERVICE_UPDATE_NOTE)
    hass.services.async_remove(DOMAIN, SERVICE_DELETE_NOTE)
    hass.services.async_remove(DOMAIN, SERVICE_GET_NOTES)

    # Remove panel
    async_remove_panel(hass, PANEL_URL)

    # Clear data
    hass.data.pop(DOMAIN, None)

    return True
