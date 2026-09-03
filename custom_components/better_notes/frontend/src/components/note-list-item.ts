import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { mdiPin } from '@mdi/js';
import { safeColor, getNoteTextColor, formatRelativeDate, stripHtml } from '../colors';
import type { Note } from '../api';

@customElement('better-notes-list-item')
export class BetterNotesListItem extends LitElement {
  static styles = css`
    :host { display: block; cursor: pointer; margin-block-end: var(--ha-space-2); }
    .card {
      border-radius: 6px;
      padding: var(--ha-space-3);
    }
    :host(:hover) .card { box-shadow: var(--ha-box-shadow-s, 0 2px 6px rgba(0, 0, 0, 0.15)); }
    :host([active]) .card { box-shadow: 0 0 0 2px var(--primary-color); }
    .header { display: flex; align-items: center; gap: var(--ha-space-2); margin-block-end: 4px; }
    .title {
      font-size: 15px; line-height: 1.3; font-weight: 600; color: var(--note-text);
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1;
    }
    .preview {
      font-size: 13px; line-height: 1.4; color: var(--note-text-muted);
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-block-end: 4px;
    }
    .date { font-size: 12px; line-height: 1.3; color: var(--note-text-muted); }
    ha-svg-icon { --mdc-icon-size: 14px; color: var(--note-text-muted); flex-shrink: 0; }
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
    const { title: textColor, muted: mutedColor } = getNoteTextColor(this.note.color);
    return html`
      <div
        class="card"
        style="background:${safeColor(this.note.color)}; --note-text:${textColor}; --note-text-muted:${mutedColor}"
      >
        <div class="header">
          <div class="title">${this.note.title || 'Untitled'}</div>
          ${this.note.pinned ? html`<ha-svg-icon .path=${mdiPin}></ha-svg-icon>` : ''}
        </div>
        <div class="preview">${truncated}</div>
        <div class="date">${formatRelativeDate(this.note.modified)}</div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'better-notes-list-item': BetterNotesListItem;
  }
}
