import { i as b, n as l, a as v, d as C, c as L, m as O, b as a, f as E, t as _, r as p, N, s as P, g as S, h as A, u as D, j as I } from "./colors-w_morKZN.js";
const z = (t, e, i) => (i.configurable = !0, i.enumerable = !0, Reflect.decorate && typeof e != "object" && Object.defineProperty(t, e, i), i);
function y(t, e) {
  return (i, s, o) => {
    const n = (r) => r.renderRoot?.querySelector(t) ?? null;
    return z(i, s, { get() {
      return n(this);
    } });
  };
}
var H = Object.defineProperty, j = Object.getOwnPropertyDescriptor, $ = (t, e, i, s) => {
  for (var o = s > 1 ? void 0 : s ? j(e, i) : e, n = t.length - 1, r; n >= 0; n--)
    (r = t[n]) && (o = (s ? r(e, i, o) : r(o)) || o);
  return s && o && H(e, i, o), o;
};
let x = class extends v {
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
    const t = C(this.note.content || ""), e = t.length > 60 ? `${t.slice(0, 60)}…` : t;
    return a`
      <div class="bar" style="background:${L(this.note.color)}"></div>
      <div class="header">
        <div class="title">${this.note.title || "Untitled"}</div>
        ${this.note.pinned ? a`<ha-icon .path=${O}></ha-icon>` : ""}
      </div>
      <div class="preview">${e}</div>
      <div class="date">${E(this.note.modified)}</div>
    `;
  }
};
x.styles = b`
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
$([
  l({ attribute: !1 })
], x.prototype, "note", 2);
$([
  l({ type: Boolean, reflect: !0 })
], x.prototype, "active", 2);
x = $([
  _("better-notes-list-item")
], x);
var B = Object.defineProperty, G = Object.getOwnPropertyDescriptor, k = (t, e, i, s) => {
  for (var o = s > 1 ? void 0 : s ? G(e, i) : e, n = t.length - 1, r; n >= 0; n--)
    (r = t[n]) && (o = (s ? r(e, i, o) : r(o)) || o);
  return s && o && B(e, i, o), o;
};
let u = class extends v {
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
      (e) => (e.title || "").toLowerCase().includes(t) || C(e.content || "").toLowerCase().includes(t)
    ) : this.notes;
  }
  render() {
    const t = this._filtered;
    return a`
      <div class="header">
        <h1>Better Notes</h1>
        <ha-input placeholder="Search notes..." .value=${this.searchTerm} @input=${this._onSearch}></ha-input>
        <ha-button @click=${this._onNew}>+ New Note</ha-button>
      </div>
      <div class="items">
        ${t.length === 0 ? a`<div class="empty">No notes found</div>` : t.map((e) => a`
              <better-notes-list-item .note=${e} ?active=${this.selectedNoteId === e.note_id}></better-notes-list-item>
            `)}
      </div>
    `;
  }
};
u.styles = b`
    :host { display: flex; flex-direction: column; height: 100%; background: var(--secondary-background-color); }
    .header { padding: 16px; border-bottom: 1px solid var(--divider-color); }
    h1 { font-size: 22px; font-weight: 600; color: var(--primary-text-color); margin: 0 0 12px; }
    ha-input { display: block; width: 100%; margin-bottom: 10px; }
    ha-button { width: 100%; }
    .items { flex: 1; overflow-y: auto; padding: 10px; }
    .empty { padding: 20px; text-align: center; color: var(--secondary-text-color); font-size: 14px; }
  `;
k([
  l({ attribute: !1 })
], u.prototype, "notes", 2);
k([
  l({ type: String })
], u.prototype, "selectedNoteId", 2);
k([
  l({ type: String })
], u.prototype, "searchTerm", 2);
u = k([
  _("better-notes-list")
], u);
var R = Object.defineProperty, q = Object.getOwnPropertyDescriptor, m = (t, e, i, s) => {
  for (var o = s > 1 ? void 0 : s ? q(e, i) : e, n = t.length - 1, r; n >= 0; n--)
    (r = t[n]) && (o = (s ? r(e, i, o) : r(o)) || o);
  return s && o && R(e, i, o), o;
};
let c = class extends v {
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
    const e = this.renderRoot.querySelector(".link-row input")?.value.trim();
    e && this._isValidUrl(e) && this._dispatchAction("setLink", { href: e }), this._linkOpen = !1;
  }
  render() {
    return a`
      <div class="group ${this._openGroup === "heading" ? "open" : ""}">
        <ha-button size="small" @click=${() => this._toggleGroup("heading")}>H ▾</ha-button>
        <div class="dropdown">
          <button class="item" @click=${() => this._dispatchAction("paragraph")}>Normal</button>
          <button class="item" @click=${() => this._dispatchAction("h1")}>H1</button>
          <button class="item" @click=${() => this._dispatchAction("h2")}>H2</button>
          <button class="item" @click=${() => this._dispatchAction("h3")}>H3</button>
        </div>
      </div>
      <div class="group ${this._openGroup === "format" ? "open" : ""}">
        <ha-button size="small" @click=${() => this._toggleGroup("format")}>B ▾</ha-button>
        <div class="dropdown">
          <button class="item" @click=${() => this._dispatchAction("bold")}>Bold</button>
          <button class="item" @click=${() => this._dispatchAction("italic")}>Italic</button>
          <button class="item" @click=${() => this._dispatchAction("strike")}>Strikethrough</button>
          <button class="item" @click=${() => this._dispatchAction("highlight")}>Highlight</button>
        </div>
      </div>
      <div class="group ${this._openGroup === "list" ? "open" : ""}">
        <ha-button size="small" @click=${() => this._toggleGroup("list")}>≡ ▾</ha-button>
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
        <ha-button size="small" @click=${() => this._toggleGroup("color")}>Color ▾</ha-button>
        <div class="dropdown">
          <div class="swatches">
            ${N.map((t) => a`
              <div class="dot ${this.color === t ? "active" : ""}" style="background:${t}"
                   @click=${() => this._selectColor(t)}></div>
            `)}
          </div>
        </div>
      </div>
      <ha-button size="small" class=${this.pinned ? "active" : ""} @click=${() => this._togglePin()}>
        ${this.pinned ? "Pinned" : "Pin"}
      </ha-button>
      <ha-button size="small" @click=${() => this._openLink()}>Link</ha-button>
      ${this._linkOpen ? a`
        <div class="link-row">
          <ha-input type="url" placeholder="https://…" .value=${this.linkHref}></ha-input>
          <ha-button size="small" @click=${() => this._applyLink()}>Apply</ha-button>
          <ha-button size="small" @click=${() => this._dispatchAction("unsetLink")}>Remove</ha-button>
          <ha-button size="small" @click=${() => {
      this._linkOpen = !1;
    }}>✕</ha-button>
        </div>
      ` : ""}
    `;
  }
};
c.styles = b`
    :host {
      display: flex; flex-wrap: wrap; gap: 4px; padding: 8px 12px;
      background: var(--card-background-color); border-top: 1px solid var(--divider-color);
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
], c.prototype, "pinned", 2);
m([
  l({ type: String })
], c.prototype, "color", 2);
m([
  l({ type: String })
], c.prototype, "linkHref", 2);
m([
  p()
], c.prototype, "_openGroup", 2);
m([
  p()
], c.prototype, "_linkOpen", 2);
c = m([
  _("better-notes-toolbar")
], c);
async function U() {
  const [{ Editor: t }, { StarterKit: e }, { TaskList: i }, { TaskItem: s }, { Link: o }, { Highlight: n }] = await Promise.all([
    import("./index-DpIQkkjT.js").then((r) => r.O),
    import("./index-D5nyuybU.js"),
    import("./index-C_curDh4.js"),
    import("./index-BzgY6Pzl.js"),
    import("./index-DSnW7XAV.js"),
    import("./index-DcOljIx1.js")
  ]);
  return {
    Editor: t,
    extensions: [
      e.configure({ heading: { levels: [1, 2, 3] }, link: !1 }),
      i,
      s.configure({ nested: !0 }),
      o.configure({ openOnClick: !1 }),
      n
    ]
  };
}
var M = Object.defineProperty, V = Object.getOwnPropertyDescriptor, T = (t, e, i, s) => {
  for (var o = s > 1 ? void 0 : s ? V(e, i) : e, n = t.length - 1, r; n >= 0; n--)
    (r = t[n]) && (o = (s ? r(e, i, o) : r(o)) || o);
  return s && o && M(e, i, o), o;
};
let w = class extends v {
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
    t.has("content") && this._editor && this.content !== this._lastEmitted && (this._lastEmitted = this.content, this._editor.commands.setContent(this.content), this._editor.commands.focus("end"));
  }
  async _init() {
    let t;
    try {
      t = await U();
    } catch (s) {
      console.warn("Better Notes: Tiptap failed to load, falling back to textarea", s), t = null;
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
      ></textarea>` : a`<div id="mount"></div>`;
  }
};
w.styles = b`
    :host { display: block; }
    .fallback {
      width: 100%; min-height: 300px; font-size: 15px; line-height: 1.6;
      border: none; outline: none; resize: none; color: var(--primary-text-color);
      background: transparent; font-family: inherit;
    }
  `;
T([
  l({ attribute: !1 })
], w.prototype, "content", 2);
T([
  y("#mount")
], w.prototype, "_mount", 2);
w = T([
  _("better-notes-tiptap-editor")
], w);
var K = Object.defineProperty, F = Object.getOwnPropertyDescriptor, g = (t, e, i, s) => {
  for (var o = s > 1 ? void 0 : s ? F(e, i) : e, n = t.length - 1, r; n >= 0; n--)
    (r = t[n]) && (o = (s ? r(e, i, o) : r(o)) || o);
  return s && o && K(e, i, o), o;
};
let d = class extends v {
  constructor() {
    super(...arguments), this.note = null, this._pendingDelete = !1, this._showToast = !1;
  }
  disconnectedCallback() {
    super.disconnectedCallback(), clearTimeout(this._saveTimeout), clearTimeout(this._deleteTimeout), clearTimeout(this._toastTimeout);
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
    this.dispatchEvent(new CustomEvent("note-save", { detail: e, bubbles: !0, composed: !0 })), this._showToast = !0, clearTimeout(this._toastTimeout), this._toastTimeout = setTimeout(() => {
      this._showToast = !1;
    }, 1500);
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
        <ha-icon-button class="back-btn" @click=${() => this.dispatchEvent(new CustomEvent("editor-back", { bubbles: !0, composed: !0 }))}>←</ha-icon-button>
        <div class="actions">
          <ha-button @click=${() => {
      clearTimeout(this._saveTimeout), this._save();
    }}>Save</ha-button>
          <ha-button @click=${() => this._onDelete()}>${this._pendingDelete ? "Confirm?" : "Delete"}</ha-button>
        </div>
      </div>
      <div class="body">
        <input
          class="title-input"
          type="text"
          placeholder="Note Title"
          .value=${this.note.title || ""}
          @input=${() => this._scheduleSave()}
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
      ${this._showToast ? a`<div class="toast">Saved</div>` : ""}
    ` : a`<div class="empty">Select a note or create one</div>`;
  }
};
d.styles = b`
    :host {
      display: flex; flex-direction: column; height: 100%; background: var(--card-background-color);
      min-width: 0; min-height: 0; position: relative;
    }
    .header { padding: 12px 16px; border-bottom: 1px solid var(--divider-color); display: flex; align-items: center; gap: 10px; }
    .back-btn { display: none; }
    @media (max-width: 767px) { .back-btn { display: inline-flex; } }
    .actions { display: flex; gap: 8px; margin-left: auto; }
    .body { flex: 1; min-height: 0; overflow-y: auto; padding: 20px 24px; }
    .title-input {
      width: 100%; font-size: 28px; font-weight: 700; border: none; outline: none; margin-bottom: 16px;
      color: var(--primary-text-color); background: transparent; font-family: inherit;
    }
    .empty {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      height: 100%; color: var(--secondary-text-color);
    }
    .toast {
      position: absolute; bottom: 24px; right: 24px; background: var(--primary-text-color);
      color: var(--card-background-color); padding: 8px 16px; border-radius: 4px; font-size: 13px;
      pointer-events: none; z-index: 1000;
    }
  `;
g([
  l({ attribute: !1 })
], d.prototype, "note", 2);
g([
  p()
], d.prototype, "_pendingDelete", 2);
g([
  p()
], d.prototype, "_showToast", 2);
g([
  y("better-notes-tiptap-editor")
], d.prototype, "_tiptap", 2);
g([
  y(".title-input")
], d.prototype, "_titleInput", 2);
d = g([
  _("better-notes-editor")
], d);
var J = Object.defineProperty, Q = Object.getOwnPropertyDescriptor, f = (t, e, i, s) => {
  for (var o = s > 1 ? void 0 : s ? Q(e, i) : e, n = t.length - 1, r; n >= 0; n--)
    (r = t[n]) && (o = (s ? r(e, i, o) : r(o)) || o);
  return s && o && J(e, i, o), o;
};
function W(t) {
  return [...t].sort((e, i) => e.pinned !== i.pinned ? e.pinned ? -1 : 1 : new Date(i.modified).getTime() - new Date(e.modified).getTime());
}
let h = class extends v {
  constructor() {
    super(...arguments), this._notes = [], this._selectedId = null, this._searchTerm = "", this._view = "list";
  }
  connectedCallback() {
    super.connectedCallback(), this.hass && this._init();
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._unsubscribe?.(), this._unsubscribe = void 0;
  }
  updated(t) {
    t.has("hass") && this.hass && !this._unsubscribe && this._init(), t.has("_view") && this.setAttribute("data-view", this._view);
  }
  async _init() {
    await this._loadNotes(), this._unsubscribe = await P(this.hass, () => this._loadNotes());
  }
  async _loadNotes() {
    this._notes = W(await S(this.hass));
  }
  get _selectedNote() {
    return this._notes.find((t) => t.note_id === this._selectedId) ?? null;
  }
  async _onNoteNew() {
    const t = await A(this.hass, { title: "New Note", content: "", color: N[0], pinned: !1 });
    await this._loadNotes(), t && (this._selectedId = t, this._view = "editor");
  }
  _onNoteSelect(t) {
    this._selectedId = t.detail.noteId, this._view = "editor";
  }
  _onSearchChanged(t) {
    this._searchTerm = t.detail.value;
  }
  async _onNoteSave(t) {
    await D(this.hass, t.detail), await this._loadNotes();
  }
  async _onNoteDelete(t) {
    await I(this.hass, t.detail.noteId), this._selectedId = null, this._view = "list", await this._loadNotes();
  }
  _onEditorBack() {
    this._view = "list";
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
h.styles = b`
    :host { display: block; height: 100%; }
    .layout { display: flex; height: 100%; background: var(--card-background-color); overflow: hidden; }
    .list-pane { flex-shrink: 0; }
    .editor-pane { flex: 1; min-width: 0; }
    @media (min-width: 768px) { .list-pane { width: 280px; } }
    @media (max-width: 767px) {
      :host([data-view="list"]) .editor-pane { display: none; }
      :host([data-view="editor"]) .list-pane { display: none; }
    }
  `;
f([
  l({ attribute: !1 })
], h.prototype, "hass", 2);
f([
  p()
], h.prototype, "_notes", 2);
f([
  p()
], h.prototype, "_selectedId", 2);
f([
  p()
], h.prototype, "_searchTerm", 2);
f([
  p()
], h.prototype, "_view", 2);
h = f([
  _("better-notes-panel")
], h);
export {
  h as BetterNotesPanel
};
