---
name: ha-frontend-styling
description: Home Assistant theme variables, spacing tokens, responsive layout, and general styling guidance. Use when writing or reviewing CSS in this integration's frontend/ so it inherits HA's own light/dark theming instead of hardcoded colors.
---

# HA Frontend Styling

Adapted from `home-assistant/frontend`'s `.agents/skills/ha-frontend-styling/SKILL.md`
(https://raw.githubusercontent.com/home-assistant/frontend/dev/AGENTS.md), trimmed to what applies to a
third-party custom integration's frontend rather than HA core itself.

## Theme & spacing

- Use Home Assistant CSS custom properties instead of hardcoded colors — that's the entire point of this
  project's redesign (matching HA's light/dark theme automatically instead of a fixed custom palette).
- Prefer `--ha-space-*` spacing tokens over hardcoded pixel values where practical (`--ha-space-1` through
  `--ha-space-20`, 4px to 80px in 4px increments; common ones: `--ha-space-2` = 8px, `--ha-space-4` = 16px,
  `--ha-space-8` = 32px). This project currently uses hardcoded px values in most components (written before
  this guidance was incorporated) — prefer the tokens in new work.
- Common color properties already in use here: `--primary-color`, `--primary-text-color`,
  `--secondary-text-color`, `--card-background-color`, `--secondary-background-color`, `--divider-color`.
- Box-shadow tokens already in use here: `--ha-box-shadow-s`, `--ha-box-shadow-m` (both with a hardcoded
  fallback value, since they were only introduced in HA 2026.4/2026.5 and this repo's target baseline is
  2026.8+ — the fallback is defensive, not strictly required).

## Layout

- Keep layouts mobile-first, then enhance for desktop — this project's panel does exactly this via
  `@media (min-width: 768px)`/`@media (max-width: 767px)` breakpoints in `panel.ts`, `note-editor.ts`, and
  `note-toolbar.ts`.
- Keep layouts RTL-safe: prefer logical CSS properties (`margin-inline-start` over `margin-left`, etc.) where
  it doesn't complicate the code disproportionately. This project doesn't yet fully follow this — worth revisiting
  if RTL support becomes a real requirement.
- Scope styles to the component (Lit's `static styles` + Shadow DOM already does this) — do not rely on global
  page styles.

## Component defaults are not "no styling needed"

The single biggest source of visual bugs in this project's redesign was assuming a bare `<ha-button>` (or any
other `ha-*` component) looks subtle/native by default. It doesn't — see `ha-frontend-components`'s Buttons
section. Always check a component's actual default appearance before assuming "native = no attributes needed."
