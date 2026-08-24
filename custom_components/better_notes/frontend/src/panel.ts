import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import './components/note-list';
import './components/note-editor';
import { getNotes, createNote, updateNote, deleteNote, subscribeNoteEvents } from './api';
import type { Note } from './api';
import { NOTE_COLORS } from './colors';
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
    .list-pane { flex-shrink: 0; }
    .editor-pane { flex: 1; min-width: 0; }
    @media (min-width: 768px) { .list-pane { width: 280px; } }
    @media (max-width: 767px) {
      :host([data-view="list"]) .editor-pane { display: none; }
      :host([data-view="editor"]) .list-pane { display: none; }
    }
  `;

  @property({ attribute: false }) hass!: HomeAssistant;

  @state() private _notes: Note[] = [];
  @state() private _selectedId: string | null = null;
  @state() private _searchTerm = '';
  @state() private _view: 'list' | 'editor' = 'list';

  private _unsubscribe?: () => void;

  connectedCallback(): void {
    super.connectedCallback();
    if (this.hass) this._init();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this._unsubscribe?.();
    this._unsubscribe = undefined;
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
    const noteId = await createNote(this.hass, { title: 'New Note', content: '', color: NOTE_COLORS[0], pinned: false });
    await this._loadNotes();
    if (noteId) {
      this._selectedId = noteId;
      this._view = 'editor';
    }
  }

  private _onNoteSelect(e: CustomEvent<{ noteId: string }>): void {
    this._selectedId = e.detail.noteId;
    this._view = 'editor';
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
    this._view = 'list';
    await this._loadNotes();
  }

  private _onEditorBack(): void {
    this._view = 'list';
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
