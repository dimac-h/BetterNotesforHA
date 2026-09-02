# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A Home Assistant custom integration (`custom_components/better_notes`) that adds an Apple Notes-style panel and Lovelace card to Home Assistant. Distributed via HACS, requires HA 2026.8.0+.

## Development

Backend-only changes (`__init__.py`, `storage.py`, `config_flow.py`, `const.py`) need no build step.

Frontend changes (`custom_components/better_notes/frontend/src/`) need a build first:
```bash
cd custom_components/better_notes/frontend
npm run build   # outputs to frontend/dist/, copy the built *.js into ../www/
```

Local testing uses a disposable, bind-mounted HA instance instead of copying files into a real install:
```bash
docker compose -f dev/docker-compose.yml up -d      # start — http://localhost:8123
docker compose -f dev/docker-compose.yml restart     # pick up changes (HA doesn't hot-reload custom_components)
docker compose -f dev/docker-compose.yml logs -f     # watch logs
rm -rf dev/config                                    # full reset
```

`custom_components/better_notes` is mounted read-only, so edits appear after a restart with no copy step.

## Releasing

Publishing a GitHub Release triggers `.github/workflows/release.yml`, which builds `frontend/`, patches `manifest.json`'s version, zips `custom_components/better_notes/`, and uploads the zip as a release asset. `hacs.json` sets `"zip_release": true` so HACS installs from that built asset rather than raw repo content — the frontend build output must exist in what HACS installs, and committing it to git isn't required (unlike `tiptap-bundle.js`, which is committed since it's not part of the Vite build).

## Architecture

**Backend (Python)** — standard HA integration pattern:
- `__init__.py` — entry point: sets up storage, registers the iframe panel, and registers all four HA services (`create_note`, `update_note`, `delete_note`, `get_notes`)
- `storage.py` — `NotesStorage` wraps HA's `homeassistant.helpers.storage.Store`; persists notes to `.storage/better_notes.notes` as a dict keyed by UUID
- `config_flow.py` — minimal single-instance config flow (no user-configurable options)
- `const.py` — all domain constants, attribute names, default colors, and panel config

**Frontend** — TypeScript + LitElement, built with Vite (`custom_components/better_notes/frontend/`), using HA's own native elements and theme tokens (`ha-card`, `ha-dialog`, `ha-button`, `ha-input`, etc.) rather than a custom design system:
- `frontend/src/panel.ts` — full-page notes UI, built to `www/better-notes-panel.js` and served as a sidebar panel
- `frontend/src/card.ts` — custom Lovelace card (`custom:better-notes-card`), built to `www/better-notes-card.js`
- `www/tiptap-bundle.js` — pre-built rich-text editor, checked into git as-is (not part of the Vite build), wrapped by a Lit component for the note body editor

The panel communicates with HA backend by calling HA services via the HA WebSocket API / REST API from the browser.

## Frontend Design Language

This project's frontend targets Home Assistant's own look by using native `ha-*` components and theme tokens
instead of a custom design system. Home Assistant's own frontend team documents exactly how to do this
correctly in `home-assistant/frontend`'s `AGENTS.md` (https://raw.githubusercontent.com/home-assistant/frontend/dev/AGENTS.md)
and its referenced project skills. Two of those skills have been adapted into this repo — **load them before
touching any `ha-*` component usage or CSS in `frontend/`**:

- `.claude/skills/ha-frontend-components/SKILL.md` — `ha-button` axes (`variant`/`appearance`/`size`), icons
  (`ha-svg-icon` vs `ha-icon`), forms, alerts, dialogs, the Shadow-DOM keyboard-shortcut-leakage gotcha, and
  reading a native element's value across a shadow boundary.
- `.claude/skills/ha-frontend-styling/SKILL.md` — theme CSS custom properties, `--ha-space-*` spacing tokens,
  mobile-first/RTL layout guidance.

The single most common mistake found during this redesign: assuming a bare `<ha-button>` (or any other
native component) looks subtle/native with no attributes set. It doesn't — `ha-button` defaults to
`appearance="filled" variant="brand"` (a solid, prominent blue button) unless told otherwise, and an invalid
`size` value (the string `"small"` isn't one — valid values are `xs`/`s`/`m`/`l`/`xl`) silently falls back to
the default size rather than erroring. Always check a component's actual default before assuming "native
component = no styling needed."

## Event-Based Service Results

Services don't return values directly. Results are communicated by firing HA bus events:
- `better_notes_note_created` — fired after create, payload is the note dict
- `better_notes_note_updated` — fired after update, payload is the note dict
- `better_notes_note_deleted` — fired after delete, payload is `{note_id: ...}`
- `better_notes_notes_list` — fired by `get_notes`, payload is `{notes: [...]}`

## Note Data Schema

```python
{
    "note_id": str,      # UUID v4
    "title": str,
    "content": str,
    "color": str,        # hex code, default "#FFEB3B"
    "pinned": bool,
    "created": str,      # ISO 8601
    "modified": str,     # ISO 8601
    "tags": list[str],
}
```

Notes are sorted pinned-first, then by `modified` descending.

## Git Workflow

Always open a pull request when completing a feature or fix. Never merge directly to `main` without a PR.

All commits, branches, and PRs in this repo must be attributed to `dimac-h` (author and committer) — never to Claude, an AI, or a specific Claude model name, in commit messages, PR titles/descriptions, or branch names.

## HACS Distribution

`hacs.json` and `manifest.json` must stay in sync for HACS compatibility. The `render_readme` flag in `hacs.json` means the README is shown as the HACS integration page.