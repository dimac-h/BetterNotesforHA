import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { mdiPin } from '@mdi/js';
import { safeColor, formatRelativeDate, stripHtml } from '../colors';
import type { Note } from '../api';

@customElement('better-notes-list-item')
export class BetterNotesListItem extends LitElement {
  static styles = css`
    :host {
      display: block; cursor: pointer;
      padding-block: var(--ha-space-3);
      padding-inline: var(--ha-space-4) var(--ha-space-3);
      border-block-end: 1px solid var(--divider-color);
      border-inline-start: 3px solid transparent;
      background: var(--card-background-color);
    }
    :host(:hover) { background: color-mix(in srgb, var(--primary-color) 6%, var(--card-background-color)); }
    :host([active]) {
      background: color-mix(in srgb, var(--primary-color) 12%, var(--card-background-color));
      border-inline-start-color: var(--primary-color);
    }
    .header { display: flex; align-items: center; gap: var(--ha-space-2); margin-block-end: 2px; }
    .dot { flex-shrink: 0; width: 8px; height: 8px; border-radius: 50%; }
    .title {
      font-size: 15px; line-height: 1.3; font-weight: 600; color: var(--primary-text-color);
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1;
    }
    .preview {
      font-size: 13px; line-height: 1.4; color: var(--secondary-text-color);
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-block-end: 2px;
      padding-inline-start: 16px;
    }
    .date {
      font-size: 12px; line-height: 1.3; color: var(--secondary-text-color);
      padding-inline-start: 16px;
    }
    ha-svg-icon { --mdc-icon-size: 14px; color: var(--secondary-text-color); flex-shrink: 0; }
  `;

  @property({ attribute: false }) note!: Note;
  @property({ type: Boolean, reflect: true }) active = false;

  connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('click', this._select);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('click', this._select);
  }

  private _select = (): void => {
    this.dispatchEvent(new CustomEvent('note-select', {
      detail: { noteId: this.note.note_id },
      bubbles: true,
      composed: true,
    }));
  };

  render() {
    const preview = stripHtml(this.note.content || '');
    const truncated = preview.length > 60 ? `${preview.slice(0, 60)}…` : preview;
    return html`
      <div class="header">
        <div class="dot" style="background:${safeColor(this.note.color)}"></div>
        <div class="title">${this.note.title || 'Untitled'}</div>
        ${this.note.pinned ? html`<ha-svg-icon .path=${mdiPin}></ha-svg-icon>` : ''}
      </div>
      <div class="preview">${truncated}</div>
      <div class="date">${formatRelativeDate(this.note.modified)}</div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'better-notes-list-item': BetterNotesListItem;
  }
}
