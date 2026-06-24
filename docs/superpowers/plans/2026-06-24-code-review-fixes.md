# Code Review Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Address all issues found in the application-wide code review: Python schema/logging fixes, CSS render optimisation (Option B), panel JS correctness fixes, panel UX improvements, and card JS fixes.

**Architecture:** Five independent tasks — Python layer first, then panel JS in three focused passes (render split, correctness, UX), then card JS. No new files; all changes are in-place edits to existing files.

**Tech Stack:** Python/voluptuous, vanilla JS custom elements, Home Assistant integration APIs.

## Global Constraints

- No build step, no bundler, no npm — vanilla JS only
- HA minimum version: 2024.1.0
- `get_notes` must be called with `return_response: true`
- Mutation services must NOT use `return_response`
- No test suite — verification is deploy-to-HA + browser console check
- Hex color validation regex: `/^#[0-9a-fA-F]{6}$|^#[0-9a-fA-F]{3}$/` (3 or 6 digits only — not 4 or 5)
- Default fallback color: `'#FFEB3B'`

---

## File Map

| File | Task(s) | Changes |
|---|---|---|
| `custom_components/better_notes/__init__.py` | 1 | Add hex color validation to `CREATE_NOTE_SCHEMA` and `UPDATE_NOTE_SCHEMA` |
| `custom_components/better_notes/storage.py` | 1 | Remove unused `async_get_note`; change `.error` → `.warning` for user-input errors |
| `custom_components/better_notes/services.yaml` | 1 | Fix `color` selector type; fix `get_notes` description |
| `custom_components/better_notes/www/better-notes-panel.js` | 2, 3, 4 | CSS/render split; correctness fixes; UX improvements |
| `custom_components/better_notes/www/better-notes-card.js` | 5 | Fix subscription leak; fix `CardEditor` shadow root |

---

### Task 1: Python and services.yaml fixes

**Files:**
- Modify: `custom_components/better_notes/__init__.py:36-51`
- Modify: `custom_components/better_notes/storage.py:115-129`
- Modify: `custom_components/better_notes/services.yaml`

**Interfaces:**
- Produces: `CREATE_NOTE_SCHEMA` and `UPDATE_NOTE_SCHEMA` reject non-hex-string colors at service call time

- [ ] **Step 1: Add hex color validation to both service schemas in `__init__.py`**

Find the schema definitions (lines 36–51). Change the `ATTR_COLOR` lines in both schemas:

```python
# CREATE_NOTE_SCHEMA — change:
vol.Optional(ATTR_COLOR, default=DEFAULT_COLOR): cv.string,
# to:
vol.Optional(ATTR_COLOR, default=DEFAULT_COLOR): vol.Match(r'^#[0-9a-fA-F]{3}$|^#[0-9a-fA-F]{6}$'),

# UPDATE_NOTE_SCHEMA — change:
vol.Optional(ATTR_COLOR): cv.string,
# to:
vol.Optional(ATTR_COLOR): vol.Match(r'^#[0-9a-fA-F]{3}$|^#[0-9a-fA-F]{6}$'),
```

The `vol` import is already present. No new imports needed.

- [ ] **Step 2: Fix log levels and remove dead code in `storage.py`**

In `async_update_note` (line 92) and `async_delete_note` (line 118), change `_LOGGER.error` to `_LOGGER.warning`:

```python
# async_update_note line 92 — change:
_LOGGER.error("Note not found: %s", note_id)
# to:
_LOGGER.warning("Note not found: %s", note_id)

# async_delete_note line 118 — change:
_LOGGER.error("Note not found: %s", note_id)
# to:
_LOGGER.warning("Note not found: %s", note_id)
```

Then delete the entire `async_get_note` method (lines 127–129 — the method is never called by any service):

```python
# DELETE this method entirely:
async def async_get_note(self, note_id: str) -> dict[str, Any] | None:
    """Get a specific note."""
    return self._data.get(note_id)
```

- [ ] **Step 3: Fix `services.yaml`**

Replace the `color` selector in both `create_note` and `update_note` from `color_rgb` (which returns an RGB tuple, not a hex string) to `text`, and update the `get_notes` description:

```yaml
# In create_note and update_note, change the color field selector from:
      selector:
        color_rgb:
# to:
      selector:
        text:

# Change the get_notes description from:
get_notes:
  name: Get Notes
  description: Get all notes (fires an event with the notes list)
# to:
get_notes:
  name: Get Notes
  description: Get all notes. Returns a response object with a "notes" array.
```

- [ ] **Step 4: Verify Python syntax**

```bash
python3 -m py_compile custom_components/better_notes/__init__.py && echo "OK"
python3 -m py_compile custom_components/better_notes/storage.py && echo "OK"
```

Expected: `OK` on both lines.

- [ ] **Step 5: Commit**

```bash
git add custom_components/better_notes/__init__.py custom_components/better_notes/storage.py custom_components/better_notes/services.yaml
git commit -m "fix: add color hex validation to schemas, fix log levels, fix services.yaml color selector"
```

---

### Task 2: Panel JS — split CSS from content (Option B)

**Files:**
- Modify: `custom_components/better_notes/www/better-notes-panel.js`

**Interfaces:**
- Produces: `_initStyles()` method that injects `<style>` and a `<div id="content">` into shadow root once; `_render()` updates only `#content` innerHTML

- [ ] **Step 1: Add `_disconnected` and `_saving` instance variables to constructor**

In the `constructor()`, add two new instance variables after `this._unsubscribeEvents = null;`:

```js
    this._disconnected = false;
    this._saving = false;
```

- [ ] **Step 2: Extract CSS into `_initStyles()` method**

Add a new method `_initStyles()` to the class. It must contain the full CSS that is currently embedded in `_render()`'s template literal, plus a new `.save-toast` rule needed by Task 4. Place this method just before `_render()`:

```js
  _initStyles() {
    const style = document.createElement('style');
    style.textContent = `
      :host {
        display: block;
        height: 100%;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        --accent: #2196F3;
        --accent-dark: #1976D2;
        --border: #e0e0e0;
        --bg: #fafafa;
        --text: #333;
        --text-muted: #666;
        --text-faint: #999;
      }

      * { box-sizing: border-box; margin: 0; padding: 0; }

      .panel {
        display: flex;
        height: 100%;
        background: #fff;
        overflow: hidden;
      }

      .panel-list {
        width: 100%;
        background: var(--bg);
        border-right: 1px solid var(--border);
        display: flex;
        flex-direction: column;
        flex-shrink: 0;
      }

      .panel-list-header {
        padding: 16px;
        border-bottom: 1px solid var(--border);
      }

      .panel-list-header h1 {
        font-size: 22px;
        font-weight: 600;
        color: var(--text);
        margin-bottom: 12px;
      }

      .search-box {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid var(--border);
        border-radius: 6px;
        font-size: 14px;
        background: #fff;
        margin-bottom: 10px;
      }

      .search-box:focus { outline: none; border-color: var(--accent); }

      .new-note-btn {
        width: 100%;
        padding: 10px;
        background: var(--accent);
        color: #fff;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
      }

      .new-note-btn:hover { background: var(--accent-dark); }

      .notes-list {
        flex: 1;
        overflow-y: auto;
        padding: 10px;
      }

      .note-item {
        position: relative;
        padding: 10px 10px 10px 14px;
        margin-bottom: 8px;
        background: #fff;
        border: 1px solid var(--border);
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.15s;
      }

      .note-item:hover { border-color: var(--accent); box-shadow: 0 2px 4px rgba(0,0,0,0.08); }
      .note-item.active { background: #e3f2fd; border-color: var(--accent); }

      .note-color-bar {
        position: absolute;
        left: 0; top: 0;
        width: 4px; height: 100%;
        border-radius: 8px 0 0 8px;
      }

      .note-item-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 3px;
      }

      .note-item-title {
        font-weight: 600;
        font-size: 14px;
        color: var(--text);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        flex: 1;
      }

      .note-item-preview {
        font-size: 12px;
        color: var(--text-muted);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        margin-bottom: 3px;
      }

      .note-item-date { font-size: 11px; color: var(--text-faint); }
      .pin-icon { font-size: 14px; margin-left: 4px; flex-shrink: 0; }

      .empty-list {
        padding: 20px;
        text-align: center;
        color: var(--text-faint);
        font-size: 14px;
      }

      .panel-editor {
        flex: 1;
        display: flex;
        flex-direction: column;
        background: #fff;
        min-width: 0;
      }

      .editor-header {
        padding: 12px 16px;
        border-bottom: 1px solid var(--border);
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .back-btn {
        display: none;
        padding: 6px 12px;
        border: 1px solid var(--border);
        border-radius: 6px;
        background: #fff;
        cursor: pointer;
        font-size: 14px;
      }

      .back-btn:hover { background: #f5f5f5; }

      .editor-actions { display: flex; gap: 8px; margin-left: auto; }

      .editor-btn {
        padding: 6px 14px;
        border: 1px solid var(--border);
        border-radius: 6px;
        background: #fff;
        cursor: pointer;
        font-size: 14px;
      }

      .editor-btn:hover { background: #f5f5f5; }
      .editor-btn.danger { background: #f44336; color: #fff; border-color: #f44336; }
      .editor-btn.danger:hover { background: #d32f2f; }
      .editor-btn.confirming { background: #ff7043; color: #fff; border-color: #ff7043; }

      .editor-body {
        flex: 1;
        overflow-y: auto;
        padding: 20px 24px;
      }

      .editor-toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        align-items: center;
        padding-bottom: 16px;
        border-bottom: 1px solid var(--border);
        margin-bottom: 16px;
      }

      .pin-toggle {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 5px 10px;
        border: 1px solid var(--border);
        border-radius: 6px;
        background: #fff;
        cursor: pointer;
        font-size: 13px;
      }

      .pin-toggle:hover { background: #f5f5f5; }
      .pin-toggle.active { background: #fff3e0; border-color: #FF9800; color: #FF9800; }

      .toolbar-label { font-size: 13px; color: var(--text-muted); font-weight: 500; }

      .color-picker { display: flex; gap: 6px; flex-wrap: wrap; }

      .color-dot {
        width: 28px; height: 28px;
        border-radius: 50%;
        cursor: pointer;
        border: 2px solid transparent;
        transition: all 0.15s;
      }

      .color-dot:hover { transform: scale(1.1); }
      .color-dot.active { border-color: #333; transform: scale(1.15); }

      .note-title-input {
        width: 100%;
        font-size: 28px;
        font-weight: 700;
        border: none;
        outline: none;
        margin-bottom: 16px;
        color: var(--text);
        font-family: inherit;
      }

      .note-content-input {
        width: 100%;
        min-height: 300px;
        font-size: 15px;
        line-height: 1.6;
        border: none;
        outline: none;
        resize: none;
        color: var(--text);
        font-family: inherit;
      }

      .empty-editor {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: var(--text-faint);
      }

      .empty-editor-icon { font-size: 56px; margin-bottom: 16px; }
      .empty-editor-text { font-size: 16px; }

      .save-toast {
        position: fixed;
        bottom: 24px;
        right: 24px;
        background: #323232;
        color: #fff;
        padding: 8px 16px;
        border-radius: 4px;
        font-size: 13px;
        pointer-events: none;
        opacity: 1;
        transition: opacity 0.4s;
        z-index: 1000;
      }

      @media (max-width: 767px) {
        :host([data-view="list"]) .panel-editor { display: none; }
        :host([data-view="editor"]) .panel-list { display: none; }
        .back-btn { display: block; }
        .save-toast { bottom: 16px; right: 16px; left: 16px; text-align: center; }
      }

      @media (min-width: 768px) {
        .panel-list { width: 280px; display: flex; }
        .panel-editor { display: flex; }
      }
    `;
    this.shadowRoot.appendChild(style);

    const content = document.createElement('div');
    content.id = 'content';
    content.style.cssText = 'display:contents';
    this.shadowRoot.appendChild(content);
  }
```

- [ ] **Step 3: Rewrite `_render()` to update only the `#content` div**

Replace the entire `_render()` method with:

```js
  _render() {
    this.setAttribute('data-view', this._view);
    const content = this.shadowRoot.getElementById('content');
    if (!content) return;
    const filtered = this._filteredNotes();
    content.innerHTML = `
      <div class="panel">
        <div class="panel-list">
          <div class="panel-list-header">
            <h1>Better Notes</h1>
            <input class="search-box" id="searchBox" type="text" placeholder="Search notes..." value="${this._escapeAttr(this._searchTerm)}">
            <button class="new-note-btn" id="newNoteBtn">+ New Note</button>
          </div>
          <div class="notes-list" id="notesList">
            ${filtered.length === 0
              ? `<div class="empty-list">No notes found</div>`
              : filtered.map(note => `
                <div class="note-item ${this._currentNoteId === note.note_id ? 'active' : ''}" data-id="${note.note_id}">
                  <div class="note-color-bar" style="background:${this._safeColor(note.color)}"></div>
                  <div class="note-item-header">
                    <div class="note-item-title">${this._escapeHtml(note.title || 'Untitled')}</div>
                    ${note.pinned ? '<span class="pin-icon">📌</span>' : ''}
                  </div>
                  <div class="note-item-preview">${this._escapeHtml((note.content || '').substring(0, 60))}${note.content?.length > 60 ? '…' : ''}</div>
                  <div class="note-item-date">${this._formatDate(note.modified)}</div>
                </div>
              `).join('')
            }
          </div>
        </div>

        <div class="panel-editor">
          ${this._currentNote()
            ? this._renderEditor()
            : `<div class="empty-editor">
                 <div class="empty-editor-icon">📝</div>
                 <div class="empty-editor-text">Select a note or create a new one</div>
               </div>`
          }
        </div>
      </div>
    `;
    this._attachListeners();
  }
```

- [ ] **Step 4: Update `set hass` to call `_initStyles()` on first init**

Replace the `set hass` setter with:

```js
  set hass(hass) {
    this._hass = hass;
    if (!this._initialized) {
      this._initialized = true;
      this._initStyles();
      this._render();
      this._loadNotes();
      this._subscribeToEvents();
    }
  }
```

- [ ] **Step 5: Update `connectedCallback` to only render if already initialized**

Replace:
```js
  connectedCallback() {
    this._render();
  }
```
With:
```js
  connectedCallback() {
    if (this._initialized) this._render();
  }
```

- [ ] **Step 6: Deploy and verify**

Copy the file and hard-refresh. Expected: panel loads correctly, search still works, CSS is visually identical. Open DevTools > Elements > shadow-root — you should see a persistent `<style>` element and a `<div id="content">` rather than the entire shadow DOM being replaced on interaction.

- [ ] **Step 7: Commit**

```bash
git add custom_components/better_notes/www/better-notes-panel.js
git commit -m "perf: extract CSS to one-time init, render only updates content div"
```

---

### Task 3: Panel JS — correctness fixes

**Files:**
- Modify: `custom_components/better_notes/www/better-notes-panel.js`

**Interfaces:**
- Consumes: `this._disconnected` (added in Task 2), `this._saving` (added in Task 2)
- Produces: subscription leak fixed; `_safeColor` accepts only 3 or 6 hex digits; `_saveNote` has in-flight guard

- [ ] **Step 1: Fix subscription leak in `_subscribeToEvents`**

Replace the entire `_subscribeToEvents` method with:

```js
  _subscribeToEvents() {
    if (!this._hass?.connection || this._unsubscribeEvents) return;
    const refresh = () => this._loadNotes();
    const events = [
      'better_notes_note_created',
      'better_notes_note_updated',
      'better_notes_note_deleted',
    ];
    Promise.all(
      events.map(e => this._hass.connection.subscribeEvents(refresh, e))
    ).then(unsubs => {
      if (this._disconnected) {
        unsubs.forEach(fn => fn());
      } else {
        this._unsubscribeEvents = () => unsubs.forEach(fn => fn());
      }
    });
  }
```

- [ ] **Step 2: Set `_disconnected = true` in `disconnectedCallback`**

Replace the `disconnectedCallback` method with:

```js
  disconnectedCallback() {
    this._disconnected = true;
    clearTimeout(this._saveTimeout);
    if (this._unsubscribeEvents) {
      this._unsubscribeEvents();
      this._unsubscribeEvents = null;
    }
  }
```

- [ ] **Step 3: Fix `_safeColor` regex to accept only 3 or 6 hex digits**

Replace:
```js
  _safeColor(color) {
    return /^#[0-9a-fA-F]{3,6}$/.test(color) ? color : '#FFEB3B';
  }
```
With:
```js
  _safeColor(color) {
    return /^#[0-9a-fA-F]{6}$|^#[0-9a-fA-F]{3}$/.test(color) ? color : '#FFEB3B';
  }
```

- [ ] **Step 4: Add in-flight save guard to `_saveNote`**

Replace the `_saveNote` method with:

```js
  async _saveNote() {
    if (this._saving) return;
    this._saving = true;
    clearTimeout(this._saveTimeout);
    const note = this._currentNote();
    if (!note) {
      this._saving = false;
      return;
    }

    const title = this.shadowRoot.getElementById('noteTitle')?.value ?? note.title;
    const content = this.shadowRoot.getElementById('noteContent')?.value ?? note.content;

    try {
      await this._hass.callService('better_notes', 'update_note', {
        note_id: note.note_id,
        title,
        content,
        color: note.color,
        pinned: note.pinned,
      });
      const savedId = note.note_id;
      await this._loadNotes();
      this._currentNoteId = this._notes.find(n => n.note_id === savedId)
        ? savedId
        : null;
    } catch (e) {
      console.error('Better Notes: failed to save note', e);
    } finally {
      this._saving = false;
    }
  }
```

- [ ] **Step 5: Deploy and verify**

Hard-refresh. Test: rapidly clicking Save multiple times should not queue up duplicate calls (check Network tab — only one `update_note` call should fire at a time). Pin/color changes should not cause the editor to flash back after delete.

- [ ] **Step 6: Commit**

```bash
git add custom_components/better_notes/www/better-notes-panel.js
git commit -m "fix: subscription leak, _safeColor regex, in-flight save guard"
```

---

### Task 4: Panel JS — UX improvements

**Files:**
- Modify: `custom_components/better_notes/www/better-notes-panel.js`

**Interfaces:**
- Consumes: `this._saving` (Task 2/3), CSS `.save-toast` and `.editor-btn.confirming` (injected by `_initStyles` in Task 2)
- Produces: `_showSavedFeedback()` method; `_deleteNote` uses two-tap confirm instead of `window.confirm()`

- [ ] **Step 1: Add `_pendingDelete` and `_deleteTimeout` to constructor**

In the `constructor()`, add after `this._saving = false;`:

```js
    this._pendingDelete = false;
    this._deleteTimeout = null;
```

- [ ] **Step 2: Clear delete timeout in `disconnectedCallback`**

In `disconnectedCallback`, add `clearTimeout(this._deleteTimeout);` after `clearTimeout(this._saveTimeout);`:

```js
  disconnectedCallback() {
    this._disconnected = true;
    clearTimeout(this._saveTimeout);
    clearTimeout(this._deleteTimeout);
    if (this._unsubscribeEvents) {
      this._unsubscribeEvents();
      this._unsubscribeEvents = null;
    }
  }
```

- [ ] **Step 3: Add `_showSavedFeedback()` method**

Add this method to the class, after `_setColor`:

```js
  _showSavedFeedback() {
    const existing = this.shadowRoot.querySelector('.save-toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = 'save-toast';
    toast.textContent = 'Saved';
    this.shadowRoot.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 400);
    }, 1100);
  }
```

- [ ] **Step 4: Call `_showSavedFeedback()` on successful save in `_saveNote`**

In `_saveNote`, add `this._showSavedFeedback();` immediately after `this._currentNoteId = ...` line inside the `try` block:

```js
      const savedId = note.note_id;
      await this._loadNotes();
      this._currentNoteId = this._notes.find(n => n.note_id === savedId)
        ? savedId
        : null;
      this._showSavedFeedback();
```

- [ ] **Step 5: Replace `_deleteNote` with two-tap confirm (no `window.confirm`)**

Replace the entire `_deleteNote` method with:

```js
  async _deleteNote() {
    const note = this._currentNote();
    if (!note) return;

    if (!this._pendingDelete) {
      this._pendingDelete = true;
      const btn = this.shadowRoot.getElementById('deleteBtn');
      if (btn) {
        btn.textContent = 'Confirm?';
        btn.classList.add('confirming');
      }
      this._deleteTimeout = setTimeout(() => {
        this._pendingDelete = false;
        this._render();
      }, 3000);
      return;
    }

    clearTimeout(this._deleteTimeout);
    this._pendingDelete = false;

    try {
      await this._hass.callService('better_notes', 'delete_note', {
        note_id: note.note_id,
      });
      this._currentNoteId = null;
      this._view = 'list';
      await this._loadNotes();
    } catch (e) {
      console.error('Better Notes: failed to delete note', e);
    }
  }
```

- [ ] **Step 6: Deploy and verify on both desktop and mobile**

Hard-refresh. Test:
- Save a note → "Saved" toast appears bottom-right (desktop) / bottom-full-width (mobile) and fades out
- Click Delete once → button changes to "Confirm?" in amber
- Wait 3 seconds → button resets to "Delete"
- Click Delete → "Confirm?" → click again → note is deleted, returns to list
- No `window.confirm` dialog appears at any point

- [ ] **Step 7: Commit**

```bash
git add custom_components/better_notes/www/better-notes-panel.js
git commit -m "feat: add save toast feedback and two-tap delete confirmation"
```

---

### Task 5: Card JS fixes

**Files:**
- Modify: `custom_components/better_notes/www/better-notes-card.js`

**Interfaces:**
- Produces: `BetterNotesCardEditor` attaches shadow root in `constructor()`; `_subscribeToNoteEvents` safe against early disconnect

- [ ] **Step 1: Fix subscription leak in `BetterNotesCard._subscribeToNoteEvents`**

In `better-notes-card.js`, find `_subscribeToNoteEvents` (around line 57). Replace it with:

```js
  _subscribeToNoteEvents() {
    if (!this._hass?.connection || this._unsubscribeEvents) return;

    const refresh = () => this._loadNotes();
    const events = [
      'better_notes_note_created',
      'better_notes_note_updated',
      'better_notes_note_deleted',
    ];

    Promise.all(
      events.map(e => this._hass.connection.subscribeEvents(refresh, e))
    ).then(unsubs => {
      if (!this.isConnected) {
        unsubs.forEach(fn => fn());
      } else {
        this._unsubscribeEvents = () => unsubs.forEach(fn => fn());
      }
    });
  }
```

Note: the card uses `this.isConnected` (the standard `Node.isConnected` DOM property) instead of a custom `_disconnected` flag — the card doesn't have a `disconnectedCallback` that sets one, and `isConnected` is always available on DOM nodes.

- [ ] **Step 2: Move shadow root attachment in `BetterNotesCardEditor` to constructor**

Find `BetterNotesCardEditor` (around line 370). It currently calls `this.attachShadow` inside `render()`. Move it to a `constructor`:

Add a constructor before `setConfig`:
```js
class BetterNotesCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  setConfig(config) {
```

Then in the `render()` method, remove the guard and the `attachShadow` call:
```js
  render() {
    // DELETE these two lines:
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
    }

    this.shadowRoot.innerHTML = `
```

So `render()` becomes simply:
```js
  render() {
    this.shadowRoot.innerHTML = `
```

- [ ] **Step 3: Deploy and verify**

Hard-refresh. Open the Lovelace dashboard with a `better-notes-card`. Open the card editor. Expected: no errors in console, card editor opens and closes without throwing `Failed to attach shadow root`.

- [ ] **Step 4: Commit**

```bash
git add custom_components/better_notes/www/better-notes-card.js
git commit -m "fix: subscription leak in card, move CardEditor shadow root to constructor"
```
