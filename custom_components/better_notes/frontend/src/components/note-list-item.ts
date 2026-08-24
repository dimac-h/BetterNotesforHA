import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { mdiPin } from '@mdi/js';
import { safeColor, formatRelativeDate, stripHtml } from '../colors';
import type { Note } from '../api';

@customElement('better-notes-list-item')
export class BetterNotesListItem extends LitElement {
  static styles = css`
    :host {
      position: relative; display: block; padding: 10px 10px 10px 14px; margin-bottom: 8px;
      background: var(--card-background-color); border: 1px solid var(--divider-color);
      border-radius: 8px; cursor: pointer;
    }
    :host(:hover) { border-color: var(--primary-color); box-shadow: var(--ha-box-shadow-s, 0 2px 4px rgba(0,0,0,0.08)); }
    :host([active]) {
      background: color-mix(in srgb, var(--primary-color) 18%, var(--card-background-color));
      border-color: var(--primary-color);
      box-shadow: inset 3px 0 0 var(--primary-color);
    }
    .bar { position: absolute; left: 0; top: 0; width: 4px; height: 100%; border-radius: 8px 0 0 8px; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px; }
    .title {
      font-weight: 600; font-size: 14px; color: var(--primary-text-color);
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1;
    }
    .preview {
      font-size: 12px; color: var(--secondary-text-color);
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-bottom: 3px;
    }
    .date { font-size: 11px; color: var(--secondary-text-color); }
    ha-icon { --mdc-icon-size: 12px; color: var(--secondary-text-color); }
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
      <div class="bar" style="background:${safeColor(this.note.color)}"></div>
      <div class="header">
        <div class="title">${this.note.title || 'Untitled'}</div>
        ${this.note.pinned ? html`<ha-icon .path=${mdiPin}></ha-icon>` : ''}
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
