# Better Notes for Home Assistant

An Apple Notes-like integration for Home Assistant that brings a beautiful, intuitive note-taking experience to your smart home dashboard.

## Features

- **Apple Notes-Inspired UI** - Clean, modern interface with familiar UX patterns
- **Sidebar Panel** - Quick access to all your notes from the Home Assistant sidebar
- **Rich Note Management** - Create, edit, delete, and organize notes with ease
- **Color Coding** - Choose from 10 beautiful colors to organize your notes
- **Pin Important Notes** - Keep your most important notes at the top
- **Search & Filter** - Quickly find notes with real-time search
- **Dashboard Cards** - Pin individual notes or note lists to any dashboard
- **Auto-Save** - Never lose your work with automatic saving
- **Tags Support** - Organize notes with custom tags
- **Persistent Storage** - Notes are safely stored in Home Assistant's data store

## Installation

### Method 1: HACS (Recommended)

1. Open HACS in your Home Assistant instance
2. Click on "Integrations"
3. Click the three dots in the top right corner
4. Select "Custom repositories"
5. Add this repository URL: `https://github.com/CameronVerrells/BetterNotesforHA`
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
2. Enter a title and content
3. Choose a color to organize your note
4. Optionally pin the note to keep it at the top
5. Notes are automatically saved as you type

### Pinning Notes to Dashboard

1. Go to any dashboard in edit mode
2. Click **"+ Add Card"**
3. Search for **"Better Notes Card"**
4. Configure the card:
   - Set a title
   - Choose to show all notes or a specific note
   - Set max number of notes to display
   - Option to show only pinned notes

### Card Configuration Options

```yaml
type: custom:better-notes-card
title: My Notes
max_notes: 5
show_pinned_only: false
note_id: null  # Set to specific note ID to show only that note
```

## Services

Better Notes provides several services you can use in automations:

### `better_notes.create_note`

Create a new note programmatically.

```yaml
service: better_notes.create_note
data:
  title: "Grocery List"
  content: "Milk\nEggs\nBread"
  color: "#FFEB3B"
  pinned: false
  tags:
    - shopping
    - groceries
```

### `better_notes.update_note`

Update an existing note.

```yaml
service: better_notes.update_note
data:
  note_id: "abc123-def456-ghi789"
  title: "Updated Title"
  content: "Updated content"
  pinned: true
```

### `better_notes.delete_note`

Delete a note.

```yaml
service: better_notes.delete_note
data:
  note_id: "abc123-def456-ghi789"
```

### `better_notes.get_notes`

Retrieve all notes (fires an event with the notes list).

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
          content: "Don't forget to:\n- Check the mail\n- Water plants\n- Review calendar"
          color: "#4CAF50"
          tags:
            - daily
            - reminders
```

## Available Colors

The integration includes 10 beautiful colors:

- Yellow (#FFEB3B) - Default
- Orange (#FF9800)
- Red (#F44336)
- Pink (#E91E63)
- Purple (#9C27B0)
- Indigo (#3F51B5)
- Blue (#2196F3)
- Cyan (#00BCD4)
- Teal (#009688)
- Green (#4CAF50)

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
│   ├── better-notes-panel.html  # Main panel UI
│   └── better-notes-card.js     # Lovelace card
└── translations/
    └── en.json              # English translations
```

### Data Storage

Notes are stored using Home Assistant's built-in storage API at:
`.storage/better_notes.notes`

Each note contains:
- `note_id`: Unique identifier
- `title`: Note title
- `content`: Note content
- `color`: Color code
- `pinned`: Boolean indicating if pinned
- `created`: Creation timestamp
- `modified`: Last modification timestamp
- `tags`: Array of tags

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

1. Make sure you've registered the card by adding it to your dashboard resources
2. The card type should be: `custom:better-notes-card`
3. Check browser console for JavaScript errors

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Support

If you encounter any issues or have feature requests, please [open an issue](https://github.com/CameronVerrells/BetterNotesforHA/issues) on GitHub.

## Acknowledgments

- Inspired by Apple Notes
- Built for the Home Assistant community
- Uses Home Assistant's integration framework
