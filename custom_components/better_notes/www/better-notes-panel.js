import { i as v, n as l, a as _, d as P, c as L, m as N, b as a, f as S, t as g, r as h, N as E, h as O, j as A, s as D, g as z, k as I, u as H, l as B } from "./colors-BT8ai8-5.js";
const j = (t, e, i) => (i.configurable = !0, i.enumerable = !0, Reflect.decorate && typeof e != "object" && Object.defineProperty(t, e, i), i);
function y(t, e) {
  return (i, s, o) => {
    const n = (r) => r.renderRoot?.querySelector(t) ?? null;
    return j(i, s, { get() {
      return n(this);
    } });
  };
}
var M = Object.defineProperty, G = Object.getOwnPropertyDescriptor, $ = (t, e, i, s) => {
  for (var o = s > 1 ? void 0 : s ? G(e, i) : e, n = t.length - 1, r; n >= 0; n--)
    (r = t[n]) && (o = (s ? r(e, i, o) : r(o)) || o);
  return s && o && M(e, i, o), o;
};
let k = class extends _ {
  constructor() {
    super(...arguments), this.active = !1, this._select = () => {
      this.dispatchEvent(new CustomEvent("note-select", {
        detail: { noteId: this.note.note_id },
        bubbles: !0,
        composed: !0
      }));
    };
  }
  connectedCallback() {
    super.connectedCallback(), this.addEventListener("click", this._select);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this.removeEventListener("click", this._select);
  }
  render() {
    const t = P(this.note.content || ""), e = t.length > 60 ? `${t.slice(0, 60)}…` : t;
    return a`
      <div class="header">
        <div class="dot" style="background:${L(this.note.color)}"></div>
        <div class="title">${this.note.title || "Untitled"}</div>
        ${this.note.pinned ? a`<ha-svg-icon .path=${N}></ha-svg-icon>` : ""}
      </div>
      <div class="preview">${e}</div>
      <div class="date">${S(this.note.modified)}</div>
    `;
  }
};
k.styles = v`
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
$([
  l({ attribute: !1 })
], k.prototype, "note", 2);
$([
  l({ type: Boolean, reflect: !0 })
], k.prototype, "active", 2);
k = $([
  g("better-notes-list-item")
], k);
var R = Object.defineProperty, q = Object.getOwnPropertyDescriptor, w = (t, e, i, s) => {
  for (var o = s > 1 ? void 0 : s ? q(e, i) : e, n = t.length - 1, r; n >= 0; n--)
    (r = t[n]) && (o = (s ? r(e, i, o) : r(o)) || o);
  return s && o && R(e, i, o), o;
};
let b = class extends _ {
  constructor() {
    super(...arguments), this.notes = [], this.selectedNoteId = null, this.searchTerm = "";
  }
  _onSearch(t) {
    const e = t.target.value;
    this.dispatchEvent(new CustomEvent("search-changed", { detail: { value: e }, bubbles: !0, composed: !0 }));
  }
  _onNew() {
    this.dispatchEvent(new CustomEvent("note-new", { bubbles: !0, composed: !0 }));
  }
  get _filtered() {
    const t = this.searchTerm.toLowerCase();
    return t ? this.notes.filter(
      (e) => (e.title || "").toLowerCase().includes(t) || P(e.content || "").toLowerCase().includes(t)
    ) : this.notes;
  }
  render() {
    const t = this._filtered;
    return a`
      <div class="header">
        <div class="title-row">
          <ha-menu-button></ha-menu-button>
          <h1>Home Assistant Notes</h1>
        </div>
        <ha-input placeholder="Search notes..." .value=${this.searchTerm} @input=${this._onSearch} @keydown=${(e) => e.stopPropagation()}></ha-input>
        <ha-button size="s" appearance="filled" variant="brand" @click=${this._onNew}>New note</ha-button>
      </div>
      <div class="items">
        ${t.length === 0 ? a`
              <div class="empty">
                <ha-alert alert-type="info" narrow>
                  ${this.searchTerm ? a`No notes match "${this.searchTerm}".` : "No notes yet. Create one to get started."}
                </ha-alert>
              </div>
            ` : t.map((e) => a`
              <better-notes-list-item .note=${e} ?active=${this.selectedNoteId === e.note_id}></better-notes-list-item>
            `)}
      </div>
    `;
  }
};
b.styles = v`
    :host { display: flex; flex-direction: column; height: 100%; background: var(--secondary-background-color); }
    .header {
      position: relative; z-index: 1;
      background: var(--card-background-color);
      padding-block: var(--ha-space-4) var(--ha-space-3);
      padding-inline: var(--ha-space-4);
      border-block-end: 1px solid var(--divider-color);
      box-shadow: var(--ha-box-shadow-s, 0 1px 2px rgba(0, 0, 0, 0.06));
    }
    .title-row { display: flex; align-items: center; gap: var(--ha-space-2); margin-block-end: var(--ha-space-3); }
    ha-menu-button { flex-shrink: 0; }
    h1 {
      font-size: 20px; line-height: 1.25; font-weight: 600; letter-spacing: -0.01em;
      color: var(--primary-text-color); margin: 0;
    }
    ha-input { display: block; width: 100%; margin-block-end: var(--ha-space-3); }
    ha-button { width: 100%; }
    .items { flex: 1; overflow-y: auto; }
    .empty { padding: var(--ha-space-4); }
  `;
w([
  l({ attribute: !1 })
], b.prototype, "notes", 2);
w([
  l({ type: String })
], b.prototype, "selectedNoteId", 2);
w([
  l({ type: String })
], b.prototype, "searchTerm", 2);
b = w([
  g("better-notes-list")
], b);
var V = Object.defineProperty, U = Object.getOwnPropertyDescriptor, m = (t, e, i, s) => {
  for (var o = s > 1 ? void 0 : s ? U(e, i) : e, n = t.length - 1, r; n >= 0; n--)
    (r = t[n]) && (o = (s ? r(e, i, o) : r(o)) || o);
  return s && o && V(e, i, o), o;
};
let d = class extends _ {
  constructor() {
    super(...arguments), this.pinned = !1, this.color = "", this.linkHref = "", this._openGroup = null, this._linkOpen = !1;
  }
  _toggleGroup(t) {
    this._openGroup = this._openGroup === t ? null : t;
  }
  _closeAll() {
    this._openGroup = null;
  }
  _dispatchAction(t, e) {
    this.dispatchEvent(new CustomEvent("toolbar-action", { detail: { action: t, payload: e }, bubbles: !0, composed: !0 })), this._closeAll();
  }
  _selectColor(t) {
    this.dispatchEvent(new CustomEvent("color-select", { detail: { color: t }, bubbles: !0, composed: !0 })), this._closeAll();
  }
  _togglePin() {
    this.dispatchEvent(new CustomEvent("pin-toggle", { bubbles: !0, composed: !0 }));
  }
  _openLink() {
    this._closeAll(), this._linkOpen = !0, this.dispatchEvent(new CustomEvent("link-open-requested", { bubbles: !0, composed: !0 }));
  }
  _isValidUrl(t) {
    try {
      const e = new URL(t);
      return ["https:", "http:", "mailto:"].includes(e.protocol);
    } catch {
      return !1;
    }
  }
  _applyLink() {
    const e = this.renderRoot.querySelector(".link-row ha-input")?.value?.trim();
    e && this._isValidUrl(e) && this._dispatchAction("setLink", { href: e }), this._linkOpen = !1;
  }
  render() {
    return a`
      <div class="group ${this._openGroup === "heading" ? "open" : ""}">
        <ha-button size="s" appearance="plain" variant="neutral" @click=${() => this._toggleGroup("heading")} @mousedown=${(t) => t.preventDefault()}>H<span class="caret"> ▾</span></ha-button>
        <div class="dropdown">
          <button class="item" @click=${() => this._dispatchAction("paragraph")}>Normal</button>
          <button class="item" @click=${() => this._dispatchAction("h1")}>H1</button>
          <button class="item" @click=${() => this._dispatchAction("h2")}>H2</button>
          <button class="item" @click=${() => this._dispatchAction("h3")}>H3</button>
        </div>
      </div>
      <div class="group ${this._openGroup === "format" ? "open" : ""}">
        <ha-button size="s" appearance="plain" variant="neutral" @click=${() => this._toggleGroup("format")} @mousedown=${(t) => t.preventDefault()}>B<span class="caret"> ▾</span></ha-button>
        <div class="dropdown">
          <button class="item" @click=${() => this._dispatchAction("bold")}>Bold</button>
          <button class="item" @click=${() => this._dispatchAction("italic")}>Italic</button>
          <button class="item" @click=${() => this._dispatchAction("strike")}>Strikethrough</button>
          <button class="item" @click=${() => this._dispatchAction("highlight")}>Highlight</button>
          <div class="divider"></div>
          <button class="item" @click=${() => this._dispatchAction("code")}>Code</button>
          <button class="item" @click=${() => this._dispatchAction("codeBlock")}>Code block</button>
          <button class="item" @click=${() => this._dispatchAction("blockquote")}>Blockquote</button>
        </div>
      </div>
      <div class="group ${this._openGroup === "list" ? "open" : ""}">
        <ha-button size="s" appearance="plain" variant="neutral" @click=${() => this._toggleGroup("list")} @mousedown=${(t) => t.preventDefault()}>≡<span class="caret"> ▾</span></ha-button>
        <div class="dropdown">
          <button class="item" @click=${() => this._dispatchAction("bulletList")}>Bullet list</button>
          <button class="item" @click=${() => this._dispatchAction("orderedList")}>Numbered list</button>
          <button class="item" @click=${() => this._dispatchAction("taskList")}>Checklist</button>
          <div class="divider"></div>
          <button class="item" @click=${() => this._dispatchAction("indent")}>Indent</button>
          <button class="item" @click=${() => this._dispatchAction("outdent")}>Outdent</button>
        </div>
      </div>
      <div class="group ${this._openGroup === "color" ? "open" : ""}">
        <ha-button size="s" appearance="plain" variant="neutral" @click=${() => this._toggleGroup("color")} @mousedown=${(t) => t.preventDefault()}>Color<span class="caret"> ▾</span></ha-button>
        <div class="dropdown">
          <div class="swatches">
            ${E.map((t) => a`
              <div class="dot ${this.color === t ? "active" : ""}" style="background:${t}"
                   @click=${() => this._selectColor(t)}></div>
            `)}
          </div>
        </div>
      </div>
      <ha-button size="s" appearance="plain" variant=${this.pinned ? "brand" : "neutral"} @click=${() => this._togglePin()} @mousedown=${(t) => t.preventDefault()}>
        ${this.pinned ? "Pinned" : "Pin"}
      </ha-button>
      <ha-button size="s" appearance="plain" variant="neutral" @click=${() => this._openLink()} @mousedown=${(t) => t.preventDefault()}>Link</ha-button>
      ${this._linkOpen ? a`
        <div class="link-row">
          <ha-input type="url" placeholder="https://…" .value=${this.linkHref} @keydown=${(t) => t.stopPropagation()}></ha-input>
          <ha-button size="s" appearance="plain" variant="neutral" @click=${() => this._applyLink()}>Apply</ha-button>
          <ha-button size="s" appearance="plain" variant="neutral" @click=${() => this._dispatchAction("unsetLink")}>Remove</ha-button>
          <ha-button size="s" appearance="plain" variant="neutral" @click=${() => {
      this._linkOpen = !1;
    }}>✕</ha-button>
        </div>
      ` : ""}
    `;
  }
};
d.styles = v`
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
m([
  l({ type: Boolean })
], d.prototype, "pinned", 2);
m([
  l({ type: String })
], d.prototype, "color", 2);
m([
  l({ type: String })
], d.prototype, "linkHref", 2);
m([
  h()
], d.prototype, "_openGroup", 2);
m([
  h()
], d.prototype, "_linkOpen", 2);
d = m([
  g("better-notes-toolbar")
], d);
async function K() {
  const [{ Editor: t }, { StarterKit: e }, { TaskList: i }, { TaskItem: s }, { Link: o }, { Highlight: n }, { ListItem: r }] = await Promise.all([
    import("./index-pa5U7i3D.js").then((T) => T.O),
    import("./index-Yys9n5GD.js"),
    import("./index-B0TKEn8L.js"),
    import("./index-D6ncd5DV.js"),
    import("./index-Vi6toNLn.js"),
    import("./index-lBYWkvms.js"),
    import("./index-C46ou4Bj.js")
  ]);
  return {
    Editor: t,
    extensions: [
      // listItem: false — replaced below with a ListItem that also allows a
      // heading as its first child. The default ListItem content model is
      // 'paragraph block*' (first child must specifically be a paragraph),
      // so toggling a list item to a heading is invalid at that level and
      // ProseMirror climbs up through every ancestor list to find a place
      // it IS valid, collapsing all nested indentation in the process.
      e.configure({ heading: { levels: [1, 2, 3] }, link: !1, listItem: !1, hardBreak: !1 }),
      r.extend({ content: "(paragraph|heading) block*" }),
      i,
      s.configure({ nested: !0 }),
      o.configure({ openOnClick: !0 }),
      n
    ]
  };
}
var F = Object.defineProperty, J = Object.getOwnPropertyDescriptor, C = (t, e, i, s) => {
  for (var o = s > 1 ? void 0 : s ? J(e, i) : e, n = t.length - 1, r; n >= 0; n--)
    (r = t[n]) && (o = (s ? r(e, i, o) : r(o)) || o);
  return s && o && F(e, i, o), o;
};
let x = class extends _ {
  constructor() {
    super(...arguments), this.content = "", this._editor = null, this._fallback = !1, this._lastEmitted = "";
  }
  async connectedCallback() {
    super.connectedCallback(), await this.updateComplete, this._init();
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._editor?.destroy(), this._editor = null;
  }
  updated(t) {
    t.has("content") && this._editor && this.content !== this._lastEmitted && (this._lastEmitted = this.content, this._editor.commands.setContent(this.content, { emitUpdate: !1 }), this._editor.commands.focus("end"));
  }
  async _init() {
    let t;
    try {
      t = await K();
    } catch (s) {
      console.warn("Home Assistant Notes: Tiptap failed to load, falling back to textarea", s), t = null;
    }
    if (!t || !this._mount) {
      this._fallback = !0, this.requestUpdate();
      return;
    }
    const { Editor: e, extensions: i } = t;
    this._lastEmitted = this.content, this._editor = new e({
      element: this._mount,
      extensions: i,
      content: this.content,
      autofocus: "end",
      onUpdate: () => this._emitChanged()
    });
  }
  _emitChanged() {
    this._lastEmitted = this.getHTML(), this.dispatchEvent(new CustomEvent("content-changed", {
      detail: { html: this._lastEmitted },
      bubbles: !0,
      composed: !0
    }));
  }
  getHTML() {
    return this._editor ? this._editor.getHTML() : this.renderRoot.querySelector("#fallback")?.value ?? this.content;
  }
  getLinkHref() {
    return this._editor?.getAttributes("link").href ?? "";
  }
  runAction(t, e) {
    const i = this._editor?.chain().focus();
    if (i)
      switch (t) {
        case "paragraph":
          i.setParagraph().run();
          break;
        case "h1":
          i.toggleHeading({ level: 1 }).run();
          break;
        case "h2":
          i.toggleHeading({ level: 2 }).run();
          break;
        case "h3":
          i.toggleHeading({ level: 3 }).run();
          break;
        case "bold":
          i.toggleBold().run();
          break;
        case "italic":
          i.toggleItalic().run();
          break;
        case "strike":
          i.toggleStrike().run();
          break;
        case "highlight":
          i.toggleHighlight().run();
          break;
        case "code":
          i.toggleCode().run();
          break;
        case "codeBlock":
          i.toggleCodeBlock().run();
          break;
        case "blockquote":
          i.toggleBlockquote().run();
          break;
        case "bulletList":
          i.toggleBulletList().run();
          break;
        case "orderedList":
          i.toggleOrderedList().run();
          break;
        case "taskList":
          i.toggleTaskList().run();
          break;
        case "indent":
          i.sinkListItem("listItem").run();
          break;
        case "outdent":
          i.liftListItem("listItem").run();
          break;
        case "setLink":
          e?.href && i.setLink({ href: e.href }).run();
          break;
        case "unsetLink":
          i.unsetLink().run();
          break;
      }
  }
  render() {
    return this._fallback ? a`<textarea
        id="fallback"
        class="fallback"
        placeholder="Start typing..."
        .value=${this.content}
        @input=${() => this._emitChanged()}
        @keydown=${(t) => t.stopPropagation()}
      ></textarea>` : a`<div id="mount" @keydown=${(t) => t.stopPropagation()}></div>`;
  }
};
x.styles = v`
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
      flex: 1; min-height: 100%; cursor: text; overflow-wrap: anywhere;
    }
    .ProseMirror ul[data-type="taskList"] {
      list-style: none;
      padding-left: 0;
    }
    .ProseMirror ul[data-type="taskList"] li {
      display: flex;
      align-items: flex-start;
      margin: 1em 0;
    }
    .ProseMirror ul[data-type="taskList"] li > label {
      flex: 0 0 auto;
      margin-right: 0.5rem;
      user-select: none;
    }
    .ProseMirror ul[data-type="taskList"] li > div {
      flex: 1 1 auto;
    }
    .ProseMirror ul[data-type="taskList"] li > div > p {
      margin: 0;
    }
    .ProseMirror ul[data-type="taskList"] input[type="checkbox"] {
      cursor: pointer;
    }
    .ProseMirror pre {
      background-color: var(--primary-text-color);
      color: var(--card-background-color);
      border-radius: var(--ha-border-radius-sm, 8px);
      padding: var(--ha-space-4, 16px);
      white-space: pre-wrap;
      word-break: break-word;
      font-family: var(--ha-font-family-code, monospace);
    }
    .ProseMirror pre code {
      background: none;
      color: inherit;
      padding: 0;
    }
    .ProseMirror blockquote {
      border-left: 4px solid var(--divider-color);
      margin-inline: 0;
      padding-inline: 1em;
    }
  `;
C([
  l({ attribute: !1 })
], x.prototype, "content", 2);
C([
  y("#mount")
], x.prototype, "_mount", 2);
x = C([
  g("better-notes-tiptap-editor")
], x);
var Q = Object.defineProperty, W = Object.getOwnPropertyDescriptor, f = (t, e, i, s) => {
  for (var o = s > 1 ? void 0 : s ? W(e, i) : e, n = t.length - 1, r; n >= 0; n--)
    (r = t[n]) && (o = (s ? r(e, i, o) : r(o)) || o);
  return s && o && Q(e, i, o), o;
};
let p = class extends _ {
  constructor() {
    super(...arguments), this.note = null, this._pendingDelete = !1, this._justSaved = !1, this._onViewportResize = () => {
      const t = window.visualViewport;
      t && this.style.setProperty("--better-notes-visible-height", `${t.height}px`);
    };
  }
  connectedCallback() {
    super.connectedCallback(), window.visualViewport?.addEventListener("resize", this._onViewportResize), this._onViewportResize();
  }
  disconnectedCallback() {
    super.disconnectedCallback(), clearTimeout(this._saveTimeout), clearTimeout(this._deleteTimeout), clearTimeout(this._toastTimeout), window.visualViewport?.removeEventListener("resize", this._onViewportResize);
  }
  _scheduleSave() {
    clearTimeout(this._saveTimeout), this._saveTimeout = setTimeout(() => this._save(), 1e3);
  }
  _save(t = {}) {
    if (!this.note) return;
    const e = {
      note_id: this.note.note_id,
      title: t.title ?? this._titleInput?.value ?? this.note.title,
      content: t.content ?? this._tiptap?.getHTML() ?? this.note.content,
      color: t.color ?? this.note.color,
      pinned: t.pinned ?? this.note.pinned
    };
    this.dispatchEvent(new CustomEvent("note-save", { detail: e, bubbles: !0, composed: !0 })), this._justSaved = !0, clearTimeout(this._toastTimeout), this._toastTimeout = setTimeout(() => {
      this._justSaved = !1;
    }, 1e3);
  }
  _onToolbarAction(t) {
    this._tiptap?.runAction(t.detail.action, t.detail.payload);
  }
  _onColorSelect(t) {
    clearTimeout(this._saveTimeout), this._save({ color: t.detail.color });
  }
  _onPinToggle() {
    this.note && (clearTimeout(this._saveTimeout), this._save({ pinned: !this.note.pinned }));
  }
  _onLinkOpenRequested(t) {
    const e = t.target;
    e.linkHref = this._tiptap?.getLinkHref() ?? "";
  }
  _onDelete() {
    if (this.note) {
      if (!this._pendingDelete) {
        this._pendingDelete = !0, this._deleteTimeout = setTimeout(() => {
          this._pendingDelete = !1;
        }, 3e3);
        return;
      }
      clearTimeout(this._deleteTimeout), this._pendingDelete = !1, this.dispatchEvent(new CustomEvent("note-delete", { detail: { noteId: this.note.note_id }, bubbles: !0, composed: !0 }));
    }
  }
  render() {
    return this.note ? a`
      <div class="header">
        <ha-icon-button class="back-btn" .path=${O} @click=${() => this.dispatchEvent(new CustomEvent("editor-back", { bubbles: !0, composed: !0 }))}></ha-icon-button>
        <div class="actions">
          <ha-button size="s" appearance="plain" variant="neutral" @click=${() => {
      clearTimeout(this._saveTimeout), this._save();
    }}>
            ${this._justSaved ? a`<ha-svg-icon .path=${A}></ha-svg-icon>` : "Save"}
          </ha-button>
          <ha-button size="s" appearance="plain" variant="danger" @click=${() => this._onDelete()}>${this._pendingDelete ? "Confirm?" : "Delete"}</ha-button>
        </div>
      </div>
      <div class="body">
        <input
          class="title-input"
          type="text"
          placeholder="Note Title"
          .value=${this.note.title || ""}
          @input=${() => this._scheduleSave()}
          @keydown=${(t) => t.stopPropagation()}
        >
        <better-notes-tiptap-editor
          .content=${this.note.content || ""}
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
    ` : a`<div class="empty">Select a note or create one</div>`;
  }
};
p.styles = v`
    :host {
      display: flex; flex-direction: column; height: var(--better-notes-visible-height, 100%);
      background: var(--card-background-color);
      min-width: 0; min-height: 0; position: relative;
    }
    .header { padding: 12px 16px; border-bottom: 1px solid var(--divider-color); display: flex; align-items: center; gap: 10px; }
    .back-btn { display: none; }
    @media (max-width: 767px) {
      .back-btn { display: inline-flex; --mdc-icon-size: 28px; }
    }
    .actions { display: flex; gap: 8px; margin-left: auto; }
    .body {
      flex: 1; min-height: 0; overflow-y: auto; overflow-x: hidden; display: flex; flex-direction: column;
      padding: 20px 24px 40px;
    }
    better-notes-tiptap-editor { flex: 1; min-height: 0; display: flex; flex-direction: column; }
    better-notes-toolbar {
      flex-shrink: 0;
      margin: 8px 12px 12px;
      margin-bottom: calc(12px + var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px)));
    }
    .title-input {
      width: 100%; font-size: 28px; font-weight: 700; border: none; outline: none; margin-bottom: 16px;
      color: var(--primary-text-color); background: transparent; font-family: inherit;
    }
    .empty {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      height: 100%; color: var(--secondary-text-color);
    }
  `;
f([
  l({ attribute: !1 })
], p.prototype, "note", 2);
f([
  h()
], p.prototype, "_pendingDelete", 2);
f([
  h()
], p.prototype, "_justSaved", 2);
f([
  y("better-notes-tiptap-editor")
], p.prototype, "_tiptap", 2);
f([
  y(".title-input")
], p.prototype, "_titleInput", 2);
p = f([
  g("better-notes-editor")
], p);
var X = Object.defineProperty, Y = Object.getOwnPropertyDescriptor, u = (t, e, i, s) => {
  for (var o = s > 1 ? void 0 : s ? Y(e, i) : e, n = t.length - 1, r; n >= 0; n--)
    (r = t[n]) && (o = (s ? r(e, i, o) : r(o)) || o);
  return s && o && X(e, i, o), o;
};
function Z(t) {
  return [...t].sort((e, i) => e.pinned !== i.pinned ? e.pinned ? -1 : 1 : new Date(i.modified).getTime() - new Date(e.modified).getTime());
}
let c = class extends _ {
  constructor() {
    super(...arguments), this.narrow = !1, this._notes = [], this._selectedId = null, this._searchTerm = "", this._view = "list", this._creatingNote = !1, this._pushedEditorState = !1, this._onPopState = () => {
      this._pushedEditorState && (this._pushedEditorState = !1, this._view = "list");
    };
  }
  connectedCallback() {
    super.connectedCallback(), this.hass && this._init(), window.addEventListener("popstate", this._onPopState);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._unsubscribe?.(), this._unsubscribe = void 0, window.removeEventListener("popstate", this._onPopState);
  }
  _enterEditor(t) {
    this._selectedId = t, this.narrow && this._view !== "editor" && (history.pushState({ betterNotesEditor: !0 }, "", location.href), this._pushedEditorState = !0), this._view = "editor";
  }
  _leaveEditor() {
    this._pushedEditorState ? (this._pushedEditorState = !1, history.back()) : this._view = "list";
  }
  updated(t) {
    t.has("hass") && this.hass && !this._unsubscribe && this._init(), t.has("_view") && this.setAttribute("data-view", this._view);
  }
  async _init() {
    await this._loadNotes(), this._unsubscribe = await D(this.hass, () => this._loadNotes());
  }
  async _loadNotes() {
    this._notes = Z(await z(this.hass));
  }
  get _selectedNote() {
    return this._notes.find((t) => t.note_id === this._selectedId) ?? null;
  }
  async _onNoteNew() {
    if (!this._creatingNote) {
      this._creatingNote = !0;
      try {
        const t = await I(this.hass, { title: "New Note", content: "", color: E[0], pinned: !1 });
        await this._loadNotes(), t && this._enterEditor(t);
      } finally {
        this._creatingNote = !1;
      }
    }
  }
  _onNoteSelect(t) {
    this._enterEditor(t.detail.noteId);
  }
  _onSearchChanged(t) {
    this._searchTerm = t.detail.value;
  }
  async _onNoteSave(t) {
    await H(this.hass, t.detail), await this._loadNotes();
  }
  async _onNoteDelete(t) {
    await B(this.hass, t.detail.noteId), this._selectedId = null, this._leaveEditor(), await this._loadNotes();
  }
  _onEditorBack() {
    this._leaveEditor();
  }
  render() {
    return a`
      <div class="layout">
        <div class="list-pane">
          <better-notes-list
            .notes=${this._notes}
            .selectedNoteId=${this._selectedId}
            .searchTerm=${this._searchTerm}
            @note-select=${this._onNoteSelect}
            @note-new=${this._onNoteNew}
            @search-changed=${this._onSearchChanged}
          ></better-notes-list>
        </div>
        <div class="editor-pane">
          <better-notes-editor
            .note=${this._selectedNote}
            @editor-back=${this._onEditorBack}
            @note-save=${this._onNoteSave}
            @note-delete=${this._onNoteDelete}
          ></better-notes-editor>
        </div>
      </div>
    `;
  }
};
c.styles = v`
    :host { display: block; height: 100%; }
    .layout { display: flex; height: 100%; background: var(--card-background-color); overflow: hidden; }
    .list-pane { flex-shrink: 0; border-inline-end: 1px solid var(--divider-color); }
    .editor-pane { flex: 1; min-width: 0; }
    @media (min-width: 768px) { .list-pane { width: 280px; } }
    @media (max-width: 767px) {
      .list-pane { width: 100%; flex: 1; }
      :host([data-view="list"]) .editor-pane { display: none; }
      :host([data-view="editor"]) .list-pane { display: none; }
    }
  `;
u([
  l({ attribute: !1 })
], c.prototype, "hass", 2);
u([
  l({ type: Boolean })
], c.prototype, "narrow", 2);
u([
  h()
], c.prototype, "_notes", 2);
u([
  h()
], c.prototype, "_selectedId", 2);
u([
  h()
], c.prototype, "_searchTerm", 2);
u([
  h()
], c.prototype, "_view", 2);
c = u([
  g("better-notes-panel")
], c);
export {
  c as BetterNotesPanel
};
