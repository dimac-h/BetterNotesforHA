# HA-Native Frontend Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the Better Notes panel and Lovelace card as TypeScript/LitElement components using Home Assistant's own native elements and theme tokens, bundled with Vite, with a CI-built HACS zip release — replacing the current hand-rolled vanilla-JS frontend without changing any backend behavior.

**Architecture:** A new `custom_components/better_notes/frontend/` TypeScript project (Vite + Lit + `@mdi/js`, no CDN) compiles to `www/better-notes-panel.js` and `www/better-notes-card.js`. Components use native HA elements (`ha-card`, `ha-input`, `ha-button`, `ha-icon-button`, `ha-checkbox`/`ha-formfield`) and HA CSS custom properties instead of a custom design system. The existing inline split-view UX (list pane + editor pane, no modal) and the Tiptap rich-text editor are preserved behaviorally; only the chrome changes.

**Tech Stack:** TypeScript, Lit 3, `@mdi/js`, Vite, Node 24. GitHub Actions for CI (hassfest/HACS validation + build-and-zip release).

**Spec:** `docs/superpowers/specs/2026-08-23-ha-native-frontend-redesign-design.md`

## Global Constraints

- No backend (Python) changes — `__init__.py`, `storage.py`, `config_flow.py`, `const.py`, the four services, and the four events stay exactly as they are.
- Target component set is HA 2026.5+ (per `hacs.json`'s `"homeassistant": "2026.8.0"`): use `ha-input` (not the removed `ha-textfield`), `ha-button` (not the removed `ha-fab`/deprecated `mwc-button`).
- No automated test suite exists in this repo and this work doesn't introduce one (per the spec's Testing section) — verification is `npm run build` / `tsc --noEmit` per task, plus a manual functional pass via `dev/docker-compose.yml` at the end.
- Behavior parity: every interaction in the current `www/better-notes-panel.js` and `www/better-notes-card.js` (search, create, autosave-on-type with 1s debounce, two-click delete confirm with 3s timeout, pin, 10-color picker, link editor, tag *display* only — no tag editing exists today and none is being added) must still work identically after the rewrite.
- `frontend/dist/` is gitignored — not committed.
- The existing root-level `package.json`/`package-lock.json` + `scripts/tiptap-entry.js` esbuild pipeline (which produces the committed `www/tiptap-bundle.js` IIFE, currently pinned to Tiptap `3.27.1`) is removed — the same Tiptap packages (`@tiptap/core`, `@tiptap/starter-kit`, `@tiptap/extension-task-list`, `@tiptap/extension-task-item`, `@tiptap/extension-link`, `@tiptap/extension-highlight`) move into `frontend/package.json`, bumped to the latest release (`3.30.3`), and are loaded via dynamic `import()` instead.

---

## File Structure

```
custom_components/better_notes/
  frontend/
    package.json
    tsconfig.json
    vite.config.ts
    src/
      ha-types.ts          # HomeAssistant/Connection type shims
      api.ts                # service-call wrappers + event subscription + Note type
      colors.ts             # NOTE_COLORS, safeColor, formatRelativeDate, stripHtml
      sanitize.ts           # sanitizeNoteHtml (ported allow-list sanitizer)
      panel.ts              # <better-notes-panel>, root of the sidebar panel
      card.ts               # <better-notes-card>, Lovelace card
      card-editor.ts         # <better-notes-card-editor>, card visual config editor
      components/
        note-list.ts
        note-list-item.ts
        note-editor.ts
        note-toolbar.ts
        tiptap-editor.ts
  www/
    better-notes-panel.js   # build output (copied from frontend/dist/, includes a lazy Tiptap chunk)
    better-notes-card.js    # build output (copied from frontend/dist/)
.github/workflows/
  validate.yml
  release.yml
hacs.json                    # gains zip_release + filename
```

Removed as part of this plan: root `package.json`, `package-lock.json`, `scripts/tiptap-entry.js`, and the committed `custom_components/better_notes/www/tiptap-bundle.js` artifact — see Task 1 Step 11.

---

### Task 1: Frontend project scaffold + shared modules

**Files:**
- Create: `custom_components/better_notes/frontend/package.json`
- Create: `custom_components/better_notes/frontend/tsconfig.json`
- Create: `custom_components/better_notes/frontend/vite.config.ts`
- Create: `custom_components/better_notes/frontend/src/ha-types.ts`
- Create: `custom_components/better_notes/frontend/src/api.ts`
- Create: `custom_components/better_notes/frontend/src/colors.ts`
- Create: `custom_components/better_notes/frontend/src/sanitize.ts`
- Create: `custom_components/better_notes/frontend/src/panel.ts` (placeholder — replaced in Task 7)
- Create: `custom_components/better_notes/frontend/src/card.ts` (placeholder — replaced in Task 8)

**Interfaces:**
- Produces: `Note` interface, `getNotes`, `createNote`, `updateNote`, `deleteNote`, `subscribeNoteEvents` from `api.ts`; `NOTE_COLORS`, `safeColor`, `formatRelativeDate`, `stripHtml` from `colors.ts`; `sanitizeNoteHtml` from `sanitize.ts`; `HomeAssistant`, `Connection` from `ha-types.ts`. All later tasks import from these.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "better-notes-frontend",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "engines": { "node": ">=24" },
  "scripts": {
    "build": "tsc --noEmit && vite build",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@mdi/js": "^7.4.47",
    "lit": "^3.3.3",
    "@tiptap/core": "3.30.3",
    "@tiptap/starter-kit": "3.30.3",
    "@tiptap/extension-task-list": "3.30.3",
    "@tiptap/extension-task-item": "3.30.3",
    "@tiptap/extension-link": "3.30.3",
    "@tiptap/extension-highlight": "3.30.3"
  },
  "devDependencies": {
    "typescript": "^7.0.2",
    "vite": "^8.2.1"
  }
}
```

Tiptap versions are pinned exactly (no `^`), same policy as the root `package.json` this replaces (which pinned `3.27.1` across the board) — bumped here to the latest available release, `3.30.3`, since re-pinning is happening anyway. Tiptap extensions must all be on the same version to avoid cross-package schema mismatches, so this project pins all of them together rather than letting them drift independently.

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "strict": true,
    "useDefineForClassFields": false,
    "experimentalDecorators": true,
    "skipLibCheck": true,
    "noEmit": true
  },
  "include": ["src"]
}
```

`useDefineForClassFields: false` is required for Lit's `@property`/`@state` decorators to work correctly under legacy decorator semantics.

- [ ] **Step 3: Create `vite.config.ts`**

```typescript
import { defineConfig } from 'vite';

// HA serves the built output from /better_notes_panel/ (see __init__.py's
// static path registration) — base must match so any future chunk/asset
// imports resolve correctly.
export default defineConfig({
  base: '/better_notes_panel/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    lib: {
      entry: {
        'better-notes-panel': 'src/panel.ts',
        'better-notes-card': 'src/card.ts',
      },
      formats: ['es'],
    },
    rollupOptions: {
      output: {
        entryFileNames: '[name].js',
      },
    },
  },
});
```

- [ ] **Step 4: Create `src/ha-types.ts`**

```typescript
/** Minimal HA frontend types for what this integration's frontend actually uses. */

export type UnsubscribeFunc = () => void;

export interface Connection {
  sendMessagePromise<T>(message: Record<string, unknown>): Promise<T>;
  subscribeEvents<T>(callback: (ev: T) => void, eventType: string): Promise<UnsubscribeFunc>;
}

export interface HomeAssistant {
  connection: Connection;
  callService(domain: string, service: string, data?: Record<string, unknown>): Promise<unknown>;
}
```

- [ ] **Step 5: Create `src/colors.ts`**

```typescript
// Ported verbatim from the current www/better-notes-panel.js COLORS array —
// this is the toolbar/create-note palette, distinct from const.py's
// DEFAULT_COLORS (which the backend uses only for schema validation
// defaults, not anything the frontend reads).
export const NOTE_COLORS = [
  '#E8D44D', // warm yellow
  '#E09455', // amber
  '#C96060', // muted red
  '#C4607A', // dusty rose
  '#9068A8', // muted purple
  '#5868A0', // slate indigo
  '#4A85B8', // sky blue
  '#3C9AAA', // teal-cyan
  '#3A9080', // teal
  '#52A068', // sage green
];

export function safeColor(color: string | undefined | null): string {
  return color && /^#[0-9a-fA-F]{6}$|^#[0-9a-fA-F]{3}$/.test(color) ? color : '#FFEB3B';
}

export function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
}

export function stripHtml(html: string): string {
  return new DOMParser().parseFromString(html, 'text/html').body.textContent || '';
}
```

- [ ] **Step 6: Create `src/sanitize.ts`**

```typescript
// Ported verbatim from the current www/better-notes-card.js _sanitizeHtml —
// used by the card's single-note view, which renders note HTML directly.
const ALLOWED_TAGS = new Set([
  'p', 'br', 'strong', 'b', 'em', 'i', 's', 'u', 'mark',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'a', 'blockquote', 'code', 'pre',
  'input', 'label', 'span', 'div',
]);
const ALLOWED_ATTRS_BY_TAG: Record<string, string[]> = {
  a: ['href', 'target', 'rel'],
  input: ['type', 'checked', 'disabled'],
};
const SAFE_PROTOCOLS = /^(https?:|mailto:)/i;

function sanitizeNode(node: Node): void {
  if (node.nodeType === Node.TEXT_NODE) return;
  if (node.nodeType !== Node.ELEMENT_NODE) {
    node.parentNode?.removeChild(node);
    return;
  }
  const el = node as Element;
  const tag = el.tagName.toLowerCase();
  if (!ALLOWED_TAGS.has(tag)) {
    const parent = el.parentNode;
    while (el.firstChild) parent?.insertBefore(el.firstChild, el);
    parent?.removeChild(el);
    return;
  }
  const allowed = ALLOWED_ATTRS_BY_TAG[tag] || [];
  Array.from(el.attributes).forEach(attr => {
    if (!allowed.includes(attr.name) && attr.name !== 'data-type' && attr.name !== 'data-checked') {
      el.removeAttribute(attr.name);
    }
  });
  if (tag === 'a') {
    const href = el.getAttribute('href') || '';
    if (!SAFE_PROTOCOLS.test(href)) el.removeAttribute('href');
    el.setAttribute('rel', 'noopener noreferrer');
  }
  Array.from(el.childNodes).forEach(sanitizeNode);
}

export function sanitizeNoteHtml(htmlText: string): string {
  const doc = new DOMParser().parseFromString(htmlText, 'text/html');
  Array.from(doc.body.childNodes).forEach(sanitizeNode);
  return doc.body.innerHTML;
}
```

- [ ] **Step 7: Create `src/api.ts`**

```typescript
import type { HomeAssistant } from './ha-types';

export interface Note {
  note_id: string;
  title: string;
  content: string;
  color: string;
  pinned: boolean;
  created: string;
  modified: string;
  tags: string[];
}

export async function getNotes(hass: HomeAssistant): Promise<Note[]> {
  const result = await hass.connection.sendMessagePromise<{ response: { notes: Note[] } }>({
    type: 'call_service',
    domain: 'better_notes',
    service: 'get_notes',
    service_data: {},
    return_response: true,
  });
  return result.response?.notes ?? [];
}

export async function createNote(
  hass: HomeAssistant,
  params: { title: string; content: string; color: string; pinned: boolean },
): Promise<string | undefined> {
  const result = await hass.connection.sendMessagePromise<{ response: { note_id: string } }>({
    type: 'call_service',
    domain: 'better_notes',
    service: 'create_note',
    service_data: params,
    return_response: true,
  });
  return result.response?.note_id;
}

export async function updateNote(
  hass: HomeAssistant,
  params: { note_id: string; title?: string; content?: string; color?: string; pinned?: boolean },
): Promise<void> {
  await hass.callService('better_notes', 'update_note', params);
}

export async function deleteNote(hass: HomeAssistant, noteId: string): Promise<void> {
  await hass.callService('better_notes', 'delete_note', { note_id: noteId });
}

export function subscribeNoteEvents(hass: HomeAssistant, onEvent: () => void): Promise<() => void> {
  const events = ['better_notes_note_created', 'better_notes_note_updated', 'better_notes_note_deleted'];
  return Promise.all(events.map(e => hass.connection.subscribeEvents(onEvent, e))).then(
    unsubs => () => unsubs.forEach(fn => fn()),
  );
}
```

- [ ] **Step 8: Create placeholder `src/panel.ts` and `src/card.ts`**

```typescript
// src/panel.ts
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('better-notes-panel')
export class BetterNotesPanel extends LitElement {
  render() {
    return html`<p>Better Notes panel — build placeholder</p>`;
  }
}
```

```typescript
// src/card.ts
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('better-notes-card')
export class BetterNotesCard extends LitElement {
  render() {
    return html`<p>Better Notes card — build placeholder</p>`;
  }
}
```

- [ ] **Step 9: Install dependencies and build**

Run:
```bash
cd custom_components/better_notes/frontend
npm install
npm run build
```
Expected: `npm run build` completes with no TypeScript errors, producing `dist/better-notes-panel.js` and `dist/better-notes-card.js`.

- [ ] **Step 10: Remove the old root-level Tiptap build pipeline**

Its deps now live in `frontend/package.json` (Step 1) and its loading mechanism is replaced in Task 2.

```bash
git rm package.json package-lock.json scripts/tiptap-entry.js
git rm custom_components/better_notes/www/tiptap-bundle.js
rmdir scripts 2>/dev/null || true
```

- [ ] **Step 11: Commit**

```bash
git add -A custom_components/better_notes/frontend/package.json \
        custom_components/better_notes/frontend/package-lock.json \
        custom_components/better_notes/frontend/tsconfig.json \
        custom_components/better_notes/frontend/vite.config.ts \
        custom_components/better_notes/frontend/src
git commit -m "feat: scaffold frontend build (Vite + Lit + TypeScript)"
```

---

### Task 2: Tiptap editor wrapper

**Files:**
- Create: `custom_components/better_notes/frontend/src/tiptap-extensions.ts`
- Create: `custom_components/better_notes/frontend/src/components/tiptap-editor.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks besides the toolchain.
- Produces: `loadTiptapExtensions()` from `tiptap-extensions.ts` (consumed only by `tiptap-editor.ts`); `<better-notes-tiptap-editor>` element with `.content: string` property, `content-changed` CustomEvent (`detail: { html: string }`), and public methods `getHTML(): string`, `runAction(action: ToolbarAction, payload?: { href?: string }): void`, `getLinkHref(): string`. Exports the `ToolbarAction` type. Task 3 (`note-toolbar.ts`) consumes `ToolbarAction`; Task 4 (`note-editor.ts`) consumes the element, its events, and its methods.

`tiptap-extensions.ts` isolates *which* Tiptap packages are loaded from the editor lifecycle in `tiptap-editor.ts` — adding a future extension (the user has a list planned) is then a two-line change confined to this one file: `npm install @tiptap/extension-whatever` in `frontend/`, add one line to the `Promise.all` below and one line to the returned `extensions` array. No other file needs to change, and no separate build step exists anymore to remember to re-run (unlike the old `scripts/tiptap-entry.js` + `npm run build:tiptap` pipeline this replaces) — `npm run build` picks it up automatically.

- [ ] **Step 1: Create `src/tiptap-extensions.ts`**

```typescript
// Adding a new Tiptap extension: `npm install @tiptap/extension-X` in
// frontend/, then add it to the Promise.all below and to the returned
// extensions array. That's the whole surface area — tiptap-editor.ts
// never needs to change for a new extension.
export async function loadTiptapExtensions() {
  const [{ Editor }, { StarterKit }, { TaskList }, { TaskItem }, { Link }, { Highlight }] = await Promise.all([
    import('@tiptap/core'),
    import('@tiptap/starter-kit'),
    import('@tiptap/extension-task-list'),
    import('@tiptap/extension-task-item'),
    import('@tiptap/extension-link'),
    import('@tiptap/extension-highlight'),
  ]);
  return {
    Editor,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] }, link: false }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Link.configure({ openOnClick: false }),
      Highlight,
    ],
  };
}
```

- [ ] **Step 2: Create `src/components/tiptap-editor.ts`**

```typescript
import { LitElement, html, css } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { loadTiptapExtensions } from '../tiptap-extensions';

export type ToolbarAction =
  | 'paragraph' | 'h1' | 'h2' | 'h3'
  | 'bold' | 'italic' | 'strike' | 'highlight'
  | 'bulletList' | 'orderedList' | 'taskList' | 'indent' | 'outdent'
  | 'setLink' | 'unsetLink';

@customElement('better-notes-tiptap-editor')
export class BetterNotesTiptapEditor extends LitElement {
  static styles = css`
    :host { display: block; }
    .fallback {
      width: 100%; min-height: 300px; font-size: 15px; line-height: 1.6;
      border: none; outline: none; resize: none; color: var(--primary-text-color);
      background: transparent; font-family: inherit;
    }
  `;

  @property({ attribute: false }) content = '';

  @query('#mount') private _mount?: HTMLDivElement;

  private _editor: any = null;
  private _fallback = false;
  private _lastEmitted = '';

  async connectedCallback(): Promise<void> {
    super.connectedCallback();
    await this.updateComplete;
    this._init();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this._editor?.destroy();
    this._editor = null;
  }

  updated(changed: Map<string, unknown>): void {
    if (changed.has('content') && this._editor && this.content !== this._lastEmitted) {
      this._lastEmitted = this.content;
      this._editor.commands.setContent(this.content);
      this._editor.commands.focus('end');
    }
  }

  private async _init(): Promise<void> {
    let loaded: Awaited<ReturnType<typeof loadTiptapExtensions>> | null;
    try {
      loaded = await loadTiptapExtensions();
    } catch (err) {
      console.warn('Better Notes: Tiptap failed to load, falling back to textarea', err);
      loaded = null;
    }
    if (!loaded || !this._mount) {
      this._fallback = true;
      this.requestUpdate();
      return;
    }
    const { Editor, extensions } = loaded;
    this._lastEmitted = this.content;
    this._editor = new Editor({
      element: this._mount,
      extensions,
      content: this.content,
      autofocus: 'end',
      onUpdate: () => this._emitChanged(),
    });
  }

  private _emitChanged(): void {
    this._lastEmitted = this.getHTML();
    this.dispatchEvent(new CustomEvent('content-changed', {
      detail: { html: this._lastEmitted },
      bubbles: true,
      composed: true,
    }));
  }

  getHTML(): string {
    if (this._editor) return this._editor.getHTML();
    const textarea = this.renderRoot.querySelector('#fallback') as HTMLTextAreaElement | null;
    return textarea?.value ?? this.content;
  }

  getLinkHref(): string {
    return this._editor?.getAttributes('link').href ?? '';
  }

  runAction(action: ToolbarAction, payload?: { href?: string }): void {
    const chain = this._editor?.chain().focus();
    if (!chain) return;
    switch (action) {
      case 'paragraph': chain.setParagraph().run(); break;
      case 'h1': chain.toggleHeading({ level: 1 }).run(); break;
      case 'h2': chain.toggleHeading({ level: 2 }).run(); break;
      case 'h3': chain.toggleHeading({ level: 3 }).run(); break;
      case 'bold': chain.toggleBold().run(); break;
      case 'italic': chain.toggleItalic().run(); break;
      case 'strike': chain.toggleStrike().run(); break;
      case 'highlight': chain.toggleHighlight().run(); break;
      case 'bulletList': chain.toggleBulletList().run(); break;
      case 'orderedList': chain.toggleOrderedList().run(); break;
      case 'taskList': chain.toggleTaskList().run(); break;
      case 'indent': chain.sinkListItem('listItem').run(); break;
      case 'outdent': chain.liftListItem('listItem').run(); break;
      case 'setLink': if (payload?.href) chain.setLink({ href: payload.href }).run(); break;
      case 'unsetLink': chain.unsetLink().run(); break;
    }
  }

  render() {
    if (this._fallback) {
      return html`<textarea
        id="fallback"
        class="fallback"
        placeholder="Start typing..."
        .value=${this.content}
        @input=${() => this._emitChanged()}
      ></textarea>`;
    }
    return html`<div id="mount"></div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'better-notes-tiptap-editor': BetterNotesTiptapEditor;
  }
}
```

- [ ] **Step 2: Typecheck**

Run: `cd custom_components/better_notes/frontend && npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add custom_components/better_notes/frontend/src/components/tiptap-editor.ts
git commit -m "feat: add Tiptap editor wrapper component"
```

---

### Task 3: Formatting toolbar

**Files:**
- Create: `custom_components/better_notes/frontend/src/components/note-toolbar.ts`

**Interfaces:**
- Consumes: `NOTE_COLORS` from `../colors`; `ToolbarAction` type from `./tiptap-editor`.
- Produces: `<better-notes-toolbar>` element with `.pinned: boolean`, `.color: string`, `.linkHref: string` properties, and events: `toolbar-action` (`detail: { action: ToolbarAction; payload?: { href?: string } }`), `color-select` (`detail: { color: string }`), `pin-toggle` (no detail), `link-open-requested` (no detail, bubbles so `note-editor.ts` can read the current link href and set `.linkHref` before the row renders). Task 4 (`note-editor.ts`) consumes this element and all four events.

- [ ] **Step 1: Create `src/components/note-toolbar.ts`**

```typescript
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { NOTE_COLORS } from '../colors';
import type { ToolbarAction } from './tiptap-editor';

@customElement('better-notes-toolbar')
export class BetterNotesToolbar extends LitElement {
  static styles = css`
    :host {
      display: flex; flex-wrap: wrap; gap: 4px; padding: 8px 12px;
      background: var(--card-background-color); border-top: 1px solid var(--divider-color);
    }
    .group { position: relative; }
    .dropdown {
      display: none; position: absolute; bottom: calc(100% + 6px); left: 0;
      background: var(--card-background-color); border: 1px solid var(--divider-color);
      border-radius: 8px; box-shadow: var(--ha-box-shadow-m, 0 4px 16px rgba(0,0,0,0.2));
      z-index: 200; min-width: 150px; padding: 4px 0;
    }
    .group.open .dropdown { display: block; }
    .item {
      display: block; width: 100%; padding: 8px 14px; text-align: left; border: none;
      background: none; color: var(--primary-text-color); cursor: pointer; font-size: 14px;
    }
    .item:hover { background: var(--secondary-background-color); }
    .divider { height: 1px; background: var(--divider-color); margin: 4px 0; }
    .swatches { display: flex; flex-wrap: wrap; gap: 6px; padding: 10px; }
    .dot { width: 24px; height: 24px; border-radius: 50%; cursor: pointer; border: 2px solid transparent; }
    .dot.active { border-color: var(--primary-text-color); }
    .link-row { display: flex; align-items: center; gap: 6px; width: 100%; padding: 6px 0 2px; flex-basis: 100%; }
    .link-row ha-input { flex: 1; }
  `;

  @property({ type: Boolean }) pinned = false;
  @property({ type: String }) color = '';
  @property({ type: String }) linkHref = '';

  @state() private _openGroup: string | null = null;
  @state() private _linkOpen = false;

  private _toggleGroup(name: string): void {
    this._openGroup = this._openGroup === name ? null : name;
  }

  private _closeAll(): void {
    this._openGroup = null;
  }

  private _dispatchAction(action: ToolbarAction, payload?: { href?: string }): void {
    this.dispatchEvent(new CustomEvent('toolbar-action', { detail: { action, payload }, bubbles: true, composed: true }));
    this._closeAll();
  }

  private _selectColor(c: string): void {
    this.dispatchEvent(new CustomEvent('color-select', { detail: { color: c }, bubbles: true, composed: true }));
    this._closeAll();
  }

  private _togglePin(): void {
    this.dispatchEvent(new CustomEvent('pin-toggle', { bubbles: true, composed: true }));
  }

  private _openLink(): void {
    this._closeAll();
    this._linkOpen = true;
    this.dispatchEvent(new CustomEvent('link-open-requested', { bubbles: true, composed: true }));
  }

  private _isValidUrl(str: string): boolean {
    try {
      const url = new URL(str);
      return ['https:', 'http:', 'mailto:'].includes(url.protocol);
    } catch {
      return false;
    }
  }

  private _applyLink(): void {
    const input = this.renderRoot.querySelector('.link-row input') as HTMLInputElement | null;
    const url = input?.value.trim();
    if (url && this._isValidUrl(url)) this._dispatchAction('setLink', { href: url });
    this._linkOpen = false;
  }

  render() {
    return html`
      <div class="group ${this._openGroup === 'heading' ? 'open' : ''}">
        <ha-button size="small" @click=${() => this._toggleGroup('heading')}>H ▾</ha-button>
        <div class="dropdown">
          <button class="item" @click=${() => this._dispatchAction('paragraph')}>Normal</button>
          <button class="item" @click=${() => this._dispatchAction('h1')}>H1</button>
          <button class="item" @click=${() => this._dispatchAction('h2')}>H2</button>
          <button class="item" @click=${() => this._dispatchAction('h3')}>H3</button>
        </div>
      </div>
      <div class="group ${this._openGroup === 'format' ? 'open' : ''}">
        <ha-button size="small" @click=${() => this._toggleGroup('format')}>B ▾</ha-button>
        <div class="dropdown">
          <button class="item" @click=${() => this._dispatchAction('bold')}>Bold</button>
          <button class="item" @click=${() => this._dispatchAction('italic')}>Italic</button>
          <button class="item" @click=${() => this._dispatchAction('strike')}>Strikethrough</button>
          <button class="item" @click=${() => this._dispatchAction('highlight')}>Highlight</button>
        </div>
      </div>
      <div class="group ${this._openGroup === 'list' ? 'open' : ''}">
        <ha-button size="small" @click=${() => this._toggleGroup('list')}>≡ ▾</ha-button>
        <div class="dropdown">
          <button class="item" @click=${() => this._dispatchAction('bulletList')}>Bullet list</button>
          <button class="item" @click=${() => this._dispatchAction('orderedList')}>Numbered list</button>
          <button class="item" @click=${() => this._dispatchAction('taskList')}>Checklist</button>
          <div class="divider"></div>
          <button class="item" @click=${() => this._dispatchAction('indent')}>Indent</button>
          <button class="item" @click=${() => this._dispatchAction('outdent')}>Outdent</button>
        </div>
      </div>
      <div class="group ${this._openGroup === 'color' ? 'open' : ''}">
        <ha-button size="small" @click=${() => this._toggleGroup('color')}>Color ▾</ha-button>
        <div class="dropdown">
          <div class="swatches">
            ${NOTE_COLORS.map(c => html`
              <div class="dot ${this.color === c ? 'active' : ''}" style="background:${c}"
                   @click=${() => this._selectColor(c)}></div>
            `)}
          </div>
        </div>
      </div>
      <ha-button size="small" class=${this.pinned ? 'active' : ''} @click=${() => this._togglePin()}>
        ${this.pinned ? 'Pinned' : 'Pin'}
      </ha-button>
      <ha-button size="small" @click=${() => this._openLink()}>Link</ha-button>
      ${this._linkOpen ? html`
        <div class="link-row">
          <ha-input type="url" placeholder="https://…" .value=${this.linkHref}></ha-input>
          <ha-button size="small" @click=${() => this._applyLink()}>Apply</ha-button>
          <ha-button size="small" @click=${() => this._dispatchAction('unsetLink')}>Remove</ha-button>
          <ha-button size="small" @click=${() => { this._linkOpen = false; }}>✕</ha-button>
        </div>
      ` : ''}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'better-notes-toolbar': BetterNotesToolbar;
  }
}
```


- [ ] **Step 2: Typecheck**

Run: `cd custom_components/better_notes/frontend && npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add custom_components/better_notes/frontend/src/components/note-toolbar.ts
git commit -m "feat: add note formatting toolbar component"
```

---

### Task 4: Note list and list item

**Files:**
- Create: `custom_components/better_notes/frontend/src/components/note-list-item.ts`
- Create: `custom_components/better_notes/frontend/src/components/note-list.ts`

**Interfaces:**
- Consumes: `Note` from `../api`; `safeColor`, `formatRelativeDate`, `stripHtml` from `../colors`.
- Produces: `<better-notes-list-item>` (`.note: Note`, `active` boolean attribute, emits `note-select` with `detail: { noteId: string }`); `<better-notes-list>` (`.notes: Note[]`, `.selectedNoteId: string | null`, `.searchTerm: string`, emits `note-select` (re-bubbled from items), `note-new`, `search-changed` with `detail: { value: string }`). Task 6 (`panel.ts`) consumes `<better-notes-list>` and its three events.

- [ ] **Step 1: Create `src/components/note-list-item.ts`**

```typescript
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { mdiPin } from '@mdi/js';
import { safeColor, formatRelativeDate, stripHtml } from '../colors';
import type { Note } from '../api';

@customElement('better-notes-list-item')
export class BetterNotesListItem extends LitElement {
  static styles = css`
    :host {
      position: relative; display: block; padding: 10px 10px 10px 14px; margin-bottom: 8px;
      background: var(--card-background-color); border: 1px solid var(--divider-color);
      border-radius: 8px; cursor: pointer;
    }
    :host(:hover) { border-color: var(--primary-color); box-shadow: var(--ha-box-shadow-s, 0 2px 4px rgba(0,0,0,0.08)); }
    :host([active]) {
      background: color-mix(in srgb, var(--primary-color) 18%, var(--card-background-color));
      border-color: var(--primary-color);
      box-shadow: inset 3px 0 0 var(--primary-color);
    }
    .bar { position: absolute; left: 0; top: 0; width: 4px; height: 100%; border-radius: 8px 0 0 8px; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px; }
    .title {
      font-weight: 600; font-size: 14px; color: var(--primary-text-color);
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1;
    }
    .preview {
      font-size: 12px; color: var(--secondary-text-color);
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-bottom: 3px;
    }
    .date { font-size: 11px; color: var(--secondary-text-color); }
    ha-icon { --mdc-icon-size: 12px; color: var(--secondary-text-color); }
  `;

  @property({ attribute: false }) note!: Note;
  @property({ type: Boolean, reflect: true }) active = false;

  connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('click', this._select);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('click', this._select);
  }

  private _select = (): void => {
    this.dispatchEvent(new CustomEvent('note-select', {
      detail: { noteId: this.note.note_id },
      bubbles: true,
      composed: true,
    }));
  };

  render() {
    const preview = stripHtml(this.note.content || '');
    const truncated = preview.length > 60 ? `${preview.slice(0, 60)}…` : preview;
    return html`
      <div class="bar" style="background:${safeColor(this.note.color)}"></div>
      <div class="header">
        <div class="title">${this.note.title || 'Untitled'}</div>
        ${this.note.pinned ? html`<ha-icon .path=${mdiPin}></ha-icon>` : ''}
      </div>
      <div class="preview">${truncated}</div>
      <div class="date">${formatRelativeDate(this.note.modified)}</div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'better-notes-list-item': BetterNotesListItem;
  }
}
```

- [ ] **Step 2: Create `src/components/note-list.ts`**

```typescript
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import './note-list-item';
import { stripHtml } from '../colors';
import type { Note } from '../api';

@customElement('better-notes-list')
export class BetterNotesList extends LitElement {
  static styles = css`
    :host { display: flex; flex-direction: column; height: 100%; background: var(--secondary-background-color); }
    .header { padding: 16px; border-bottom: 1px solid var(--divider-color); }
    h1 { font-size: 22px; font-weight: 600; color: var(--primary-text-color); margin: 0 0 12px; }
    ha-input { display: block; width: 100%; margin-bottom: 10px; }
    ha-button { width: 100%; }
    .items { flex: 1; overflow-y: auto; padding: 10px; }
    .empty { padding: 20px; text-align: center; color: var(--secondary-text-color); font-size: 14px; }
  `;

  @property({ attribute: false }) notes: Note[] = [];
  @property({ type: String }) selectedNoteId: string | null = null;
  @property({ type: String }) searchTerm = '';

  private _onSearch(e: Event): void {
    const value = (e.target as HTMLInputElement).value;
    this.dispatchEvent(new CustomEvent('search-changed', { detail: { value }, bubbles: true, composed: true }));
  }

  private _onNew(): void {
    this.dispatchEvent(new CustomEvent('note-new', { bubbles: true, composed: true }));
  }

  private get _filtered(): Note[] {
    const term = this.searchTerm.toLowerCase();
    if (!term) return this.notes;
    return this.notes.filter(n =>
      (n.title || '').toLowerCase().includes(term) ||
      stripHtml(n.content || '').toLowerCase().includes(term),
    );
  }

  render() {
    const filtered = this._filtered;
    return html`
      <div class="header">
        <h1>Better Notes</h1>
        <ha-input placeholder="Search notes..." .value=${this.searchTerm} @input=${this._onSearch}></ha-input>
        <ha-button @click=${this._onNew}>+ New Note</ha-button>
      </div>
      <div class="items">
        ${filtered.length === 0
          ? html`<div class="empty">No notes found</div>`
          : filtered.map(note => html`
              <better-notes-list-item .note=${note} ?active=${this.selectedNoteId === note.note_id}></better-notes-list-item>
            `)}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'better-notes-list': BetterNotesList;
  }
}
```

- [ ] **Step 3: Typecheck**

Run: `cd custom_components/better_notes/frontend && npm run typecheck`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add custom_components/better_notes/frontend/src/components/note-list.ts \
        custom_components/better_notes/frontend/src/components/note-list-item.ts
git commit -m "feat: add note list and list item components"
```

---

### Task 5: Note editor pane

**Files:**
- Create: `custom_components/better_notes/frontend/src/components/note-editor.ts`

**Interfaces:**
- Consumes: `Note` from `../api`; `<better-notes-toolbar>` and its events from `./note-toolbar`; `<better-notes-tiptap-editor>`, `BetterNotesTiptapEditor`, `ToolbarAction` from `./tiptap-editor`.
- Produces: `<better-notes-editor>` (`.note: Note | null` property), emits `note-save` (`detail: Partial<Note> & { note_id: string }`), `note-delete` (`detail: { noteId: string }`). Task 6 (`panel.ts`) consumes this element and both events.

- [ ] **Step 1: Create `src/components/note-editor.ts`**

```typescript
import { LitElement, html, css } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import './note-toolbar';
import './tiptap-editor';
import type { BetterNotesTiptapEditor, ToolbarAction } from './tiptap-editor';
import type { Note } from '../api';

@customElement('better-notes-editor')
export class BetterNotesEditor extends LitElement {
  static styles = css`
    :host {
      display: flex; flex-direction: column; height: 100%; background: var(--card-background-color);
      min-width: 0; min-height: 0; position: relative;
    }
    .header { padding: 12px 16px; border-bottom: 1px solid var(--divider-color); display: flex; align-items: center; gap: 10px; }
    .back-btn { display: none; }
    @media (max-width: 767px) { .back-btn { display: inline-flex; } }
    .actions { display: flex; gap: 8px; margin-left: auto; }
    .body { flex: 1; min-height: 0; overflow-y: auto; padding: 20px 24px; }
    .title-input {
      width: 100%; font-size: 28px; font-weight: 700; border: none; outline: none; margin-bottom: 16px;
      color: var(--primary-text-color); background: transparent; font-family: inherit;
    }
    .empty {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      height: 100%; color: var(--secondary-text-color);
    }
    .toast {
      position: absolute; bottom: 24px; right: 24px; background: var(--primary-text-color);
      color: var(--card-background-color); padding: 8px 16px; border-radius: 4px; font-size: 13px;
      pointer-events: none; z-index: 1000;
    }
  `;

  @property({ attribute: false }) note: Note | null = null;

  @state() private _pendingDelete = false;
  @state() private _showToast = false;

  @query('better-notes-tiptap-editor') private _tiptap?: BetterNotesTiptapEditor;
  @query('.title-input') private _titleInput?: HTMLInputElement;

  private _saveTimeout?: ReturnType<typeof setTimeout>;
  private _deleteTimeout?: ReturnType<typeof setTimeout>;
  private _toastTimeout?: ReturnType<typeof setTimeout>;

  disconnectedCallback(): void {
    super.disconnectedCallback();
    clearTimeout(this._saveTimeout);
    clearTimeout(this._deleteTimeout);
    clearTimeout(this._toastTimeout);
  }

  private _scheduleSave(): void {
    clearTimeout(this._saveTimeout);
    this._saveTimeout = setTimeout(() => this._save(), 1000);
  }

  private _save(overrides: Partial<Note> = {}): void {
    if (!this.note) return;
    const detail = {
      note_id: this.note.note_id,
      title: overrides.title ?? this._titleInput?.value ?? this.note.title,
      content: overrides.content ?? this._tiptap?.getHTML() ?? this.note.content,
      color: overrides.color ?? this.note.color,
      pinned: overrides.pinned ?? this.note.pinned,
    };
    this.dispatchEvent(new CustomEvent('note-save', { detail, bubbles: true, composed: true }));
    this._showToast = true;
    clearTimeout(this._toastTimeout);
    this._toastTimeout = setTimeout(() => { this._showToast = false; }, 1500);
  }

  private _onToolbarAction(e: CustomEvent<{ action: ToolbarAction; payload?: { href?: string } }>): void {
    this._tiptap?.runAction(e.detail.action, e.detail.payload);
  }

  private _onColorSelect(e: CustomEvent<{ color: string }>): void {
    clearTimeout(this._saveTimeout);
    this._save({ color: e.detail.color });
  }

  private _onPinToggle(): void {
    if (!this.note) return;
    clearTimeout(this._saveTimeout);
    this._save({ pinned: !this.note.pinned });
  }

  private _onLinkOpenRequested(e: Event): void {
    const toolbar = e.target as HTMLElement & { linkHref: string };
    toolbar.linkHref = this._tiptap?.getLinkHref() ?? '';
  }

  private _onDelete(): void {
    if (!this.note) return;
    if (!this._pendingDelete) {
      this._pendingDelete = true;
      this._deleteTimeout = setTimeout(() => { this._pendingDelete = false; }, 3000);
      return;
    }
    clearTimeout(this._deleteTimeout);
    this._pendingDelete = false;
    this.dispatchEvent(new CustomEvent('note-delete', { detail: { noteId: this.note.note_id }, bubbles: true, composed: true }));
  }

  render() {
    if (!this.note) {
      return html`<div class="empty">Select a note or create one</div>`;
    }
    return html`
      <div class="header">
        <ha-icon-button class="back-btn" @click=${() => this.dispatchEvent(new CustomEvent('editor-back', { bubbles: true, composed: true }))}>←</ha-icon-button>
        <div class="actions">
          <ha-button @click=${() => { clearTimeout(this._saveTimeout); this._save(); }}>Save</ha-button>
          <ha-button @click=${() => this._onDelete()}>${this._pendingDelete ? 'Confirm?' : 'Delete'}</ha-button>
        </div>
      </div>
      <div class="body">
        <input
          class="title-input"
          type="text"
          placeholder="Note Title"
          .value=${this.note.title || ''}
          @input=${() => this._scheduleSave()}
        >
        <better-notes-tiptap-editor
          .content=${this.note.content || ''}
          @content-changed=${() => this._scheduleSave()}
        ></better-notes-tiptap-editor>
      </div>
      <better-notes-toolbar
        .pinned=${this.note.pinned}
        .color=${this.note.color}
        @toolbar-action=${this._onToolbarAction}
        @color-select=${this._onColorSelect}
        @pin-toggle=${this._onPinToggle}
        @link-open-requested=${this._onLinkOpenRequested}
      ></better-notes-toolbar>
      ${this._showToast ? html`<div class="toast">Saved</div>` : ''}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'better-notes-editor': BetterNotesEditor;
  }
}
```

- [ ] **Step 2: Typecheck**

Run: `cd custom_components/better_notes/frontend && npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add custom_components/better_notes/frontend/src/components/note-editor.ts
git commit -m "feat: add note editor pane component"
```

---

### Task 6: Panel root component

**Files:**
- Modify: `custom_components/better_notes/frontend/src/panel.ts` (replace Task 1's placeholder)

**Interfaces:**
- Consumes: `getNotes`, `createNote`, `updateNote`, `deleteNote`, `subscribeNoteEvents`, `Note` from `./api`; `NOTE_COLORS` from `./colors`; `HomeAssistant` from `./ha-types`; `<better-notes-list>` and its events from `./components/note-list`; `<better-notes-editor>` and its events from `./components/note-editor`.
- Produces: `<better-notes-panel>` with `.hass: HomeAssistant` property (the HA panel contract) — final, no later task consumes this directly.

- [ ] **Step 1: Replace `src/panel.ts`**

```typescript
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import './components/note-list';
import './components/note-editor';
import { getNotes, createNote, updateNote, deleteNote, subscribeNoteEvents } from './api';
import type { Note } from './api';
import { NOTE_COLORS } from './colors';
import type { HomeAssistant } from './ha-types';

function sortNotes(notes: Note[]): Note[] {
  return [...notes].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.modified).getTime() - new Date(a.modified).getTime();
  });
}

@customElement('better-notes-panel')
export class BetterNotesPanel extends LitElement {
  static styles = css`
    :host { display: block; height: 100%; }
    .layout { display: flex; height: 100%; background: var(--card-background-color); overflow: hidden; }
    .list-pane { flex-shrink: 0; }
    .editor-pane { flex: 1; min-width: 0; }
    @media (min-width: 768px) { .list-pane { width: 280px; } }
    @media (max-width: 767px) {
      :host([data-view="list"]) .editor-pane { display: none; }
      :host([data-view="editor"]) .list-pane { display: none; }
    }
  `;

  @property({ attribute: false }) hass!: HomeAssistant;

  @state() private _notes: Note[] = [];
  @state() private _selectedId: string | null = null;
  @state() private _searchTerm = '';
  @state() private _view: 'list' | 'editor' = 'list';

  private _unsubscribe?: () => void;

  connectedCallback(): void {
    super.connectedCallback();
    if (this.hass) this._init();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this._unsubscribe?.();
    this._unsubscribe = undefined;
  }

  updated(changed: Map<string, unknown>): void {
    if (changed.has('hass') && this.hass && !this._unsubscribe) this._init();
    if (changed.has('_view')) this.setAttribute('data-view', this._view);
  }

  private async _init(): Promise<void> {
    await this._loadNotes();
    this._unsubscribe = await subscribeNoteEvents(this.hass, () => this._loadNotes());
  }

  private async _loadNotes(): Promise<void> {
    this._notes = sortNotes(await getNotes(this.hass));
  }

  private get _selectedNote(): Note | null {
    return this._notes.find(n => n.note_id === this._selectedId) ?? null;
  }

  private async _onNoteNew(): Promise<void> {
    const noteId = await createNote(this.hass, { title: 'New Note', content: '', color: NOTE_COLORS[0], pinned: false });
    await this._loadNotes();
    if (noteId) {
      this._selectedId = noteId;
      this._view = 'editor';
    }
  }

  private _onNoteSelect(e: CustomEvent<{ noteId: string }>): void {
    this._selectedId = e.detail.noteId;
    this._view = 'editor';
  }

  private _onSearchChanged(e: CustomEvent<{ value: string }>): void {
    this._searchTerm = e.detail.value;
  }

  private async _onNoteSave(e: CustomEvent<Partial<Note> & { note_id: string }>): Promise<void> {
    await updateNote(this.hass, e.detail);
    await this._loadNotes();
  }

  private async _onNoteDelete(e: CustomEvent<{ noteId: string }>): Promise<void> {
    await deleteNote(this.hass, e.detail.noteId);
    this._selectedId = null;
    this._view = 'list';
    await this._loadNotes();
  }

  private _onEditorBack(): void {
    this._view = 'list';
  }

  render() {
    return html`
      <div class="layout">
        <div class="list-pane">
          <better-notes-list
            .notes=${this._notes}
            .selectedNoteId=${this._selectedId}
            .searchTerm=${this._searchTerm}
            @note-select=${this._onNoteSelect}
            @note-new=${this._onNoteNew}
            @search-changed=${this._onSearchChanged}
          ></better-notes-list>
        </div>
        <div class="editor-pane">
          <better-notes-editor
            .note=${this._selectedNote}
            @editor-back=${this._onEditorBack}
            @note-save=${this._onNoteSave}
            @note-delete=${this._onNoteDelete}
          ></better-notes-editor>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'better-notes-panel': BetterNotesPanel;
  }
}
```

- [ ] **Step 2: Build**

Run: `cd custom_components/better_notes/frontend && npm run build`
Expected: succeeds, `dist/better-notes-panel.js` regenerated.

- [ ] **Step 3: Commit**

```bash
git add custom_components/better_notes/frontend/src/panel.ts
git commit -m "feat: implement panel root component"
```

---

### Task 7: Card and card config editor

**Files:**
- Modify: `custom_components/better_notes/frontend/src/card.ts` (replace Task 1's placeholder)
- Create: `custom_components/better_notes/frontend/src/card-editor.ts`

**Interfaces:**
- Consumes: `getNotes`, `subscribeNoteEvents`, `Note` from `./api`; `safeColor`, `formatRelativeDate`, `stripHtml` from `./colors`; `sanitizeNoteHtml` from `./sanitize`; `HomeAssistant` from `./ha-types`.
- Produces: `<better-notes-card>` implementing the Lovelace custom card contract (`setConfig`, `.hass`, `getCardSize`, static `getConfigElement`/`getStubConfig`, `window.customCards` registration) and exports `BetterNotesCardConfig`; `<better-notes-card-editor>` implementing the Lovelace card editor contract (`setConfig`, emits `config-changed`). Final — no later task consumes these.

- [ ] **Step 1: Create `src/card-editor.ts`**

```typescript
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import type { BetterNotesCardConfig } from './card';

@customElement('better-notes-card-editor')
export class BetterNotesCardEditor extends LitElement {
  static styles = css`
    .option { margin-bottom: 16px; }
    label { display: block; margin-bottom: 4px; font-weight: 500; }
    ha-input { width: 100%; }
  `;

  @state() private _config: BetterNotesCardConfig = { type: 'custom:better-notes-card' };

  setConfig(config: BetterNotesCardConfig): void {
    this._config = config;
  }

  private _update(partial: Partial<BetterNotesCardConfig>): void {
    this._config = { ...this._config, ...partial };
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this._config }, bubbles: true, composed: true }));
  }

  render() {
    return html`
      <div class="option">
        <label for="title">Title</label>
        <ha-input id="title" .value=${this._config.title ?? 'Notes'}
          @input=${(e: Event) => this._update({ title: (e.target as HTMLInputElement).value })}></ha-input>
      </div>
      <div class="option">
        <label for="max_notes">Max Notes to Display</label>
        <ha-input id="max_notes" type="number" min="1" max="20" .value=${String(this._config.max_notes ?? 5)}
          @input=${(e: Event) => this._update({ max_notes: parseInt((e.target as HTMLInputElement).value, 10) || 5 })}></ha-input>
      </div>
      <div class="option">
        <ha-formfield label="Show Pinned Notes Only">
          <ha-checkbox .checked=${!!this._config.show_pinned_only}
            @change=${(e: Event) => this._update({ show_pinned_only: (e.target as HTMLInputElement).checked })}></ha-checkbox>
        </ha-formfield>
      </div>
      <div class="option">
        <ha-formfield label="Show All Notes">
          <ha-checkbox .checked=${!!this._config.show_all}
            @change=${(e: Event) => this._update({ show_all: (e.target as HTMLInputElement).checked })}></ha-checkbox>
        </ha-formfield>
      </div>
      <div class="option">
        <label for="card_color">Card Background Color (hex)</label>
        <ha-input id="card_color" .value=${this._config.card_color ?? '#FFEB3B'} placeholder="#FFEB3B"
          @input=${(e: Event) => this._update({ card_color: (e.target as HTMLInputElement).value })}></ha-input>
      </div>
      <div class="option">
        <label for="note_id">Specific Note ID (optional)</label>
        <ha-input id="note_id" .value=${this._config.note_id ?? ''} placeholder="Leave empty to show all"
          @input=${(e: Event) => this._update({ note_id: (e.target as HTMLInputElement).value || null })}></ha-input>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'better-notes-card-editor': BetterNotesCardEditor;
  }
}
```

- [ ] **Step 2: Replace `src/card.ts`**

```typescript
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { mdiNoteMultipleOutline, mdiPin } from '@mdi/js';
import './card-editor';
import { getNotes, subscribeNoteEvents } from './api';
import type { Note } from './api';
import { safeColor, formatRelativeDate, stripHtml } from './colors';
import { sanitizeNoteHtml } from './sanitize';
import type { HomeAssistant } from './ha-types';

export interface BetterNotesCardConfig {
  type: string;
  title?: string;
  note_id?: string | null;
  show_all?: boolean;
  max_notes?: number;
  show_pinned_only?: boolean;
  card_color?: string | null;
}

@customElement('better-notes-card')
export class BetterNotesCard extends LitElement {
  static styles = css`
    :host { display: block; }
    ha-card { padding: 16px; }
    .header {
      font-size: 18px; font-weight: 600; margin-bottom: 16px; color: var(--primary-text-color);
      display: flex; align-items: center; gap: 8px;
    }
    .note {
      background: var(--note-color, #FFEB3B); padding: 16px; border-radius: 8px; margin-bottom: 12px;
      box-shadow: var(--ha-box-shadow-s, 0 2px 4px rgba(0,0,0,0.1)); cursor: pointer;
    }
    .note:last-child { margin-bottom: 0; }
    .note-title {
      font-size: 16px; font-weight: 600; margin-bottom: 8px; color: rgba(0,0,0,0.87);
      display: flex; align-items: center; justify-content: space-between;
    }
    .note-content { font-size: 14px; color: rgba(0,0,0,0.6); line-height: 1.5; word-wrap: break-word; }
    .note-meta { margin-top: 8px; font-size: 12px; color: rgba(0,0,0,0.5); }
    .tags { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
    .tag { background: rgba(0,0,0,0.1); padding: 2px 8px; border-radius: 12px; font-size: 11px; color: rgba(0,0,0,0.7); }
    .empty { text-align: center; padding: 32px; color: var(--secondary-text-color); }
    ha-button { width: 100%; margin-top: 12px; }
  `;

  @property({ attribute: false }) hass!: HomeAssistant;
  @state() private _config: BetterNotesCardConfig = { type: 'custom:better-notes-card' };
  @state() private _notes: Note[] = [];

  private _unsubscribe?: () => void;

  setConfig(config: BetterNotesCardConfig): void {
    if (!config) throw new Error('Invalid configuration');
    this._config = {
      title: 'Notes', note_id: null, show_all: false, max_notes: 5, show_pinned_only: false, card_color: null,
      ...config,
    };
  }

  updated(changed: Map<string, unknown>): void {
    if (changed.has('hass') && this.hass && !this._unsubscribe) this._init();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this._unsubscribe?.();
    this._unsubscribe = undefined;
  }

  private async _init(): Promise<void> {
    this._notes = await getNotes(this.hass);
    this._unsubscribe = await subscribeNoteEvents(this.hass, async () => {
      this._notes = await getNotes(this.hass);
    });
  }

  getCardSize(): number {
    return this._config.note_id ? 3 : Math.min(this._config.max_notes ?? 5, this._notes.length) + 1;
  }

  static getConfigElement(): HTMLElement {
    return document.createElement('better-notes-card-editor');
  }

  static getStubConfig(): BetterNotesCardConfig {
    return { type: 'custom:better-notes-card', title: 'Notes', show_all: true, max_notes: 5, show_pinned_only: false };
  }

  private _openPanel(): void {
    window.history.pushState(null, '', '/better-notes');
    window.dispatchEvent(new Event('location-changed', { bubbles: true, composed: true }));
  }

  private _renderNote(note: Note, isSingle: boolean) {
    return html`
      <div class="note" style="--note-color:${safeColor(note.color)}" @click=${() => this._openPanel()}>
        <div class="note-title">
          <span>${note.title || 'Untitled'}</span>
          ${note.pinned ? html`<ha-icon .path=${mdiPin}></ha-icon>` : ''}
        </div>
        ${isSingle
          ? html`<div class="note-content" .innerHTML=${sanitizeNoteHtml(note.content || '')}></div>`
          : html`<div class="note-content">${(() => {
              const plain = stripHtml(note.content || '');
              return plain.length > 150 ? `${plain.slice(0, 150)}…` : plain;
            })()}</div>`}
        ${note.tags?.length ? html`<div class="tags">${note.tags.map(t => html`<span class="tag">${t}</span>`)}</div>` : ''}
        <div class="note-meta">${formatRelativeDate(note.modified)}</div>
      </div>
    `;
  }

  render() {
    const cardStyle = this._config.card_color ? `background:${safeColor(this._config.card_color)}` : '';
    let content;
    if (this._config.note_id) {
      const note = this._notes.find(n => n.note_id === this._config.note_id);
      content = note ? this._renderNote(note, true) : html`<div class="empty">Note not found</div>`;
    } else {
      let notes = this._config.show_pinned_only ? this._notes.filter(n => n.pinned) : this._notes;
      const total = notes.length;
      const maxNotes = this._config.max_notes ?? 5;
      if (!this._config.show_all) notes = notes.slice(0, maxNotes);
      content = notes.length === 0
        ? html`<div class="empty">No notes to display</div>`
        : html`
            ${notes.map(n => this._renderNote(n, false))}
            ${total > maxNotes ? html`<ha-button @click=${() => this._openPanel()}>View All Notes</ha-button>` : ''}
          `;
    }
    return html`
      <ha-card style=${cardStyle}>
        <div class="header">
          <ha-icon .path=${mdiNoteMultipleOutline}></ha-icon>
          <span>${this._config.title}</span>
        </div>
        ${content}
      </ha-card>
    `;
  }
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'better-notes-card',
  name: 'Better Notes Card',
  description: 'Display notes from Better Notes',
  preview: true,
  documentationURL: 'https://github.com/CameronVerrells/BetterNotesforHA',
});

declare global {
  interface Window {
    customCards?: unknown[];
  }
  interface HTMLElementTagNameMap {
    'better-notes-card': BetterNotesCard;
  }
}
```

- [ ] **Step 3: Build**

Run: `cd custom_components/better_notes/frontend && npm run build`
Expected: succeeds, `dist/better-notes-card.js` regenerated (includes the card editor, since `card.ts` imports `./card-editor`).

- [ ] **Step 4: Commit**

```bash
git add custom_components/better_notes/frontend/src/card.ts \
        custom_components/better_notes/frontend/src/card-editor.ts
git commit -m "feat: implement card and card config editor components"
```

---

### Task 8: Wire into www/ and manually verify end-to-end

**Files:**
- Modify: `custom_components/better_notes/www/better-notes-panel.js` (replaced by build output)
- Modify: `custom_components/better_notes/www/better-notes-card.js` (replaced by build output)

**Interfaces:**
- Consumes: everything from Tasks 1–7 via the build.
- Produces: nothing new — this is the integration checkpoint.

- [ ] **Step 1: Build and copy output**

```bash
cd custom_components/better_notes/frontend
npm run build
cp dist/*.js ../www/
```

`dist/*.js` (not just the two named entries) because the dynamic `import()` in `tiptap-editor.ts` makes Vite emit Tiptap as a separate lazy-loaded chunk file alongside `better-notes-panel.js` and `better-notes-card.js` — leaving it out would 404 the first time a note is opened.

- [ ] **Step 2: Start the dev instance**

```bash
cd /Users/hugohelder/PycharmProjects/BetterNotesforHA
docker compose -f dev/docker-compose.yml up -d
```
Expected: container starts; http://localhost:8123 reachable. Complete HA onboarding if this is the first run (`dev/config/` was empty).

- [ ] **Step 3: Manual functional checklist**

In the running instance, add the Better Notes integration (Settings → Devices & Services → Add Integration) if not already present, open the "Better Notes" sidebar panel, and verify:
- [ ] Panel renders using `ha-card`/`ha-input`/`ha-button` styling (not the old hand-rolled CSS), and matches both light and dark HA themes (toggle in profile settings).
- [ ] "+ New Note" creates a note and opens it in the editor pane.
- [ ] Typing in the title or body autosaves after ~1s (watch for the "Saved" toast); reload the page and confirm the change persisted.
- [ ] Formatting toolbar: heading levels, bold/italic/strike/highlight, bullet/numbered/task lists, indent/outdent, color swatch selection, pin toggle, and the link editor (apply + remove) all affect the note body.
- [ ] Delete requires two clicks (button reads "Confirm?" after the first, reverts after 3s if not confirmed).
- [ ] Search box filters the list by title and body text.
- [ ] At a narrow browser width (<768px), the list and editor panes toggle via the back button instead of showing side by side.
- [ ] Add a `type: custom:better-notes-card` card to a dashboard via the UI editor; confirm the visual config editor (title, max notes, show pinned only, show all, card color, note ID fields) works and the card reflects each option, including navigating to the panel on click.

- [ ] **Step 4: Stop the dev instance and commit**

```bash
docker compose -f dev/docker-compose.yml down
git add custom_components/better_notes/www/*.js
git commit -m "feat: wire built HA-native frontend into www/"
```

---

### Task 9: CI validation workflow

**Files:**
- Create: `.github/workflows/validate.yml`

**Interfaces:** none — standalone CI config.

- [ ] **Step 1: Create `.github/workflows/validate.yml`**

```yaml
name: Validate

on:
  workflow_dispatch:
  schedule:
    - cron: "0 0 * * *"
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

permissions: {}

jobs:
  hassfest:
    name: Hassfest validation
    runs-on: ubuntu-latest
    steps:
      - name: Checkout the repository
        uses: actions/checkout@v6

      - name: Run hassfest validation
        uses: home-assistant/actions/hassfest@master

  hacs:
    name: HACS validation
    runs-on: ubuntu-latest
    steps:
      - name: Run HACS validation
        uses: hacs/action@main
        with:
          category: integration
          ignore: brands
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/validate.yml
git commit -m "ci: add hassfest and HACS validation workflow"
```

---

### Task 10: CI release workflow and HACS zip_release

**Files:**
- Create: `.github/workflows/release.yml`
- Modify: `hacs.json`

**Interfaces:** none — standalone CI/config change.

- [ ] **Step 1: Create `.github/workflows/release.yml`**

Adapted from `dimac-h/home-upkeep-component`'s `auto-migration-and-domain-fix` branch, with node 24 instead of its node 20:

```yaml
name: Release

on:
  release:
    types: [published]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v6

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
          cache-dependency-path: custom_components/better_notes/frontend/package-lock.json

      - name: Build frontend
        working-directory: custom_components/better_notes/frontend
        run: |
          npm ci
          npm run build
          cp dist/*.js ../www/

      - name: Get version
        id: version
        uses: home-assistant/actions/helpers/version@master

      - name: Patch manifest and zip
        run: |
          sed -i -E 's/"version": "[^"]*"/"version": "${{ steps.version.outputs.version }}"/' custom_components/better_notes/manifest.json
          cd custom_components/better_notes/
          zip ../../better_notes.zip -r ./ \
            -x 'frontend/node_modules/*' \
            -x 'frontend/src/*' \
            -x 'frontend/package.json' \
            -x 'frontend/package-lock.json' \
            -x 'frontend/tsconfig.json' \
            -x 'frontend/vite.config.ts'

      - name: Upload Release
        uses: softprops/action-gh-release@v2
        with:
          files: |
            better_notes.zip
```

- [ ] **Step 2: Update `hacs.json`**

```json
{
  "name": "Better Notes",
  "render_readme": true,
  "domains": ["better_notes"],
  "homeassistant": "2026.8.0",
  "iot_class": "Local Polling",
  "zip_release": true,
  "filename": "better_notes.zip"
}
```

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/release.yml hacs.json
git commit -m "ci: build frontend and ship a CI-built HACS zip release"
```

---

## Post-plan verification

After Task 10, before opening the PR (per `CLAUDE.md`'s Git Workflow — always via PR, never direct to `main`):
- Run `cd custom_components/better_notes/frontend && npm run build` one final time from a clean checkout to confirm no uncommitted build-tool drift.
- Re-run the Task 8 manual checklist once more against the final state.
- Confirm `git status` is clean and every task's commit is present.
