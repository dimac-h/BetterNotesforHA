"""Tests for Better Notes setup, services, and events."""
from __future__ import annotations

from typing import TYPE_CHECKING

import pytest
import voluptuous as vol
from homeassistant.exceptions import HomeAssistantError

from custom_components.better_notes.__init__ import (
    CREATE_NOTE_SCHEMA,
    DELETE_NOTE_SCHEMA,
    UPDATE_NOTE_SCHEMA,
)
from custom_components.better_notes.const import DOMAIN

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant
    from pytest_homeassistant_custom_component.common import MockConfigEntry


async def test_setup_registers_all_services(hass: HomeAssistant, setup_integration: MockConfigEntry) -> None:
    assert hass.services.has_service(DOMAIN, "create_note")
    assert hass.services.has_service(DOMAIN, "update_note")
    assert hass.services.has_service(DOMAIN, "delete_note")
    assert hass.services.has_service(DOMAIN, "get_notes")


async def test_create_note_service_fires_event_and_returns_response(
    hass: HomeAssistant, setup_integration: MockConfigEntry
) -> None:
    events = []
    hass.bus.async_listen(f"{DOMAIN}_note_created", events.append)

    result = await hass.services.async_call(
        DOMAIN, "create_note", {"title": "Test note"}, blocking=True, return_response=True,
    )
    await hass.async_block_till_done()

    assert result["title"] == "Test note"
    assert len(events) == 1
    assert events[0].data["title"] == "Test note"


async def test_get_notes_service_returns_created_notes(
    hass: HomeAssistant, setup_integration: MockConfigEntry
) -> None:
    await hass.services.async_call(DOMAIN, "create_note", {"title": "A"}, blocking=True, return_response=True)
    result = await hass.services.async_call(DOMAIN, "get_notes", {}, blocking=True, return_response=True)
    assert [n["title"] for n in result["notes"]] == ["A"]


async def test_get_notes_service_does_not_fire_event(
    hass: HomeAssistant, setup_integration: MockConfigEntry
) -> None:
    """get_notes returns its result directly via SupportsResponse.ONLY and fires no bus event."""
    events = []
    hass.bus.async_listen(f"{DOMAIN}_notes_list", events.append)

    await hass.services.async_call(DOMAIN, "get_notes", {}, blocking=True, return_response=True)
    await hass.async_block_till_done()

    assert events == []


async def test_update_note_service_fires_event(hass: HomeAssistant, setup_integration: MockConfigEntry) -> None:
    created = await hass.services.async_call(
        DOMAIN, "create_note", {"title": "A"}, blocking=True, return_response=True,
    )
    events = []
    hass.bus.async_listen(f"{DOMAIN}_note_updated", events.append)

    await hass.services.async_call(
        DOMAIN, "update_note", {"note_id": created["note_id"], "title": "B"}, blocking=True,
    )
    await hass.async_block_till_done()

    assert events[0].data["title"] == "B"


async def test_update_note_service_missing_note_raises(
    hass: HomeAssistant, setup_integration: MockConfigEntry
) -> None:
    with pytest.raises(HomeAssistantError):
        await hass.services.async_call(
            DOMAIN, "update_note", {"note_id": "missing", "title": "B"}, blocking=True,
        )


async def test_delete_note_service_fires_event(hass: HomeAssistant, setup_integration: MockConfigEntry) -> None:
    created = await hass.services.async_call(
        DOMAIN, "create_note", {"title": "A"}, blocking=True, return_response=True,
    )
    events = []
    hass.bus.async_listen(f"{DOMAIN}_note_deleted", events.append)

    await hass.services.async_call(DOMAIN, "delete_note", {"note_id": created["note_id"]}, blocking=True)
    await hass.async_block_till_done()

    assert events[0].data["note_id"] == created["note_id"]


async def test_delete_note_service_missing_note_raises(
    hass: HomeAssistant, setup_integration: MockConfigEntry
) -> None:
    with pytest.raises(HomeAssistantError):
        await hass.services.async_call(DOMAIN, "delete_note", {"note_id": "missing"}, blocking=True)


async def test_unload_removes_services(hass: HomeAssistant, setup_integration: MockConfigEntry) -> None:
    assert await hass.config_entries.async_unload(setup_integration.entry_id)
    await hass.async_block_till_done()
    assert not hass.services.has_service(DOMAIN, "create_note")


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
