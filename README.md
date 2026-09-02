# Home Assistant Notes

A notes panel for Home Assistant with rich text editing, dark mode support, and Lovelace card integration.

![Home Assistant Notes panel](https://raw.githubusercontent.com/dimac-h/BetterNotesforHA/main/images/screenshot.png)

## Features

- Rich text editor — headings, bold, italic, lists, checklists, highlights, links
- Ten note colors with pin support
- Real-time search
- Dashboard card to display notes on any view
- Auto-save
- Dark mode

<details>
<summary>Installation</summary>

### HACS (recommended)

1. Open HACS → Integrations → ⋮ → Custom repositories
2. Add `https://github.com/dimac-h/BetterNotesforHA` as an Integration
3. Download **Home Assistant Notes** and restart Home Assistant

### Manual

Copy the `custom_components/better_notes` folder into your HA `custom_components` directory and restart.

### Setup

Go to **Settings → Devices & Services → Add Integration** and search for *Home Assistant Notes*. The panel appears in the sidebar automatically.

</details>

## Formatting toolbar

| Button  | Action                                                 |
|---------|--------------------------------------------------------|
| **H▾**  | Heading level (Normal / H1 / H2 / H3)                  |
| **B▾**  | Bold, Italic, Strikethrough, Highlight                 |
| **≡▾**  | Bullet list, Numbered list, Checklist, Indent, Outdent |
| **🎨▾** | Note color                                             |
| **📌**  | Pin / unpin                                            |
| **🔗**  | Insert / remove link                                   |

### `better_notes.get_notes`
Returns all notes. Use `return_response: true` in automations to read the result.

## Troubleshooting

**Panel not in sidebar** — disable and re-enable the integration in Settings → Devices & Services, then hard-refresh the browser.

**Card is not loading** — check the browser console for errors. The card type is `custom:better-notes-card`.

## License

MIT — contributions are welcome via [pull request](https://github.com/dimac-h/BetterNotesforHA/pulls).
