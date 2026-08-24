# HA-Native Frontend Redesign — Design

## Problem

The panel (`www/better-notes-panel.js`) and Lovelace card (`www/better-notes-card.js`) are plain `HTMLElement` classes with hand-rolled `innerHTML` rendering and a custom color palette. They look nothing like Home Assistant's own UI — no shared theme tokens, no native HA form controls, no dark-mode integration, no Material ripple/elevation behavior. The goal is a frontend that looks and behaves like it ships with HA core, while keeping the integration's actual behavior (notes CRUD, events, storage) unchanged.

## Non-goals

- No change to `storage.py`, `config_flow.py`, the note data schema, or any of the four services/events.
- No adoption of Web Awesome (`wa-*`) components — not public/stable outside HA core frontend yet.

## Reference precedent

`~/WebstormProjects/home-upkeep-addon` (sibling HA custom integration) already solves "Lit without a CDN": TypeScript + `lit` + `@mdi/js` as real npm dependencies, bundled by Vite to a single ES module, served as a static path. Its own upstream, `tonyroberts/home-upkeep-component`, ships a `release.yml` that never builds the frontend before zipping (`frontend/dist/` is gitignored, so the release asset would ship without it) — a real distribution gap, not a pattern to copy. The `dimac-h/home-upkeep-component` fork has since fixed exactly this on its `auto-migration-and-domain-fix` branch: `release.yml` now runs `npm ci && npm run build` before zipping (excluding frontend source/tooling from the shipped zip), and `hacs.json` sets `"zip_release": true`. We reuse that fixed workflow directly (see §5 below) rather than re-deriving our own.

## Architecture

### 1. Frontend build (`custom_components/better_notes/frontend/`)

New directory, structured like `home-upkeep-addon/frontend/`:

```
frontend/
  package.json          # deps: lit, @mdi/js; devDeps: typescript, vite; "engines": { "node": ">=24" }
  tsconfig.json
  vite.config.ts        # base: "/better_notes_panel/", lib entry per output
  src/
    ha.ts                # minimal HomeAssistant/Connection types this project needs
    api.ts               # wraps hass.connection.sendMessagePromise for the 4 services + event subscriptions
    styles.ts             # shared css`` tagged templates (spacing/layout helpers only — colors come from HA vars, see below)
    panel.ts              # <better-notes-panel>, replaces www/better-notes-panel.js
    card.ts               # <better-notes-card>, replaces www/better-notes-card.js
    components/
      note-list.ts
      note-card-item.ts
      note-editor-dialog.ts
      color-picker.ts
      tag-chips.ts
  dist/                  # build output, gitignored — see Release below
```

`frontend/dist/` is **not** committed (mirrors `home-upkeep-addon`, but here the release workflow actually builds it — see below). Local dev testing (per `CLAUDE.md`'s existing "copy into a live HA instance" workflow) requires running `npm run build` in `frontend/` first when frontend source changed, then copying `frontend/dist/*.js` into `www/`.

**Folding in the existing Tiptap build.** The repo already has a *second*, separate build pipeline for the rich-text editor: a root-level `package.json`/`package-lock.json` + `scripts/tiptap-entry.js`, built with esbuild into `www/tiptap-bundle.js` as an IIFE exposing `window.TiptapBundle`, loaded at runtime via a hand-rolled `<script>` tag injection with a textarea fallback on failure. Now that `frontend/` has real Vite/npm tooling, running two separate toolchains for one app is duplication this redesign should remove: the exact pinned deps (`@tiptap/core`, `@tiptap/starter-kit`, `@tiptap/extension-task-list`, `@tiptap/extension-task-item`, `@tiptap/extension-link`, `@tiptap/extension-highlight`, all `3.27.1`) move into `frontend/package.json`, and `tiptap-editor.ts` loads them via a real dynamic `import()` instead of the script-tag/global pattern — Vite code-splits dynamic imports into a lazy chunk automatically, so the "only load Tiptap when a note is opened" behavior is preserved without a hand-rolled loader. The root `package.json`, `package-lock.json`, `scripts/tiptap-entry.js`, and the committed `www/tiptap-bundle.js` artifact are all removed as part of this work.

### 2. Visual design — native HA elements and tokens

Rather than inventing a design system (as `home-upkeep-addon` did with its own `--hu-*` palette), components use HA's real building blocks, which are already registered as custom elements on the page when running inside HA — no import needed, just use the tags. **Important caveat:** HA's own developer docs state plainly that these components are not an officially supported public API for custom cards/panels and "can always change" — confirmed by real churn between 2024 and 2026 (`ha-fab` removed, `ha-textfield` removed in 2026.5 in favor of `ha-input`, dialogs/buttons/inputs/switches/checkboxes migrated wholesale from Material Design Components to WebAwesome). We accept that risk deliberately, in exchange for looking genuinely native — see "Component API churn" under Migration/rollout risk. Given the target baseline is HA 2026.8+ (per `hacs.json`), we target the *current* (2026.5+) element set, not the older MDC-era ones:

- `<ha-card>` — card/panel surface (replaces custom `div.note-card`)
- `<ha-input>` — title input, tag input (replaces the removed `ha-textfield`)
- `<ha-icon-button>` + `<ha-icon>` (mdi icons) — pin/delete/edit/close actions
- `<ha-dialog>` — note editor modal (replaces custom modal overlay); internally WebAwesome-backed since 2026.3 — set width via prop (not CSS override) and use `autofocus` (not the removed `dialogInitialFocus`)
- `<ha-button>` — all buttons, including what would have been a FAB or `mwc-button` (both removed/deprecated; `ha-button` covers primary/plain/warning variants and handles its own positioning)
- `<ha-progress-bar>` — loading state (replaces a hand-rolled CSS spinner; new in 2026.5, fully themeable)
- CSS custom properties: `--primary-color`, `--card-background-color`, `--divider-color`, `--primary-text-color`, `--secondary-text-color`, plus the newer semantic tokens introduced in 2026.4/2026.5 (`--ha-box-shadow-s/m/l`, the six new surface-color tokens, `--ha-color-form-background*`) — so light/dark theme switching is automatic, matching whatever HA theme the user has active.

`DEFAULT_COLORS` (the 10 note accent colors in `const.py`) stay as user-facing note colors — those are content, not chrome, and are intentionally vivid/distinct from the neutral HA theme surface.

The rich-text body editor continues to use Tiptap (same extension set: StarterKit, TaskList, TaskItem, Link, Highlight) — bumped from the currently-pinned `3.27.1` to the latest release, `3.30.3`, since the packages are being re-pinned in `frontend/package.json` anyway. Only *how* it's bundled changes otherwise, per the "Folding in the existing Tiptap build" note above. `components/tiptap-editor.ts` mounts it into a plain `div` inside its own shadow DOM.

### 3. Component split

Corrected against the actual current UX (read from `www/better-notes-panel.js` and `www/better-notes-card.js` in full, not assumed): the panel is an **inline Apple-Notes-style split view** — a list pane and an editor pane side by side (mobile: one or the other, toggled via a `data-view` attribute) — not a modal dialog. There's also a second, previously-missed custom element: `better-notes-card-editor`, the Lovelace visual config editor for the card. Tags exist in the schema and are *displayed* (as read-only chips) by the card, but are not editable anywhere in the current UI — that stays out of scope; no tag-editing UI is being added.

- `panel.ts` (root `<better-notes-panel>`): owns `hass`/`narrow`/`route` properties (per HA panel contract), the notes array, search term, selected note id, mobile view state, event subscriptions (`better_notes_note_created/updated/deleted`), and the create/save/delete/pin/color service calls — mirrors `home-upkeep-addon/frontend/src/entrypoint.ts`'s state-holder-at-root pattern. Renders `note-list.ts` and `note-editor.ts` side by side.
- `components/note-list.ts`: search `ha-input`, "New Note" `ha-button`, and the pinned-first/modified-desc sorted/filtered list of `note-list-item.ts`.
- `components/note-list-item.ts`: one row (color bar, title, pin icon, content preview, relative date), emits a `note-select` event.
- `components/note-editor.ts`: the inline editor pane — title `ha-input` (debounced autosave), mobile `ha-icon-button` back action, save/delete `ha-button`s (delete uses a pending-confirm state, same 3s two-click-confirm behavior as today), save-toast feedback, and mounts `tiptap-editor.ts` for the body.
- `components/note-toolbar.ts`: the formatting toolbar — heading/format/list dropdown groups, the `DEFAULT_COLORS` swatch dropdown, pin toggle, and the link editor row (URL `ha-input` + apply/remove/cancel) — emits toolbar-action events that `note-editor.ts` forwards to the Tiptap editor instance.
- `components/tiptap-editor.ts`: isolates the dynamic-`import()`-with-textarea-fallback loading logic and the `Editor` lifecycle (create/update/destroy), so `note-editor.ts` doesn't need to know Tiptap's API directly.
- `card.ts` (`<better-notes-card>`): thin LitElement wrapping `ha-card`, reuses `note-list-item.ts`-equivalent rendering for the list and single-note views, read-only tag chip display, keeps the existing `setConfig`/`hass` setter contract, `getCardSize()`, `getConfigElement()`, `getStubConfig()`, and `window.customCards` registration so existing user Lovelace YAML configs and the card picker keep working unchanged.
- `card-editor.ts` (`<better-notes-card-editor>`): the card's visual config editor (title, max_notes, show_pinned_only, show_all, card_color, note_id fields), dispatching the same `config-changed` custom event Lovelace's card editor contract expects.

### 4. Backend wiring changes

`__init__.py`'s static path registration and `async_register_panel` call (`module_url="/better_notes_panel/better-notes-panel.js"`) stay pointed at the same URL — only the *contents* of `www/better-notes-panel.js` change (from hand-written vanilla JS to Vite-built output). No Python changes required beyond this.

### 5. CI / release

The sibling `home-upkeep-component` repo (the separate, non-addon HACS integration in that project's ecosystem) has since fixed exactly this gap on its `auto-migration-and-domain-fix` branch — its `release.yml` now builds the frontend before zipping, and its `hacs.json` sets `zip_release`. We reuse that pattern directly rather than re-deriving it.

New `.github/workflows/validate.yml` (unchanged from the upstream/reference version — hassfest + HACS validation, on push/PR to `main` and a daily schedule):

```yaml
on: [push, pull_request, workflow_dispatch]
jobs:
  hassfest: ...   # home-assistant/actions/hassfest
  hacs: ...       # hacs/action, category: integration
```

New `.github/workflows/release.yml` (on GitHub Release `published`), adapted from `home-upkeep-component`'s fixed version:

1. Checkout.
2. `actions/setup-node@v4` (node 24 — Active LTS as of this writing, vs. the node 20 the reference workflow still uses; npm cache keyed on `custom_components/better_notes/frontend/package-lock.json`).
3. `cd custom_components/better_notes/frontend && npm ci && npm run build` — output lands in `frontend/dist/`.
4. Copy `frontend/dist/*.js` into `custom_components/better_notes/www/` (our static path already serves `www/` — see `__init__.py`; no Python change needed).
5. Patch `manifest.json`'s `version` to the release tag via `home-assistant/actions/helpers/version` + `sed`.
6. `zip -r better_notes.zip custom_components/better_notes/ -x 'frontend/node_modules/*' -x 'frontend/src/*' -x 'frontend/package.json' -x 'frontend/package-lock.json' -x 'frontend/tsconfig.json' -x 'frontend/vite.config.ts'` — ships the built `www/` output but not frontend source/tooling.
7. Upload the zip as a release asset (`softprops/action-gh-release`).

`hacs.json` gains:
```json
"zip_release": true,
"filename": "better_notes.zip"
```
so HACS installs from the built release asset instead of raw repo content — this, combined with step 3 actually running in CI (unlike the still-unfixed `tonyroberts/home-upkeep-component` upstream), is what closes the gap.

### 6. Docs

`CLAUDE.md` changes:
- Replace "No Build System" section with: backend-only changes still need no build step; frontend source changes (`frontend/src/`) require `cd custom_components/better_notes/frontend && npm run build` before restarting the dev instance.
- Document `dev/docker-compose.yml` as the standard local dev/test loop (see §7 below), replacing the old "copy into a live HA instance" instructions.
- Note the new `frontend/` directory and its role in the Architecture section.
- Note the release process (tag → GitHub Release → CI builds & attaches zip → HACS installs from that zip) under a new "Releasing" section.

### 7. Local dev instance (`dev/docker-compose.yml`)

Replaces "copy into a live HA instance and restart" with a disposable, bind-mounted HA container — modeled directly on `home-upkeep-addon/dev/docker-compose.yml`:

```yaml
services:
  homeassistant:
    image: ghcr.io/home-assistant/home-assistant:stable
    ports: ["8123:8123"]
    volumes:
      - ./config:/config
      - ../custom_components/better_notes:/config/custom_components/better_notes:ro
```

`custom_components/better_notes` is bind-mounted read-only, so edits appear without any copy step — a `docker compose restart` (HA doesn't hot-reload custom integrations) picks them up. `dev/config/` is gitignored (matches the reference project). Already added as part of this design's setup, independent of the rest of the implementation.

Because the mount is read-only from the *host* checkout, frontend changes still need `npm run build` (or `vite build --watch`) run on the host so `www/` contains fresh output before the container restart — the container itself never runs the build.

## Testing

**Backend: automated.** No test suite exists in this repo today, but this redesign adds one for the Python side, since the backend is stable, self-contained, and easy to test in isolation — `pytest` + `pytest-homeassistant-custom-component` (the standard harness for HA custom integrations; `home-upkeep-addon` uses the identical setup), covering `storage.py`'s CRUD and sort behavior, all four services' event-firing and error paths in `__init__.py`, and the single-instance `config_flow.py`. A root `pyproject.toml` and `tests/` directory are added.

**Frontend: manual.** No automated frontend tests are added. `home-upkeep-addon` — a comparable, larger Lit frontend — has zero frontend test files despite having full pytest coverage on its backend, which is real precedent for this split. The reasons this makes sense for an app this size: the main risk here is visual/theming (does it look native in light/dark HA themes), which a DOM assertion can't verify anyway — it needs a human looking at a real HA instance regardless; and the behavioral logic worth protecting (autosave debounce, delete-confirm, sort order, search filter) is thin per-component glue, not business logic, so the setup cost of a browser-based test harness (Vitest + `@open-wc/testing` or Web Test Runner, none of which exist in this repo yet) isn't justified yet. Revisit if the frontend grows real logic (offline queueing, conflict resolution, etc.). Verification stays manual, using the `dev/docker-compose.yml` instance:
- `npm run build` succeeds with no TypeScript errors.
- Start `dev/docker-compose.yml`, confirm the panel renders, matches HA's light and dark themes, and all four operations (create/update/delete/pin) still work end-to-end via the existing events.
- Confirm the Lovelace card still accepts existing `custom:better-notes-card` YAML configs unchanged.
- `hassfest` and `hacs/action` validations pass in CI.
- A test GitHub Release produces a zip asset containing a non-empty `www/` with built JS.

**CI.** `validate.yml` (Task 9 of the implementation plan) is extended to also run `pytest` on every push/PR, alongside hassfest/HACS validation.

## Migration / rollout risk

This is a full frontend rewrite behind the same public contracts (services, events, panel URL, card config schema) — so it's an atomic swap, not incremental. Rollback is a plain `git revert` of the frontend commit(s) since the backend is untouched.

**Component API churn.** HA's own frontend developer docs explicitly disclaim that `ha-*` built-in components are not a stable public API for third-party use. Between 2024 and 2026 alone: `mwc-button`/`ha-fab` were removed in favor of `ha-button`; `ha-textfield` was removed in 2026.5 in favor of `ha-input`; dialogs, switches, checkboxes, and text areas were migrated wholesale from Material Design Components to WebAwesome, each with its own token/prop breaking changes. Choosing native elements over a self-contained design system (as `home-upkeep-addon` did) means this integration inherits that churn — a future HA release could rename or restyle a component we depend on. Mitigation: keep the component choices and their HA-version-introduced-in dates listed in §2 above as a single place to check against future HA changelogs; since the min supported version is being bumped to 2026.8+, there's no need to support the older MDC-era equivalents in parallel.

**HA baseline.** Bumping `hacs.json`'s `homeassistant` minimum to `2026.8.0` (already done) is a prerequisite for this design, not just a version bump — it's what makes targeting the current (`ha-input`/`ha-button`/`ha-progress-bar`) component set valid instead of the removed/deprecated ones.
