import { i as _, r as h, a as f, b as s, t as g, n as v, g as p, s as w, c as u, m as x, d as y, f as $, e as N } from "./colors-CMfYGb1F.js";
var C = Object.defineProperty, E = Object.getOwnPropertyDescriptor, b = (t, e, i, n) => {
  for (var o = n > 1 ? void 0 : n ? E(e, i) : e, a = t.length - 1, r; a >= 0; a--)
    (r = t[a]) && (o = (n ? r(e, i, o) : r(o)) || o);
  return n && o && C(e, i, o), o;
};
let c = class extends f {
  constructor() {
    super(...arguments), this._config = { type: "custom:better-notes-card" };
  }
  setConfig(t) {
    this._config = t;
  }
  _update(t) {
    this._config = { ...this._config, ...t }, this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: !0, composed: !0 }));
  }
  render() {
    return s`
      <div class="option">
        <label for="title">Title</label>
        <ha-input id="title" .value=${this._config.title ?? "Notes"}
          @input=${(t) => this._update({ title: t.target.value })}></ha-input>
      </div>
      <div class="option">
        <label for="max_notes">Max Notes to Display</label>
        <ha-input id="max_notes" type="number" min="1" max="20" .value=${String(this._config.max_notes ?? 5)}
          @input=${(t) => this._update({ max_notes: parseInt(t.target.value, 10) || 5 })}></ha-input>
      </div>
      <div class="option">
        <ha-formfield label="Show Pinned Notes Only">
          <ha-checkbox .checked=${!!this._config.show_pinned_only}
            @change=${(t) => this._update({ show_pinned_only: t.target.checked })}></ha-checkbox>
        </ha-formfield>
      </div>
      <div class="option">
        <ha-formfield label="Show All Notes">
          <ha-checkbox .checked=${!!this._config.show_all}
            @change=${(t) => this._update({ show_all: t.target.checked })}></ha-checkbox>
        </ha-formfield>
      </div>
      <div class="option">
        <label for="card_color">Card Background Color (hex)</label>
        <ha-input id="card_color" .value=${this._config.card_color ?? "#FFEB3B"} placeholder="#FFEB3B"
          @input=${(t) => this._update({ card_color: t.target.value })}></ha-input>
      </div>
      <div class="option">
        <label for="note_id">Specific Note ID (optional)</label>
        <ha-input id="note_id" .value=${this._config.note_id ?? ""} placeholder="Leave empty to show all"
          @input=${(t) => this._update({ note_id: t.target.value || null })}></ha-input>
      </div>
    `;
  }
};
c.styles = _`
    .option { margin-bottom: 16px; }
    label { display: block; margin-bottom: 4px; font-weight: 500; }
    ha-input { width: 100%; }
  `;
b([
  h()
], c.prototype, "_config", 2);
c = b([
  g("better-notes-card-editor")
], c);
const O = /* @__PURE__ */ new Set([
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "s",
  "u",
  "mark",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "li",
  "a",
  "blockquote",
  "code",
  "pre",
  "input",
  "label",
  "span",
  "div"
]), A = {
  a: ["href", "target", "rel"],
  input: ["type", "checked", "disabled"]
}, P = /^(https?:|mailto:)/i;
function m(t) {
  if (t.nodeType === Node.TEXT_NODE) return;
  if (t.nodeType !== Node.ELEMENT_NODE) {
    t.parentNode?.removeChild(t);
    return;
  }
  const e = t, i = e.tagName.toLowerCase();
  if (!O.has(i)) {
    const o = e.parentNode;
    for (; e.firstChild; ) o?.insertBefore(e.firstChild, e);
    o?.removeChild(e);
    return;
  }
  const n = A[i] || [];
  if (Array.from(e.attributes).forEach((o) => {
    !n.includes(o.name) && o.name !== "data-type" && o.name !== "data-checked" && e.removeAttribute(o.name);
  }), i === "a") {
    const o = e.getAttribute("href") || "";
    P.test(o) || e.removeAttribute("href"), e.setAttribute("rel", "noopener noreferrer");
  }
  Array.from(e.childNodes).forEach(m);
}
function B(t) {
  const e = new DOMParser().parseFromString(t, "text/html");
  return Array.from(e.body.childNodes).forEach(m), e.body.innerHTML;
}
var S = Object.defineProperty, k = Object.getOwnPropertyDescriptor, d = (t, e, i, n) => {
  for (var o = n > 1 ? void 0 : n ? k(e, i) : e, a = t.length - 1, r; a >= 0; a--)
    (r = t[a]) && (o = (n ? r(e, i, o) : r(o)) || o);
  return n && o && S(e, i, o), o;
};
let l = class extends f {
  constructor() {
    super(...arguments), this._config = { type: "custom:better-notes-card" }, this._notes = [];
  }
  setConfig(t) {
    if (!t) throw new Error("Invalid configuration");
    this._config = {
      title: "Notes",
      note_id: null,
      show_all: !1,
      max_notes: 5,
      show_pinned_only: !1,
      card_color: null,
      ...t
    };
  }
  updated(t) {
    t.has("hass") && this.hass && !this._unsubscribe && this._init();
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._unsubscribe?.(), this._unsubscribe = void 0;
  }
  async _init() {
    this._notes = await p(this.hass), this._unsubscribe = await w(this.hass, async () => {
      this._notes = await p(this.hass);
    });
  }
  getCardSize() {
    return this._config.note_id ? 3 : Math.min(this._config.max_notes ?? 5, this._notes.length) + 1;
  }
  static getConfigElement() {
    return document.createElement("better-notes-card-editor");
  }
  static getStubConfig() {
    return { type: "custom:better-notes-card", title: "Notes", show_all: !0, max_notes: 5, show_pinned_only: !1 };
  }
  _openPanel() {
    window.history.pushState(null, "", "/better-notes"), window.dispatchEvent(new Event("location-changed", { bubbles: !0, composed: !0 }));
  }
  _renderNote(t, e) {
    return s`
      <div class="note" style="--note-color:${u(t.color)}" @click=${() => this._openPanel()}>
        <div class="note-title">
          <span>${t.title || "Untitled"}</span>
          ${t.pinned ? s`<ha-svg-icon .path=${x}></ha-svg-icon>` : ""}
        </div>
        ${e ? s`<div class="note-content" .innerHTML=${B(t.content || "")}></div>` : s`<div class="note-content">${(() => {
      const i = y(t.content || "");
      return i.length > 150 ? `${i.slice(0, 150)}…` : i;
    })()}</div>`}
        ${t.tags?.length ? s`<div class="tags">${t.tags.map((i) => s`<span class="tag">${i}</span>`)}</div>` : ""}
        <div class="note-meta">${$(t.modified)}</div>
      </div>
    `;
  }
  render() {
    const t = this._config.card_color ? `background:${u(this._config.card_color)}` : "";
    let e;
    if (this._config.note_id) {
      const i = this._notes.find((n) => n.note_id === this._config.note_id);
      e = i ? this._renderNote(i, !0) : s`<div class="empty">Note not found</div>`;
    } else {
      let i = this._config.show_pinned_only ? this._notes.filter((a) => a.pinned) : this._notes;
      const n = i.length, o = this._config.max_notes ?? 5;
      this._config.show_all || (i = i.slice(0, o)), e = i.length === 0 ? s`<div class="empty">No notes to display</div>` : s`
            ${i.map((a) => this._renderNote(a, !1))}
            ${n > o ? s`<ha-button @click=${() => this._openPanel()}>View All Notes</ha-button>` : ""}
          `;
    }
    return s`
      <ha-card style=${t}>
        <div class="header">
          <ha-svg-icon .path=${N}></ha-svg-icon>
          <span>${this._config.title}</span>
        </div>
        ${e}
      </ha-card>
    `;
  }
};
l.styles = _`
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
d([
  v({ attribute: !1 })
], l.prototype, "hass", 2);
d([
  h()
], l.prototype, "_config", 2);
d([
  h()
], l.prototype, "_notes", 2);
l = d([
  g("better-notes-card")
], l);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "better-notes-card",
  name: "Better Notes Card",
  description: "Display notes from Better Notes",
  preview: !0,
  documentationURL: "https://github.com/CameronVerrells/BetterNotesforHA"
});
export {
  l as BetterNotesCard
};
