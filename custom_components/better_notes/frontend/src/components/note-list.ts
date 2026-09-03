import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import './note-list-item';
import { stripHtml } from '../colors';
import type { Note } from '../api';

@customElement('better-notes-list')
export class BetterNotesList extends LitElement {
  static styles = css`
    :host { display: flex; flex-direction: column; height: 100%; background: var(--card-background-color); }
    .header {
      background: var(--card-background-color);
      padding-block: var(--ha-space-4) var(--ha-space-3);
      padding-inline: var(--ha-space-4);
    }
    .title-row { display: flex; align-items: center; gap: var(--ha-space-2); margin-block-end: var(--ha-space-3); }
    ha-menu-button { flex-shrink: 0; }
    h1 {
      font-size: 20px; line-height: 1.25; font-weight: 600; letter-spacing: -0.01em;
      color: var(--primary-text-color); margin: 0;
    }
    .search-wrap {
      margin-block-end: var(--ha-space-3);
      border-radius: 6px;
      box-shadow: 0 0 0 1px var(--divider-color);
      overflow: hidden;
    }
    ha-input {
      display: block; width: 100%;
      --ha-color-form-background: var(--card-background-color);
      --ha-color-form-background-hover: var(--card-background-color);
      --ha-color-form-background-focus: var(--card-background-color);
      --ha-color-form-background-active: var(--card-background-color);
      font-size: 12px;
    }
    /* ha-input's internal wa-input::part(base) hardcodes height: 56px with
       no CSS variable indirection — target the exported shadow part
       directly instead of clipping/offsetting the whole element, so this
       tracks the control's real box rather than a guessed pixel offset. */
    ha-input::part(base) { height: 34px; min-height: 34px; }
    ha-button { width: 100%; --wa-form-control-border-radius: 6px; }
    .items { flex: 1; overflow-y: auto; padding: var(--ha-space-3) var(--ha-space-4); }
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
        <div class="title-row">
          <ha-menu-button></ha-menu-button>
          <h1>Home Assistant Notes</h1>
        </div>
        <div class="search-wrap">
          <ha-input appearance="plain" size="s" placeholder="Search notes..." .value=${this.searchTerm} @input=${this._onSearch} @keydown=${(e: KeyboardEvent) => e.stopPropagation()}></ha-input>
        </div>
        <ha-button size="s" appearance="filled" variant="brand" @click=${this._onNew}>New note</ha-button>
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
