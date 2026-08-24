import { LitElement, html, css } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { mdiCheck } from '@mdi/js';
import './note-toolbar';
import './tiptap-editor';
import type { BetterNotesTiptapEditor, ToolbarAction } from './tiptap-editor';
import type { Note } from '../api';

@customElement('better-notes-editor')
export class BetterNotesEditor extends LitElement {
  static styles = css`
    :host {
      display: flex; flex-direction: column; height: 100%; background: var(--card-background-color);
      min-width: 0; min-height: 0; position: relative;
    }
    .header { padding: 12px 16px; border-bottom: 1px solid var(--divider-color); display: flex; align-items: center; gap: 10px; }
    .back-btn { display: none; }
    @media (max-width: 767px) { .back-btn { display: inline-flex; } }
    .actions { display: flex; gap: 8px; margin-left: auto; }
    .body { flex: 1; min-height: 0; overflow-y: auto; padding: 20px 24px; display: flex; flex-direction: column; }
    better-notes-tiptap-editor { flex: 1; min-height: 0; display: flex; flex-direction: column; }
    .title-input {
      width: 100%; font-size: 28px; font-weight: 700; border: none; outline: none; margin-bottom: 16px;
      color: var(--primary-text-color); background: transparent; font-family: inherit;
    }
    .empty {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      height: 100%; color: var(--secondary-text-color);
    }
  `;

  @property({ attribute: false }) note: Note | null = null;

  @state() private _pendingDelete = false;
  @state() private _justSaved = false;

  @query('better-notes-tiptap-editor') private _tiptap?: BetterNotesTiptapEditor;
  @query('.title-input') private _titleInput?: HTMLInputElement;

  private _saveTimeout?: ReturnType<typeof setTimeout>;
  private _deleteTimeout?: ReturnType<typeof setTimeout>;
  private _toastTimeout?: ReturnType<typeof setTimeout>;

  disconnectedCallback(): void {
    super.disconnectedCallback();
    clearTimeout(this._saveTimeout);
    clearTimeout(this._deleteTimeout);
    clearTimeout(this._toastTimeout);
  }

  private _scheduleSave(): void {
    clearTimeout(this._saveTimeout);
    this._saveTimeout = setTimeout(() => this._save(), 1000);
  }

  private _save(overrides: Partial<Note> = {}): void {
    if (!this.note) return;
    const detail = {
      note_id: this.note.note_id,
      title: overrides.title ?? this._titleInput?.value ?? this.note.title,
      content: overrides.content ?? this._tiptap?.getHTML() ?? this.note.content,
      color: overrides.color ?? this.note.color,
      pinned: overrides.pinned ?? this.note.pinned,
    };
    this.dispatchEvent(new CustomEvent('note-save', { detail, bubbles: true, composed: true }));
    this._justSaved = true;
    clearTimeout(this._toastTimeout);
    this._toastTimeout = setTimeout(() => { this._justSaved = false; }, 500);
  }

  private _onToolbarAction(e: CustomEvent<{ action: ToolbarAction; payload?: { href?: string } }>): void {
    this._tiptap?.runAction(e.detail.action, e.detail.payload);
  }

  private _onColorSelect(e: CustomEvent<{ color: string }>): void {
    clearTimeout(this._saveTimeout);
    this._save({ color: e.detail.color });
  }

  private _onPinToggle(): void {
    if (!this.note) return;
    clearTimeout(this._saveTimeout);
    this._save({ pinned: !this.note.pinned });
  }

  private _onLinkOpenRequested(e: Event): void {
    const toolbar = e.target as HTMLElement & { linkHref: string };
    toolbar.linkHref = this._tiptap?.getLinkHref() ?? '';
  }

  private _onDelete(): void {
    if (!this.note) return;
    if (!this._pendingDelete) {
      this._pendingDelete = true;
      this._deleteTimeout = setTimeout(() => { this._pendingDelete = false; }, 3000);
      return;
    }
    clearTimeout(this._deleteTimeout);
    this._pendingDelete = false;
    this.dispatchEvent(new CustomEvent('note-delete', { detail: { noteId: this.note.note_id }, bubbles: true, composed: true }));
  }

  render() {
    if (!this.note) {
      return html`<div class="empty">Select a note or create one</div>`;
    }
    return html`
      <div class="header">
        <ha-icon-button class="back-btn" @click=${() => this.dispatchEvent(new CustomEvent('editor-back', { bubbles: true, composed: true }))}>←</ha-icon-button>
        <div class="actions">
          <ha-button @click=${() => { clearTimeout(this._saveTimeout); this._save(); }}>
            ${this._justSaved ? html`<ha-svg-icon .path=${mdiCheck}></ha-svg-icon>` : 'Save'}
          </ha-button>
          <ha-button @click=${() => this._onDelete()}>${this._pendingDelete ? 'Confirm?' : 'Delete'}</ha-button>
        </div>
      </div>
      <div class="body">
        <input
          class="title-input"
          type="text"
          placeholder="Note Title"
          .value=${this.note.title || ''}
          @input=${() => this._scheduleSave()}
          @keydown=${(e: KeyboardEvent) => e.stopPropagation()}
        >
        <better-notes-tiptap-editor
          .content=${this.note.content || ''}
          @content-changed=${() => this._scheduleSave()}
        ></better-notes-tiptap-editor>
      </div>
      <better-notes-toolbar
        .pinned=${this.note.pinned}
        .color=${this.note.color}
        @toolbar-action=${this._onToolbarAction}
        @color-select=${this._onColorSelect}
        @pin-toggle=${this._onPinToggle}
        @link-open-requested=${this._onLinkOpenRequested}
      ></better-notes-toolbar>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'better-notes-editor': BetterNotesEditor;
  }
}
