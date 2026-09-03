import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import './components/note-list';
import './components/note-editor';
import { getNotes, createNote, updateNote, deleteNote, subscribeNoteEvents } from './api';
import type { Note } from './api';
import { DEFAULT_NOTE_COLOR } from './colors';
import type { HomeAssistant } from './ha-types';

function sortNotes(notes: Note[]): Note[] {
  return [...notes].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.modified).getTime() - new Date(a.modified).getTime();
  });
}

@customElement('better-notes-panel')
export class BetterNotesPanel extends LitElement {
  static styles = css`
    :host { display: block; height: 100%; }
    .layout { display: flex; height: 100%; background: var(--card-background-color); overflow: hidden; }
    .list-pane { flex-shrink: 0; border-inline-end: 1px solid var(--divider-color); }
    .editor-pane { flex: 1; min-width: 0; }
    @media (min-width: 768px) { .list-pane { width: 280px; } }
    @media (max-width: 767px) {
      .list-pane { width: 100%; flex: 1; }
      :host([data-view="list"]) .editor-pane { display: none; }
      :host([data-view="editor"]) .list-pane { display: none; }
    }
  `;

  @property({ attribute: false }) hass!: HomeAssistant;
  @property({ type: Boolean }) narrow = false;

  @state() private _notes: Note[] = [];
  @state() private _selectedId: string | null = null;
  @state() private _searchTerm = '';
  @state() private _view: 'list' | 'editor' = 'list';

  private _unsubscribe?: () => void;
  private _creatingNote = false;
  private _pushedEditorState = false;

  connectedCallback(): void {
    super.connectedCallback();
    if (this.hass) this._init();
    window.addEventListener('popstate', this._onPopState);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this._unsubscribe?.();
    this._unsubscribe = undefined;
    window.removeEventListener('popstate', this._onPopState);
  }

  // On narrow (mobile) layouts, the editor pane replaces the list pane
  // instead of showing beside it — push a history entry when entering it so
  // the browser/swipe back gesture returns to the note list instead of
  // leaving the panel entirely. Desktop shows both panes at once, so
  // there's no "screen" to navigate back from — skip history entirely there.
  private _onPopState = (): void => {
    if (this._pushedEditorState) {
      this._pushedEditorState = false;
      this._view = 'list';
    }
  };

  private _enterEditor(noteId: string): void {
    this._selectedId = noteId;
    if (this.narrow && this._view !== 'editor') {
      history.pushState({ betterNotesEditor: true }, '', location.href);
      this._pushedEditorState = true;
    }
    this._view = 'editor';
  }

  private _leaveEditor(): void {
    if (this._pushedEditorState) {
      this._pushedEditorState = false;
      history.back();
    } else {
      this._view = 'list';
    }
  }

  updated(changed: Map<string, unknown>): void {
    if (changed.has('hass') && this.hass && !this._unsubscribe) this._init();
    if (changed.has('_view')) this.setAttribute('data-view', this._view);
  }

  private async _init(): Promise<void> {
    await this._loadNotes();
    this._unsubscribe = await subscribeNoteEvents(this.hass, () => this._loadNotes());
  }

  private async _loadNotes(): Promise<void> {
    this._notes = sortNotes(await getNotes(this.hass));
  }

  private get _selectedNote(): Note | null {
    return this._notes.find(n => n.note_id === this._selectedId) ?? null;
  }

  private async _onNoteNew(): Promise<void> {
    if (this._creatingNote) return;
    this._creatingNote = true;
    try {
      const noteId = await createNote(this.hass, { title: 'New Note', content: '', color: DEFAULT_NOTE_COLOR, pinned: false });
      await this._loadNotes();
      if (noteId) {
        this._enterEditor(noteId);
      }
    } finally {
      this._creatingNote = false;
    }
  }

  private _onNoteSelect(e: CustomEvent<{ noteId: string }>): void {
    this._enterEditor(e.detail.noteId);
  }

  private _onSearchChanged(e: CustomEvent<{ value: string }>): void {
    this._searchTerm = e.detail.value;
  }

  private async _onNoteSave(e: CustomEvent<Partial<Note> & { note_id: string }>): Promise<void> {
    await updateNote(this.hass, e.detail);
    await this._loadNotes();
  }

  private async _onNoteDelete(e: CustomEvent<{ noteId: string }>): Promise<void> {
    await deleteNote(this.hass, e.detail.noteId);
    this._selectedId = null;
    this._leaveEditor();
    await this._loadNotes();
  }

  private _onEditorBack(): void {
    this._leaveEditor();
  }

  render() {
    return html`
      <div class="layout">
        <div class="list-pane">
          <better-notes-list
            .notes=${this._notes}
            .selectedNoteId=${this._selectedId}
            .searchTerm=${this._searchTerm}
            @note-select=${this._onNoteSelect}
            @note-new=${this._onNoteNew}
            @search-changed=${this._onSearchChanged}
          ></better-notes-list>
        </div>
        <div class="editor-pane">
          <better-notes-editor
            .note=${this._selectedNote}
            @editor-back=${this._onEditorBack}
            @note-save=${this._onNoteSave}
            @note-delete=${this._onNoteDelete}
          ></better-notes-editor>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'better-notes-panel': BetterNotesPanel;
  }
}
