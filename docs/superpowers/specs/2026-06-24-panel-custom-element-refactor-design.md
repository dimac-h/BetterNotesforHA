---
name: panel-custom-element-refactor
description: Refactor iframe panel to native HA custom element panel for proper auth and mobile-first layout
metadata:
  type: project
---

# Better Notes Panel: Custom Element Refactor

## Goal

Replace the `iframe` panel (`better-notes-panel.html`) with a native HA `panel_custom` element (`better-notes-panel.js`). This eliminates all manual token handling and makes the panel work correctly on the HA mobile app. The layout is redesigned to be mobile-first with a responsive two-column view on desktop.

## Backend Changes (`__init__.py`)

Replace `async_register_built_in_panel` (iframe) with `async_register_custom_panel`:

```python
hass.components.frontend.async_register_custom_panel(
    component_name="better-notes-panel",
    sidebar_title=PANEL_TITLE,
    sidebar_icon=PANEL_ICON,
    frontend_url_path=PANEL_URL,
    module_url="/better_notes_panel/better-notes-panel.js",
    require_admin=False,
)
```

The static path registration (`/better_notes_panel` → `www/`) stays unchanged. The HTML file is deleted and replaced by the JS file.

## Frontend: `better-notes-panel.js`

A single JS module file. No bundler, no framework — vanilla JS custom element.

### Custom Element Shell

```js
class BetterNotesPanel extends HTMLElement {
  set hass(hass) {
    this._hass = hass;
    if (!this._initialized) {
      this._initialized = true;
      this._loadNotes();
      this._subscribeToEvents();
    }
  }
}
customElements.define('better-notes-panel', BetterNotesPanel);
```

HA calls `set hass(hass)` each time the hass object updates. The `_initialized` guard ensures setup runs only once.

### Service Calls

All service calls use `this._hass.callService` — no fetch, no token, no auth handling:

```js
// get_notes must use return_response: true (SupportsResponse.ONLY)
const result = await this._hass.callService(
  'better_notes', 'get_notes', {}, { return_response: true }
);

// Mutations need no return_response
await this._hass.callService('better_notes', 'create_note', { title, content, color, pinned });
await this._hass.callService('better_notes', 'update_note', { note_id, title, content, color, pinned });
await this._hass.callService('better_notes', 'delete_note', { note_id });
```

### Live Updates

Subscribe to HA bus events on init to reload notes whenever any mutation fires:

```js
const events = ['better_notes_note_created', 'better_notes_note_updated', 'better_notes_note_deleted'];
events.forEach(e => this._hass.connection.subscribeEvents(() => this._loadNotes(), e));
```

This keeps the panel in sync with the card and any automations that mutate notes.

### State

| Property | Type | Description |
|---|---|---|
| `_hass` | object | HA hass instance |
| `_notes` | array | All notes, sorted pinned-first then by modified desc |
| `_currentNoteId` | string\|null | ID of selected note |
| `_view` | `'list'`\|`'editor'` | Active view (mobile only, desktop shows both) |
| `_searchTerm` | string | Current search filter |
| `_initialized` | boolean | Guard for one-time setup |

### Rendering

Re-render the shadow DOM on any state change. The root template contains both `.panel-list` and `.panel-editor` divs; CSS controls visibility per breakpoint.

```js
_render() {
  this.shadowRoot.innerHTML = `<style>${CSS}</style>${HTML}`;
  this._attachListeners();
}
```

## Layout

### Mobile (default, `< 768px`)

- Single column, full width
- `_view === 'list'`: show `.panel-list`, hide `.panel-editor`
- `_view === 'editor'`: hide `.panel-list`, show `.panel-editor`
- Editor has a `← Back` button in its header
- New Note button in the list header

### Desktop (`≥ 768px`)

- Two-column flex layout: `.panel-list` fixed at 280px, `.panel-editor` takes remaining width
- Both panels always visible; `_view` state ignored by CSS
- Back button hidden via CSS

### State Transitions

| Action | Result |
|---|---|
| Tap note in list | `_currentNoteId = id`, `_view = 'editor'`, re-render |
| Tap New Note | call `create_note`, reload, select new note, `_view = 'editor'` |
| Tap ← Back | `_view = 'list'`, re-render |
| Delete note | call `delete_note`, reload, `_currentNoteId = null`, `_view = 'list'` |
| Save note | call `update_note`, reload, re-select same note |
| Auto-save (1s debounce) | same as Save |

## Files Changed

| File | Change |
|---|---|
| `custom_components/better_notes/__init__.py` | Replace iframe panel registration with `async_register_custom_panel` |
| `custom_components/better_notes/www/better-notes-panel.js` | New file — custom element panel |
| `custom_components/better_notes/www/better-notes-panel.html` | Delete |

## What Does Not Change

- All Python services, storage, schemas, events — unchanged
- `better-notes-card.js` — unchanged
- HACS distribution files — unchanged
- Note data schema — unchanged
