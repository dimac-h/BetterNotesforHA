"""Storage handler for Better Notes."""
from __future__ import annotations

import logging
from typing import Any
import uuid

from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util

from .const import (
    ATTR_NOTE_ID,
    ATTR_TITLE,
    ATTR_CONTENT,
    ATTR_COLOR,
    ATTR_PINNED,
    ATTR_CREATED,
    ATTR_MODIFIED,
    ATTR_TAGS,
    DEFAULT_COLOR,
    STORAGE_KEY,
    STORAGE_VERSION,
)

_LOGGER = logging.getLogger(__name__)


class NotesStorage:
    """Handle storage for notes."""

    def __init__(self, hass: HomeAssistant) -> None:
        """Initialize the storage handler."""
        self.hass = hass
        self._store = Store(hass, STORAGE_VERSION, STORAGE_KEY)
        self._data: dict[str, dict[str, Any]] = {}

    async def async_load(self) -> None:
        """Load notes from storage."""
        data = await self._store.async_load()
        if data is not None:
            self._data = data.get("notes", {})
        else:
            self._data = {}
        _LOGGER.debug("Loaded %d notes from storage", len(self._data))

    async def async_save(self) -> None:
        """Save notes to storage."""
        await self._store.async_save({"notes": self._data})
        _LOGGER.debug("Saved %d notes to storage", len(self._data))

    async def async_create_note(
        self,
        title: str,
        content: str = "",
        color: str = DEFAULT_COLOR,
        pinned: bool = False,
        tags: list[str] | None = None,
    ) -> dict[str, Any]:
        """Create a new note."""
        note_id = str(uuid.uuid4())
        now = dt_util.utcnow().isoformat()

        note = {
            ATTR_NOTE_ID: note_id,
            ATTR_TITLE: title,
            ATTR_CONTENT: content,
            ATTR_COLOR: color,
            ATTR_PINNED: pinned,
            ATTR_CREATED: now,
            ATTR_MODIFIED: now,
            ATTR_TAGS: tags or [],
        }

        self._data[note_id] = note
        await self.async_save()

        _LOGGER.info("Created note: %s", title)
        return note

    async def async_update_note(
        self,
        note_id: str,
        title: str | None = None,
        content: str | None = None,
        color: str | None = None,
        pinned: bool | None = None,
        tags: list[str] | None = None,
    ) -> dict[str, Any] | None:
        """Update an existing note."""
        if note_id not in self._data:
            _LOGGER.error("Note not found: %s", note_id)
            return None

        note = self._data[note_id]

        if title is not None:
            note[ATTR_TITLE] = title
        if content is not None:
            note[ATTR_CONTENT] = content
        if color is not None:
            note[ATTR_COLOR] = color
        if pinned is not None:
            note[ATTR_PINNED] = pinned
        if tags is not None:
            note[ATTR_TAGS] = tags

        note[ATTR_MODIFIED] = dt_util.utcnow().isoformat()

        await self.async_save()

        _LOGGER.info("Updated note: %s", note_id)
        return note

    async def async_delete_note(self, note_id: str) -> bool:
        """Delete a note."""
        if note_id not in self._data:
            _LOGGER.error("Note not found: %s", note_id)
            return False

        del self._data[note_id]
        await self.async_save()

        _LOGGER.info("Deleted note: %s", note_id)
        return True

    async def async_get_note(self, note_id: str) -> dict[str, Any] | None:
        """Get a specific note."""
        return self._data.get(note_id)

    async def async_get_all_notes(self) -> list[dict[str, Any]]:
        """Get all notes."""
        notes = list(self._data.values())
        # Sort by pinned first, then by modified date (newest first)
        notes.sort(
            key=lambda x: (not x.get(ATTR_PINNED, False), x.get(ATTR_MODIFIED, "")),
            reverse=True
        )
        return notes
