# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A Home Assistant custom integration (`custom_components/better_notes`) that adds an Apple Notes-style panel and Lovelace card to Home Assistant. Distributed via HACS, requires HA 2024.1.0+.

## No Build System

There is no build step, test suite, linter config, or package manager in this repo. Development is done by copying the `custom_components/better_notes/` directory into a live Home Assistant instance and restarting HA to pick up changes.

To test changes, copy the integration to your HA instance:
```bash
cp -r custom_components/better_notes/ /path/to/homeassistant/custom_components/
```

Then restart Home Assistant and check logs for errors.

## Architecture

**Backend (Python)** — standard HA integration pattern:
- `__init__.py` — entry point: sets up storage, registers the iframe panel, and registers all four HA services (`create_note`, `update_note`, `delete_note`, `get_notes`)
- `storage.py` — `NotesStorage` wraps HA's `homeassistant.helpers.storage.Store`; persists notes to `.storage/better_notes.notes` as a dict keyed by UUID
- `config_flow.py` — minimal single-instance config flow (no user-configurable options)
- `const.py` — all domain constants, attribute names, default colors, and panel config

**Frontend (vanilla JS/HTML)** — no framework, no bundler:
- `www/better-notes-panel.html` — full-page notes UI served as an iframe panel in the HA sidebar
- `www/better-notes-card.js` — custom Lovelace card (`custom:better-notes-card`) registered as a custom element

The panel communicates with HA backend by calling HA services via the HA WebSocket API / REST API from the browser.

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

## HACS Distribution

`hacs.json` and `manifest.json` must stay in sync for HACS compatibility. The `render_readme` flag in `hacs.json` means the README is shown as the HACS integration page.