import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import './note-list-item';
import { stripHtml } from '../colors';
import type { Note } from '../api';

@customElement('better-notes-list')
export class BetterNotesList extends LitElement {
  static styles = css`
    :host { display: flex; flex-direction: column; height: 100%; background: var(--secondary-background-color); }
    .header {
      padding-block: var(--ha-space-4) var(--ha-space-3);
      padding-inline: var(--ha-space-4);
      border-block-end: 1px solid var(--divider-color);
    }
    .title-row { display: flex; align-items: center; gap: var(--ha-space-1); margin-block-end: var(--ha-space-3); }
    h1 {
      font-size: 20px; line-height: 1.25; font-weight: 600;
      color: var(--primary-text-color); margin: 0;
    }
    ha-input { display: block; width: 100%; margin-block-end: var(--ha-space-2); }
    ha-button { width: 100%; }
    .items { flex: 1; overflow-y: auto; }
    .empty { padding: var(--ha-space-4); }
  `;

  @property({ attribute: false }) notes: Note[] = [];
  @property({ type: String }) selectedNoteId: string | null = null;
  @property({ type: String }) searchTerm = '';

  private _onSearch(e: Event): void {
    const value = (e.target as HTMLInputElement).value;
    this.dispatchEvent(new CustomEvent('search-changed', { detail: { value }, bubbles: true, composed: true }));
  }

  private _onNew(): void {
    this.dispatchEvent(new CustomEvent('note-new', { bubbles: true, composed: true }));
  }

  private get _filtered(): Note[] {
    const term = this.searchTerm.toLowerCase();
    if (!term) return this.notes;
    return this.notes.filter(n =>
      (n.title || '').toLowerCase().includes(term) ||
      stripHtml(n.content || '').toLowerCase().includes(term),
    );
  }

  render() {
    const filtered = this._filtered;
    return html`
      <div class="header">
        <div class="title-row">
          <ha-menu-button></ha-menu-button>
          <h1>Home Assistant Notes</h1>
        </div>
        <ha-input placeholder="Search notes..." .value=${this.searchTerm} @input=${this._onSearch} @keydown=${(e: KeyboardEvent) => e.stopPropagation()}></ha-input>
        <ha-button size="s" appearance="filled" variant="brand" @click=${this._onNew}>New note</ha-button>
      </div>
      <div class="items">
        ${filtered.length === 0
          ? html`
              <div class="empty">
                <ha-alert alert-type="info" narrow>
                  ${this.searchTerm ? html`No notes match "${this.searchTerm}".` : 'No notes yet. Create one to get started.'}
                </ha-alert>
              </div>
            `
          : filtered.map(note => html`
              <better-notes-list-item .note=${note} ?active=${this.selectedNoteId === note.note_id}></better-notes-list-item>
            `)}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'better-notes-list': BetterNotesList;
  }
}
