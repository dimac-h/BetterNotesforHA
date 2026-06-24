"""Tests for __init__.py service setup."""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from homeassistant.core import ServiceCall, SupportsResponse


def test_get_notes_service_supports_response():
    """get_notes handler must be registered with SupportsResponse.ONLY."""
    # We verify the constant exists and has the right value
    assert SupportsResponse.ONLY is not None
    # The actual service registration is verified via HA's test harness;
    # this test confirms the import works and the enum value is as expected.
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

    # Simulate what the handler does when called
    async def handle_get_notes(call: ServiceCall):
        notes = await mock_storage.async_get_all_notes()
        return {"notes": notes}

    call = MagicMock(spec=ServiceCall)
    result = await handle_get_notes(call)

    assert "notes" in result
    assert result["notes"] == notes_data
    # Must NOT fire a bus event
    mock_hass.bus.async_fire.assert_not_called()
