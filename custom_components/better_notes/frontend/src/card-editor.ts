import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import type { BetterNotesCardConfig } from './card';

@customElement('better-notes-card-editor')
export class BetterNotesCardEditor extends LitElement {
  static styles = css`
    .option { margin-bottom: 16px; }
    label { display: block; margin-bottom: 4px; font-weight: 500; }
    ha-input { width: 100%; }
  `;

  @state() private _config: BetterNotesCardConfig = { type: 'custom:better-notes-card' };

  setConfig(config: BetterNotesCardConfig): void {
    this._config = config;
  }

  private _update(partial: Partial<BetterNotesCardConfig>): void {
    this._config = { ...this._config, ...partial };
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this._config }, bubbles: true, composed: true }));
  }

  render() {
    return html`
      <div class="option">
        <label for="title">Title</label>
        <ha-input id="title" .value=${this._config.title ?? 'Notes'}
          @input=${(e: Event) => this._update({ title: (e.target as HTMLInputElement).value })}></ha-input>
      </div>
      <div class="option">
        <label for="max_notes">Max Notes to Display</label>
        <ha-input id="max_notes" type="number" min="1" max="20" .value=${String(this._config.max_notes ?? 5)}
          @input=${(e: Event) => this._update({ max_notes: parseInt((e.target as HTMLInputElement).value, 10) || 5 })}></ha-input>
      </div>
      <div class="option">
        <ha-formfield label="Show Pinned Notes Only">
          <ha-checkbox .checked=${!!this._config.show_pinned_only}
            @change=${(e: Event) => this._update({ show_pinned_only: (e.target as HTMLInputElement).checked })}></ha-checkbox>
        </ha-formfield>
      </div>
      <div class="option">
        <ha-formfield label="Show All Notes">
          <ha-checkbox .checked=${!!this._config.show_all}
            @change=${(e: Event) => this._update({ show_all: (e.target as HTMLInputElement).checked })}></ha-checkbox>
        </ha-formfield>
      </div>
      <div class="option">
        <label for="card_color">Card Background Color (hex)</label>
        <ha-input id="card_color" .value=${this._config.card_color ?? '#FFEB3B'} placeholder="#FFEB3B"
          @input=${(e: Event) => this._update({ card_color: (e.target as HTMLInputElement).value })}></ha-input>
      </div>
      <div class="option">
        <label for="note_id">Specific Note ID (optional)</label>
        <ha-input id="note_id" .value=${this._config.note_id ?? ''} placeholder="Leave empty to show all"
          @input=${(e: Event) => this._update({ note_id: (e.target as HTMLInputElement).value || null })}></ha-input>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'better-notes-card-editor': BetterNotesCardEditor;
  }
}
