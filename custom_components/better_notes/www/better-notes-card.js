class BetterNotesCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = {};
    this._hass = null;
    this._notes = [];
    this._unsubscribeEvents = null;
  }

  setConfig(config) {
    if (!config) {
      throw new Error('Invalid configuration');
    }

    this._config = {
      title: config.title || 'Notes',
      note_id: config.note_id || null,
      show_all: config.show_all || false,
      max_notes: config.max_notes || 5,
      show_pinned_only: config.show_pinned_only || false,
      card_color: config.card_color || '#FFEB3B',
      ...config
    };

    this.render();
  }

  set hass(hass) {
    const firstLoad = !this._hass;
    this._hass = hass;
    if (firstLoad) {
      this._loadNotes();
      this._subscribeToNoteEvents();
    }
  }

  async _loadNotes() {
    if (!this._hass) return;

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
        this.render();
      }
    } catch (error) {
      console.error('Error loading notes for card:', error);
    }
  }

  _subscribeToNoteEvents() {
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
      if (!this.isConnected) {
        unsubs.forEach(fn => fn());
      } else {
        this._unsubscribeEvents = () => unsubs.forEach(fn => fn());
      }
    });
  }

  disconnectedCallback() {
    if (this._unsubscribeEvents) {
      this._unsubscribeEvents();
      this._unsubscribeEvents = null;
    }
  }

  render() {
    const content = this._config.note_id
      ? this.renderSingleNote()
      : this.renderNotesList();

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }

        ha-card {
          padding: 16px;
          background: var(--card-background-color, #fff);
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .card-header {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 16px;
          color: var(--primary-text-color);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .note-card {
          background: var(--note-color, #FFEB3B);
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 12px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          cursor: pointer;
          transition: all 0.2s;
        }

        .note-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }

        .note-card:last-child {
          margin-bottom: 0;
        }

        .note-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 8px;
          color: rgba(0,0,0,0.87);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .note-content {
          font-size: 14px;
          color: rgba(0,0,0,0.6);
          line-height: 1.5;
          word-wrap: break-word;
        }
        .note-content h1 { font-size: 18px; font-weight: 700; margin: 4px 0; }
        .note-content h2 { font-size: 16px; font-weight: 600; margin: 4px 0; }
        .note-content h3 { font-size: 14px; font-weight: 600; margin: 4px 0; }
        .note-content ul, .note-content ol { margin: 4px 0; padding-left: 20px; }
        .note-content li { margin-bottom: 2px; }
        .note-content ul[data-type="taskList"] { list-style: none; padding-left: 0; }
        .note-content ul[data-type="taskList"] li { display: flex; align-items: flex-start; gap: 4px; }
        .note-content mark { background: #fff176; padding: 1px 2px; border-radius: 2px; }
        .note-content a { color: inherit; text-decoration: underline; }
        .note-content s { text-decoration: line-through; }

        .note-meta {
          margin-top: 8px;
          font-size: 12px;
          color: rgba(0,0,0,0.5);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .pinned-badge {
          font-size: 14px;
        }

        .empty-state {
          text-align: center;
          padding: 32px;
          color: var(--secondary-text-color);
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 12px;
        }

        .tags {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin-top: 8px;
        }

        .tag {
          background: rgba(0,0,0,0.1);
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          color: rgba(0,0,0,0.7);
        }

        .view-all-btn {
          display: block;
          width: 100%;
          padding: 12px;
          margin-top: 12px;
          background: var(--primary-color);
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        }

        .view-all-btn:hover {
          opacity: 0.9;
        }
      </style>

      <ha-card>
        <div class="card-header">
          <span>📝</span>
          <span>${this.escapeHtml(this._config.title)}</span>
        </div>
        ${content}
      </ha-card>
    `;

    this.shadowRoot.querySelectorAll('[data-note-content]').forEach(el => {
      const noteId = el.dataset.noteContent;
      const n = this._notes.find(note => note.note_id === noteId);
      if (!n) return;
      const isListView = !this._config.note_id;
      if (isListView) {
        const plain = this._stripHtml(n.content || '');
        el.textContent = plain.length > 150 ? plain.substring(0, 150) + '…' : plain;
      } else {
        el.innerHTML = this._sanitizeHtml(n.content || '');
      }
    });

    this.attachEventListeners();
  }

  renderSingleNote() {
    const note = this._notes.find(n => n.note_id === this._config.note_id);

    if (!note) {
      return `
        <div class="empty-state">
          <div class="empty-icon">📭</div>
          <div>Note not found</div>
        </div>
      `;
    }

    return `
      <div class="note-card" style="--note-color: ${this._safeColor(note.color)}" data-note-id="${note.note_id}">
        <div class="note-title">
          <span>${this.escapeHtml(note.title || 'Untitled')}</span>
          ${note.pinned ? '<span class="pinned-badge">📌</span>' : ''}
        </div>
        <div class="note-content" data-note-content="${note.note_id}"></div>
        ${note.tags && note.tags.length > 0 ? `
          <div class="tags">
            ${note.tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
          </div>
        ` : ''}
        <div class="note-meta">
          <span>${this.formatDate(note.modified)}</span>
        </div>
      </div>
    `;
  }

  renderNotesList() {
    let notes = [...this._notes];

    if (this._config.show_pinned_only) {
      notes = notes.filter(n => n.pinned);
    }

    notes = notes.slice(0, this._config.max_notes);

    if (notes.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-icon">📭</div>
          <div>No notes to display</div>
        </div>
      `;
    }

    return `
      ${notes.map(note => `
        <div class="note-card" style="--note-color: ${this._safeColor(note.color)}" data-note-id="${note.note_id}">
          <div class="note-title">
            <span>${this.escapeHtml(note.title || 'Untitled')}</span>
            ${note.pinned ? '<span class="pinned-badge">📌</span>' : ''}
          </div>
          <div class="note-content" data-note-content="${note.note_id}"></div>
          ${note.tags && note.tags.length > 0 ? `
            <div class="tags">
              ${note.tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
            </div>
          ` : ''}
          <div class="note-meta">
            <span>${this.formatDate(note.modified)}</span>
          </div>
        </div>
      `).join('')}
      ${this._notes.length > this._config.max_notes ? `
        <button class="view-all-btn" id="viewAllBtn">View All Notes</button>
      ` : ''}
    `;
  }

  attachEventListeners() {
    const noteCards = this.shadowRoot.querySelectorAll('.note-card');
    noteCards.forEach(card => {
      card.addEventListener('click', () => {
        this.openBetterNotes();
      });
    });

    const viewAllBtn = this.shadowRoot.getElementById('viewAllBtn');
    if (viewAllBtn) {
      viewAllBtn.addEventListener('click', () => {
        this.openBetterNotes();
      });
    }
  }

  openBetterNotes() {
    window.history.pushState(null, '', '/better-notes');
    window.dispatchEvent(new Event('location-changed', {
      bubbles: true,
      composed: true,
    }));
  }

  truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  formatDate(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString();
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  _safeColor(color) {
    return /^#[0-9a-fA-F]{6}$|^#[0-9a-fA-F]{3}$/.test(color) ? color : '#FFEB3B';
  }

  _sanitizeHtml(html) {
    const ALLOWED_TAGS = new Set([
      'p', 'br', 'strong', 'b', 'em', 'i', 's', 'u', 'mark',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'a', 'blockquote', 'code', 'pre',
      'input', 'label', 'span', 'div',
    ]);
    const ALLOWED_ATTRS_BY_TAG = {
      a:     ['href', 'target', 'rel'],
      input: ['type', 'checked', 'disabled'],
    };
    const SAFE_PROTOCOLS = /^(https?:|mailto:)/i;

    const sanitizeNode = node => {
      if (node.nodeType === Node.TEXT_NODE) return;
      if (node.nodeType !== Node.ELEMENT_NODE) {
        node.parentNode?.removeChild(node);
        return;
      }
      const tag = node.tagName.toLowerCase();
      if (!ALLOWED_TAGS.has(tag)) {
        // Replace disallowed element with its children
        const parent = node.parentNode;
        while (node.firstChild) parent.insertBefore(node.firstChild, node);
        parent.removeChild(node);
        return;
      }
      // Strip disallowed attributes
      const allowed = ALLOWED_ATTRS_BY_TAG[tag] || [];
      Array.from(node.attributes).forEach(attr => {
        if (!allowed.includes(attr.name) && attr.name !== 'data-type' && attr.name !== 'data-checked') {
          node.removeAttribute(attr.name);
        }
      });
      // Enforce safe href protocols
      if (tag === 'a') {
        const href = node.getAttribute('href') || '';
        if (!SAFE_PROTOCOLS.test(href)) node.removeAttribute('href');
        node.setAttribute('rel', 'noopener noreferrer');
      }
      Array.from(node.childNodes).forEach(sanitizeNode);
    };

    const div = document.createElement('div');
    div.innerHTML = html;
    Array.from(div.childNodes).forEach(sanitizeNode);
    return div.innerHTML;
  }

  _stripHtml(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || '';
  }

  getCardSize() {
    return this._config.note_id ? 3 : Math.min(this._config.max_notes, this._notes.length) + 1;
  }

  static getConfigElement() {
    return document.createElement('better-notes-card-editor');
  }

  static getStubConfig() {
    return {
      title: 'Notes',
      show_all: true,
      max_notes: 5,
      show_pinned_only: false
    };
  }
}

customElements.define('better-notes-card', BetterNotesCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'better-notes-card',
  name: 'Better Notes Card',
  description: 'Display notes from Better Notes',
  preview: true,
  documentationURL: 'https://github.com/CameronVerrells/BetterNotesforHA'
});

// Card Editor
class BetterNotesCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  setConfig(config) {
    this._config = config;
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        .card-config {
          padding: 16px;
        }

        .option {
          margin-bottom: 16px;
        }

        label {
          display: block;
          margin-bottom: 4px;
          font-weight: 500;
        }

        input[type="text"],
        input[type="number"],
        select {
          width: 100%;
          padding: 8px;
          border: 1px solid #ccc;
          border-radius: 4px;
        }

        input[type="checkbox"] {
          margin-right: 8px;
        }
      </style>

      <div class="card-config">
        <div class="option">
          <label for="title">Title</label>
          <input type="text" id="title" value="${this._escapeAttr(this._config.title || 'Notes')}">
        </div>

        <div class="option">
          <label for="max_notes">Max Notes to Display</label>
          <input type="number" id="max_notes" min="1" max="20" value="${this._config.max_notes || 5}">
        </div>

        <div class="option">
          <label>
            <input type="checkbox" id="show_pinned_only" ${this._config.show_pinned_only ? 'checked' : ''}>
            Show Pinned Notes Only
          </label>
        </div>

        <div class="option">
          <label>
            <input type="checkbox" id="show_all" ${this._config.show_all ? 'checked' : ''}>
            Show All Notes
          </label>
        </div>

        <div class="option">
          <label for="card_color">Card Background Color (hex)</label>
          <input type="text" id="card_color" value="${this._escapeAttr(this._config.card_color || '#FFEB3B')}" placeholder="#FFEB3B">
        </div>

        <div class="option">
          <label for="note_id">Specific Note ID (optional)</label>
          <input type="text" id="note_id" value="${this._escapeAttr(this._config.note_id || '')}" placeholder="Leave empty to show all">
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  attachEventListeners() {
    ['title', 'max_notes', 'note_id'].forEach(id => {
      const input = this.shadowRoot.getElementById(id);
      input.addEventListener('input', () => this.configChanged());
    });

    this.shadowRoot.getElementById('show_pinned_only').addEventListener('change', () => this.configChanged());
    this.shadowRoot.getElementById('show_all').addEventListener('change', () => this.configChanged());
    this.shadowRoot.getElementById('card_color').addEventListener('input', () => this.configChanged());
  }

  _escapeAttr(text) {
    const d = document.createElement('div');
    d.textContent = String(text);
    return d.innerHTML.replace(/"/g, '&quot;');
  }

  configChanged() {
    this._config = {
      ...this._config,
      title: this.shadowRoot.getElementById('title').value,
      max_notes: parseInt(this.shadowRoot.getElementById('max_notes').value, 10) || 5,
      show_pinned_only: this.shadowRoot.getElementById('show_pinned_only').checked,
      show_all: this.shadowRoot.getElementById('show_all').checked,
      card_color: this.shadowRoot.getElementById('card_color').value || '#FFEB3B',
      note_id: this.shadowRoot.getElementById('note_id').value || null
    };

    const event = new CustomEvent('config-changed', {
      detail: { config: this._config },
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  }
}

customElements.define('better-notes-card-editor', BetterNotesCardEditor);
