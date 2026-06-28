# Tiptap Rich Text Editor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the plain textarea in the Better Notes panel with a Tiptap WYSIWYG editor with a custom formatting toolbar, and update the Lovelace card to render HTML content.

**Architecture:** Remove shadow DOM from `BetterNotesPanel` (required for Firefox selection support). Split the monolithic `_render()` into a stable DOM skeleton + separate list/editor update paths so the Tiptap instance survives note list refreshes. The Tiptap bundle is generated once via esbuild and committed to the repo.

**Tech Stack:** Tiptap v2 (StarterKit, TaskList, TaskItem, Link, Highlight), esbuild (dev-only bundler), vanilla JS custom elements, HA WebSocket API.

## Global Constraints

- No build step at runtime — `tiptap-bundle.js` is pre-generated and committed.
- No test suite — verification is manual: copy `www/` to live HA, restart, observe.
- `node_modules/` must not be committed (already in `.gitignore`).
- Static files served at `/better_notes_panel/<filename>` (registered in `__init__.py`).
- No Python backend changes. No storage schema changes.
- Shadow DOM must be removed from `BetterNotesPanel` only; `BetterNotesCard` retains it.
- Content stored as HTML string in `note.content`.

---

### Task 1: Generate and commit Tiptap bundle

**Files:**
- Create: `package.json`
- Create: `scripts/tiptap-entry.js`
- Create: `custom_components/better_notes/www/tiptap-bundle.js` (generated)

**Interfaces:**
- Produces: `window.TiptapBundle` global with `{ Editor, StarterKit, TaskList, TaskItem, Link, Highlight }`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "better-notes-ha",
  "private": true,
  "scripts": {
    "build:tiptap": "esbuild scripts/tiptap-entry.js --bundle --format=iife --global-name=TiptapBundle --minify --outfile=custom_components/better_notes/www/tiptap-bundle.js"
  },
  "devDependencies": {
    "@tiptap/core": "^2.0.0",
    "@tiptap/extension-highlight": "^2.0.0",
    "@tiptap/extension-link": "^2.0.0",
    "@tiptap/extension-task-item": "^2.0.0",
    "@tiptap/extension-task-list": "^2.0.0",
    "@tiptap/starter-kit": "^2.0.0",
    "esbuild": "^0.20.0"
  }
}
```

- [ ] **Step 2: Create `scripts/tiptap-entry.js`**

```js
export { Editor } from '@tiptap/core';
export { StarterKit } from '@tiptap/starter-kit';
export { TaskList } from '@tiptap/extension-task-list';
export { TaskItem } from '@tiptap/extension-task-item';
export { Link } from '@tiptap/extension-link';
export { Highlight } from '@tiptap/extension-highlight';
```

- [ ] **Step 3: Install dependencies and generate bundle**

```bash
npm install
npm run build:tiptap
```

Expected: `custom_components/better_notes/www/tiptap-bundle.js` created, ~300–500KB minified.

- [ ] **Step 4: Verify the bundle exposes expected globals**

```bash
node -e "
const fs = require('fs');
const code = fs.readFileSync('custom_components/better_notes/www/tiptap-bundle.js', 'utf8');
// Check the IIFE sets TiptapBundle
console.log('Has TiptapBundle assignment:', code.includes('TiptapBundle='));
"
```

Expected output: `Has TiptapBundle assignment: true`

- [ ] **Step 5: Commit**

```bash
git add package.json scripts/tiptap-entry.js custom_components/better_notes/www/tiptap-bundle.js
git commit -m "feat: add Tiptap bundle (generated via esbuild)"
```

---

### Task 2: Remove shadow DOM from panel

**Files:**
- Modify: `custom_components/better_notes/www/better-notes-panel.js`

**Interfaces:**
- Consumes: existing `BetterNotesPanel` class
- Produces: same class without shadow DOM; all DOM queries use `this.querySelector` / `this` instead of `this.shadowRoot`

- [ ] **Step 1: Remove `attachShadow` from the constructor**

In `constructor()`, replace:
```js
this.attachShadow({ mode: 'open' });
```
with nothing (delete that line).

- [ ] **Step 2: Replace all `this.shadowRoot` references with `this`**

There are occurrences in: `_initStyles()`, `_render()`, `_attachListeners()`, `_createNote()`, `_saveNote()`, `_showSavedFeedback()`. Do a global find-and-replace in the file:

Old: `this.shadowRoot`
New: `this`

- [ ] **Step 3: Update `_initStyles()` to append style to `this` instead of a shadow root**

The method currently calls `this.shadowRoot.appendChild(style)` (now `this.appendChild(style)` after step 2). Also append the content div to `this`:

Ensure `_initStyles()` ends with:
```js
this.appendChild(style);
const content = document.createElement('div');
content.id = 'content';
content.style.cssText = 'display:contents';
this.appendChild(content);
```

- [ ] **Step 4: Add a scoping class to prevent HA style bleed**

At the top of `_initStyles()`, wrap all CSS rules inside `.bn-panel { ... }`. Replace:
```js
style.textContent = `
  :host { ... }
  * { ... }
  .panel { ... }
  ...
`;
```
with:
```js
style.textContent = `
  better-notes-panel {
    display: block;
    height: 100%;
  }
  .bn-panel {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    --accent: #2196F3;
    --accent-dark: #1976D2;
    --border: #e0e0e0;
    --bg: #fafafa;
    --text: #333;
    --text-muted: #666;
    --text-faint: #999;
    display: flex;
    height: 100%;
    background: #fff;
    overflow: hidden;
  }
  .bn-panel * { box-sizing: border-box; margin: 0; padding: 0; }
  .bn-panel .panel-list { ... }
  /* ... all remaining rules prefixed with .bn-panel ... */
`;
```

Add `class="bn-panel"` to the outer `.panel` div in `_render()`:
```js
content.innerHTML = `<div class="panel bn-panel">...</div>`;
```

- [ ] **Step 5: Manual verification**

Copy `www/` to HA, restart. Open the Better Notes panel in the browser. Confirm:
- Panel renders (list visible, header visible)
- Notes load
- Clicking a note opens the editor
- Saving works
- No console errors about shadow root

- [ ] **Step 6: Commit**

```bash
git add custom_components/better_notes/www/better-notes-panel.js
git commit -m "refactor: remove shadow DOM from panel for Firefox Tiptap compatibility"
```

---

### Task 3: Split render cycle — stable DOM skeleton

**Files:**
- Modify: `custom_components/better_notes/www/better-notes-panel.js`

**Interfaces:**
- Consumes: light DOM panel from Task 2
- Produces:
  - `_initDOM()` — builds persistent skeleton once; call from `set hass()`
  - `_renderList()` — updates `#panel-list` innerHTML; replaces list portion of `_render()`
  - `_renderEditor(note)` — stub; full implementation in Task 4
  - `_attachListListeners()` — attaches listeners for the notes list

**Goal:** After this task the panel loads, the list works, and clicking a note shows the editor placeholder (title input + empty content div). The Tiptap instance is not yet created.

- [ ] **Step 1: Add `_initDOM()` method**

Insert after `_initStyles()`:

```js
_initDOM() {
  const content = this.querySelector('#content');
  if (!content) return;
  content.innerHTML = `
    <div class="panel bn-panel">
      <div class="panel-list" id="panel-list"></div>
      <div class="panel-editor" id="panel-editor">
        <div class="empty-editor" id="editor-empty">
          <div class="empty-editor-icon">📝</div>
          <div class="empty-editor-text">Select a note or create a new one</div>
        </div>
      </div>
    </div>
  `;
}
```

- [ ] **Step 2: Add `_renderList()` method**

This is the list-side portion of the existing `_render()`. Insert after `_initDOM()`:

```js
_renderList() {
  const listEl = this.querySelector('#panel-list');
  if (!listEl) return;
  this.setAttribute('data-view', this._view);
  const filtered = this._filteredNotes();
  listEl.innerHTML = `
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
            <div class="note-item-preview">${this._escapeHtml(this._stripHtml(note.content || '').substring(0, 60))}${this._stripHtml(note.content || '').length > 60 ? '…' : ''}</div>
            <div class="note-item-date">${this._formatDate(note.modified)}</div>
          </div>
        `).join('')
      }
    </div>
  `;
  this._attachListListeners();
}
```

- [ ] **Step 3: Add `_stripHtml()` helper**

Insert before `_escapeHtml()`:

```js
_stripHtml(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || '';
}
```

- [ ] **Step 4: Add `_renderEditor()` stub**

Insert after `_renderList()`:

```js
_renderEditor(note) {
  const editorPanel = this.querySelector('#panel-editor');
  if (!editorPanel) return;

  if (!note) {
    if (this._editor) {
      this._editor.destroy();
      this._editor = null;
    }
    editorPanel.innerHTML = `
      <div class="empty-editor" id="editor-empty">
        <div class="empty-editor-icon">📝</div>
        <div class="empty-editor-text">Select a note or create a new one</div>
      </div>
    `;
    return;
  }

  if (!this._editor) {
    editorPanel.innerHTML = this._editorShell(note);
    this._attachEditorListeners();
    // Tiptap init added in Task 4
  } else {
    const titleInput = this.querySelector('#noteTitle');
    if (titleInput) titleInput.value = note.title || '';
    this._updateToolbarState(note);
    // editor.commands.setContent added in Task 4
  }
}

_editorShell(note) {
  return `
    <div class="editor-header">
      <button class="back-btn" id="backBtn">← Back</button>
      <div class="editor-actions">
        <button class="editor-btn" id="saveBtn">Save</button>
        <button class="editor-btn danger" id="deleteBtn">Delete</button>
      </div>
    </div>
    <div class="editor-body">
      <input class="note-title-input" id="noteTitle" type="text"
             placeholder="Note Title" value="${this._escapeAttr(note.title || '')}">
      <div id="tiptap-mount"></div>
    </div>
    <div class="formatting-toolbar" id="formattingToolbar">
      ${this._toolbarHtml(note)}
    </div>
  `;
}

_toolbarHtml(note) {
  return `<span style="color:var(--text-faint);font-size:12px">Loading editor…</span>`;
}

_updateToolbarState(note) {
  // Populated in Task 5
}
```

- [ ] **Step 5: Add `_attachListListeners()` method**

Extract list-related listeners from the existing `_attachListeners()` into a new method:

```js
_attachListListeners() {
  this.querySelector('#searchBox')?.addEventListener('input', e => {
    this._searchTerm = e.target.value;
    this._renderList();
  });
  this.querySelector('#newNoteBtn')?.addEventListener('click', () => this._createNote());
  this.querySelectorAll('.note-item').forEach(el => {
    el.addEventListener('click', () => this._selectNote(el.dataset.id));
  });
}
```

- [ ] **Step 6: Add `_attachEditorListeners()` stub**

```js
_attachEditorListeners() {
  this.querySelector('#backBtn')?.addEventListener('click', () => {
    this._view = 'list';
    this._renderList();
  });
  this.querySelector('#saveBtn')?.addEventListener('click', () => this._saveNote());
  this.querySelector('#deleteBtn')?.addEventListener('click', () => this._deleteNote());

  const autoSave = () => {
    clearTimeout(this._saveTimeout);
    this._saveTimeout = setTimeout(() => this._saveNote(), 1000);
  };
  this.querySelector('#noteTitle')?.addEventListener('input', autoSave);
}
```

- [ ] **Step 7: Update `set hass()` to use new methods**

Replace the body of the `if (!this._initialized)` block:

```js
set hass(hass) {
  this._hass = hass;
  if (!this._initialized) {
    this._initialized = true;
    this._initStyles();
    this._initDOM();
    this._renderList();
    this._loadNotes();
    this._subscribeToEvents();
  }
}
```

- [ ] **Step 8: Update `connectedCallback`**

```js
connectedCallback() {
  if (this._initialized) {
    this._renderList();
    this._renderEditor(this._currentNote());
  }
}
```

- [ ] **Step 9: Update `_loadNotes()` to call `_renderList()` only**

Replace the `this._render()` call at the end of `_loadNotes()`:
```js
if (Array.isArray(notes)) {
  this._notes = notes;
  this._renderList();
}
```

- [ ] **Step 10: Update `_selectNote()` to call `_renderEditor()`**

```js
_selectNote(id) {
  clearTimeout(this._saveTimeout);
  clearTimeout(this._deleteTimeout);
  this._pendingDelete = false;
  this._currentNoteId = id;
  this._view = 'editor';
  this._renderList();
  this._renderEditor(this._currentNote());
}
```

- [ ] **Step 11: Update `_saveNote()` to not call `_render()`**

In `_saveNote()`, after `await this._loadNotes()`:
```js
const savedNote = this._notes.find(n => n.note_id === savedId);
this._currentNoteId = savedNote ? savedId : null;
if (savedNote) this._updateToolbarState(savedNote);
this._showSavedFeedback();
```

- [ ] **Step 12: Update `_deleteNote()` to call `_renderEditor(null)`**

After `this._currentNoteId = null; this._view = 'list'; await this._loadNotes();`:
```js
this._renderEditor(null);
```

- [ ] **Step 13: Delete the old `_render()` and `_renderEditor()` (original) methods**

Remove the original `_render()` method (which built the full `content.innerHTML`) and the original `_renderEditor()` method. The new versions defined above replace them.

Also remove `_attachListeners()` (replaced by `_attachListListeners()` and `_attachEditorListeners()`).

- [ ] **Step 14: Manual verification**

Copy `www/` to HA, restart. Confirm:
- Notes list loads correctly
- Search filters correctly
- Clicking a note opens the editor area (shows title input, empty content div, "Loading editor…" in toolbar)
- Back button works on mobile
- Save button is present (save will fail gracefully — Tiptap not yet wired)
- Delete with confirm works

- [ ] **Step 15: Commit**

```bash
git add custom_components/better_notes/www/better-notes-panel.js
git commit -m "refactor: split render cycle into stable DOM skeleton + list/editor paths"
```

---

### Task 4: Integrate Tiptap editor

**Files:**
- Modify: `custom_components/better_notes/www/better-notes-panel.js`

**Interfaces:**
- Consumes:
  - `window.TiptapBundle` from Task 1 (`/better_notes_panel/tiptap-bundle.js`)
  - `_editorShell()`, `_renderEditor()`, `_attachEditorListeners()` from Task 3
- Produces:
  - `this._editor` — live Tiptap `Editor` instance
  - `_loadTiptapBundle()` — returns Promise, sets `window.TiptapBundle`
  - `_initTiptap(note)` — creates and mounts the Editor
  - `_saveNote()` reads `this._editor.getHTML()`

- [ ] **Step 1: Add `_loadTiptapBundle()` to the class**

Insert after `_attachEditorListeners()`:

```js
_loadTiptapBundle() {
  if (window.TiptapBundle) return Promise.resolve(window.TiptapBundle);
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = '/better_notes_panel/tiptap-bundle.js';
    script.onload = () => {
      if (window.TiptapBundle) resolve(window.TiptapBundle);
      else reject(new Error('TiptapBundle not found after script load'));
    };
    script.onerror = () => reject(new Error('Failed to load tiptap-bundle.js'));
    document.head.appendChild(script);
  });
}
```

- [ ] **Step 2: Kick off bundle load at init time**

In `set hass()`, inside the `if (!this._initialized)` block, after `this._initDOM()`, add:

```js
this._loadTiptapBundle().catch(err => console.warn('Better Notes: Tiptap failed to load', err));
```

- [ ] **Step 3: Add `_initTiptap(note)` method**

```js
_initTiptap(note) {
  const mount = this.querySelector('#tiptap-mount');
  if (!mount) return;

  const bundle = window.TiptapBundle;
  if (!bundle) {
    // Fallback: show plain textarea
    mount.innerHTML = `<textarea class="note-content-input" id="noteContent"
      placeholder="Start typing...">${this._escapeHtml(note.content || '')}</textarea>`;
    const autoSave = () => {
      clearTimeout(this._saveTimeout);
      this._saveTimeout = setTimeout(() => this._saveNote(), 1000);
    };
    mount.querySelector('#noteContent')?.addEventListener('input', autoSave);
    return;
  }

  const { Editor, StarterKit, TaskList, TaskItem, Link, Highlight } = bundle;

  try {
    this._editor = new Editor({
      element: mount,
      extensions: [
        StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
        TaskList,
        TaskItem.configure({ nested: true }),
        Link.configure({ openOnClick: false }),
        Highlight,
      ],
      content: note.content || '',
      onUpdate: () => {
        clearTimeout(this._saveTimeout);
        this._saveTimeout = setTimeout(() => this._saveNote(), 1000);
      },
    });
  } catch (err) {
    console.warn('Better Notes: Tiptap init failed, falling back to textarea', err);
    mount.innerHTML = `<textarea class="note-content-input" id="noteContent"
      placeholder="Start typing...">${this._escapeHtml(note.content || '')}</textarea>`;
    mount.querySelector('#noteContent')?.addEventListener('input', () => {
      clearTimeout(this._saveTimeout);
      this._saveTimeout = setTimeout(() => this._saveNote(), 1000);
    });
  }
}
```

- [ ] **Step 4: Call `_initTiptap(note)` from `_renderEditor()`**

In `_renderEditor()`, replace the `// Tiptap init added in Task 4` comment:

```js
if (!this._editor) {
  editorPanel.innerHTML = this._editorShell(note);
  this._attachEditorListeners();
  this._attachToolbarListeners(note);  // added in Task 5 — leave as no-op stub for now
  this._initTiptap(note);
} else {
  const titleInput = this.querySelector('#noteTitle');
  if (titleInput) titleInput.value = note.title || '';
  this._editor.commands.setContent(note.content || '');
  this._updateToolbarState(note);
}
```

Add a stub for `_attachToolbarListeners`:
```js
_attachToolbarListeners(note) {
  // Populated in Task 5
}
```

- [ ] **Step 5: Update `_saveNote()` to read from Tiptap**

Replace the content-reading lines in `_saveNote()`:

```js
const title = overrides.title ?? this.querySelector('#noteTitle')?.value ?? note.title;
const content = overrides.content ?? (
  this._editor
    ? this._editor.getHTML()
    : (this.querySelector('#noteContent')?.value ?? note.content)
);
```

- [ ] **Step 6: Destroy editor in `disconnectedCallback()`**

```js
disconnectedCallback() {
  this._disconnected = true;
  clearTimeout(this._saveTimeout);
  clearTimeout(this._deleteTimeout);
  if (this._editor) {
    this._editor.destroy();
    this._editor = null;
  }
  if (this._unsubscribeEvents) {
    this._unsubscribeEvents();
    this._unsubscribeEvents = null;
  }
}
```

- [ ] **Step 7: Add Tiptap editor CSS**

In `_initStyles()`, inside the `.bn-panel { }` block, add:

```css
.bn-panel #tiptap-mount .ProseMirror {
  min-height: 300px;
  font-size: 15px;
  line-height: 1.6;
  outline: none;
  color: var(--text);
  font-family: inherit;
}

.bn-panel #tiptap-mount .ProseMirror p { margin: 0 0 8px; }
.bn-panel #tiptap-mount .ProseMirror h1 { font-size: 24px; font-weight: 700; margin: 0 0 8px; }
.bn-panel #tiptap-mount .ProseMirror h2 { font-size: 20px; font-weight: 600; margin: 0 0 8px; }
.bn-panel #tiptap-mount .ProseMirror h3 { font-size: 16px; font-weight: 600; margin: 0 0 8px; }
.bn-panel #tiptap-mount .ProseMirror ul,
.bn-panel #tiptap-mount .ProseMirror ol { margin: 0 0 8px; padding-left: 24px; }
.bn-panel #tiptap-mount .ProseMirror li { margin-bottom: 2px; }
.bn-panel #tiptap-mount .ProseMirror ul[data-type="taskList"] { list-style: none; padding-left: 0; }
.bn-panel #tiptap-mount .ProseMirror ul[data-type="taskList"] li { display: flex; align-items: flex-start; gap: 6px; }
.bn-panel #tiptap-mount .ProseMirror ul[data-type="taskList"] li > label { flex-shrink: 0; margin-top: 2px; }
.bn-panel #tiptap-mount .ProseMirror mark { background: #fff176; padding: 1px 2px; border-radius: 2px; }
.bn-panel #tiptap-mount .ProseMirror a { color: var(--accent); text-decoration: underline; }
.bn-panel #tiptap-mount .ProseMirror s { text-decoration: line-through; }
.bn-panel #tiptap-mount .ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: var(--text-faint);
  pointer-events: none;
  height: 0;
}
```

- [ ] **Step 8: Manual verification**

Copy `www/` to HA, restart. Confirm:
- Clicking a note opens Tiptap editor (cursor blinks, can type)
- Typing triggers auto-save after 1 second ("Saved" toast appears)
- Reloading the page re-opens the note with content preserved
- Switching between notes updates content correctly
- Old plain-text notes open and display their text in a `<p>` tag
- In Firefox: typing works, text cursor works

- [ ] **Step 9: Commit**

```bash
git add custom_components/better_notes/www/better-notes-panel.js
git commit -m "feat: integrate Tiptap WYSIWYG editor with autosave"
```

---

### Task 5: Add formatting toolbar

**Files:**
- Modify: `custom_components/better_notes/www/better-notes-panel.js`

**Interfaces:**
- Consumes: `this._editor` (Tiptap Editor from Task 4), `note.color`, `note.pinned`, `COLORS` array
- Produces:
  - `_toolbarHtml(note)` — full toolbar HTML
  - `_attachToolbarListeners(note)` — wires all buttons to editor commands
  - `_updateToolbarState(note)` — updates pin active state and color swatch active class

- [ ] **Step 1: Replace `_toolbarHtml()` with full implementation**

```js
_toolbarHtml(note) {
  const colorSwatches = COLORS.map(c => `
    <div class="tb-color-dot ${note.color === c ? 'active' : ''}"
         style="background:${this._safeColor(c)}" data-color="${c}"></div>
  `).join('');

  return `
    <div class="toolbar-group" id="tbGroupHeading">
      <button class="tb-btn" id="tbHeading">H <span class="tb-caret">▾</span></button>
      <div class="tb-dropdown" id="tbDropHeading">
        <button class="tb-dd-item" data-action="paragraph">Normal</button>
        <button class="tb-dd-item" data-action="h1">H1</button>
        <button class="tb-dd-item" data-action="h2">H2</button>
        <button class="tb-dd-item" data-action="h3">H3</button>
      </div>
    </div>
    <div class="toolbar-group" id="tbGroupFormat">
      <button class="tb-btn" id="tbFormat">B <span class="tb-caret">▾</span></button>
      <div class="tb-dropdown" id="tbDropFormat">
        <button class="tb-dd-item" data-action="bold">Bold</button>
        <button class="tb-dd-item" data-action="italic">Italic</button>
        <button class="tb-dd-item" data-action="strike">Strikethrough</button>
        <button class="tb-dd-item" data-action="highlight">Highlight</button>
      </div>
    </div>
    <div class="toolbar-group" id="tbGroupList">
      <button class="tb-btn" id="tbList">≡ <span class="tb-caret">▾</span></button>
      <div class="tb-dropdown" id="tbDropList">
        <button class="tb-dd-item" data-action="bulletList">Bullet list</button>
        <button class="tb-dd-item" data-action="orderedList">Numbered list</button>
        <button class="tb-dd-item" data-action="taskList">Checklist</button>
        <div class="tb-dd-divider"></div>
        <button class="tb-dd-item" data-action="indent">Indent</button>
        <button class="tb-dd-item" data-action="outdent">Outdent</button>
      </div>
    </div>
    <div class="toolbar-group" id="tbGroupColor">
      <button class="tb-btn" id="tbColor">🎨 <span class="tb-caret">▾</span></button>
      <div class="tb-dropdown" id="tbDropColor">
        <div class="tb-color-swatches">${colorSwatches}</div>
      </div>
    </div>
    <button class="tb-btn tb-pin-btn ${note.pinned ? 'active' : ''}" id="tbPin">📌</button>
    <div class="toolbar-group" id="tbGroupOverflow">
      <button class="tb-btn" id="tbOverflow">⋮</button>
      <div class="tb-dropdown" id="tbDropOverflow">
        <button class="tb-dd-item" data-action="link">Link</button>
      </div>
    </div>
    <div class="tb-link-row" id="tbLinkRow" style="display:none">
      <input type="url" class="tb-link-input" id="tbLinkUrl" placeholder="https://…">
      <button class="tb-link-action-btn" id="tbLinkApply">Apply</button>
      <button class="tb-link-action-btn" id="tbLinkRemove">Remove</button>
      <button class="tb-link-action-btn" id="tbLinkCancel">✕</button>
    </div>
  `;
}
```

- [ ] **Step 2: Replace `_attachToolbarListeners()` with full implementation**

```js
_attachToolbarListeners(note) {
  const root = this;

  // Dropdown toggle logic
  const dropdownPairs = [
    ['tbHeading', 'tbGroupHeading'],
    ['tbFormat', 'tbGroupFormat'],
    ['tbList', 'tbGroupList'],
    ['tbColor', 'tbGroupColor'],
    ['tbOverflow', 'tbGroupOverflow'],
  ];

  const closeAllDropdowns = () => {
    dropdownPairs.forEach(([, groupId]) => {
      root.querySelector(`#${groupId}`)?.classList.remove('open');
    });
  };

  dropdownPairs.forEach(([btnId, groupId]) => {
    root.querySelector(`#${btnId}`)?.addEventListener('click', e => {
      e.stopPropagation();
      const group = root.querySelector(`#${groupId}`);
      const wasOpen = group?.classList.contains('open');
      closeAllDropdowns();
      if (!wasOpen) group?.classList.add('open');
    });
  });

  document.addEventListener('click', closeAllDropdowns, { once: false });
  this._closeDropdownsHandler = closeAllDropdowns;

  // Heading actions
  root.querySelector('[data-action="paragraph"]')?.addEventListener('click', () => {
    this._editor?.chain().focus().setParagraph().run();
    closeAllDropdowns();
  });
  [1, 2, 3].forEach(level => {
    root.querySelector(`[data-action="h${level}"]`)?.addEventListener('click', () => {
      this._editor?.chain().focus().toggleHeading({ level }).run();
      closeAllDropdowns();
    });
  });

  // Format actions
  root.querySelector('[data-action="bold"]')?.addEventListener('click', () => {
    this._editor?.chain().focus().toggleBold().run();
    closeAllDropdowns();
  });
  root.querySelector('[data-action="italic"]')?.addEventListener('click', () => {
    this._editor?.chain().focus().toggleItalic().run();
    closeAllDropdowns();
  });
  root.querySelector('[data-action="strike"]')?.addEventListener('click', () => {
    this._editor?.chain().focus().toggleStrike().run();
    closeAllDropdowns();
  });
  root.querySelector('[data-action="highlight"]')?.addEventListener('click', () => {
    this._editor?.chain().focus().toggleHighlight().run();
    closeAllDropdowns();
  });

  // List actions
  root.querySelector('[data-action="bulletList"]')?.addEventListener('click', () => {
    this._editor?.chain().focus().toggleBulletList().run();
    closeAllDropdowns();
  });
  root.querySelector('[data-action="orderedList"]')?.addEventListener('click', () => {
    this._editor?.chain().focus().toggleOrderedList().run();
    closeAllDropdowns();
  });
  root.querySelector('[data-action="taskList"]')?.addEventListener('click', () => {
    this._editor?.chain().focus().toggleTaskList().run();
    closeAllDropdowns();
  });
  root.querySelector('[data-action="indent"]')?.addEventListener('click', () => {
    this._editor?.chain().focus().sinkListItem('listItem').run();
    closeAllDropdowns();
  });
  root.querySelector('[data-action="outdent"]')?.addEventListener('click', () => {
    this._editor?.chain().focus().liftListItem('listItem').run();
    closeAllDropdowns();
  });

  // Color swatches
  root.querySelectorAll('.tb-color-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      this._setColor(dot.dataset.color);
      closeAllDropdowns();
    });
  });

  // Pin button
  root.querySelector('#tbPin')?.addEventListener('click', () => this._togglePin());

  // Link (overflow)
  root.querySelector('[data-action="link"]')?.addEventListener('click', () => {
    closeAllDropdowns();
    const linkRow = root.querySelector('#tbLinkRow');
    if (linkRow) {
      linkRow.style.display = 'flex';
      const existing = this._editor?.getAttributes('link').href || '';
      root.querySelector('#tbLinkUrl').value = existing;
      root.querySelector('#tbLinkUrl').focus();
    }
  });

  root.querySelector('#tbLinkApply')?.addEventListener('click', () => {
    const url = root.querySelector('#tbLinkUrl')?.value?.trim();
    if (url && this._isValidUrl(url)) {
      this._editor?.chain().focus().setLink({ href: url }).run();
    }
    root.querySelector('#tbLinkRow').style.display = 'none';
  });

  root.querySelector('#tbLinkRemove')?.addEventListener('click', () => {
    this._editor?.chain().focus().unsetLink().run();
    root.querySelector('#tbLinkRow').style.display = 'none';
  });

  root.querySelector('#tbLinkCancel')?.addEventListener('click', () => {
    root.querySelector('#tbLinkRow').style.display = 'none';
  });
}

_isValidUrl(str) {
  try { new URL(str); return true; } catch { return false; }
}
```

- [ ] **Step 3: Replace `_updateToolbarState()` with full implementation**

```js
_updateToolbarState(note) {
  const pinBtn = this.querySelector('#tbPin');
  if (pinBtn) pinBtn.classList.toggle('active', !!note.pinned);

  this.querySelectorAll('.tb-color-dot').forEach(dot => {
    dot.classList.toggle('active', dot.dataset.color === note.color);
  });
}
```

- [ ] **Step 4: Clean up `document` event listener on editor destroy**

In `disconnectedCallback()`, after `this._editor.destroy()`:
```js
if (this._closeDropdownsHandler) {
  document.removeEventListener('click', this._closeDropdownsHandler);
  this._closeDropdownsHandler = null;
}
```

Also add `this._closeDropdownsHandler = null;` to the constructor.

- [ ] **Step 5: Add toolbar CSS to `_initStyles()`**

Add inside the main style block:

```css
.bn-panel .formatting-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 8px 12px;
  background: #fff;
  border-top: 1px solid var(--border);
  flex-shrink: 0;
}

.bn-panel .toolbar-group { position: relative; }

.bn-panel .tb-btn {
  padding: 6px 10px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 3px;
  white-space: nowrap;
}
.bn-panel .tb-btn:hover { background: #f5f5f5; }
.bn-panel .tb-btn.active { background: #fff3e0; border-color: #FF9800; }

.bn-panel .tb-caret { font-size: 10px; }

.bn-panel .tb-dropdown {
  display: none;
  position: absolute;
  bottom: calc(100% + 6px);
  left: 0;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  z-index: 200;
  min-width: 150px;
  padding: 4px 0;
}
.bn-panel .toolbar-group.open .tb-dropdown { display: block; }

.bn-panel .tb-dd-item {
  display: block;
  width: 100%;
  padding: 8px 14px;
  text-align: left;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 14px;
  white-space: nowrap;
}
.bn-panel .tb-dd-item:hover { background: #f5f5f5; }

.bn-panel .tb-dd-divider { height: 1px; background: var(--border); margin: 4px 0; }

.bn-panel .tb-color-swatches {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 10px;
}
.bn-panel .tb-color-dot {
  width: 24px; height: 24px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid transparent;
  transition: transform 0.1s;
}
.bn-panel .tb-color-dot:hover { transform: scale(1.1); }
.bn-panel .tb-color-dot.active { border-color: #333; }

.bn-panel .tb-link-row {
  display: none;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 6px 0 2px;
  flex-basis: 100%;
}
.bn-panel .tb-link-input {
  flex: 1;
  padding: 5px 8px;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 13px;
  min-width: 0;
}
.bn-panel .tb-link-action-btn {
  padding: 5px 10px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  font-size: 13px;
  flex-shrink: 0;
}
.bn-panel .tb-link-action-btn:hover { background: #f5f5f5; }

/* Desktop: toolbar at bottom — natural flex order (last child in panel-editor) */
.bn-panel .panel-editor {
  display: flex;
  flex-direction: column;
}
.bn-panel .editor-body { flex: 1; overflow-y: auto; padding: 20px 24px; }
.bn-panel .formatting-toolbar { order: 3; }

/* Mobile: toolbar below header, above editor body */
@media (max-width: 767px) {
  .bn-panel .editor-body { order: 3; }
  .bn-panel .formatting-toolbar {
    order: 2;
    border-top: none;
    border-bottom: 1px solid var(--border);
  }
  .bn-panel .tb-dropdown {
    top: calc(100% + 6px);
    bottom: auto;
  }
}
```

- [ ] **Step 6: Manual verification**

Copy `www/` to HA, restart. Confirm:
- Toolbar renders with 6 buttons (H▾ B▾ ≡▾ 🎨▾ 📌 ⋮)
- Desktop: toolbar appears at bottom of editor
- Mobile (narrow window): toolbar appears below header, above content
- H▾ dropdown: Normal/H1/H2/H3 apply heading correctly
- B▾: Bold/Italic/Strikethrough/Highlight apply correctly
- ≡▾: Bullet/Numbered/Checklist toggle correctly; Indent/Outdent work inside lists
- 🎨▾: Color swatches update note color (active dot shows current color)
- 📌: Toggles pin state; button shows orange highlight when pinned
- ⋮ → Link: input row appears, URL validated, link applied to selection
- Dropdowns close on outside click
- Only one dropdown open at a time

- [ ] **Step 7: Commit**

```bash
git add custom_components/better_notes/www/better-notes-panel.js
git commit -m "feat: add formatting toolbar (headings, bold/italic/strike/highlight, lists, color, pin, link)"
```

---

### Task 6: Fix list preview and search for HTML content

**Files:**
- Modify: `custom_components/better_notes/www/better-notes-panel.js`

**Interfaces:**
- Consumes: `_stripHtml(html)` from Task 3
- Produces: updated `_filteredNotes()` that strips HTML before searching

Note: `_renderList()` already calls `_stripHtml()` on preview text (added in Task 3, Step 2). This task only fixes search.

- [ ] **Step 1: Update `_filteredNotes()` to strip HTML before searching**

Replace the existing `_filteredNotes()`:

```js
_filteredNotes() {
  const term = this._searchTerm.toLowerCase();
  if (!term) return this._notes;
  return this._notes.filter(n =>
    (n.title || '').toLowerCase().includes(term) ||
    this._stripHtml(n.content || '').toLowerCase().includes(term)
  );
}
```

- [ ] **Step 2: Manual verification**

Copy `www/` to HA, restart. Create a note with formatted content (e.g. a bold word). Confirm:
- The note list preview shows plain text (no HTML tags)
- Searching for the bold word finds the note
- Searching for an HTML tag like `strong` does NOT match the note

- [ ] **Step 3: Commit**

```bash
git add custom_components/better_notes/www/better-notes-panel.js
git commit -m "fix: strip HTML tags in note list preview and search"
```

---

### Task 7: Update Lovelace card for rich text rendering

**Files:**
- Modify: `custom_components/better_notes/www/better-notes-card.js`

**Interfaces:**
- Consumes: `note.content` as HTML string (produced by Task 4)
- Produces: card that renders HTML formatting instead of escaped plain text

- [ ] **Step 1: Add a `_stripHtml()` helper to the card class**

Inside `BetterNotesCard`, before `getCardSize()`, add:

```js
_stripHtml(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || '';
}
```

- [ ] **Step 2: Change `renderSingleNote()` to use a placeholder for content**

Replace:
```js
<div class="note-content">${this.escapeHtml(note.content)}</div>
```
with:
```js
<div class="note-content" data-note-content="${note.note_id}"></div>
```

- [ ] **Step 3: Change `renderNotesList()` to use a placeholder for content**

Replace:
```js
<div class="note-content">${this.truncateText(this.escapeHtml(note.content), 150)}</div>
```
with:
```js
<div class="note-content" data-note-content="${note.note_id}"></div>
```

- [ ] **Step 4: Update `render()` to set `innerHTML` on content divs after rendering**

In the `render()` method, after `this.shadowRoot.innerHTML = \`...\`` and before `this.attachEventListeners()`, add:

```js
this.shadowRoot.querySelectorAll('[data-note-content]').forEach(el => {
  const noteId = el.dataset.noteContent;
  const n = this._notes.find(note => note.note_id === noteId);
  if (!n) return;
  const isListView = !this._config.note_id;
  if (isListView) {
    const plain = this._stripHtml(n.content || '');
    el.textContent = plain.length > 150 ? plain.substring(0, 150) + '…' : plain;
  } else {
    el.innerHTML = n.content || '';
  }
});
```

Note: The list view uses plain text (truncated) for the card preview. The single-note view renders full HTML. This keeps the list cards readable.

- [ ] **Step 5: Remove `white-space: pre-wrap` from card CSS**

Find in the card's `<style>` block:
```css
.note-content {
  font-size: 14px;
  color: rgba(0,0,0,0.6);
  line-height: 1.5;
  white-space: pre-wrap;
  word-wrap: break-word;
}
```
Replace with:
```css
.note-content {
  font-size: 14px;
  color: rgba(0,0,0,0.6);
  line-height: 1.5;
  word-wrap: break-word;
}
```

- [ ] **Step 6: Add rich text CSS to the card**

In the card's `<style>` block, add after `.note-content { ... }`:

```css
.note-content h1 { font-size: 18px; font-weight: 700; margin: 4px 0; }
.note-content h2 { font-size: 16px; font-weight: 600; margin: 4px 0; }
.note-content h3 { font-size: 14px; font-weight: 600; margin: 4px 0; }
.note-content ul, .note-content ol { margin: 4px 0; padding-left: 20px; }
.note-content li { margin-bottom: 2px; }
.note-content ul[data-type="taskList"] { list-style: none; padding-left: 0; }
.note-content ul[data-type="taskList"] li { display: flex; align-items: flex-start; gap: 4px; }
.note-content mark { background: #fff176; padding: 1px 2px; border-radius: 2px; }
.note-content a { color: inherit; text-decoration: underline; }
.note-content s { text-decoration: line-through; }
```

- [ ] **Step 7: Manual verification**

Copy `www/` to HA, restart. Add the `better-notes-card` to a dashboard. Confirm:
- Single-note card shows formatted HTML (bold, headings, lists render correctly)
- Notes list card shows plain-text preview (no HTML tags visible)
- Old plain-text notes still display their content correctly
- No console errors

- [ ] **Step 8: Commit**

```bash
git add custom_components/better_notes/www/better-notes-card.js
git commit -m "feat: render rich text HTML in Lovelace card"
```

---

## Self-Review

**Spec coverage:**

| Spec requirement | Task |
|---|---|
| Remove shadow DOM from panel | Task 2 |
| Split render cycle (_renderList / _renderEditor) | Task 3 |
| Tiptap bundle (esbuild, committed) | Task 1 |
| Extensions: StarterKit, TaskList, TaskItem, Link, Highlight | Task 4 |
| onUpdate autosave | Task 4 |
| Toolbar: H▾ (Normal/H1/H2/H3) | Task 5 |
| Toolbar: B▾ (Bold/Italic/Strike/Highlight) | Task 5 |
| Toolbar: ≡▾ (Bullet/Ordered/Checklist/Indent/Outdent) | Task 5 |
| Toolbar: 🎨▾ (color swatches, replaces old row) | Task 5 |
| Toolbar: 📌 pin with active state | Task 5 |
| Toolbar: ⋮ overflow (Link) | Task 5 |
| Desktop: toolbar at bottom | Task 5 |
| Mobile: toolbar at top (below header) | Task 5 |
| Old editor-toolbar row removed | Task 3 (_editorShell has no editor-toolbar) |
| HTML stored via editor.getHTML() | Task 4 |
| Old plain-text notes: auto-wrapped by Tiptap, no migration | Task 4 |
| List preview: strip HTML | Task 3 |
| Search: strip HTML | Task 6 |
| Card: innerHTML rendering | Task 7 |
| Card: remove white-space: pre-wrap | Task 7 |
| Card: rich text CSS | Task 7 |
| Bundle load failure: textarea fallback | Task 4 |
| Editor init failure: textarea fallback | Task 4 |
| Save with no editor: textarea fallback | Task 4 |
| Link: URL validation | Task 5 |

All spec requirements covered. ✓
