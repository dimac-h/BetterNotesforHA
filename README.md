# Better Notes for Home Assistant

An Apple Notes-like integration for Home Assistant that brings a beautiful, intuitive note-taking experience to your smart home dashboard.

## Features

- **Apple Notes-Inspired UI** - Clean, modern interface with familiar UX patterns
- **Rich Text Editing** - WYSIWYG editor with bold, italic, headings, lists, checklists, highlights, and links
- **Sidebar Panel** - Quick access to all your notes from the Home Assistant sidebar
- **Color Coding** - Choose from 10 beautiful colors to organize your notes
- **Pin Important Notes** - Keep your most important notes at the top
- **Search & Filter** - Quickly find notes with real-time search
- **Dashboard Cards** - Pin individual notes or note lists to any dashboard
- **Auto-Save** - Never lose your work with automatic saving
- **Persistent Storage** - Notes are safely stored in Home Assistant's data store

## Installation

### Method 1: HACS (Recommended)

1. Open HACS in your Home Assistant instance
2. Click on "Integrations"
3. Click the three dots in the top right corner
4. Select "Custom repositories"
5. Add this repository URL: `https://github.com/dimac-h/BetterNotesforHA`
6. Select category: "Integration"
7. Click "Add"
8. Find "Better Notes" in the integration list and click "Download"
9. Restart Home Assistant

### Method 2: Manual Installation

1. Download this repository
2. Copy the `custom_components/better_notes` folder to your Home Assistant's `custom_components` directory
3. If the `custom_components` directory doesn't exist, create it in the same directory as your `configuration.yaml`
4. Restart Home Assistant

## Setup

1. Go to **Settings** → **Devices & Services**
2. Click **+ Add Integration**
3. Search for "Better Notes"
4. Click on it to set it up
5. Once configured, you'll see "Better Notes" in your sidebar menu

## Usage

### Accessing the Notes Panel

Click on **Better Notes** in the Home Assistant sidebar to open the full notes interface.

### Creating a Note

1. Click the **"+ New Note"** button in the sidebar
2. Enter a title
3. Type your content — use the formatting toolbar to add headings, bold, lists, checklists, links, and more
4. Use the 🎨 toolbar button to choose a color
5. Use the 📌 toolbar button to pin the note to the top
6. Notes are automatically saved as you type

### Formatting Toolbar

The toolbar appears at the bottom of the editor on desktop and at the top on mobile:

| Button | Options |
|--------|---------|
| **H▾** | Normal text, H1, H2, H3 |
| **B▾** | Bold, Italic, Strikethrough, Highlight |
| **≡▾** | Bullet list, Numbered list, Checklist, Indent, Outdent |
| **🎨▾** | Note color (10 options) |
| **📌** | Pin / unpin the note |
| **⋮** | Insert link |

### Pinning Notes to Dashboard

1. Go to any dashboard in edit mode
2. Click **"+ Add Card"**
3. Search for **"Better Notes Card"**
4. Configure the card:
   - Set a title
   - Choose to show all notes or a specific note
   - Set max number of notes to display
   - Option to show only pinned notes

### Card Configuration

```yaml
type: custom:better-notes-card
title: My Notes
max_notes: 5
show_pinned_only: false
note_id: null  # Set to a specific note ID to show only that note
```

The card renders formatted content (headings, bold, lists, etc.) when displaying a single note. In list view it shows a plain-text preview.

## Services

Better Notes provides services you can use in automations. Note that `content` is stored as HTML — plain text values are accepted and will be displayed as a plain paragraph.

### `better_notes.create_note`

```yaml
service: better_notes.create_note
data:
  title: "Grocery List"
  content: "Milk, eggs, bread"
  color: "#FFEB3B"
  pinned: false
```

### `better_notes.update_note`

```yaml
service: better_notes.update_note
data:
  note_id: "abc123-def456-ghi789"
  title: "Updated Title"
  content: "Updated content"
  pinned: true
```

### `better_notes.delete_note`

```yaml
service: better_notes.delete_note
data:
  note_id: "abc123-def456-ghi789"
```

### `better_notes.get_notes`

```yaml
service: better_notes.get_notes
```

## Automation Examples

### Create a note when the doorbell rings

```yaml
automation:
  - alias: "Doorbell Note"
    trigger:
      - platform: state
        entity_id: binary_sensor.doorbell
        to: "on"
    action:
      - service: better_notes.create_note
        data:
          title: "Doorbell Rang"
          content: "Someone rang the doorbell at {{ now().strftime('%I:%M %p') }}"
          color: "#F44336"
          pinned: true
```

### Daily reminder note

```yaml
automation:
  - alias: "Daily Reminder"
    trigger:
      - platform: time
        at: "09:00:00"
    action:
      - service: better_notes.create_note
        data:
          title: "Daily Reminder - {{ now().strftime('%A, %B %d') }}"
          content: "Don't forget to check the mail, water plants, and review your calendar."
          color: "#4CAF50"
```

## Available Colors

| Color | Hex |
|-------|-----|
| Yellow (default) | `#FFEB3B` |
| Orange | `#FF9800` |
| Red | `#F44336` |
| Pink | `#E91E63` |
| Purple | `#9C27B0` |
| Indigo | `#3F51B5` |
| Blue | `#2196F3` |
| Cyan | `#00BCD4` |
| Teal | `#009688` |
| Green | `#4CAF50` |

## Technical Details

### File Structure

```
custom_components/better_notes/
├── __init__.py              # Integration initialization
├── manifest.json            # Integration metadata
├── const.py                 # Constants and configuration
├── config_flow.py           # Configuration flow
├── storage.py               # Notes storage handler
├── services.yaml            # Service definitions
├── www/                     # Frontend assets
│   ├── better-notes-panel.js    # Main panel UI (custom element)
│   ├── better-notes-card.js     # Lovelace card
│   └── tiptap-bundle.js         # Bundled rich text editor
└── translations/
    └── en.json              # English translations
```

### Data Storage

Notes are stored using Home Assistant's built-in storage API at:
`.storage/better_notes.notes`

Each note contains:
- `note_id`: Unique identifier (UUID v4)
- `title`: Note title (plain text)
- `content`: Note content (HTML)
- `color`: Hex color code
- `pinned`: Boolean
- `created`: ISO 8601 timestamp
- `modified`: ISO 8601 timestamp

## Troubleshooting

### Notes not appearing

1. Check that the integration is properly installed and configured
2. Check Home Assistant logs for any errors
3. Try restarting Home Assistant

### Panel not showing in sidebar

1. Ensure the integration is enabled in Settings → Devices & Services
2. Clear browser cache
3. Hard refresh the page (Ctrl+F5 or Cmd+Shift+R)

### Card not working

1. The card type is `custom:better-notes-card`
2. Check the browser console for JavaScript errors

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Support

If you encounter any issues or have feature requests, please [open an issue](https://github.com/dimac-h/BetterNotesforHA/issues) on GitHub.

## Acknowledgments

- Inspired by Apple Notes
- Built for the Home Assistant community
- Uses Home Assistant's integration framework
