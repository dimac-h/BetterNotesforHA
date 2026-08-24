import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { NOTE_COLORS } from '../colors';
import type { ToolbarAction } from './tiptap-editor';

@customElement('better-notes-toolbar')
export class BetterNotesToolbar extends LitElement {
  static styles = css`
    :host {
      display: flex; flex-wrap: wrap; align-items: center; gap: 4px; padding: 8px 12px;
      background: var(--card-background-color); border: 1px solid var(--divider-color);
      border-radius: 16px; box-shadow: var(--ha-box-shadow-m, 0 4px 16px rgba(0,0,0,0.2));
    }
    @media (max-width: 767px) {
      :host { gap: 2px; padding: 4px 6px; border-radius: 12px; }
      .caret { display: none; }
    }
    .group { position: relative; }
    .dropdown {
      display: none; position: absolute; bottom: calc(100% + 6px); left: 0;
      background: var(--card-background-color); border: 1px solid var(--divider-color);
      border-radius: 8px; box-shadow: var(--ha-box-shadow-m, 0 4px 16px rgba(0,0,0,0.2));
      z-index: 200; min-width: 150px; padding: 4px 0;
    }
    .group.open .dropdown { display: block; }
    .item {
      display: block; width: 100%; padding: 8px 14px; text-align: left; border: none;
      background: none; color: var(--primary-text-color); cursor: pointer; font-size: 14px;
    }
    .item:hover { background: var(--secondary-background-color); }
    .divider { height: 1px; background: var(--divider-color); margin: 4px 0; }
    .swatches { display: flex; flex-wrap: wrap; gap: 6px; padding: 10px; }
    .dot { width: 24px; height: 24px; border-radius: 50%; cursor: pointer; border: 2px solid transparent; }
    .dot.active { border-color: var(--primary-text-color); }
    .link-row { display: flex; align-items: center; gap: 6px; width: 100%; padding: 6px 0 2px; flex-basis: 100%; }
    .link-row ha-input { flex: 1; }
  `;

  @property({ type: Boolean }) pinned = false;
  @property({ type: String }) color = '';
  @property({ type: String }) linkHref = '';

  @state() private _openGroup: string | null = null;
  @state() private _linkOpen = false;

  private _toggleGroup(name: string): void {
    this._openGroup = this._openGroup === name ? null : name;
  }

  private _closeAll(): void {
    this._openGroup = null;
  }

  private _dispatchAction(action: ToolbarAction, payload?: { href?: string }): void {
    this.dispatchEvent(new CustomEvent('toolbar-action', { detail: { action, payload }, bubbles: true, composed: true }));
    this._closeAll();
  }

  private _selectColor(c: string): void {
    this.dispatchEvent(new CustomEvent('color-select', { detail: { color: c }, bubbles: true, composed: true }));
    this._closeAll();
  }

  private _togglePin(): void {
    this.dispatchEvent(new CustomEvent('pin-toggle', { bubbles: true, composed: true }));
  }

  private _openLink(): void {
    this._closeAll();
    this._linkOpen = true;
    this.dispatchEvent(new CustomEvent('link-open-requested', { bubbles: true, composed: true }));
  }

  private _isValidUrl(str: string): boolean {
    try {
      const url = new URL(str);
      return ['https:', 'http:', 'mailto:'].includes(url.protocol);
    } catch {
      return false;
    }
  }

  private _applyLink(): void {
    const input = this.renderRoot.querySelector('.link-row ha-input') as (HTMLElement & { value?: string }) | null;
    const url = input?.value?.trim();
    if (url && this._isValidUrl(url)) this._dispatchAction('setLink', { href: url });
    this._linkOpen = false;
  }

  render() {
    return html`
      <div class="group ${this._openGroup === 'heading' ? 'open' : ''}">
        <ha-button size="small" @click=${() => this._toggleGroup('heading')} @mousedown=${(e: MouseEvent) => e.preventDefault()}>H<span class="caret"> ▾</span></ha-button>
        <div class="dropdown">
          <button class="item" @click=${() => this._dispatchAction('paragraph')}>Normal</button>
          <button class="item" @click=${() => this._dispatchAction('h1')}>H1</button>
          <button class="item" @click=${() => this._dispatchAction('h2')}>H2</button>
          <button class="item" @click=${() => this._dispatchAction('h3')}>H3</button>
        </div>
      </div>
      <div class="group ${this._openGroup === 'format' ? 'open' : ''}">
        <ha-button size="small" @click=${() => this._toggleGroup('format')} @mousedown=${(e: MouseEvent) => e.preventDefault()}>B<span class="caret"> ▾</span></ha-button>
        <div class="dropdown">
          <button class="item" @click=${() => this._dispatchAction('bold')}>Bold</button>
          <button class="item" @click=${() => this._dispatchAction('italic')}>Italic</button>
          <button class="item" @click=${() => this._dispatchAction('strike')}>Strikethrough</button>
          <button class="item" @click=${() => this._dispatchAction('highlight')}>Highlight</button>
        </div>
      </div>
      <div class="group ${this._openGroup === 'list' ? 'open' : ''}">
        <ha-button size="small" @click=${() => this._toggleGroup('list')} @mousedown=${(e: MouseEvent) => e.preventDefault()}>≡<span class="caret"> ▾</span></ha-button>
        <div class="dropdown">
          <button class="item" @click=${() => this._dispatchAction('bulletList')}>Bullet list</button>
          <button class="item" @click=${() => this._dispatchAction('orderedList')}>Numbered list</button>
          <button class="item" @click=${() => this._dispatchAction('taskList')}>Checklist</button>
          <div class="divider"></div>
          <button class="item" @click=${() => this._dispatchAction('indent')}>Indent</button>
          <button class="item" @click=${() => this._dispatchAction('outdent')}>Outdent</button>
        </div>
      </div>
      <div class="group ${this._openGroup === 'color' ? 'open' : ''}">
        <ha-button size="small" @click=${() => this._toggleGroup('color')} @mousedown=${(e: MouseEvent) => e.preventDefault()}>Color<span class="caret"> ▾</span></ha-button>
        <div class="dropdown">
          <div class="swatches">
            ${NOTE_COLORS.map(c => html`
              <div class="dot ${this.color === c ? 'active' : ''}" style="background:${c}"
                   @click=${() => this._selectColor(c)}></div>
            `)}
          </div>
        </div>
      </div>
      <ha-button size="small" class=${this.pinned ? 'active' : ''} @click=${() => this._togglePin()} @mousedown=${(e: MouseEvent) => e.preventDefault()}>
        ${this.pinned ? 'Pinned' : 'Pin'}
      </ha-button>
      <ha-button size="small" @click=${() => this._openLink()} @mousedown=${(e: MouseEvent) => e.preventDefault()}>Link</ha-button>
      ${this._linkOpen ? html`
        <div class="link-row">
          <ha-input type="url" placeholder="https://…" .value=${this.linkHref} @keydown=${(e: KeyboardEvent) => e.stopPropagation()}></ha-input>
          <ha-button size="small" @click=${() => this._applyLink()}>Apply</ha-button>
          <ha-button size="small" @click=${() => this._dispatchAction('unsetLink')}>Remove</ha-button>
          <ha-button size="small" @click=${() => { this._linkOpen = false; }}>✕</ha-button>
        </div>
      ` : ''}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'better-notes-toolbar': BetterNotesToolbar;
  }
}
