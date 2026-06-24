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


@pytest.mark.asyncio
async def test_create_note_timestamps_are_utc_iso(mock_hass, mock_store):
    """Created note timestamps must be UTC ISO strings (ends with +00:00 or Z)."""
    with patch(
        "custom_components.better_notes.storage.Store", return_value=mock_store
    ):
        storage = NotesStorage(mock_hass)
        await storage.async_load()
        note = await storage.async_create_note(title="Test")

    # dt_util.utcnow() produces timezone-aware datetimes; .isoformat() includes offset
    assert note["created"].endswith("+00:00") or note["created"].endswith("Z"), (
        f"Expected UTC timestamp, got: {note['created']}"
    )
    assert note["modified"].endswith("+00:00") or note["modified"].endswith("Z")


@pytest.mark.asyncio
async def test_update_note_modified_timestamp_is_utc(mock_hass, mock_store):
    """Updated note modified timestamp must be UTC."""
    with patch(
        "custom_components.better_notes.storage.Store", return_value=mock_store
    ):
        storage = NotesStorage(mock_hass)
        await storage.async_load()
        note = await storage.async_create_note(title="Test")
        updated = await storage.async_update_note(note_id=note["note_id"], title="New")

    assert updated["modified"].endswith("+00:00") or updated["modified"].endswith("Z")
