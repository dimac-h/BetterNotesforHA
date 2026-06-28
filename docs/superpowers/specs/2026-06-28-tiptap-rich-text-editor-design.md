# Tiptap Rich Text Editor — Design Spec

**Date**: 2026-06-28
**Branch**: feature/tiptap-rich-text (to be created)

---

## Overview

Replace the plain `<textarea>` in `better-notes-panel.js` with a Tiptap WYSIWYG editor. Add a custom formatting toolbar. Update `better-notes-card.js` to render HTML content. No backend changes.

---

## 1. Architecture

### Files changed
- `custom_components/better_notes/www/better-notes-panel.js` — editor + toolbar
- `custom_components/better_notes/www/better-notes-card.js` — rich text rendering
- `custom_components/better_notes/www/tiptap-bundle.js` — new, committed bundle (generated once)

No Python files change. Storage schema is unchanged (`content` is already a plain `str`).

### Shadow DOM removal from panel
`attachShadow` is removed from `BetterNotesPanel`. All `this.shadowRoot` references become `this`. HA's own styles live inside its shadow root and do not bleed into the panel. This is required for Tiptap/ProseMirror to work correctly in Firefox, where `document.getSelection()` does not see selections inside shadow DOM.

The Lovelace card (`BetterNotesCard`) retains shadow DOM — it genuinely needs style encapsulation from HA's dashboard.

### Render cycle split
The current `_render()` rebuilds the entire panel innerHTML on every state change. With Tiptap this would destroy the editor instance on each update. The fix:

- `_renderList()` — rebuilds only the left-side notes list. Called on any state change (search, note selection, load).
- `_renderEditor(noteId)` — called once when a note is selected. Creates the Tiptap instance and mounts it. On subsequent auto-saves or list refreshes, the editor content is updated imperatively via `editor.commands.setContent(html)` rather than rebuilding the DOM.

### Tiptap instance lifecycle
- Created: `_selectNote(id)` — mounts to a persistent `#tiptap-mount` div in the editor panel.
- Updated: `editor.commands.setContent(html)` when the same editor switches to a different note.
- Destroyed: `editor.destroy()` in `disconnectedCallback()` and before mounting a new instance.

---

## 2. Tiptap Bundle

### Generation (one-time dev step)
```bash
npx esbuild \
  --bundle \
  --format=iife \
  --global-name=TiptapBundle \
  --outfile=custom_components/better_notes/www/tiptap-bundle.js \
  scripts/tiptap-entry.js
```

Where `scripts/tiptap-entry.js` exports the required extensions:
```js
export { Editor } from '@tiptap/core'
export { StarterKit } from '@tiptap/starter-kit'
export { TaskList } from '@tiptap/extension-task-list'
export { TaskItem } from '@tiptap/extension-task-item'
export { Link } from '@tiptap/extension-link'
export { Highlight } from '@tiptap/extension-highlight'
```

The resulting `tiptap-bundle.js` is committed to the repo. It is not regenerated unless Tiptap is upgraded.

### Loading
The panel loads the bundle dynamically at init time (before the user opens any note) via a `<script>` tag pointing to the HA static URL for the integration's `www/` directory.

### Extensions configured
| Extension | Config |
|---|---|
| `StarterKit` | `heading: { levels: [1, 2, 3] }` |
| `TaskList` | defaults |
| `TaskItem` | `nested: true` |
| `Link` | `openOnClick: false` |
| `Highlight` | defaults |

---

## 3. Toolbar

### Layout
Single toolbar. Same on desktop and mobile. Positioned:
- **Desktop**: docked to the bottom of the editor panel (sticky)
- **Mobile**: docked to the top of the editor panel, below the Save/Delete/Back header

### Buttons
```
H▾   B▾   ≡▾   🎨▾   📌   ⋮
```

| Button | Dropdown contents |
|---|---|
| **H▾** | Normal text, H1, H2, H3 |
| **B▾** | Bold, Italic, Strikethrough, Highlight |
| **≡▾** | Bullet list, Numbered list, Checklist, divider, Indent, Outdent |
| **🎨▾** | 10 color swatches (existing COLORS array) |
| **📌** | Pin toggle — no dropdown |
| **⋮** | Link |

### Behaviour
- Heading, list type buttons: mutually exclusive toggles. Clicking the active type returns to normal/no-list.
- Indent/Outdent: call `sinkListItem` / `liftListItem`. Have no effect outside a list.
- Link: opens an inline URL input below the toolbar. Validates URL before applying. Empty/invalid input closes without applying.
- **📌 Pin**: the only button with a persistent active state — visually distinct (e.g. highlighted background or filled icon) when the current note is pinned.
- No active state on any other button.
- No visual dividers between buttons.

### Removed
The existing `editor-toolbar` row (pin toggle + color dots) is removed. Colors and pin are now in the formatting toolbar.

---

## 4. Storage & Data Flow

### Content format
`note.content` becomes an HTML string (e.g. `<p>Hello <strong>world</strong></p>`). The Python backend is unchanged.

### Read path
`editor.commands.setContent(note.content)` on note open. Old plain-text notes are wrapped in `<p>` by Tiptap automatically. No data is written back until the user edits.

### Write path
Auto-save reads `editor.getHTML()` via Tiptap's `onUpdate` callback (1-second debounce, same as today). Manual Save button does the same.

### Note list preview
Strip HTML tags before truncating: `div.textContent = html` gives plain text, then `.substring(0, 60)`.

### Search
Same strip-then-search: HTML tags removed before matching `_filteredNotes()` against the search term.

### Card rendering
- Replace `escapeHtml(note.content)` with direct `innerHTML` assignment (content is user-authored).
- Remove `white-space: pre-wrap` CSS.
- Add card CSS for rendered HTML elements: `ul`, `ol`, `li`, `h1`–`h3`, `strong`, `em`, `a`, `s`, task list checkboxes (`input[type=checkbox]`).

---

## 5. Error Handling

| Scenario | Behaviour |
|---|---|
| `tiptap-bundle.js` fails to load | Fall back to plain `<textarea>`. Log warning to console. |
| `new Editor(...)` throws | Same textarea fallback. Note remains editable. |
| Save with no Tiptap instance | Read `textarea.value` if editor absent (consistent with fallback). |
| Link input invalid/empty | Close prompt without applying. No error shown. |
| Old note with literal `<`/`>` in content | Renders as HTML — accepted edge case under no-migration policy. |

---

## Out of Scope

- Tags feature (no changes)
- Python backend / storage schema
- HACS metadata / manifest
- `better-notes-card-editor` (config UI for the card)
- Any migration of existing note content
