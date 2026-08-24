import { LitElement, html, css } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { loadTiptapExtensions } from '../tiptap-extensions';

export type ToolbarAction =
  | 'paragraph' | 'h1' | 'h2' | 'h3'
  | 'bold' | 'italic' | 'strike' | 'highlight'
  | 'bulletList' | 'orderedList' | 'taskList' | 'indent' | 'outdent'
  | 'setLink' | 'unsetLink';

@customElement('better-notes-tiptap-editor')
export class BetterNotesTiptapEditor extends LitElement {
  static styles = css`
    :host { display: flex; flex-direction: column; min-height: 0; flex: 1; }
    .fallback {
      width: 100%; min-height: 300px; font-size: 15px; line-height: 1.6;
      border: none; outline: none; resize: none; color: var(--primary-text-color);
      background: transparent; font-family: inherit;
    }
    #mount { flex: 1; min-height: 0; display: flex; flex-direction: column; }
    .ProseMirror,
    .ProseMirror:focus,
    .ProseMirror:focus-visible {
      outline: none;
    }
    .ProseMirror {
      flex: 1; min-height: 100%; cursor: text;
    }
    .ProseMirror ul[data-type="taskList"] {
      list-style: none;
      padding-left: 0;
    }
    .ProseMirror ul[data-type="taskList"] li {
      display: flex;
      align-items: flex-start;
    }
    .ProseMirror ul[data-type="taskList"] li > label {
      flex: 0 0 auto;
      margin-right: 0.5rem;
      user-select: none;
    }
    .ProseMirror ul[data-type="taskList"] li > div {
      flex: 1 1 auto;
    }
    .ProseMirror ul[data-type="taskList"] input[type="checkbox"] {
      cursor: pointer;
    }
  `;

  @property({ attribute: false }) content = '';

  @query('#mount') private _mount?: HTMLDivElement;

  private _editor: any = null;
  private _fallback = false;
  private _lastEmitted = '';

  async connectedCallback(): Promise<void> {
    super.connectedCallback();
    await this.updateComplete;
    this._init();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this._editor?.destroy();
    this._editor = null;
  }

  updated(changed: Map<string, unknown>): void {
    if (changed.has('content') && this._editor && this.content !== this._lastEmitted) {
      this._lastEmitted = this.content;
      this._editor.commands.setContent(this.content, { emitUpdate: false });
      this._editor.commands.focus('end');
    }
  }

  private async _init(): Promise<void> {
    let loaded: Awaited<ReturnType<typeof loadTiptapExtensions>> | null;
    try {
      loaded = await loadTiptapExtensions();
    } catch (err) {
      console.warn('Better Notes: Tiptap failed to load, falling back to textarea', err);
      loaded = null;
    }
    if (!loaded || !this._mount) {
      this._fallback = true;
      this.requestUpdate();
      return;
    }
    const { Editor, extensions } = loaded;
    this._lastEmitted = this.content;
    this._editor = new Editor({
      element: this._mount,
      extensions,
      content: this.content,
      autofocus: 'end',
      onUpdate: () => this._emitChanged(),
    });
  }

  private _emitChanged(): void {
    this._lastEmitted = this.getHTML();
    this.dispatchEvent(new CustomEvent('content-changed', {
      detail: { html: this._lastEmitted },
      bubbles: true,
      composed: true,
    }));
  }

  getHTML(): string {
    if (this._editor) return this._editor.getHTML();
    const textarea = this.renderRoot.querySelector('#fallback') as HTMLTextAreaElement | null;
    return textarea?.value ?? this.content;
  }

  getLinkHref(): string {
    return this._editor?.getAttributes('link').href ?? '';
  }

  runAction(action: ToolbarAction, payload?: { href?: string }): void {
    const chain = this._editor?.chain().focus();
    if (!chain) return;
    switch (action) {
      case 'paragraph': chain.setParagraph().run(); break;
      case 'h1': chain.toggleHeading({ level: 1 }).run(); break;
      case 'h2': chain.toggleHeading({ level: 2 }).run(); break;
      case 'h3': chain.toggleHeading({ level: 3 }).run(); break;
      case 'bold': chain.toggleBold().run(); break;
      case 'italic': chain.toggleItalic().run(); break;
      case 'strike': chain.toggleStrike().run(); break;
      case 'highlight': chain.toggleHighlight().run(); break;
      case 'bulletList': chain.toggleBulletList().run(); break;
      case 'orderedList': chain.toggleOrderedList().run(); break;
      case 'taskList': chain.toggleTaskList().run(); break;
      case 'indent': chain.sinkListItem('listItem').run(); break;
      case 'outdent': chain.liftListItem('listItem').run(); break;
      case 'setLink': if (payload?.href) chain.setLink({ href: payload.href }).run(); break;
      case 'unsetLink': chain.unsetLink().run(); break;
    }
  }

  render() {
    if (this._fallback) {
      return html`<textarea
        id="fallback"
        class="fallback"
        placeholder="Start typing..."
        .value=${this.content}
        @input=${() => this._emitChanged()}
        @keydown=${(e: KeyboardEvent) => e.stopPropagation()}
      ></textarea>`;
    }
    return html`<div id="mount" @keydown=${(e: KeyboardEvent) => e.stopPropagation()}></div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'better-notes-tiptap-editor': BetterNotesTiptapEditor;
  }
}
