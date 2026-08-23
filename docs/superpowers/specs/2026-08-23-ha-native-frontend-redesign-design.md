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
  package.json          # deps: lit, @mdi/js; devDeps: typescript, vite
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

`frontend/dist/` is **not** committed (mirrors `home-upkeep-addon`, but here the release workflow actually builds it — see below). Local dev testing (per `CLAUDE.md`'s existing "copy into a live HA instance" workflow) requires running `npm run build` in `frontend/` first when frontend source changed, then copying `frontend/dist/*.js` into `www/` alongside the existing `tiptap-bundle.js`.

### 2. Visual design — native HA elements and tokens

Rather than inventing a design system (as `home-upkeep-addon` did with its own `--hu-*` palette), components use HA's real building blocks, which are already registered as custom elements on the page when running inside HA — no import needed, just use the tags:

- `<ha-card>` — card/panel surface (replaces custom `div.note-card`)
- `<ha-textfield>` — title input, tag input
- `<ha-icon-button>` + `<ha-icon>` (mdi icons) — pin/delete/edit/close actions
- `<ha-dialog>` — note editor modal (replaces custom modal overlay)
- `<ha-fab>` — "new note" floating action button
- `mwc-button` — dialog save/cancel actions
- CSS custom properties: `--primary-color`, `--card-background-color`, `--divider-color`, `--primary-text-color`, `--secondary-text-color`, `--mdc-theme-*` — so light/dark theme switching is automatic, matching whatever HA theme the user has active.

`DEFAULT_COLORS` (the 10 note accent colors in `const.py`) stay as user-facing note colors — those are content, not chrome, and are intentionally vivid/distinct from the neutral HA theme surface.

The rich-text body editor continues to use the existing `tiptap-bundle.js` (self-hosted, already vetted, unrelated to this redesign). It's wrapped by a small Lit component (`components/note-editor-dialog.ts`) that mounts Tiptap into a plain `div` inside the dialog's Lit-rendered shadow DOM, the same integration pattern the current vanilla code already uses.

### 3. Component split

- `panel.ts` (root `<better-notes-panel>`): owns `hass`/`narrow`/`route` properties (per HA panel contract), note list state, event subscriptions (`better_notes_note_created/updated/deleted`), and dispatches to child components via properties/events — mirrors `home-upkeep-addon/frontend/src/entrypoint.ts`'s state-holder-at-root pattern.
- `components/note-list.ts`: renders pinned-first / modified-desc sorted notes, filtering/search if present today.
- `components/note-card-item.ts`: one note tile, emits `note-edit`/`note-delete`/`note-pin-toggle` events.
- `components/note-editor-dialog.ts`: create/edit form (title, tags, color picker, Tiptap body), emits `dialog-save`/`dialog-close`.
- `components/color-picker.ts`: swatch grid over `DEFAULT_COLORS`.
- `components/tag-chips.ts`: tag input/display.
- `card.ts` (`<better-notes-card>`): thin LitElement wrapping `ha-card`, reuses `note-list.ts`/`note-card-item.ts` for rendering, keeps existing `setConfig`/`hass` setter contract so existing user Lovelace YAML configs keep working unchanged.

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
2. `actions/setup-node@v4` (node 20, npm cache keyed on `custom_components/better_notes/frontend/package-lock.json`).
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

No automated test suite exists in this repo today (per `CLAUDE.md`) and this change doesn't introduce one. Verification is manual, using the `dev/docker-compose.yml` instance:
- `npm run build` succeeds with no TypeScript errors.
- Start `dev/docker-compose.yml`, confirm the panel renders, matches HA's light and dark themes, and all four operations (create/update/delete/pin) still work end-to-end via the existing events.
- Confirm the Lovelace card still accepts existing `custom:better-notes-card` YAML configs unchanged.
- `hassfest` and `hacs/action` validations pass in CI.
- A test GitHub Release produces a zip asset containing a non-empty `www/` with built JS.

## Migration / rollout risk

This is a full frontend rewrite behind the same public contracts (services, events, panel URL, card config schema) — so it's an atomic swap, not incremental. Rollback is a plain `git revert` of the frontend commit(s) since the backend is untouched.
