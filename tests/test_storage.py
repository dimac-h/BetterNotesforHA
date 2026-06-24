"""Tests for NotesStorage."""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from custom_components.better_notes.storage import NotesStorage


@pytest.fixture
def mock_hass():
    hass = MagicMock()
    hass.config.path = lambda *args: "/config/" + "/".join(args)
    return hass


@pytest.fixture
def mock_store():
    store = MagicMock()
    store.async_load = AsyncMock(return_value=None)
    store.async_save = AsyncMock()
    return store


@pytest.fixture
async def storage(mock_hass, mock_store):
    with patch("custom_components.better_notes.storage.Store", return_value=mock_store):
        s = NotesStorage(mock_hass)
        await s.async_load()
        return s


# ---------------------------------------------------------------------------
# Timestamps
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_create_note_timestamps_are_utc_iso(mock_hass, mock_store):
    """Created note timestamps must be UTC ISO strings (ends with +00:00 or Z)."""
    with patch("custom_components.better_notes.storage.Store", return_value=mock_store):
        s = NotesStorage(mock_hass)
        await s.async_load()
        note = await s.async_create_note(title="Test")

    assert note["created"].endswith("+00:00") or note["created"].endswith("Z"), (
        f"Expected UTC timestamp, got: {note['created']}"
    )
    assert note["modified"].endswith("+00:00") or note["modified"].endswith("Z")


@pytest.mark.asyncio
async def test_update_note_modified_timestamp_is_utc(mock_hass, mock_store):
    """Updated note modified timestamp must be UTC."""
    with patch("custom_components.better_notes.storage.Store", return_value=mock_store):
        s = NotesStorage(mock_hass)
        await s.async_load()
        note = await s.async_create_note(title="Test")
        updated = await s.async_update_note(note_id=note["note_id"], title="New")

    assert updated["modified"].endswith("+00:00") or updated["modified"].endswith("Z")


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_create_note_returns_full_schema(storage):
    note = await storage.async_create_note(title="Hello", content="World")
    assert note["title"] == "Hello"
    assert note["content"] == "World"
    assert "note_id" in note
    assert "created" in note
    assert "modified" in note
    assert note["pinned"] is False
    assert note["tags"] == []


@pytest.mark.asyncio
async def test_create_note_defaults(storage):
    note = await storage.async_create_note(title="Minimal")
    assert note["content"] == ""
    assert note["color"] == "#FFEB3B"
    assert note["pinned"] is False
    assert note["tags"] == []


@pytest.mark.asyncio
async def test_create_note_persists(storage):
    await storage.async_create_note(title="A")
    notes = await storage.async_get_all_notes()
    assert len(notes) == 1
    assert notes[0]["title"] == "A"


@pytest.mark.asyncio
async def test_create_multiple_notes_all_stored(storage):
    await storage.async_create_note(title="First")
    await storage.async_create_note(title="Second")
    notes = await storage.async_get_all_notes()
    assert len(notes) == 2


# ---------------------------------------------------------------------------
# Update
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_update_note_title(storage):
    note = await storage.async_create_note(title="Old")
    updated = await storage.async_update_note(note_id=note["note_id"], title="New")
    assert updated["title"] == "New"


@pytest.mark.asyncio
async def test_update_note_partial_preserves_other_fields(storage):
    note = await storage.async_create_note(title="Keep", content="body", color="#FF9800")
    updated = await storage.async_update_note(note_id=note["note_id"], title="Changed")
    assert updated["content"] == "body"
    assert updated["color"] == "#FF9800"


@pytest.mark.asyncio
async def test_update_nonexistent_note_returns_none(storage):
    result = await storage.async_update_note(note_id="does-not-exist", title="X")
    assert result is None


@pytest.mark.asyncio
async def test_update_note_modified_changes(storage):
    import asyncio
    note = await storage.async_create_note(title="T")
    original_modified = note["modified"]
    await asyncio.sleep(0.01)
    updated = await storage.async_update_note(note_id=note["note_id"], title="T2")
    assert updated["modified"] >= original_modified


# ---------------------------------------------------------------------------
# Delete
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_delete_note_returns_true(storage):
    note = await storage.async_create_note(title="Bye")
    result = await storage.async_delete_note(note["note_id"])
    assert result is True


@pytest.mark.asyncio
async def test_delete_note_removes_from_storage(storage):
    note = await storage.async_create_note(title="Gone")
    await storage.async_delete_note(note["note_id"])
    notes = await storage.async_get_all_notes()
    assert all(n["note_id"] != note["note_id"] for n in notes)


@pytest.mark.asyncio
async def test_delete_nonexistent_note_returns_false(storage):
    result = await storage.async_delete_note("no-such-id")
    assert result is False


# ---------------------------------------------------------------------------
# Sort order — pinned-first, then modified descending
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_sort_pinned_first(storage):
    """Pinned notes must appear before unpinned notes regardless of creation order."""
    import asyncio
    unpinned = await storage.async_create_note(title="Unpinned", pinned=False)
    await asyncio.sleep(0.01)
    pinned = await storage.async_create_note(title="Pinned", pinned=True)
    notes = await storage.async_get_all_notes()
    assert notes[0]["note_id"] == pinned["note_id"]
    assert notes[1]["note_id"] == unpinned["note_id"]


@pytest.mark.asyncio
async def test_sort_unpinned_by_modified_desc(storage):
    """Among unpinned notes, most-recently-modified appears first."""
    import asyncio
    older = await storage.async_create_note(title="Older")
    await asyncio.sleep(0.01)
    newer = await storage.async_create_note(title="Newer")
    notes = await storage.async_get_all_notes()
    ids = [n["note_id"] for n in notes]
    assert ids.index(newer["note_id"]) < ids.index(older["note_id"])


@pytest.mark.asyncio
async def test_sort_after_update_moves_note_up(storage):
    """Updating an older note's title bumps its modified time, moving it first."""
    import asyncio
    old_note = await storage.async_create_note(title="Old")
    await asyncio.sleep(0.01)
    _new_note = await storage.async_create_note(title="New")
    await asyncio.sleep(0.01)
    # Touch the old note — it should now sort first
    await storage.async_update_note(note_id=old_note["note_id"], title="Updated Old")
    notes = await storage.async_get_all_notes()
    assert notes[0]["note_id"] == old_note["note_id"]


# ---------------------------------------------------------------------------
# _createNote fallback: newest note is at index 0 after sort
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_newest_note_is_at_index_zero(storage):
    """After create, async_get_all_notes()[0] is the most recently modified note.

    This validates the _createNote fallback in better-notes-panel.js:
    the panel falls back to this._notes[0] when the timestamp-based lookup
    fails — which must be the newest note, not this._notes[last].
    """
    import asyncio
    await storage.async_create_note(title="First")
    await asyncio.sleep(0.01)
    latest = await storage.async_create_note(title="Latest")
    notes = await storage.async_get_all_notes()
    assert notes[0]["note_id"] == latest["note_id"], (
        "notes[0] must be the newest note; panel fallback relies on this"
    )
