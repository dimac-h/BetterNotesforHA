# Panel Custom Element Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `iframe` panel with a native HA `panel_custom` element so auth is handled by HA natively and the panel works on mobile.

**Architecture:** A single JS module (`better-notes-panel.js`) defines a custom element that receives the `hass` object as a property, calls services via `hass.callService`, and renders a mobile-first two-view layout (list / editor) that switches to side-by-side on desktop. The Python backend registration switches from `async_register_built_in_panel` (iframe) to `async_register_custom_panel`.

**Tech Stack:** Vanilla JS (no bundler, no framework), Python/HA integration APIs, Shadow DOM.

## Global Constraints

- No build step, no bundler, no npm — vanilla JS only
- HA minimum version: 2024.1.0
- `get_notes` service must always be called with `return_response: true` (registered as `SupportsResponse.ONLY`)
- Mutation services (`create_note`, `update_note`, `delete_note`) must NOT use `return_response`
- Panel component name must match `PANEL_COMPONENT_NAME = "better-notes-panel"` in `const.py`
- Static files served from `custom_components/better_notes/www/`
- No test suite exists — verification is done by deploying to HA and checking browser console + HA logs

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `custom_components/better_notes/__init__.py` | Modify | Swap iframe registration for `async_register_custom_panel` |
| `custom_components/better_notes/www/better-notes-panel.js` | Create | Custom element panel — full UI, service calls, event subscriptions |
| `custom_components/better_notes/www/better-notes-panel.html` | Delete | Replaced by the JS file |

---

### Task 1: Update panel registration in `__init__.py`

**Files:**
- Modify: `custom_components/better_notes/__init__.py:67-83`

**Interfaces:**
- Consumes: `PANEL_TITLE`, `PANEL_ICON`, `PANEL_URL`, `PANEL_COMPONENT_NAME` from `const.py`
- Produces: HA registers `better-notes-panel` custom element served from `/better_notes_panel/better-notes-panel.js`

- [ ] **Step 1: Replace the panel registration block**

In `__init__.py`, find the `async_register_built_in_panel` call (lines 75–83) and replace it with `async_register_custom_panel`. Also remove the `async_register_built_in_panel` import and add the custom panel import.

The top-level imports currently include:
```python
from homeassistant.components.frontend import async_register_built_in_panel, async_remove_panel
```

Change to:
```python
from homeassistant.components.frontend import async_register_custom_panel, async_remove_panel
```

Then replace the registration block:
```python
    # OLD — remove this:
    async_register_built_in_panel(
        hass,
        component_name="iframe",
        sidebar_title=PANEL_TITLE,
        sidebar_icon=PANEL_ICON,
        frontend_url_path=PANEL_URL,
        config={"url": "/better_notes_panel/better-notes-panel.html"},
        require_admin=False,
    )

    # NEW — replace with this:
    async_register_custom_panel(
        hass,
        frontend_url_path=PANEL_URL,
        webcomponent_name=PANEL_COMPONENT_NAME,
        sidebar_title=PANEL_TITLE,
        sidebar_icon=PANEL_ICON,
        module_url="/better_notes_panel/better-notes-panel.js",
        embed_iframe=False,
        require_admin=False,
    )
```

- [ ] **Step 2: Verify `async_unload_entry` still works**

`async_remove_panel(hass, PANEL_URL)` in `async_unload_entry` is the same for both panel types — no change needed. Confirm it's still present at the bottom of the file.

- [ ] **Step 3: Deploy and confirm HA starts without errors**

Copy `__init__.py` to your HA instance:
```bash
cp custom_components/better_notes/__init__.py /path/to/homeassistant/custom_components/better_notes/
```

Restart HA. Check Settings > System > Logs. Expected: no errors from `better_notes`. The sidebar will show "Better Notes" but the panel will be blank/broken until Task 2.

- [ ] **Step 4: Commit**

```bash
git add custom_components/better_notes/__init__.py
git commit -m "fix: register panel as custom element instead of iframe"
```

---

### Task 2: Create `better-notes-panel.js` — skeleton and hass wiring

**Files:**
- Create: `custom_components/better_notes/www/better-notes-panel.js`

**Interfaces:**
- Consumes: HA `hass` object (set as property by HA), `hass.callService(domain, service, data, options)`, `hass.connection.subscribeEvents(callback, eventType)`
- Produces: `BetterNotesPanel` custom element registered as `better-notes-panel`; renders a loading state until notes are fetched

- [ ] **Step 1: Create the file with the custom element skeleton**

Create `custom_components/better_notes/www/better-notes-panel.js`:

```js
const COLORS = [
  '#FFEB3B', '#FF9800', '#F44336', '#E91E63', '#9C27B0',
  '#3F51B5', '#2196F3', '#00BCD4', '#009688', '#4CAF50',
];

class BetterNotesPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._hass = null;
    this._notes = [];
    this._currentNoteId = null;
    this._view = 'list';
    this._searchTerm = '';
    this._initialized = false;
    this._saveTimeout = null;
    this._unsubscribeEvents = null;
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._initialized) {
      this._initialized = true;
      this._render();
      this._loadNotes();
      this._subscribeToEvents();
    }
  }

  connectedCallback() {
    this._render();
  }

  disconnectedCallback() {
    if (this._unsubscribeEvents) {
      this._unsubscribeEvents();
      this._unsubscribeEvents = null;
    }
  }
}

customElements.define('better-notes-panel', BetterNotesPanel);
```

- [ ] **Step 2: Add `_loadNotes` method**

Add inside the class body, after `disconnectedCallback`:

```js
  async _loadNotes() {
    try {
      const result = await this._hass.callService(
        'better_notes', 'get_notes', {}, { return_response: true }
      );
      if (result && Array.isArray(result.notes)) {
        this._notes = result.notes;
        this._render();
      }
    } catch (e) {
      console.error('Better Notes: failed to load notes', e);
    }
  }
```

- [ ] **Step 3: Add `_subscribeToEvents` method**

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
      this._unsubscribeEvents = () => unsubs.forEach(fn => fn());
    });
  }
```

- [ ] **Step 4: Add a minimal `_render` method (loading state only)**

```js
  _render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; height: 100%; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
        .loading { display: flex; align-items: center; justify-content: center; height: 100%; font-size: 18px; color: #666; }
      </style>
      <div class="loading">Loading Better Notes...</div>
    `;
  }
```

- [ ] **Step 5: Deploy and confirm the panel loads without console errors**

```bash
cp custom_components/better_notes/www/better-notes-panel.js /path/to/homeassistant/custom_components/better_notes/www/
```

Hard-refresh (Ctrl+Shift+R) the browser. Navigate to the Better Notes panel in the sidebar. Expected: "Loading Better Notes..." text, no console errors. On mobile HA app: same result, no auth errors in HA logs.

- [ ] **Step 6: Commit**

```bash
git add custom_components/better_notes/www/better-notes-panel.js
git commit -m "feat: add custom element panel skeleton with hass wiring and event subscriptions"
```

---

### Task 3: Implement full `_render` with CSS and list view

**Files:**
- Modify: `custom_components/better_notes/www/better-notes-panel.js`

**Interfaces:**
- Consumes: `this._notes`, `this._currentNoteId`, `this._view`, `this._searchTerm`
- Produces: Rendered shadow DOM with sidebar list + empty editor placeholder; clicking a note calls `this._selectNote(id)`

- [ ] **Step 1: Replace `_render` with the full implementation**

Replace the minimal `_render` method with:

```js
  _render() {
    const filtered = this._filteredNotes();
    this.shadowRoot.innerHTML = `
      <style>
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

        /* List panel */
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

        /* Editor panel */
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

        /* Mobile: show only the active view */
        @media (max-width: 767px) {
          .panel-list { display: ${this._view === 'list' ? 'flex' : 'none'}; }
          .panel-editor { display: ${this._view === 'editor' ? 'flex' : 'none'}; }
          .back-btn { display: block; }
        }

        /* Desktop: always show both */
        @media (min-width: 768px) {
          .panel-list { width: 280px; display: flex; }
          .panel-editor { display: flex; }
        }
      </style>

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
                  <div class="note-color-bar" style="background:${note.color}"></div>
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

- [ ] **Step 2: Add helper methods**

Add these inside the class, after `_render`:

```js
  _currentNote() {
    return this._notes.find(n => n.note_id === this._currentNoteId) ?? null;
  }

  _filteredNotes() {
    const term = this._searchTerm.toLowerCase();
    if (!term) return this._notes;
    return this._notes.filter(n =>
      (n.title || '').toLowerCase().includes(term) ||
      (n.content || '').toLowerCase().includes(term)
    );
  }

  _renderEditor() {
    const note = this._currentNote();
    return `
      <div class="editor-header">
        <button class="back-btn" id="backBtn">← Back</button>
        <div class="editor-actions">
          <button class="editor-btn" id="saveBtn">Save</button>
          <button class="editor-btn danger" id="deleteBtn">Delete</button>
        </div>
      </div>
      <div class="editor-body">
        <div class="editor-toolbar">
          <button class="pin-toggle ${note.pinned ? 'active' : ''}" id="pinToggle">
            📌 ${note.pinned ? 'Pinned' : 'Pin'}
          </button>
          <span class="toolbar-label">Color:</span>
          <div class="color-picker">
            ${COLORS.map(c => `
              <div class="color-dot ${note.color === c ? 'active' : ''}"
                   style="background:${c}" data-color="${c}"></div>
            `).join('')}
          </div>
        </div>
        <input class="note-title-input" id="noteTitle" type="text"
               placeholder="Note Title" value="${this._escapeAttr(note.title || '')}">
        <textarea class="note-content-input" id="noteContent"
                  placeholder="Start typing...">${this._escapeHtml(note.content || '')}</textarea>
      </div>
    `;
  }

  _escapeHtml(text) {
    const d = document.createElement('div');
    d.textContent = String(text);
    return d.innerHTML;
  }

  _escapeAttr(text) {
    return String(text).replace(/"/g, '&quot;');
  }

  _formatDate(iso) {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now - date;
    const mins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMs / 3600000);
    const days = Math.floor(diffMs / 86400000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} min ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  }
```

- [ ] **Step 3: Add `_attachListeners` (list interactions only for now)**

```js
  _attachListeners() {
    const root = this.shadowRoot;

    root.getElementById('searchBox')?.addEventListener('input', e => {
      this._searchTerm = e.target.value;
      this._render();
    });

    root.getElementById('newNoteBtn')?.addEventListener('click', () => this._createNote());

    root.querySelectorAll('.note-item').forEach(el => {
      el.addEventListener('click', () => this._selectNote(el.dataset.id));
    });

    root.getElementById('backBtn')?.addEventListener('click', () => {
      this._view = 'list';
      this._render();
    });

    root.getElementById('saveBtn')?.addEventListener('click', () => this._saveNote());
    root.getElementById('deleteBtn')?.addEventListener('click', () => this._deleteNote());
    root.getElementById('pinToggle')?.addEventListener('click', () => this._togglePin());

    root.querySelectorAll('.color-dot').forEach(el => {
      el.addEventListener('click', () => this._setColor(el.dataset.color));
    });

    const autoSave = () => {
      clearTimeout(this._saveTimeout);
      this._saveTimeout = setTimeout(() => this._saveNote(), 1000);
    };
    root.getElementById('noteTitle')?.addEventListener('input', autoSave);
    root.getElementById('noteContent')?.addEventListener('input', autoSave);
  }

  _selectNote(id) {
    this._currentNoteId = id;
    this._view = 'editor';
    this._render();
  }
```

- [ ] **Step 4: Deploy and verify list renders**

```bash
cp custom_components/better_notes/www/better-notes-panel.js /path/to/homeassistant/custom_components/better_notes/www/
```

Hard-refresh. Expected: notes list renders in the sidebar, clicking a note shows the editor (desktop: side by side; mobile: full-screen editor with ← Back button). No console errors.

- [ ] **Step 5: Commit**

```bash
git add custom_components/better_notes/www/better-notes-panel.js
git commit -m "feat: implement full panel render with mobile-first list/editor layout"
```

---

### Task 4: Implement note mutation methods

**Files:**
- Modify: `custom_components/better_notes/www/better-notes-panel.js`

**Interfaces:**
- Consumes: `this._hass.callService`, `this._currentNoteId`, `this._notes`
- Produces: `_createNote()`, `_saveNote()`, `_deleteNote()`, `_togglePin()`, `_setColor(color)` — all call HA services and reload via `_loadNotes()`

- [ ] **Step 1: Add `_createNote`**

```js
  async _createNote() {
    try {
      await this._hass.callService('better_notes', 'create_note', {
        title: 'New Note',
        content: '',
        color: COLORS[0],
        pinned: false,
      });
      await this._loadNotes();
      if (this._notes.length > 0) {
        this._selectNote(this._notes[0].note_id);
        this.shadowRoot.getElementById('noteTitle')?.select();
      }
    } catch (e) {
      console.error('Better Notes: failed to create note', e);
    }
  }
```

- [ ] **Step 2: Add `_saveNote`**

```js
  async _saveNote() {
    const note = this._currentNote();
    if (!note) return;

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
    }
  }
```

- [ ] **Step 3: Add `_deleteNote`**

```js
  async _deleteNote() {
    const note = this._currentNote();
    if (!note) return;
    if (!confirm('Delete this note?')) return;

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

- [ ] **Step 4: Add `_togglePin` and `_setColor`**

```js
  _togglePin() {
    const note = this._currentNote();
    if (!note) return;
    note.pinned = !note.pinned;
    this._saveNote();
  }

  _setColor(color) {
    const note = this._currentNote();
    if (!note) return;
    note.color = color;
    this._saveNote();
  }
```

- [ ] **Step 5: Deploy and test all interactions**

```bash
cp custom_components/better_notes/www/better-notes-panel.js /path/to/homeassistant/custom_components/better_notes/www/
```

Hard-refresh. Test on both desktop and mobile:
- Create a new note → appears in list, editor opens
- Edit title/content → auto-saves after 1 second
- Pin/unpin → icon updates in list
- Change color → color bar updates in list
- Delete → returns to list, note gone
- No auth errors in HA logs on mobile

- [ ] **Step 6: Commit**

```bash
git add custom_components/better_notes/www/better-notes-panel.js
git commit -m "feat: implement create, save, delete, pin, and color mutation methods"
```

---

### Task 5: Delete the old HTML file

**Files:**
- Delete: `custom_components/better_notes/www/better-notes-panel.html`

- [ ] **Step 1: Delete the file**

```bash
git rm custom_components/better_notes/www/better-notes-panel.html
```

- [ ] **Step 2: Remove from HA instance**

```bash
rm /path/to/homeassistant/custom_components/better_notes/www/better-notes-panel.html
```

- [ ] **Step 3: Confirm panel still works**

Hard-refresh and navigate to the panel. Expected: works as before; no references to the HTML file remain.

- [ ] **Step 4: Commit**

```bash
git commit -m "chore: remove obsolete iframe panel HTML file"
```
