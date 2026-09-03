# Home Assistant Notes

A notes panel for Home Assistant with rich text editing, dark mode support, and Lovelace card integration.

<img src="https://raw.githubusercontent.com/dimac-h/Home-Assistant-Notes/main/images/screenshot-mobile.png" alt="Home Assistant Notes panel on mobile" width="320">

<details>
<summary>Desktop screenshot</summary>

![Home Assistant Notes panel](https://raw.githubusercontent.com/dimac-h/Home-Assistant-Notes/main/images/screenshot.png)

</details>

## Features

- Rich text editing via [Tiptap](https://tiptap.dev/) headings, bold, italic, lists, checklists, highlights, links
- Ten note colors with pin support
- Real-time search
- Dashboard card to display notes on any view
- Auto-save
- Dark mode

## Installation

### HACS (recommended)

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg?style=for-the-badge)](https://github.com/hacs/integration)

1. Open HACS → Integrations → ⋮ → Custom repositories
2. Add `https://github.com/dimac-h/Home-Assistant-Notes` as an Integration
3. Download **Home Assistant Notes** and restart Home Assistant

Or click the button below (requires [My Home Assistant](https://www.home-assistant.io/integrations/my/) configured) to open the repository directly in HACS:

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=dimac-h&repository=Home-Assistant-Notes&category=integration)

### Manual

Copy the `custom_components/better_notes` folder into your HA `custom_components` directory and restart.

### Setup

Go to **Settings → Devices & Services → Add Integration** and search for *Home Assistant Notes*, or click the shortcut button below. The panel appears in the sidebar automatically.

[![Add Integration to your Home Assistant instance.](https://my.home-assistant.io/badges/config_flow_start.svg)](https://my.home-assistant.io/redirect/config_flow_start/?domain=better_notes)

## Formatting toolbar

| Button  | Action                                                 |
|---------|--------------------------------------------------------|
| **H▾**  | Heading level (Normal / H1 / H2 / H3)                  |
| **B▾**  | Bold, Italic, Strikethrough, Highlight, Code, Code block, Blockquote |
| **≡▾**  | Bullet list, Numbered list, Checklist, Indent, Outdent |
| **🎨▾** | Note color                                             |
| **📌**  | Pin / unpin                                            |
| **🔗**  | Insert / remove link                                   |
## Troubleshooting

**Panel not in sidebar** — disable and re-enable the integration in Settings → Devices & Services, then hard-refresh the browser.

**Card is not loading** — check the browser console for errors. The card type is `custom:better-notes-card`.

## License

MIT — contributions are welcome via [pull request](https://github.com/dimac-h/Home-Assistant-Notes/pulls).
