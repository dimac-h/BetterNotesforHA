import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import './note-list-item';
import { stripHtml } from '../colors';
import type { Note } from '../api';

@customElement('better-notes-list')
export class BetterNotesList extends LitElement {
  static styles = css`
    :host { display: flex; flex-direction: column; height: 100%; background: var(--secondary-background-color); }
    .header { padding: 16px; border-bottom: 1px solid var(--divider-color); }
    h1 { font-size: 22px; font-weight: 600; color: var(--primary-text-color); margin: 0 0 12px; }
    ha-input { display: block; width: 100%; margin-bottom: 10px; }
    ha-button { width: 100%; }
    .items { flex: 1; overflow-y: auto; padding: 10px; }
    .empty { padding: 20px; text-align: center; color: var(--secondary-text-color); font-size: 14px; }
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
        <h1>Better Notes</h1>
        <ha-input placeholder="Search notes..." .value=${this.searchTerm} @input=${this._onSearch} @keydown=${(e: KeyboardEvent) => e.stopPropagation()}></ha-input>
        <ha-button @click=${this._onNew}>+ New Note</ha-button>
      </div>
      <div class="items">
        ${filtered.length === 0
          ? html`<div class="empty">No notes found</div>`
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
