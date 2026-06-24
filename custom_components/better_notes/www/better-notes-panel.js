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
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; height: 100%; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
        .loading { display: flex; align-items: center; justify-content: center; height: 100%; font-size: 18px; color: #666; }
      </style>
      <div class="loading">Loading Better Notes...</div>
    `;
  }
}

customElements.define('better-notes-panel', BetterNotesPanel);
