---
name: ha-frontend-components
description: Home Assistant native frontend component patterns (ha-button, ha-form, ha-alert, dialogs, panels, Lovelace cards). Use when implementing or reviewing any UI in this integration's frontend/ so it matches HA's own design language instead of falling back on component defaults.
---

# HA Frontend Components

Adapted from `home-assistant/frontend`'s own `AGENTS.md` and `.agents/skills/ha-frontend-components/SKILL.md`
(https://raw.githubusercontent.com/home-assistant/frontend/dev/AGENTS.md), trimmed to what applies to a
third-party custom integration's frontend (this repo does not build HA core itself, so core-repo-only guidance
like `yarn lint`/`yarn dev`, the PR template, and the AI policy section are omitted).

Use this skill before touching any `ha-*` component usage or styling in `custom_components/better_notes/frontend/`.

## Buttons

`ha-button` wraps a Web Awesome button. **Never leave `appearance`/`variant`/`size` unset** — the defaults are
`appearance="filled"` `variant="brand"` (a solid, prominent blue button), and an invalid `size` value (e.g. the
non-existent `"small"`) silently falls back to the default size instead of erroring. This project shipped
"everything is a big blue button" as a real bug from exactly this mistake — see git history around commit
`c6b0b22` in the `ha-native-frontend-redesign` branch.

Axes:
- `variant`: `brand`, `neutral`, `danger`, `warning`, `success`.
- `appearance`: `accent`, `filled`, `outlined`, `plain`.
- `size`: `xs`, `s`, `m`, `l`, `xl` — **not** `"small"`/`"large"`/etc.

Usage in this project:
- `appearance="filled" variant="brand"` — the one genuine primary CTA per view (e.g. "+ New Note").
- `appearance="plain" variant="neutral"` — everything else: toolbar/secondary actions, dialog cancel/dismiss.
- `variant="danger"` — destructive actions (Delete).
- Place primary actions in `slot="primaryAction"` and secondary actions in `slot="secondaryAction"` inside dialogs.

## Icons

Use `<ha-svg-icon .path=${mdiSomething}>` (from `@mdi/js`) for raw MDI path data — **not** `<ha-icon>`, which
expects an `icon="mdi:name"` string attribute and does not render a `.path` property. Passing a raw path to
`ha-icon` silently renders nothing.

## Forms

`ha-form` is schema-driven with `HaFormSchema[]` and supports common selectors for entities, devices, areas,
targets, numbers, booleans, time, actions, text, objects, selects, icons, media, and location. Use
`computeLabel`, `computeError`, and `computeHelper` for translated labels, validation, and helper text.

## Alerts

Use `ha-alert` for user-visible status messaging instead of a hand-rolled banner.
- Alert types: `error`, `warning`, `info`, `success`.
- Useful properties: `title`, `alert-type`, `dismissable`, `narrow`.
- Slots: `icon` for a custom leading icon, `action` for custom action content.

## Dialogs

- Use `ha-dialog`, `header-title`/`header-subtitle` for simple header text, slots when those aren't enough.
- Use `ha-dialog-footer` with `primaryAction`/`secondaryAction` slots for footer buttons.
- Add `autofocus` to the first focusable element.
- Use standard widths: `small`, `medium`, `large`, `full` — avoid custom dialog sizing without a clear need.

## Shortcuts and focus leakage into HA's own UI

HA's own frontend has global keyboard shortcuts that check whether focus is inside a text-editing control before
acting. Because this project's components live inside Shadow DOM, `document.activeElement` at the top level
resolves to the outer custom element, not the actual focused `<input>`/contenteditable nested inside a shadow
root — so HA's own shortcut-suppression check can fail to recognize the user is typing. Call
`event.stopPropagation()` on `keydown` for every text-editing surface (title input, rich-text editor mount,
search input, any inline `<ha-input>`) to keep keystrokes from leaking out and triggering HA's shortcuts. See
this project's `note-editor.ts`, `note-toolbar.ts`, `note-list.ts`, and `tiptap-editor.ts` for the pattern.

## Reading a native element's current value

Native HA form elements like `<ha-input>` render their real `<input>` inside their OWN shadow root — a
`querySelector` from a *different* shadow tree (e.g. a parent component's `renderRoot`) cannot reach inside it
and will always return `null`. Query the `ha-input` element itself and read its `.value` property directly,
not a nested `input` selector.

## Panels and Lovelace Cards

- Panels commonly receive `hass`/`narrow`/`route` properties per the HA panel contract.
- Lovelace cards should implement `setConfig()` with validation, `.hass`, `getCardSize()`, and — when the card
  has configurable options — static `getConfigElement()`/`getStubConfig()`, plus `window.customCards`
  registration so the card picker and existing user YAML configs keep working.
