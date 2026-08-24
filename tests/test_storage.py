"""Tests for NotesStorage."""
from __future__ import annotations

import asyncio
from typing import TYPE_CHECKING

import pytest

from custom_components.better_notes.storage import NotesStorage

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant


@pytest.fixture
async def storage(hass: HomeAssistant) -> NotesStorage:
    s = NotesStorage(hass)
    await s.async_load()
    return s


async def test_create_note_defaults(storage: NotesStorage) -> None:
    note = await storage.async_create_note(title="Groceries")
    assert note["title"] == "Groceries"
    assert note["content"] == ""
    assert note["color"] == "#FFEB3B"
    assert note["pinned"] is False
    assert note["tags"] == []
    assert note["note_id"]
    assert note["created"] == note["modified"]


async def test_create_note_persists_across_instances(hass: HomeAssistant, storage: NotesStorage) -> None:
    note = await storage.async_create_note(title="Groceries")
    reloaded = NotesStorage(hass)
    await reloaded.async_load()
    notes = await reloaded.async_get_all_notes()
    assert [n["note_id"] for n in notes] == [note["note_id"]]


async def test_create_note_timestamps_are_utc_iso(storage: NotesStorage) -> None:
    """Created note timestamps must be UTC ISO strings (ends with +00:00 or Z)."""
    note = await storage.async_create_note(title="Test")
    assert note["created"].endswith("+00:00") or note["created"].endswith("Z"), (
        f"Expected UTC timestamp, got: {note['created']}"
    )
    assert note["modified"].endswith("+00:00") or note["modified"].endswith("Z")


async def test_update_note_changes_requested_fields(storage: NotesStorage) -> None:
    note = await storage.async_create_note(title="Old title")
    updated = await storage.async_update_note(note["note_id"], title="New title", pinned=True)
    assert updated is not None
    assert updated["title"] == "New title"
    assert updated["pinned"] is True
    assert updated["created"] == note["created"]
    assert updated["modified"] >= note["created"]


async def test_update_note_modified_timestamp_is_utc(storage: NotesStorage) -> None:
    """Updated note modified timestamp must be UTC."""
    note = await storage.async_create_note(title="Test")
    updated = await storage.async_update_note(note["note_id"], title="New")
    assert updated is not None
    assert updated["modified"].endswith("+00:00") or updated["modified"].endswith("Z")


async def test_update_note_partial_leaves_other_fields_untouched(storage: NotesStorage) -> None:
    note = await storage.async_create_note(title="Title", content="Body", color="#123456", tags=["a"])
    updated = await storage.async_update_note(note["note_id"], pinned=True)
    assert updated is not None
    assert updated["title"] == "Title"
    assert updated["content"] == "Body"
    assert updated["color"] == "#123456"
    assert updated["tags"] == ["a"]
    assert updated["pinned"] is True


async def test_update_note_missing_returns_none(storage: NotesStorage) -> None:
    assert await storage.async_update_note("does-not-exist", title="x") is None


async def test_delete_note(storage: NotesStorage) -> None:
    note = await storage.async_create_note(title="Temp")
    assert await storage.async_delete_note(note["note_id"]) is True
    assert await storage.async_get_all_notes() == []


async def test_delete_note_missing_returns_false(storage: NotesStorage) -> None:
    assert await storage.async_delete_note("does-not-exist") is False


async def test_get_all_notes_sorted_pinned_first_then_modified_desc(storage: NotesStorage) -> None:
    note_a = await storage.async_create_note(title="A")
    note_b = await storage.async_create_note(title="B")
    note_c = await storage.async_create_note(title="C")
    await storage.async_update_note(note_a["note_id"], pinned=True)

    notes = await storage.async_get_all_notes()
    assert notes[0]["note_id"] == note_a["note_id"]
    remaining_ids = [n["note_id"] for n in notes[1:]]
    assert remaining_ids == [note_c["note_id"], note_b["note_id"]]


async def test_sort_after_update_moves_note_up(storage: NotesStorage) -> None:
    """Updating an older note's title bumps its modified time, moving it first."""
    old_note = await storage.async_create_note(title="Old")
    await asyncio.sleep(0.01)
    _new_note = await storage.async_create_note(title="New")
    await asyncio.sleep(0.01)
    # Touch the old note — it should now sort first
    await storage.async_update_note(old_note["note_id"], title="Updated Old")
    notes = await storage.async_get_all_notes()
    assert notes[0]["note_id"] == old_note["note_id"]


async def test_newest_note_is_at_index_zero(storage: NotesStorage) -> None:
    """After create, async_get_all_notes()[0] is the most recently modified note.

    This validates the _createNote fallback in better-notes-panel.js:
    the panel falls back to this._notes[0] when the timestamp-based lookup
    fails — which must be the newest note, not this._notes[last]. Even though
    this integration's frontend has since moved on from that vanilla-JS panel,
    the invariant it protects — notes[0] is always the newest — still matters
    regardless of which frontend reads it.
    """
    await storage.async_create_note(title="First")
    await asyncio.sleep(0.01)
    latest = await storage.async_create_note(title="Latest")
    notes = await storage.async_get_all_notes()
    assert notes[0]["note_id"] == latest["note_id"], (
        "notes[0] must be the newest note; panel fallback relies on this"
    )
