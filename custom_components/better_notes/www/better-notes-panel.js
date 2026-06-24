const COLORS = [
  '#FFEB3B', '#FF9800', '#F44336', '#E91E63', '#9C27B0',
  '#3F51B5', '#2196F3', '#00BCD4', '#009688', '#4CAF50',
];

class BetterNotesPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._hass = null;
    this._notes = [];
    this._currentNoteId = null;
    this._view = 'list';
    this._searchTerm = '';
    this._initialized = false;
    this._saveTimeout = null;
    this._unsubscribeEvents = null;
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._initialized) {
      this._initialized = true;
      this._render();
      this._loadNotes();
      this._subscribeToEvents();
    }
  }

  connectedCallback() {
    this._render();
  }

  disconnectedCallback() {
    if (this._unsubscribeEvents) {
      this._unsubscribeEvents();
      this._unsubscribeEvents = null;
    }
  }

  async _loadNotes() {
    try {
      const result = await this._hass.callService(
        'better_notes', 'get_notes', {}, { return_response: true }
      );
      if (result && Array.isArray(result.notes)) {
        this._notes = result.notes;
        this._render();
      }
    } catch (e) {
      console.error('Better Notes: failed to load notes', e);
    }
  }

  _subscribeToEvents() {
    if (!this._hass?.connection || this._unsubscribeEvents) return;
    const refresh = () => this._loadNotes();
    const events = [
      'better_notes_note_created',
      'better_notes_note_updated',
      'better_notes_note_deleted',
    ];
    Promise.all(
      events.map(e => this._hass.connection.subscribeEvents(refresh, e))
    ).then(unsubs => {
      this._unsubscribeEvents = () => unsubs.forEach(fn => fn());
    });
  }

  _render() {
    const filtered = this._filteredNotes();
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          height: 100%;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          --accent: #2196F3;
          --accent-dark: #1976D2;
          --border: #e0e0e0;
          --bg: #fafafa;
          --text: #333;
          --text-muted: #666;
          --text-faint: #999;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .panel {
          display: flex;
          height: 100%;
          background: #fff;
          overflow: hidden;
        }

        /* List panel */
        .panel-list {
          width: 100%;
          background: var(--bg);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
        }

        .panel-list-header {
          padding: 16px;
          border-bottom: 1px solid var(--border);
        }

        .panel-list-header h1 {
          font-size: 22px;
          font-weight: 600;
          color: var(--text);
          margin-bottom: 12px;
        }

        .search-box {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid var(--border);
          border-radius: 6px;
          font-size: 14px;
          background: #fff;
          margin-bottom: 10px;
        }

        .search-box:focus { outline: none; border-color: var(--accent); }

        .new-note-btn {
          width: 100%;
          padding: 10px;
          background: var(--accent);
          color: #fff;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        }

        .new-note-btn:hover { background: var(--accent-dark); }

        .notes-list {
          flex: 1;
          overflow-y: auto;
          padding: 10px;
        }

        .note-item {
          position: relative;
          padding: 10px 10px 10px 14px;
          margin-bottom: 8px;
          background: #fff;
          border: 1px solid var(--border);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .note-item:hover { border-color: var(--accent); box-shadow: 0 2px 4px rgba(0,0,0,0.08); }
        .note-item.active { background: #e3f2fd; border-color: var(--accent); }

        .note-color-bar {
          position: absolute;
          left: 0; top: 0;
          width: 4px; height: 100%;
          border-radius: 8px 0 0 8px;
        }

        .note-item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 3px;
        }

        .note-item-title {
          font-weight: 600;
          font-size: 14px;
          color: var(--text);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          flex: 1;
        }

        .note-item-preview {
          font-size: 12px;
          color: var(--text-muted);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          margin-bottom: 3px;
        }

        .note-item-date { font-size: 11px; color: var(--text-faint); }
        .pin-icon { font-size: 14px; margin-left: 4px; flex-shrink: 0; }

        .empty-list {
          padding: 20px;
          text-align: center;
          color: var(--text-faint);
          font-size: 14px;
        }

        /* Editor panel */
        .panel-editor {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: #fff;
          min-width: 0;
        }

        .editor-header {
          padding: 12px 16px;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .back-btn {
          display: none;
          padding: 6px 12px;
          border: 1px solid var(--border);
          border-radius: 6px;
          background: #fff;
          cursor: pointer;
          font-size: 14px;
        }

        .back-btn:hover { background: #f5f5f5; }

        .editor-actions { display: flex; gap: 8px; margin-left: auto; }

        .editor-btn {
          padding: 6px 14px;
          border: 1px solid var(--border);
          border-radius: 6px;
          background: #fff;
          cursor: pointer;
          font-size: 14px;
        }

        .editor-btn:hover { background: #f5f5f5; }
        .editor-btn.danger { background: #f44336; color: #fff; border-color: #f44336; }
        .editor-btn.danger:hover { background: #d32f2f; }

        .editor-body {
          flex: 1;
          overflow-y: auto;
          padding: 20px 24px;
        }

        .editor-toolbar {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border);
          margin-bottom: 16px;
        }

        .pin-toggle {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 5px 10px;
          border: 1px solid var(--border);
          border-radius: 6px;
          background: #fff;
          cursor: pointer;
          font-size: 13px;
        }

        .pin-toggle:hover { background: #f5f5f5; }
        .pin-toggle.active { background: #fff3e0; border-color: #FF9800; color: #FF9800; }

        .toolbar-label { font-size: 13px; color: var(--text-muted); font-weight: 500; }

        .color-picker { display: flex; gap: 6px; flex-wrap: wrap; }

        .color-dot {
          width: 28px; height: 28px;
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid transparent;
          transition: all 0.15s;
        }

        .color-dot:hover { transform: scale(1.1); }
        .color-dot.active { border-color: #333; transform: scale(1.15); }

        .note-title-input {
          width: 100%;
          font-size: 28px;
          font-weight: 700;
          border: none;
          outline: none;
          margin-bottom: 16px;
          color: var(--text);
          font-family: inherit;
        }

        .note-content-input {
          width: 100%;
          min-height: 300px;
          font-size: 15px;
          line-height: 1.6;
          border: none;
          outline: none;
          resize: none;
          color: var(--text);
          font-family: inherit;
        }

        .empty-editor {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: var(--text-faint);
        }

        .empty-editor-icon { font-size: 56px; margin-bottom: 16px; }
        .empty-editor-text { font-size: 16px; }

        /* Mobile: show only the active view */
        @media (max-width: 767px) {
          .panel-list { display: ${this._view === 'list' ? 'flex' : 'none'}; }
          .panel-editor { display: ${this._view === 'editor' ? 'flex' : 'none'}; }
          .back-btn { display: block; }
        }

        /* Desktop: always show both */
        @media (min-width: 768px) {
          .panel-list { width: 280px; display: flex; }
          .panel-editor { display: flex; }
        }
      </style>

      <div class="panel">
        <div class="panel-list">
          <div class="panel-list-header">
            <h1>Better Notes</h1>
            <input class="search-box" id="searchBox" type="text" placeholder="Search notes..." value="${this._escapeAttr(this._searchTerm)}">
            <button class="new-note-btn" id="newNoteBtn">+ New Note</button>
          </div>
          <div class="notes-list" id="notesList">
            ${filtered.length === 0
              ? `<div class="empty-list">No notes found</div>`
              : filtered.map(note => `
                <div class="note-item ${this._currentNoteId === note.note_id ? 'active' : ''}" data-id="${note.note_id}">
                  <div class="note-color-bar" style="background:${note.color}"></div>
                  <div class="note-item-header">
                    <div class="note-item-title">${this._escapeHtml(note.title || 'Untitled')}</div>
                    ${note.pinned ? '<span class="pin-icon">📌</span>' : ''}
                  </div>
                  <div class="note-item-preview">${this._escapeHtml((note.content || '').substring(0, 60))}${note.content?.length > 60 ? '…' : ''}</div>
                  <div class="note-item-date">${this._formatDate(note.modified)}</div>
                </div>
              `).join('')
            }
          </div>
        </div>

        <div class="panel-editor">
          ${this._currentNote()
            ? this._renderEditor()
            : `<div class="empty-editor">
                 <div class="empty-editor-icon">📝</div>
                 <div class="empty-editor-text">Select a note or create a new one</div>
               </div>`
          }
        </div>
      </div>
    `;

    this._attachListeners();
  }

  _currentNote() {
    return this._notes.find(n => n.note_id === this._currentNoteId) ?? null;
  }

  _filteredNotes() {
    const term = this._searchTerm.toLowerCase();
    if (!term) return this._notes;
    return this._notes.filter(n =>
      (n.title || '').toLowerCase().includes(term) ||
      (n.content || '').toLowerCase().includes(term)
    );
  }

  _renderEditor() {
    const note = this._currentNote();
    return `
      <div class="editor-header">
        <button class="back-btn" id="backBtn">← Back</button>
        <div class="editor-actions">
          <button class="editor-btn" id="saveBtn">Save</button>
          <button class="editor-btn danger" id="deleteBtn">Delete</button>
        </div>
      </div>
      <div class="editor-body">
        <div class="editor-toolbar">
          <button class="pin-toggle ${note.pinned ? 'active' : ''}" id="pinToggle">
            📌 ${note.pinned ? 'Pinned' : 'Pin'}
          </button>
          <span class="toolbar-label">Color:</span>
          <div class="color-picker">
            ${COLORS.map(c => `
              <div class="color-dot ${note.color === c ? 'active' : ''}"
                   style="background:${c}" data-color="${c}"></div>
            `).join('')}
          </div>
        </div>
        <input class="note-title-input" id="noteTitle" type="text"
               placeholder="Note Title" value="${this._escapeAttr(note.title || '')}">
        <textarea class="note-content-input" id="noteContent"
                  placeholder="Start typing...">${this._escapeHtml(note.content || '')}</textarea>
      </div>
    `;
  }

  _escapeHtml(text) {
    const d = document.createElement('div');
    d.textContent = String(text);
    return d.innerHTML;
  }

  _escapeAttr(text) {
    return String(text).replace(/"/g, '&quot;');
  }

  _formatDate(iso) {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now - date;
    const mins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMs / 3600000);
    const days = Math.floor(diffMs / 86400000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} min ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  }

  _attachListeners() {
    const root = this.shadowRoot;

    root.getElementById('searchBox')?.addEventListener('input', e => {
      this._searchTerm = e.target.value;
      this._render();
    });

    root.getElementById('newNoteBtn')?.addEventListener('click', () => this._createNote());

    root.querySelectorAll('.note-item').forEach(el => {
      el.addEventListener('click', () => this._selectNote(el.dataset.id));
    });

    root.getElementById('backBtn')?.addEventListener('click', () => {
      this._view = 'list';
      this._render();
    });

    root.getElementById('saveBtn')?.addEventListener('click', () => this._saveNote());
    root.getElementById('deleteBtn')?.addEventListener('click', () => this._deleteNote());
    root.getElementById('pinToggle')?.addEventListener('click', () => this._togglePin());

    root.querySelectorAll('.color-dot').forEach(el => {
      el.addEventListener('click', () => this._setColor(el.dataset.color));
    });

    const autoSave = () => {
      clearTimeout(this._saveTimeout);
      this._saveTimeout = setTimeout(() => this._saveNote(), 1000);
    };
    root.getElementById('noteTitle')?.addEventListener('input', autoSave);
    root.getElementById('noteContent')?.addEventListener('input', autoSave);
  }

  _selectNote(id) {
    this._currentNoteId = id;
    this._view = 'editor';
    this._render();
  }
}

customElements.define('better-notes-panel', BetterNotesPanel);
