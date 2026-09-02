import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { mdiNoteMultipleOutline, mdiPin } from '@mdi/js';
import './card-editor';
import { getNotes, subscribeNoteEvents } from './api';
import type { Note } from './api';
import { safeColor, formatRelativeDate, stripHtml } from './colors';
import { sanitizeNoteHtml } from './sanitize';
import type { HomeAssistant } from './ha-types';

export interface BetterNotesCardConfig {
  type: string;
  title?: string;
  note_id?: string | null;
  show_all?: boolean;
  max_notes?: number;
  show_pinned_only?: boolean;
  card_color?: string | null;
}

@customElement('better-notes-card')
export class BetterNotesCard extends LitElement {
  static styles = css`
    :host { display: block; }
    ha-card { padding: 16px; }
    .header {
      font-size: 18px; font-weight: 600; margin-bottom: 16px; color: var(--primary-text-color);
      display: flex; align-items: center; gap: 8px;
    }
    .note {
      background: var(--note-color, #FFEB3B); padding: 16px; border-radius: 8px; margin-bottom: 12px;
      box-shadow: var(--ha-box-shadow-s, 0 2px 4px rgba(0,0,0,0.1)); cursor: pointer;
    }
    .note:last-child { margin-bottom: 0; }
    .note-title {
      font-size: 16px; font-weight: 600; margin-bottom: 8px; color: rgba(0,0,0,0.87);
      display: flex; align-items: center; justify-content: space-between;
    }
    .note-content { font-size: 14px; color: rgba(0,0,0,0.6); line-height: 1.5; word-wrap: break-word; }
    .note-meta { margin-top: 8px; font-size: 12px; color: rgba(0,0,0,0.5); }
    .tags { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
    .tag { background: rgba(0,0,0,0.1); padding: 2px 8px; border-radius: 12px; font-size: 11px; color: rgba(0,0,0,0.7); }
    .empty { text-align: center; padding: 32px; color: var(--secondary-text-color); }
    ha-button { width: 100%; margin-top: 12px; }
  `;

  @property({ attribute: false }) hass!: HomeAssistant;
  @state() private _config: BetterNotesCardConfig = { type: 'custom:better-notes-card' };
  @state() private _notes: Note[] = [];

  private _unsubscribe?: () => void;

  setConfig(config: BetterNotesCardConfig): void {
    if (!config) throw new Error('Invalid configuration');
    this._config = {
      title: 'Notes', note_id: null, show_all: false, max_notes: 5, show_pinned_only: false, card_color: null,
      ...config,
    };
  }

  updated(changed: Map<string, unknown>): void {
    if (changed.has('hass') && this.hass && !this._unsubscribe) this._init();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this._unsubscribe?.();
    this._unsubscribe = undefined;
  }

  private async _init(): Promise<void> {
    this._notes = await getNotes(this.hass);
    this._unsubscribe = await subscribeNoteEvents(this.hass, async () => {
      this._notes = await getNotes(this.hass);
    });
  }

  getCardSize(): number {
    return this._config.note_id ? 3 : Math.min(this._config.max_notes ?? 5, this._notes.length) + 1;
  }

  static getConfigElement(): HTMLElement {
    return document.createElement('better-notes-card-editor');
  }

  static getStubConfig(): BetterNotesCardConfig {
    return { type: 'custom:better-notes-card', title: 'Notes', show_all: true, max_notes: 5, show_pinned_only: false };
  }

  private _openPanel(): void {
    window.history.pushState(null, '', '/better-notes');
    window.dispatchEvent(new Event('location-changed', { bubbles: true, composed: true }));
  }

  private _renderNote(note: Note, isSingle: boolean) {
    return html`
      <div class="note" style="--note-color:${safeColor(note.color)}" @click=${() => this._openPanel()}>
        <div class="note-title">
          <span>${note.title || 'Untitled'}</span>
          ${note.pinned ? html`<ha-svg-icon .path=${mdiPin}></ha-svg-icon>` : ''}
        </div>
        ${isSingle
          ? html`<div class="note-content" .innerHTML=${sanitizeNoteHtml(note.content || '')}></div>`
          : html`<div class="note-content">${(() => {
              const plain = stripHtml(note.content || '');
              return plain.length > 150 ? `${plain.slice(0, 150)}…` : plain;
            })()}</div>`}
        ${note.tags?.length ? html`<div class="tags">${note.tags.map(t => html`<span class="tag">${t}</span>`)}</div>` : ''}
        <div class="note-meta">${formatRelativeDate(note.modified)}</div>
      </div>
    `;
  }

  render() {
    const cardStyle = this._config.card_color ? `background:${safeColor(this._config.card_color)}` : '';
    let content;
    if (this._config.note_id) {
      const note = this._notes.find(n => n.note_id === this._config.note_id);
      content = note ? this._renderNote(note, true) : html`<div class="empty">Note not found</div>`;
    } else {
      let notes = this._config.show_pinned_only ? this._notes.filter(n => n.pinned) : this._notes;
      const total = notes.length;
      const maxNotes = this._config.max_notes ?? 5;
      if (!this._config.show_all) notes = notes.slice(0, maxNotes);
      content = notes.length === 0
        ? html`<div class="empty">No notes to display</div>`
        : html`
            ${notes.map(n => this._renderNote(n, false))}
            ${total > maxNotes ? html`<ha-button size="s" appearance="plain" variant="neutral" @click=${() => this._openPanel()}>View All Notes</ha-button>` : ''}
          `;
    }
    return html`
      <ha-card style=${cardStyle}>
        <div class="header">
          <ha-svg-icon .path=${mdiNoteMultipleOutline}></ha-svg-icon>
          <span>${this._config.title}</span>
        </div>
        ${content}
      </ha-card>
    `;
  }
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'better-notes-card',
  name: 'Home Assistant Notes Card',
  description: 'Display notes from Home Assistant Notes',
  preview: true,
  documentationURL: 'https://github.com/dimac-h/BetterNotesforHA',
});

declare global {
  interface Window {
    customCards?: unknown[];
  }
  interface HTMLElementTagNameMap {
    'better-notes-card': BetterNotesCard;
  }
}
