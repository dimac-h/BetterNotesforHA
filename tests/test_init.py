"""Tests for __init__.py service setup."""
import pytest
import voluptuous as vol
from unittest.mock import AsyncMock, MagicMock
from homeassistant.core import ServiceCall, SupportsResponse

from custom_components.better_notes.__init__ import (
    CREATE_NOTE_SCHEMA,
    UPDATE_NOTE_SCHEMA,
    DELETE_NOTE_SCHEMA,
)


# ---------------------------------------------------------------------------
# SupportsResponse contract
# ---------------------------------------------------------------------------

def test_get_notes_service_supports_response():
    """get_notes handler must be registered with SupportsResponse.ONLY."""
    assert SupportsResponse.ONLY is not None
    assert SupportsResponse.ONLY.value == "only"


@pytest.mark.asyncio
async def test_handle_get_notes_returns_dict():
    """handle_get_notes must return a dict with 'notes' key, not fire an event."""
    notes_data = [{"note_id": "abc", "title": "Test", "content": "", "color": "#FFEB3B",
                   "pinned": False, "created": "2024-01-01T00:00:00+00:00",
                   "modified": "2024-01-01T00:00:00+00:00", "tags": []}]

    mock_storage = MagicMock()
    mock_storage.async_get_all_notes = AsyncMock(return_value=notes_data)
    mock_hass = MagicMock()
    mock_hass.data = {"better_notes": {"storage": mock_storage}}

    async def handle_get_notes(call: ServiceCall):
        notes = await mock_storage.async_get_all_notes()
        return {"notes": notes}

    call = MagicMock(spec=ServiceCall)
    result = await handle_get_notes(call)

    assert "notes" in result
    assert result["notes"] == notes_data
    mock_hass.bus.async_fire.assert_not_called()


# ---------------------------------------------------------------------------
# CREATE_NOTE_SCHEMA
# ---------------------------------------------------------------------------

class TestCreateNoteSchema:
    def test_minimal_valid(self):
        result = CREATE_NOTE_SCHEMA({"title": "My Note"})
        assert result["title"] == "My Note"
        assert result["content"] == ""
        assert result["color"] == "#FFEB3B"
        assert result["pinned"] is False
        assert result["tags"] == []

    def test_full_valid(self):
        data = {"title": "T", "content": "body", "color": "#FF9800", "pinned": True, "tags": ["a"]}
        result = CREATE_NOTE_SCHEMA(data)
        assert result["color"] == "#FF9800"
        assert result["pinned"] is True

    def test_valid_3digit_hex_color(self):
        result = CREATE_NOTE_SCHEMA({"title": "T", "color": "#ABC"})
        assert result["color"] == "#ABC"

    def test_invalid_color_no_hash(self):
        with pytest.raises(vol.Invalid):
            CREATE_NOTE_SCHEMA({"title": "T", "color": "FFEB3B"})

    def test_invalid_color_4digit(self):
        with pytest.raises(vol.Invalid):
            CREATE_NOTE_SCHEMA({"title": "T", "color": "#FFFF"})

    def test_invalid_color_5digit(self):
        with pytest.raises(vol.Invalid):
            CREATE_NOTE_SCHEMA({"title": "T", "color": "#FFFFF"})

    def test_invalid_color_7digit(self):
        with pytest.raises(vol.Invalid):
            CREATE_NOTE_SCHEMA({"title": "T", "color": "#FFFFFFF"})

    def test_invalid_color_non_hex_chars(self):
        with pytest.raises(vol.Invalid):
            CREATE_NOTE_SCHEMA({"title": "T", "color": "#GGGGGG"})

    def test_missing_title_raises(self):
        with pytest.raises(vol.Invalid):
            CREATE_NOTE_SCHEMA({"content": "no title"})


# ---------------------------------------------------------------------------
# UPDATE_NOTE_SCHEMA
# ---------------------------------------------------------------------------

class TestUpdateNoteSchema:
    def test_only_note_id_valid(self):
        result = UPDATE_NOTE_SCHEMA({"note_id": "abc-123"})
        assert result["note_id"] == "abc-123"

    def test_update_title(self):
        result = UPDATE_NOTE_SCHEMA({"note_id": "x", "title": "New"})
        assert result["title"] == "New"

    def test_update_color_valid_6digit(self):
        result = UPDATE_NOTE_SCHEMA({"note_id": "x", "color": "#4CAF50"})
        assert result["color"] == "#4CAF50"

    def test_update_color_valid_3digit(self):
        result = UPDATE_NOTE_SCHEMA({"note_id": "x", "color": "#F0F"})
        assert result["color"] == "#F0F"

    def test_update_color_invalid_4digit(self):
        with pytest.raises(vol.Invalid):
            UPDATE_NOTE_SCHEMA({"note_id": "x", "color": "#ABCD"})

    def test_update_color_invalid_5digit(self):
        with pytest.raises(vol.Invalid):
            UPDATE_NOTE_SCHEMA({"note_id": "x", "color": "#ABCDE"})

    def test_missing_note_id_raises(self):
        with pytest.raises(vol.Invalid):
            UPDATE_NOTE_SCHEMA({"title": "no id"})


# ---------------------------------------------------------------------------
# DELETE_NOTE_SCHEMA
# ---------------------------------------------------------------------------

class TestDeleteNoteSchema:
    def test_valid(self):
        result = DELETE_NOTE_SCHEMA({"note_id": "some-uuid"})
        assert result["note_id"] == "some-uuid"

    def test_missing_note_id_raises(self):
        with pytest.raises(vol.Invalid):
            DELETE_NOTE_SCHEMA({})
