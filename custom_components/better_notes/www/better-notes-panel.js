const COLORS = [
  '#FFEB3B', '#FF9800', '#F44336', '#E91E63', '#9C27B0',
  '#3F51B5', '#2196F3', '#00BCD4', '#009688', '#4CAF50',
];

class BetterNotesPanel extends HTMLElement {
  constructor() {
    super();

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
    this._closeDropdownsHandler = null;
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._initialized) {
      this._initialized = true;
      this._initStyles();
      this._initDOM();
      this._loadTiptapBundle().catch(err => console.warn('Better Notes: Tiptap failed to load', err));
      this._renderList();
      this._loadNotes();
      this._subscribeToEvents();
    }
  }

  connectedCallback() {
    // Block all keyboard events from reaching HA's global shortcut handler.
    // The notes panel is a self-contained app — HA shortcuts should not fire
    // while it is open.
    this.addEventListener('keydown', e => e.stopPropagation());
    this.addEventListener('keypress', e => e.stopPropagation());
    if (this._initialized) {
      this._renderList();
      this._renderEditor(this._currentNote());
    }
  }

  disconnectedCallback() {
    this._disconnected = true;
    clearTimeout(this._saveTimeout);
    clearTimeout(this._deleteTimeout);
    if (this._editor) {
      this._editor.destroy();
      this._editor = null;
    }
    if (this._closeDropdownsHandler) {
      document.removeEventListener('click', this._closeDropdownsHandler);
      this._closeDropdownsHandler = null;
    }
    if (this._unsubscribeEvents) {
      this._unsubscribeEvents();
      this._unsubscribeEvents = null;
    }
  }

  async _loadNotes() {
    try {
      const result = await this._hass.connection.sendMessagePromise({
        type: 'call_service',
        domain: 'better_notes',
        service: 'get_notes',
        service_data: {},
        return_response: true,
      });
      const notes = result?.response?.notes;
      if (Array.isArray(notes)) {
        this._notes = notes;
        this._renderList();
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
      better-notes-panel {
        display: block;
        height: 100%;
      }

      .bn-panel {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        --accent: #2196F3;
        --accent-dark: #1976D2;
        --border: #e0e0e0;
        --bg: #fafafa;
        --text: #333;
        --text-muted: #666;
        --text-faint: #999;
        display: flex;
        height: 100%;
        background: #fff;
        overflow: hidden;
      }

      .bn-panel * { box-sizing: border-box; margin: 0; padding: 0; }

      .bn-panel .panel-list {
        width: 100%;
        background: var(--bg);
        border-right: 1px solid var(--border);
        display: flex;
        flex-direction: column;
        flex-shrink: 0;
      }

      .bn-panel .panel-list-header {
        padding: 16px;
        border-bottom: 1px solid var(--border);
      }

      .bn-panel .panel-list-header h1 {
        font-size: 22px;
        font-weight: 600;
        color: var(--text);
        margin-bottom: 12px;
      }

      .bn-panel .search-box {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid var(--border);
        border-radius: 6px;
        font-size: 14px;
        background: #fff;
        margin-bottom: 10px;
      }

      .bn-panel .search-box:focus { outline: none; border-color: var(--accent); }

      .bn-panel .new-note-btn {
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

      .bn-panel .new-note-btn:hover { background: var(--accent-dark); }

      .bn-panel .notes-list {
        flex: 1;
        overflow-y: auto;
        padding: 10px;
      }

      .bn-panel .note-item {
        position: relative;
        padding: 10px 10px 10px 14px;
        margin-bottom: 8px;
        background: #fff;
        border: 1px solid var(--border);
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.15s;
      }

      .bn-panel .note-item:hover { border-color: var(--accent); box-shadow: 0 2px 4px rgba(0,0,0,0.08); }
      .bn-panel .note-item.active { background: #bbdefb; border-color: var(--accent); box-shadow: inset 3px 0 0 var(--accent); }

      .bn-panel .note-color-bar {
        position: absolute;
        left: 0; top: 0;
        width: 4px; height: 100%;
        border-radius: 8px 0 0 8px;
      }

      .bn-panel .note-item-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 3px;
      }

      .bn-panel .note-item-title {
        font-weight: 600;
        font-size: 14px;
        color: var(--text);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        flex: 1;
      }

      .bn-panel .note-item-preview {
        font-size: 12px;
        color: var(--text-muted);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        margin-bottom: 3px;
      }

      .bn-panel .note-item-date { font-size: 11px; color: var(--text-faint); }
      .bn-panel .pin-icon { font-size: 14px; margin-left: 4px; flex-shrink: 0; }

      .bn-panel .empty-list {
        padding: 20px;
        text-align: center;
        color: var(--text-faint);
        font-size: 14px;
      }

      .bn-panel .panel-editor {
        flex: 1;
        display: flex;
        flex-direction: column;
        background: #fff;
        min-width: 0;
      }

      .bn-panel .editor-header {
        padding: 12px 16px;
        border-bottom: 1px solid var(--border);
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .bn-panel .back-btn {
        display: none;
        padding: 6px 12px;
        border: 1px solid var(--border);
        border-radius: 6px;
        background: #fff;
        cursor: pointer;
        font-size: 14px;
      }

      .bn-panel .back-btn:hover { background: #f5f5f5; }

      .bn-panel .editor-actions { display: flex; gap: 8px; margin-left: auto; }

      .bn-panel .editor-btn {
        padding: 6px 14px;
        border: 1px solid var(--border);
        border-radius: 6px;
        background: #fff;
        cursor: pointer;
        font-size: 14px;
      }

      .bn-panel .editor-btn:hover { background: #f5f5f5; }
      .bn-panel .editor-btn.danger { background: #f44336; color: #fff; border-color: #f44336; }
      .bn-panel .editor-btn.danger:hover { background: #d32f2f; }
      .bn-panel .editor-btn.confirming { background: #ff7043; color: #fff; border-color: #ff7043; }

      .bn-panel .editor-body {
        flex: 1;
        overflow-y: auto;
        padding: 20px 24px;
      }

      .bn-panel .editor-toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        align-items: center;
        padding-bottom: 16px;
        border-bottom: 1px solid var(--border);
        margin-bottom: 16px;
      }

      .bn-panel .pin-toggle {
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

      .bn-panel .pin-toggle:hover { background: #f5f5f5; }
      .bn-panel .pin-toggle.active { background: #fff3e0; border-color: #FF9800; color: #FF9800; }

      .bn-panel .toolbar-label { font-size: 13px; color: var(--text-muted); font-weight: 500; }

      .bn-panel .color-picker { display: flex; gap: 6px; flex-wrap: wrap; }

      .bn-panel .color-dot {
        width: 28px; height: 28px;
        border-radius: 50%;
        cursor: pointer;
        border: 2px solid transparent;
        transition: all 0.15s;
      }

      .bn-panel .color-dot:hover { transform: scale(1.1); }
      .bn-panel .color-dot.active { border-color: #333; transform: scale(1.15); }

      .bn-panel .note-title-input {
        width: 100%;
        font-size: 28px;
        font-weight: 700;
        border: none;
        outline: none;
        margin-bottom: 16px;
        color: var(--text);
        font-family: inherit;
      }

      .bn-panel .note-content-input {
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

      .bn-panel .empty-editor {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: var(--text-faint);
      }

      .bn-panel .empty-editor-icon { font-size: 56px; margin-bottom: 16px; }
      .bn-panel .empty-editor-text { font-size: 16px; }

      .bn-panel .save-toast {
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

      .bn-panel #tiptap-mount .ProseMirror {
        min-height: 300px;
        font-size: 15px;
        line-height: 1.6;
        outline: none;
        color: var(--text);
        font-family: inherit;
      }

      .bn-panel #tiptap-mount .ProseMirror p { margin: 0 0 8px; }
      .bn-panel #tiptap-mount .ProseMirror h1 { font-size: 24px; font-weight: 700; margin: 0 0 8px; }
      .bn-panel #tiptap-mount .ProseMirror h2 { font-size: 20px; font-weight: 600; margin: 0 0 8px; }
      .bn-panel #tiptap-mount .ProseMirror h3 { font-size: 16px; font-weight: 600; margin: 0 0 8px; }
      .bn-panel #tiptap-mount .ProseMirror ul,
      .bn-panel #tiptap-mount .ProseMirror ol { margin: 0 0 8px; padding-left: 24px; }
      .bn-panel #tiptap-mount .ProseMirror li { margin-bottom: 2px; }
      .bn-panel #tiptap-mount .ProseMirror ul[data-type="taskList"] { list-style: none; padding-left: 0; }
      .bn-panel #tiptap-mount .ProseMirror ul[data-type="taskList"] li { display: flex; align-items: flex-start; gap: 6px; }
      .bn-panel #tiptap-mount .ProseMirror ul[data-type="taskList"] li > label { flex-shrink: 0; margin-top: 2px; }
      .bn-panel #tiptap-mount .ProseMirror mark { background: #fff176; padding: 1px 2px; border-radius: 2px; }
      .bn-panel #tiptap-mount .ProseMirror a { color: var(--accent); text-decoration: underline; }
      .bn-panel #tiptap-mount .ProseMirror s { text-decoration: line-through; }
      .bn-panel #tiptap-mount .ProseMirror p.is-editor-empty:first-child::before {
        content: attr(data-placeholder);
        float: left;
        color: var(--text-faint);
        pointer-events: none;
        height: 0;
      }

      @media (max-width: 767px) {
        better-notes-panel[data-view="list"] .panel-editor { display: none; }
        better-notes-panel[data-view="editor"] .panel-list { display: none; }
        .bn-panel .back-btn { display: block; }
        .bn-panel .save-toast { bottom: 16px; right: 16px; left: 16px; text-align: center; }
      }

      @media (min-width: 768px) {
        .bn-panel .panel-list { width: 280px; display: flex; }
        .bn-panel .panel-editor { display: flex; }
      }

      .bn-panel .formatting-toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        padding: 8px 12px;
        background: #fff;
        border-top: 1px solid var(--border);
        flex-shrink: 0;
      }

      .bn-panel .toolbar-group { position: relative; }

      .bn-panel .tb-btn {
        padding: 6px 10px;
        border: 1px solid var(--border);
        border-radius: 6px;
        background: #fff;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 3px;
        white-space: nowrap;
      }
      .bn-panel .tb-btn:hover { background: #f5f5f5; }
      .bn-panel .tb-btn.active { background: #fff3e0; border-color: #FF9800; }

      .bn-panel .tb-caret { font-size: 10px; }

      .bn-panel .tb-dropdown {
        display: none;
        position: absolute;
        bottom: calc(100% + 6px);
        left: 0;
        background: #fff;
        border: 1px solid var(--border);
        border-radius: 8px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.12);
        z-index: 200;
        min-width: 150px;
        padding: 4px 0;
      }
      .bn-panel .toolbar-group.open .tb-dropdown { display: block; }

      .bn-panel .tb-dd-item {
        display: block;
        width: 100%;
        padding: 8px 14px;
        text-align: left;
        border: none;
        background: none;
        cursor: pointer;
        font-size: 14px;
        white-space: nowrap;
      }
      .bn-panel .tb-dd-item:hover { background: #f5f5f5; }

      .bn-panel .tb-dd-divider { height: 1px; background: var(--border); margin: 4px 0; }

      .bn-panel .tb-color-swatches {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        padding: 10px;
      }
      .bn-panel .tb-color-dot {
        width: 24px; height: 24px;
        border-radius: 50%;
        cursor: pointer;
        border: 2px solid transparent;
        transition: transform 0.1s;
      }
      .bn-panel .tb-color-dot:hover { transform: scale(1.1); }
      .bn-panel .tb-color-dot.active { border-color: #333; }

      .bn-panel .tb-link-row {
        display: none;
        align-items: center;
        gap: 6px;
        width: 100%;
        padding: 6px 0 2px;
        flex-basis: 100%;
      }
      .bn-panel .tb-link-input {
        flex: 1;
        padding: 5px 8px;
        border: 1px solid var(--border);
        border-radius: 6px;
        font-size: 13px;
        min-width: 0;
      }
      .bn-panel .tb-link-action-btn {
        padding: 5px 10px;
        border: 1px solid var(--border);
        border-radius: 6px;
        background: #fff;
        cursor: pointer;
        font-size: 13px;
        flex-shrink: 0;
      }
      .bn-panel .tb-link-action-btn:hover { background: #f5f5f5; }

      /* Desktop: toolbar at bottom — natural flex order (last child in panel-editor) */
      .bn-panel .panel-editor {
        display: flex;
        flex-direction: column;
      }
      .bn-panel .editor-body { flex: 1; overflow-y: auto; padding: 20px 24px; }
      .bn-panel .formatting-toolbar { order: 3; }

      /* Mobile: toolbar below header, above editor body */
      @media (max-width: 767px) {
        .bn-panel .editor-body { order: 3; }
        .bn-panel .formatting-toolbar {
          order: 2;
          border-top: none;
          border-bottom: 1px solid var(--border);
        }
        .bn-panel .tb-dropdown {
          top: calc(100% + 6px);
          bottom: auto;
        }
      }
    `;
    this.appendChild(style);

    const content = document.createElement('div');
    content.id = 'content';
    content.style.cssText = 'display:contents';
    this.appendChild(content);
  }

  _initDOM() {
    const content = this.querySelector('#content');
    if (!content) return;
    content.innerHTML = `
      <div class="panel bn-panel">
        <div class="panel-list" id="panel-list"></div>
        <div class="panel-editor" id="panel-editor">
          <div class="empty-editor" id="editor-empty">
            <div class="empty-editor-icon">📝</div>
            <div class="empty-editor-text">Select a note or create a new one</div>
          </div>
        </div>
      </div>
    `;
  }

  _renderList() {
    const listEl = this.querySelector('#panel-list');
    if (!listEl) return;
    this.setAttribute('data-view', this._view);
    const filtered = this._filteredNotes();
    listEl.innerHTML = `
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
              <div class="note-item-preview">${this._escapeHtml(this._stripHtml(note.content || '').substring(0, 60))}${this._stripHtml(note.content || '').length > 60 ? '…' : ''}</div>
              <div class="note-item-date">${this._formatDate(note.modified)}</div>
            </div>
          `).join('')
        }
      </div>
    `;
    this._attachListListeners();
  }

  _renderEditor(note) {
    const editorPanel = this.querySelector('#panel-editor');
    if (!editorPanel) return;

    if (!note) {
      if (this._editor) {
        this._editor.destroy();
        this._editor = null;
      }
      editorPanel.innerHTML = `
        <div class="empty-editor" id="editor-empty">
          <div class="empty-editor-icon">📝</div>
          <div class="empty-editor-text">Select a note or create a new one</div>
        </div>
      `;
      return;
    }

    if (!this._editor) {
      editorPanel.innerHTML = this._editorShell(note);
      this._attachEditorListeners();
      this._attachToolbarListeners(note);
      this._initTiptap(note).catch(err => console.error('Failed to init Tiptap:', err));
    } else {
      const titleInput = this.querySelector('#noteTitle');
      if (titleInput) titleInput.value = note.title || '';
      this._editor.commands.setContent(note.content || '');
      this._editor.commands.focus('end');
      this._updateToolbarState(note);
    }
  }

  _editorShell(note) {
    return `
      <div class="editor-header">
        <button class="back-btn" id="backBtn">← Back</button>
        <div class="editor-actions">
          <button class="editor-btn" id="saveBtn">Save</button>
          <button class="editor-btn danger" id="deleteBtn">Delete</button>
        </div>
      </div>
      <div class="editor-body">
        <input class="note-title-input" id="noteTitle" type="text"
               placeholder="Note Title" value="${this._escapeAttr(note.title || '')}">
        <div id="tiptap-mount"></div>
      </div>
      <div class="formatting-toolbar" id="formattingToolbar">
        ${this._toolbarHtml(note)}
      </div>
    `;
  }

  _toolbarHtml(note) {
    const colorSwatches = COLORS.map(c => `
      <div class="tb-color-dot ${note.color === c ? 'active' : ''}"
           style="background:${this._safeColor(c)}" data-color="${c}"></div>
    `).join('');

    return `
      <div class="toolbar-group" id="tbGroupHeading">
        <button class="tb-btn" id="tbHeading">H <span class="tb-caret">▾</span></button>
        <div class="tb-dropdown" id="tbDropHeading">
          <button class="tb-dd-item" data-action="paragraph">Normal</button>
          <button class="tb-dd-item" data-action="h1">H1</button>
          <button class="tb-dd-item" data-action="h2">H2</button>
          <button class="tb-dd-item" data-action="h3">H3</button>
        </div>
      </div>
      <div class="toolbar-group" id="tbGroupFormat">
        <button class="tb-btn" id="tbFormat">B <span class="tb-caret">▾</span></button>
        <div class="tb-dropdown" id="tbDropFormat">
          <button class="tb-dd-item" data-action="bold">Bold</button>
          <button class="tb-dd-item" data-action="italic">Italic</button>
          <button class="tb-dd-item" data-action="strike">Strikethrough</button>
          <button class="tb-dd-item" data-action="highlight">Highlight</button>
        </div>
      </div>
      <div class="toolbar-group" id="tbGroupList">
        <button class="tb-btn" id="tbList">≡ <span class="tb-caret">▾</span></button>
        <div class="tb-dropdown" id="tbDropList">
          <button class="tb-dd-item" data-action="bulletList">Bullet list</button>
          <button class="tb-dd-item" data-action="orderedList">Numbered list</button>
          <button class="tb-dd-item" data-action="taskList">Checklist</button>
          <div class="tb-dd-divider"></div>
          <button class="tb-dd-item" data-action="indent">Indent</button>
          <button class="tb-dd-item" data-action="outdent">Outdent</button>
        </div>
      </div>
      <div class="toolbar-group" id="tbGroupColor">
        <button class="tb-btn" id="tbColor">🎨 <span class="tb-caret">▾</span></button>
        <div class="tb-dropdown" id="tbDropColor">
          <div class="tb-color-swatches">${colorSwatches}</div>
        </div>
      </div>
      <button class="tb-btn tb-pin-btn ${note.pinned ? 'active' : ''}" id="tbPin">📌</button>
      <div class="toolbar-group" id="tbGroupOverflow">
        <button class="tb-btn" id="tbOverflow">⋮</button>
        <div class="tb-dropdown" id="tbDropOverflow">
          <button class="tb-dd-item" data-action="link">Link</button>
        </div>
      </div>
      <div class="tb-link-row" id="tbLinkRow" style="display:none">
        <input type="url" class="tb-link-input" id="tbLinkUrl" placeholder="https://…">
        <button class="tb-link-action-btn" id="tbLinkApply">Apply</button>
        <button class="tb-link-action-btn" id="tbLinkRemove">Remove</button>
        <button class="tb-link-action-btn" id="tbLinkCancel">✕</button>
      </div>
    `;
  }

  _updateToolbarState(note) {
    const pinBtn = this.querySelector('#tbPin');
    if (pinBtn) pinBtn.classList.toggle('active', !!note.pinned);

    this.querySelectorAll('.tb-color-dot').forEach(dot => {
      dot.classList.toggle('active', dot.dataset.color === note.color);
    });
  }

  _attachListListeners() {
    this.querySelector('#searchBox')?.addEventListener('input', e => {
      this._searchTerm = e.target.value;
      this._renderList();
    });
    this.querySelector('#newNoteBtn')?.addEventListener('click', () => this._createNote());
    this.querySelectorAll('.note-item').forEach(el => {
      el.addEventListener('click', () => this._selectNote(el.dataset.id));
    });
  }

  _attachEditorListeners() {
    this.querySelector('#backBtn')?.addEventListener('click', () => {
      this._view = 'list';
      this._renderList();
    });
    this.querySelector('#saveBtn')?.addEventListener('click', () => this._saveNote());
    this.querySelector('#deleteBtn')?.addEventListener('click', () => this._deleteNote());

    const autoSave = () => {
      clearTimeout(this._saveTimeout);
      this._saveTimeout = setTimeout(() => this._saveNote(), 1000);
    };
    this.querySelector('#noteTitle')?.addEventListener('input', autoSave);
  }

  _attachToolbarListeners(note) {
    const root = this;

    // Dropdown toggle logic
    const dropdownPairs = [
      ['tbHeading', 'tbGroupHeading'],
      ['tbFormat', 'tbGroupFormat'],
      ['tbList', 'tbGroupList'],
      ['tbColor', 'tbGroupColor'],
      ['tbOverflow', 'tbGroupOverflow'],
    ];

    const closeAllDropdowns = () => {
      dropdownPairs.forEach(([, groupId]) => {
        root.querySelector(`#${groupId}`)?.classList.remove('open');
      });
    };

    dropdownPairs.forEach(([btnId, groupId]) => {
      root.querySelector(`#${btnId}`)?.addEventListener('click', e => {
        e.stopPropagation();
        const group = root.querySelector(`#${groupId}`);
        const wasOpen = group?.classList.contains('open');
        closeAllDropdowns();
        if (!wasOpen) group?.classList.add('open');
      });
    });

    document.addEventListener('click', closeAllDropdowns, { once: false });
    this._closeDropdownsHandler = closeAllDropdowns;

    // Heading actions
    root.querySelector('[data-action="paragraph"]')?.addEventListener('click', () => {
      this._editor?.chain().focus().setParagraph().run();
      closeAllDropdowns();
    });
    [1, 2, 3].forEach(level => {
      root.querySelector(`[data-action="h${level}"]`)?.addEventListener('click', () => {
        this._editor?.chain().focus().toggleHeading({ level }).run();
        closeAllDropdowns();
      });
    });

    // Format actions
    root.querySelector('[data-action="bold"]')?.addEventListener('click', () => {
      this._editor?.chain().focus().toggleBold().run();
      closeAllDropdowns();
    });
    root.querySelector('[data-action="italic"]')?.addEventListener('click', () => {
      this._editor?.chain().focus().toggleItalic().run();
      closeAllDropdowns();
    });
    root.querySelector('[data-action="strike"]')?.addEventListener('click', () => {
      this._editor?.chain().focus().toggleStrike().run();
      closeAllDropdowns();
    });
    root.querySelector('[data-action="highlight"]')?.addEventListener('click', () => {
      this._editor?.chain().focus().toggleHighlight().run();
      closeAllDropdowns();
    });

    // List actions
    root.querySelector('[data-action="bulletList"]')?.addEventListener('click', () => {
      this._editor?.chain().focus().toggleBulletList().run();
      closeAllDropdowns();
    });
    root.querySelector('[data-action="orderedList"]')?.addEventListener('click', () => {
      this._editor?.chain().focus().toggleOrderedList().run();
      closeAllDropdowns();
    });
    root.querySelector('[data-action="taskList"]')?.addEventListener('click', () => {
      this._editor?.chain().focus().toggleTaskList().run();
      closeAllDropdowns();
    });
    root.querySelector('[data-action="indent"]')?.addEventListener('click', () => {
      this._editor?.chain().focus().sinkListItem('listItem').run();
      closeAllDropdowns();
    });
    root.querySelector('[data-action="outdent"]')?.addEventListener('click', () => {
      this._editor?.chain().focus().liftListItem('listItem').run();
      closeAllDropdowns();
    });

    // Color swatches
    root.querySelectorAll('.tb-color-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        this._setColor(dot.dataset.color);
        closeAllDropdowns();
      });
    });

    // Pin button
    root.querySelector('#tbPin')?.addEventListener('click', () => this._togglePin());

    // Link (overflow)
    root.querySelector('[data-action="link"]')?.addEventListener('click', () => {
      closeAllDropdowns();
      const linkRow = root.querySelector('#tbLinkRow');
      if (linkRow) {
        linkRow.style.display = 'flex';
        const existing = this._editor?.getAttributes('link').href || '';
        root.querySelector('#tbLinkUrl').value = existing;
        root.querySelector('#tbLinkUrl').focus();
      }
    });

    root.querySelector('#tbLinkApply')?.addEventListener('click', () => {
      const url = root.querySelector('#tbLinkUrl')?.value?.trim();
      if (url && this._isValidUrl(url)) {
        this._editor?.chain().focus().setLink({ href: url }).run();
      }
      root.querySelector('#tbLinkRow').style.display = 'none';
    });

    root.querySelector('#tbLinkRemove')?.addEventListener('click', () => {
      this._editor?.chain().focus().unsetLink().run();
      root.querySelector('#tbLinkRow').style.display = 'none';
    });

    root.querySelector('#tbLinkCancel')?.addEventListener('click', () => {
      root.querySelector('#tbLinkRow').style.display = 'none';
    });
  }

  _isValidUrl(str) {
    try { new URL(str); return true; } catch { return false; }
  }

  _loadTiptapBundle() {
    if (window.TiptapBundle) return Promise.resolve(window.TiptapBundle);
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = '/better_notes_panel/tiptap-bundle.js';
      script.onload = () => {
        if (window.TiptapBundle) resolve(window.TiptapBundle);
        else reject(new Error('TiptapBundle not found after script load'));
      };
      script.onerror = () => reject(new Error('Failed to load tiptap-bundle.js'));
      document.head.appendChild(script);
    });
  }

  async _initTiptap(note) {
    const mount = this.querySelector('#tiptap-mount');
    if (!mount) return;

    let bundle;
    try {
      bundle = await this._loadTiptapBundle();
    } catch (err) {
      console.warn('Better Notes: Tiptap failed to load, falling back to textarea', err);
      bundle = null;
    }

    if (!bundle) {
      mount.innerHTML = `<textarea class="note-content-input" id="noteContent"
        placeholder="Start typing...">${this._escapeHtml(note.content || '')}</textarea>`;
      mount.querySelector('#noteContent')?.addEventListener('input', () => {
        clearTimeout(this._saveTimeout);
        this._saveTimeout = setTimeout(() => this._saveNote(), 1000);
      });
      return;
    }

    const { Editor, StarterKit, TaskList, TaskItem, Link, Highlight } = bundle;

    try {
      this._editor = new Editor({
        element: mount,
        extensions: [
          StarterKit.configure({ heading: { levels: [1, 2, 3] }, link: false }),
          TaskList,
          TaskItem.configure({ nested: true }),
          Link.configure({ openOnClick: false }),
          Highlight,
        ],
        content: note.content || '',
        autofocus: 'end',
        onUpdate: () => {
          clearTimeout(this._saveTimeout);
          this._saveTimeout = setTimeout(() => this._saveNote(), 1000);
        },
      });
    } catch (err) {
      console.warn('Better Notes: Tiptap init failed, falling back to textarea', err);
      mount.innerHTML = `<textarea class="note-content-input" id="noteContent"
        placeholder="Start typing...">${this._escapeHtml(note.content || '')}</textarea>`;
      mount.querySelector('#noteContent')?.addEventListener('input', () => {
        clearTimeout(this._saveTimeout);
        this._saveTimeout = setTimeout(() => this._saveNote(), 1000);
      });
    }
  }

  _currentNote() {
    return this._notes.find(n => n.note_id === this._currentNoteId) ?? null;
  }

  _filteredNotes() {
    const term = this._searchTerm.toLowerCase();
    if (!term) return this._notes;
    return this._notes.filter(n =>
      (n.title || '').toLowerCase().includes(term) ||
      this._stripHtml(n.content || '').toLowerCase().includes(term)
    );
  }

  _safeColor(color) {
    return /^#[0-9a-fA-F]{6}$|^#[0-9a-fA-F]{3}$/.test(color) ? color : '#FFEB3B';
  }

  _stripHtml(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || '';
  }

  _escapeHtml(text) {
    const d = document.createElement('div');
    d.textContent = String(text);
    return d.innerHTML;
  }

  _escapeAttr(text) {
    const d = document.createElement('div');
    d.textContent = String(text);
    return d.innerHTML.replace(/"/g, '&quot;');
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

  _selectNote(id) {
    clearTimeout(this._saveTimeout);
    clearTimeout(this._deleteTimeout);
    this._pendingDelete = false;
    this._currentNoteId = id;
    this._view = 'editor';
    this._renderList();
    this._renderEditor(this._currentNote());
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
      ) ?? (this._notes.length > 0 ? this._notes[0] : null);
      if (newNote) {
        this._selectNote(newNote.note_id);
        this.querySelector('#noteTitle')?.select();
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

    const title = overrides.title ?? this.querySelector('#noteTitle')?.value ?? note.title;
    const content = overrides.content ?? (
      this._editor
        ? this._editor.getHTML()
        : (this.querySelector('#noteContent')?.value ?? note.content)
    );
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
      const savedNote = this._notes.find(n => n.note_id === savedId);
      this._currentNoteId = savedNote ? savedId : null;
      if (savedNote) this._updateToolbarState(savedNote);
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
      const btn = this.querySelector('#deleteBtn');
      if (btn) {
        btn.textContent = 'Confirm?';
        btn.classList.add('confirming');
      }
      this._deleteTimeout = setTimeout(() => {
        this._pendingDelete = false;
        this._renderEditor(this._currentNote());
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
      this._renderEditor(null);
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
    const existing = this.querySelector('.save-toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = 'save-toast';
    toast.textContent = 'Saved';
    this.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 400);
    }, 1100);
  }
}

customElements.define('better-notes-panel', BetterNotesPanel);
