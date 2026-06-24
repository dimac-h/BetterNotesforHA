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
    this._disconnected = false;
    this._saving = false;
    this._pendingDelete = false;
    this._deleteTimeout = null;
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._initialized) {
      this._initialized = true;
      this._initStyles();
      this._render();
      this._loadNotes();
      this._subscribeToEvents();
    }
  }

  connectedCallback() {
    if (this._initialized) this._render();
  }

  disconnectedCallback() {
    this._disconnected = true;
    clearTimeout(this._saveTimeout);
    clearTimeout(this._deleteTimeout);
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
      if (this._disconnected) {
        unsubs.forEach(fn => fn());
      } else {
        this._unsubscribeEvents = () => unsubs.forEach(fn => fn());
      }
    });
  }

  _initStyles() {
    const style = document.createElement('style');
    style.textContent = `
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
      .editor-btn.confirming { background: #ff7043; color: #fff; border-color: #ff7043; }

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

      .save-toast {
        position: fixed;
        bottom: 24px;
        right: 24px;
        background: #323232;
        color: #fff;
        padding: 8px 16px;
        border-radius: 4px;
        font-size: 13px;
        pointer-events: none;
        opacity: 1;
        transition: opacity 0.4s;
        z-index: 1000;
      }

      @media (max-width: 767px) {
        :host([data-view="list"]) .panel-editor { display: none; }
        :host([data-view="editor"]) .panel-list { display: none; }
        .back-btn { display: block; }
        .save-toast { bottom: 16px; right: 16px; left: 16px; text-align: center; }
      }

      @media (min-width: 768px) {
        .panel-list { width: 280px; display: flex; }
        .panel-editor { display: flex; }
      }
    `;
    this.shadowRoot.appendChild(style);

    const content = document.createElement('div');
    content.id = 'content';
    content.style.cssText = 'display:contents';
    this.shadowRoot.appendChild(content);
  }

  _render() {
    this.setAttribute('data-view', this._view);
    const content = this.shadowRoot.getElementById('content');
    if (!content) return;
    const filtered = this._filteredNotes();
    content.innerHTML = `
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
                  <div class="note-color-bar" style="background:${this._safeColor(note.color)}"></div>
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
                   style="background:${this._safeColor(c)}" data-color="${c}"></div>
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

  _safeColor(color) {
    return /^#[0-9a-fA-F]{6}$|^#[0-9a-fA-F]{3}$/.test(color) ? color : '#FFEB3B';
  }

  _escapeHtml(text) {
    const d = document.createElement('div');
    d.textContent = String(text);
    return d.innerHTML;
  }

  _escapeAttr(text) {
    const d = document.createElement('div');
    d.setAttribute('x', String(text));
    return d.getAttribute('x');
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
    clearTimeout(this._saveTimeout);
    clearTimeout(this._deleteTimeout);
    this._pendingDelete = false;
    this._currentNoteId = id;
    this._view = 'editor';
    this._render();
  }

  async _createNote() {
    try {
      const beforeCreate = new Date().toISOString();
      await this._hass.callService('better_notes', 'create_note', {
        title: 'New Note',
        content: '',
        color: COLORS[0],
        pinned: false,
      });
      await this._loadNotes();
      // Find the newly created note: created after beforeCreate, not pinned, empty content
      const newNote = this._notes.find(n =>
        n.created >= beforeCreate && n.title === 'New Note' && n.content === ''
      ) ?? (this._notes.length > 0 ? this._notes[this._notes.length - 1] : null);
      if (newNote) {
        this._selectNote(newNote.note_id);
        this.shadowRoot.getElementById('noteTitle')?.select();
      }
    } catch (e) {
      console.error('Better Notes: failed to create note', e);
    }
  }

  async _saveNote(overrides = {}) {
    if (this._saving) return;
    this._saving = true;
    clearTimeout(this._saveTimeout);
    const note = this._currentNote();
    if (!note) {
      this._saving = false;
      return;
    }

    const title = overrides.title ?? this.shadowRoot.getElementById('noteTitle')?.value ?? note.title;
    const content = overrides.content ?? this.shadowRoot.getElementById('noteContent')?.value ?? note.content;
    const color = overrides.color ?? note.color;
    const pinned = overrides.pinned ?? note.pinned;

    try {
      await this._hass.callService('better_notes', 'update_note', {
        note_id: note.note_id,
        title,
        content,
        color,
        pinned,
      });
      const savedId = note.note_id;
      await this._loadNotes();
      this._currentNoteId = this._notes.find(n => n.note_id === savedId)
        ? savedId
        : null;
      this._showSavedFeedback();
    } catch (e) {
      console.error('Better Notes: failed to save note', e);
    } finally {
      this._saving = false;
    }
  }

  async _deleteNote() {
    const note = this._currentNote();
    if (!note) return;

    if (!this._pendingDelete) {
      this._pendingDelete = true;
      const btn = this.shadowRoot.getElementById('deleteBtn');
      if (btn) {
        btn.textContent = 'Confirm?';
        btn.classList.add('confirming');
      }
      this._deleteTimeout = setTimeout(() => {
        this._pendingDelete = false;
        this._render();
      }, 3000);
      return;
    }

    clearTimeout(this._deleteTimeout);
    this._pendingDelete = false;

    try {
      await this._hass.callService('better_notes', 'delete_note', {
        note_id: note.note_id,
      });
      this._currentNoteId = null;
      this._view = 'list';
      await this._loadNotes();
    } catch (e) {
      console.error('Better Notes: failed to delete note', e);
    }
  }

  async _togglePin() {
    const note = this._currentNote();
    if (!note) return;
    await this._saveNote({ pinned: !note.pinned });
  }

  async _setColor(color) {
    const note = this._currentNote();
    if (!note) return;
    await this._saveNote({ color });
  }

  _showSavedFeedback() {
    const existing = this.shadowRoot.querySelector('.save-toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = 'save-toast';
    toast.textContent = 'Saved';
    this.shadowRoot.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 400);
    }, 1100);
  }
}

customElements.define('better-notes-panel', BetterNotesPanel);
