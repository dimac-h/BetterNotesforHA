import { N as T, r as O, m as I, w as g, s as J, u as z, E, P as Y, v as A, x as Q, F as x, T as tt, y as et, z as nt, A as st, B as rt } from "./index-DpIQkkjT.js";
const it = "listItem", D = "textStyle", P = /^\s*([-+*])\s$/, ot = T.create({
  name: "bulletList",
  addOptions() {
    return {
      itemTypeName: "listItem",
      HTMLAttributes: {},
      keepMarks: !1,
      keepAttributes: !1
    };
  },
  group: "block list",
  content() {
    return `${this.options.itemTypeName}+`;
  },
  parseHTML() {
    return [{ tag: "ul" }];
  },
  renderHTML({ HTMLAttributes: t }) {
    return [
      "ul",
      I(this.options.HTMLAttributes, t),
      0
    ];
  },
  markdownTokenName: "list",
  parseMarkdown: (t, e) => t.type !== "list" || t.ordered ? [] : {
    type: "bulletList",
    content: t.items ? e.parseChildren(t.items) : []
  },
  renderMarkdown: (t, e) => t.content ? e.renderChildren(t.content, `
`) : "",
  markdownOptions: { indentsContent: !0 },
  addCommands() {
    return { toggleBulletList: () => ({ commands: t, chain: e }) => this.options.keepAttributes ? e().toggleList(this.name, this.options.itemTypeName, this.options.keepMarks).updateAttributes(it, this.editor.getAttributes(D)).run() : t.toggleList(this.name, this.options.itemTypeName, this.options.keepMarks) };
  },
  addKeyboardShortcuts() {
    return { "Mod-Shift-8": () => this.editor.commands.toggleBulletList() };
  },
  addInputRules() {
    let t = g({
      find: P,
      type: this.type
    });
    return (this.options.keepMarks || this.options.keepAttributes) && (t = g({
      find: P,
      type: this.type,
      keepMarks: this.options.keepMarks,
      keepAttributes: this.options.keepAttributes,
      getAttributes: () => this.editor.getAttributes(D),
      editor: this.editor
    })), [t];
  }
}), at = (t, e, n) => {
  const { selection: s } = t;
  if (!s.empty) return null;
  const { $from: r } = s;
  if (!r.parent.isTextblock || r.parentOffset !== r.parent.content.size) return null;
  let i = -1;
  for (let p = r.depth; p > 0; p -= 1) if (r.node(p).type.name === e) {
    i = p;
    break;
  }
  if (i < 0) return null;
  const a = r.node(i), o = r.index(i);
  if (o + 1 >= a.childCount) return null;
  const u = a.child(o + 1);
  if (!n.includes(u.type.name)) return null;
  const h = t.schema.nodes[e];
  let d = !1;
  if (u.forEach((p) => {
    p.type === h && p.childCount > 1 && (d = !0);
  }), !d) return null;
  const c = t.doc.resolve(r.after()).nodeAfter;
  if (!c || !n.includes(c.type.name)) return null;
  const l = [];
  return c.forEach((p) => {
    l.push(p);
  }), l.length === 0 ? null : {
    listItemDepth: i,
    nestedList: c,
    nestedListPos: r.after(),
    insertPos: r.after(i),
    items: l
  };
}, ct = (t, e, n, s) => {
  const r = at(t, n, s);
  if (!r) return !1;
  const { selection: i } = t, { nestedList: a, nestedListPos: o, insertPos: u, items: h } = r, d = t.tr;
  d.delete(o, o + a.nodeSize);
  const c = d.mapping.map(u);
  return d.insert(c, x.from(h)), d.setSelection(i.map(d.doc, d.mapping)), e && e(d), !0;
}, lt = (t, e, n) => ct(t.state, t.view.dispatch, e, n), F = (t, e) => E.create({
  name: `${t}BranchingDeleteKeymap`,
  priority: 101,
  addKeyboardShortcuts() {
    const n = () => lt(this.editor, t, e);
    return {
      Delete: n,
      "Mod-Delete": n
    };
  }
}), X = [
  [1e3, "m"],
  [900, "cm"],
  [500, "d"],
  [400, "cd"],
  [100, "c"],
  [90, "xc"],
  [50, "l"],
  [40, "xl"],
  [10, "x"],
  [9, "ix"],
  [5, "v"],
  [4, "iv"],
  [1, "i"]
], v = "abcdefghijklmnopqrstuvwxyz", V = String.raw`\d+|[ivxlcdmIVXLCDM]+|${"[a-zA-Z]{1,2}"}`;
function M(t) {
  let e = t, n = "";
  for (const [s, r] of X) for (; e >= s; )
    n += r, e -= s;
  return n;
}
function $(t) {
  return M(t).toUpperCase();
}
function U(t) {
  const e = t.toLowerCase();
  let n = 0, s = 0;
  for (; n < e.length; ) {
    let r = !1;
    for (const [i, a] of X) if (e.startsWith(a, n)) {
      s += i, n += a.length, r = !0;
      break;
    }
    if (!r) return 0;
  }
  return s;
}
function ut(t) {
  if (!/^[ivxlcdmIVXLCDM]+$/.test(t)) return !1;
  const e = U(t);
  return e <= 0 ? !1 : (t === t.toLowerCase() ? M(e) : $(e)) === t;
}
function dt(t) {
  const e = t.toLowerCase();
  if (e.length === 1) return e.charCodeAt(0) - 97 + 1;
  if (e.length === 2) {
    const n = e.charCodeAt(0) - 97, s = e.charCodeAt(1) - 97;
    return (n + 1) * 26 + s + 1;
  }
  return 0;
}
function w(t) {
  if (t <= 26) return v[t - 1];
  const e = Math.floor((t - 1) / 26) - 1, n = (t - 1) % 26;
  return e < 0 ? v[n] : v[e] + v[n];
}
function C(t) {
  if (!(!t || /^\d+$/.test(t))) {
    if (ut(t)) return t === t.toLowerCase() ? "i" : "I";
    if (/^[a-z]{1,2}$/.test(t)) return "a";
    if (/^[A-Z]{1,2}$/.test(t)) return "A";
  }
}
function S(t) {
  if (/^\d+$/.test(t)) return parseInt(t, 10);
  const e = C(t);
  if (e === "i" || e === "I") return U(t);
  if (e === "a" || e === "A") {
    const s = dt(t);
    return s > 0 ? s : 1;
  }
  const n = parseInt(t, 10);
  return Number.isNaN(n) ? 1 : n;
}
function pt(t, e) {
  if (t === "numeric") return String(e);
  switch (t) {
    case "a":
      return w(e);
    case "A":
      return w(e).toUpperCase();
    case "i":
      return M(e);
    case "I":
      return $(e);
    default:
      return String(e);
  }
}
function ht(t) {
  var e;
  if (t.length === 0) return !1;
  const n = (e = C(t[0])) !== null && e !== void 0 ? e : "numeric", s = S(t[0]);
  if (s < 1) return !1;
  for (let r = 0; r < t.length; r++) {
    const i = pt(n, s + r);
    if (t[r] !== i) return !1;
  }
  return !0;
}
function ft(t) {
  return {
    type: C(t),
    start: S(t)
  };
}
function mt(t) {
  const { type: e, start: n } = ft(t), s = {};
  return e && (s.type = e), n !== 1 && (s.start = n), s;
}
function kt(t, e, n = ". ") {
  const s = e + 1;
  if (!t || t === "1") return `${s}${n}`;
  switch (t) {
    case "a":
      return `${w(s)}${n}`;
    case "A":
      return `${w(s).toUpperCase()}${n}`;
    case "i":
      return `${M(s)}${n}`;
    case "I":
      return `${$(s)}${n}`;
    default:
      return `${s}${n}`;
  }
}
function Lt(t) {
  var e, n;
  const s = (e = t.tokens) === null || e === void 0 ? void 0 : e[0];
  return !!(t.text && ((n = t.tokens) === null || n === void 0 ? void 0 : n.length) === 1 && s?.type === "list" && s.ordered && s.raw === t.text);
}
function yt(t, e) {
  return e.tokenizeInline ? e.parseInline(e.tokenizeInline(t)) : e.parseInline([{
    type: "text",
    raw: t,
    text: t
  }]);
}
const bt = T.create({
  name: "listItem",
  addOptions() {
    return {
      HTMLAttributes: {},
      bulletListTypeName: "bulletList",
      orderedListTypeName: "orderedList"
    };
  },
  content: "paragraph block*",
  defining: !0,
  parseHTML() {
    return [{ tag: "li" }];
  },
  renderHTML({ HTMLAttributes: t }) {
    return [
      "li",
      I(this.options.HTMLAttributes, t),
      0
    ];
  },
  markdownTokenName: "list_item",
  parseMarkdown: (t, e) => {
    var n;
    if (t.type !== "list_item") return [];
    const s = (n = e.parseBlockChildren) !== null && n !== void 0 ? n : e.parseChildren;
    let r = [];
    if (t.tokens && t.tokens.length > 0) {
      if (Lt(t)) return {
        type: "listItem",
        content: [{
          type: "paragraph",
          content: yt(t.text || "", e)
        }]
      };
      if (t.tokens.some((i) => i.type === "paragraph")) r = s(t.tokens);
      else {
        const i = t.tokens[0];
        if (i && i.type === "text" && i.tokens && i.tokens.length > 0) {
          if (r = [{
            type: "paragraph",
            content: e.parseInline(i.tokens)
          }], t.tokens.length > 1) {
            const a = s(t.tokens.slice(1));
            r.push(...a);
          }
        } else r = s(t.tokens);
      }
    }
    return r.length === 0 && (r = [{
      type: "paragraph",
      content: []
    }]), {
      type: "listItem",
      content: r
    };
  },
  renderMarkdown: (t, e, n) => z(t, e, (s) => {
    if (s.parentType === "bulletList") return "- ";
    if (s.parentType === "orderedList") {
      var r, i;
      const a = ((r = s.meta) === null || r === void 0 || (r = r.parentAttrs) === null || r === void 0 ? void 0 : r.start) || 1;
      return kt((i = s.meta) === null || i === void 0 || (i = i.parentAttrs) === null || i === void 0 ? void 0 : i.type, a - 1 + (s.index || 0), ". ");
    }
    return "- ";
  }, n),
  addExtensions() {
    return [F(this.name, [this.options.bulletListTypeName, this.options.orderedListTypeName])];
  },
  addKeyboardShortcuts() {
    return {
      Enter: () => this.editor.commands.splitListItem(this.name),
      Tab: () => this.editor.commands.sinkListItem(this.name),
      "Shift-Tab": () => this.editor.commands.liftListItem(this.name)
    };
  }
}), R = (t, e) => {
  const { $from: n } = e.selection, s = rt(t, e.schema);
  let r = null, i = n.depth, a = n.pos, o = null;
  for (; i > 0 && o === null; )
    r = n.node(i), r.type === s ? o = i : (i -= 1, a -= 1);
  return o === null ? null : {
    $pos: e.doc.resolve(a),
    depth: o
  };
}, q = (t, e) => {
  const n = R(t, e);
  if (!n) return !1;
  const [, s] = st(e, t, n.$pos.pos + 4);
  return s;
}, gt = (t, e, n) => {
  const { $anchor: s } = t.selection, r = Math.max(0, s.pos - 2), i = t.doc.resolve(r).node();
  return !(!i || !n.includes(i.type.name));
}, H = (t, e, n) => {
  if (t.commands.undoInputRule()) return !0;
  if (t.state.selection.from !== t.state.selection.to) return !1;
  if (!A(t.state, e) && gt(t.state, e, n)) {
    const { $anchor: i } = t.state.selection, a = t.state.doc.resolve(i.before() - 1), o = [];
    a.node().descendants((d, c) => {
      d.type.name === e && o.push({
        node: d,
        pos: c
      });
    });
    const u = o.at(-1);
    if (!u) return !1;
    const h = t.state.doc.resolve(a.start() + u.pos + 1);
    return t.chain().cut({
      from: i.start() - 1,
      to: i.end() + 1
    }, h.end()).joinForward().run();
  }
  if (!A(t.state, e) || !et(t.state)) return !1;
  const { $from: s } = t.state.selection, r = s.depth - 1;
  return s.node(r).type !== t.schema.nodes[e] || s.index(r) !== 0 ? !1 : t.chain().liftListItem(e).run();
}, Tt = (t, e) => {
  const n = q(t, e), s = R(t, e);
  return !s || !n ? !1 : n > s.depth;
}, It = (t, e) => {
  const n = q(t, e), s = R(t, e);
  return !s || !n ? !1 : n < s.depth;
}, B = (t, e) => {
  if (!A(t.state, e) || !nt(t.state, e)) return !1;
  const { selection: n } = t.state, { $from: s, $to: r } = n;
  return !n.empty && s.sameParent(r) ? !1 : Tt(e, t.state) ? t.chain().focus(t.state.selection.from + 4).lift(e).joinBackward().run() : It(e, t.state) ? t.chain().joinForward().joinBackward().run() : t.commands.joinItemForward();
}, vt = (t, e, n) => {
  const { state: s } = t, { selection: r } = s;
  if (!r.empty) return !1;
  const { $from: i } = r;
  if (i.parentOffset !== 0 || !i.parent.isTextblock || A(s, e)) return !1;
  const a = Q(i);
  if (!a || !n.includes(a.type.name)) return !1;
  const o = a.lastChild;
  if (!o || o.type.name !== e) return !1;
  const u = i.parent;
  if (!o.canReplace(o.childCount, o.childCount, x.from(u))) return !1;
  const h = i.before(), d = i.after(), c = h - 2;
  return t.commands.command(({ tr: l, dispatch: p }) => (p && (l.delete(h, d).insert(c, x.from(u)), l.setSelection(tt.create(l.doc, c + 1)), l.scrollIntoView()), !0));
}, At = E.create({
  name: "listKeymap",
  addOptions() {
    return { listTypes: [{
      itemName: "listItem",
      wrapperNames: ["bulletList", "orderedList"]
    }, {
      itemName: "taskItem",
      wrapperNames: ["taskList"]
    }] };
  },
  addKeyboardShortcuts() {
    return {
      Delete: ({ editor: t }) => {
        let e = !1;
        return this.options.listTypes.forEach(({ itemName: n }) => {
          t.state.schema.nodes[n] !== void 0 && B(t, n) && (e = !0);
        }), e;
      },
      "Mod-Delete": ({ editor: t }) => {
        let e = !1;
        return this.options.listTypes.forEach(({ itemName: n }) => {
          t.state.schema.nodes[n] !== void 0 && B(t, n) && (e = !0);
        }), e;
      },
      Backspace: ({ editor: t }) => {
        let e = !1;
        return this.options.listTypes.forEach(({ itemName: n, wrapperNames: s }) => {
          t.state.schema.nodes[n] !== void 0 && H(t, n, s) && (e = !0);
        }), e;
      },
      "Mod-Backspace": ({ editor: t }) => {
        let e = !1;
        return this.options.listTypes.forEach(({ itemName: n, wrapperNames: s }) => {
          t.state.schema.nodes[n] !== void 0 && H(t, n, s) && (e = !0);
        }), e;
      },
      Tab: ({ editor: t }) => {
        for (const { itemName: e, wrapperNames: n } of this.options.listTypes)
          if (t.state.schema.nodes[e] !== void 0 && vt(t, e, n))
            return !0;
        return !1;
      }
    };
  }
}), N = new RegExp(`^(\\s*)(${V})([.)])\\s+(.*)$`), wt = /^\s/, b = {
  heading: /^#{1,6}(?:\s|$)/,
  bulletItem: /^[-+*]\s+/,
  codeFence: /^(?:```|~~~)/,
  blockMath: /^\$\$/,
  thematicBreak: /^(?:(?:-[ \t]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})$/
};
function Mt(t) {
  return N.test(t.trimStart());
}
function Ct(t) {
  const e = t.trimStart();
  return b.bulletItem.test(e) || Mt(e) || b.heading.test(e) || b.thematicBreak.test(e) && !e.startsWith("-") || /^>\s?/.test(e) || b.codeFence.test(e) || b.blockMath.test(e);
}
function xt(t) {
  return Object.values(b).some((e) => e.test(t));
}
function Nt(t) {
  const e = [], n = [];
  let s = !1;
  return t.forEach((r) => {
    if (s) {
      n.push(r);
      return;
    }
    if (r.trim() === "") {
      s = !0, n.push(r);
      return;
    }
    if (e.length > 0 && Ct(r)) {
      s = !0, n.push(r);
      return;
    }
    e.push(r);
  }), {
    paragraphLines: e,
    blockLines: n
  };
}
function Et(t) {
  const e = [];
  let n = 0, s = 0;
  for (; n < t.length; ) {
    const r = t[n], i = r.match(N);
    if (!i) break;
    const [, a, o, u, h] = i, d = a.length, c = parseInt(o, 10), l = isNaN(c) ? C(o) : void 0, p = isNaN(c) ? S(o) : c, f = [h];
    let m = n + 1;
    const k = [r];
    let y = !1;
    for (; m < t.length; ) {
      const L = t[m];
      if (L.match(N)) break;
      if (L.trim() === "")
        k.push(L), f.push(""), y = !0, m += 1;
      else if (L.match(wt)) {
        const G = L.length - L.trimStart().length, Z = d + o.length + 1;
        k.push(L), f.push(L.slice(Math.min(G, Z))), m += 1;
      } else {
        if (y || xt(L)) break;
        k.push(L), f.push(L), m += 1;
      }
    }
    e.push({
      indent: d,
      number: p,
      type: l,
      content: f.join(`
`).trim(),
      contentLines: f,
      raw: k.join(`
`)
    }), s = m, n = m;
  }
  return [e, s];
}
const $t = new RegExp(`^(${V})([.)])\\s+(.+)$`);
function St(t) {
  const e = t.split(`
`).filter((s) => s.trim().length > 0);
  if (e.length === 0) return null;
  const n = [];
  for (const s of e) {
    const r = s.trim().match($t);
    if (!r) return null;
    n.push({
      marker: r[1],
      content: r[3]
    });
  }
  return ht(n.map((s) => s.marker)) ? {
    type: "orderedList",
    attrs: mt(n[0].marker),
    content: n.map((s) => ({
      type: "listItem",
      content: [{
        type: "paragraph",
        content: [{
          type: "text",
          text: s.content
        }]
      }]
    }))
  } : null;
}
function W(t, e, n) {
  const s = [];
  let r = 0;
  for (; r < t.length; ) {
    const i = t[r];
    if (i.indent === e) {
      const { paragraphLines: a, blockLines: o } = Nt(i.contentLines), u = a.join(`
`).trim(), h = [];
      u && h.push({
        type: "paragraph",
        raw: u,
        tokens: n.inlineTokens(u)
      });
      const d = o.join(`
`).trim();
      if (d) {
        const p = n.blockTokens(d);
        h.push(...p);
      }
      let c = r + 1;
      const l = [];
      for (; c < t.length && t[c].indent > e; )
        l.push(t[c]), c += 1;
      if (l.length > 0) {
        const p = W(l, Math.min(...l.map((f) => f.indent)), n);
        h.push({
          type: "list",
          ordered: !0,
          start: l[0].number,
          typeMarker: l[0].type,
          items: p,
          raw: l.map((f) => f.raw).join(`
`)
        });
      }
      s.push({
        type: "list_item",
        raw: i.raw,
        tokens: h
      }), r = c;
    } else r += 1;
  }
  return s;
}
function Rt(t, e) {
  return t.map((n) => {
    if (n.type !== "list_item") return e.parseChildren([n])[0];
    const s = [];
    return n.tokens && n.tokens.length > 0 && n.tokens.forEach((r) => {
      if (r.type === "paragraph" || r.type === "list" || r.type === "blockquote" || r.type === "code") s.push(...e.parseChildren([r]));
      else if (r.type === "text" && r.tokens) {
        const i = e.parseChildren([r]);
        s.push({
          type: "paragraph",
          content: i
        });
      } else {
        const i = e.parseChildren([r]);
        i.length > 0 && s.push(...i);
      }
    }), {
      type: "listItem",
      content: s
    };
  });
}
const Ot = "listItem", _ = "textStyle", j = /^(\d+)\.\s$/;
function K(t) {
  const e = t.match(/list-style-type\s*:\s*([^;]+)/i);
  if (!e) return null;
  switch (e[1].trim().toLowerCase()) {
    case "upper-roman":
      return "I";
    case "lower-roman":
      return "i";
    case "upper-alpha":
    case "upper-latin":
      return "A";
    case "lower-alpha":
    case "lower-latin":
      return "a";
    default:
      return null;
  }
}
const Dt = T.create({
  name: "orderedList",
  addOptions() {
    return {
      itemTypeName: "listItem",
      HTMLAttributes: {},
      keepMarks: !1,
      keepAttributes: !1
    };
  },
  group: "block list",
  content() {
    return `${this.options.itemTypeName}+`;
  },
  addAttributes() {
    return {
      start: {
        default: 1,
        parseHTML: (t) => t.hasAttribute("start") ? parseInt(t.getAttribute("start") || "", 10) : 1
      },
      type: {
        default: null,
        parseHTML: (t) => {
          const e = t.getAttribute("type");
          if (e) return e;
          const n = t.getAttribute("style");
          if (n) {
            const r = K(n);
            if (r) return r;
          }
          const s = t.querySelector("li");
          if (s) {
            const r = s.getAttribute("style");
            if (r) {
              const i = K(r);
              if (i) return i;
            }
          }
          return null;
        }
      }
    };
  },
  parseHTML() {
    return [{ tag: "ol" }];
  },
  renderHTML({ HTMLAttributes: t }) {
    const { start: e, type: n, ...s } = t, r = I(this.options.HTMLAttributes, s);
    return e !== 1 && (r.start = e), n && n !== "1" && (r.type = n), [
      "ol",
      r,
      0
    ];
  },
  markdownTokenName: "list",
  parseMarkdown: (t, e) => {
    if (t.type !== "list" || !t.ordered) return [];
    const n = t.start || 1, s = t.typeMarker, r = t.items ? Rt(t.items, e) : [], i = {};
    return n !== 1 && (i.start = n), s && (i.type = s), Object.keys(i).length > 0 ? {
      type: "orderedList",
      attrs: i,
      content: r
    } : {
      type: "orderedList",
      content: r
    };
  },
  renderMarkdown: (t, e) => t.content ? e.renderChildren(t.content, `
`) : "",
  markdownTokenizer: {
    name: "orderedList",
    level: "block",
    start: () => -1,
    tokenize: (t, e, n) => {
      var s, r;
      const i = t.split(`
`), [a, o] = Et(i);
      if (a.length === 0) return;
      const u = W(a, a[0].indent, n);
      if (u.length !== 0)
        return {
          type: "list",
          ordered: !0,
          start: ((s = a[0]) === null || s === void 0 ? void 0 : s.number) || 1,
          typeMarker: (r = a[0]) === null || r === void 0 ? void 0 : r.type,
          items: u,
          raw: i.slice(0, o).join(`
`)
        };
    }
  },
  markdownOptions: { indentsContent: !0 },
  addCommands() {
    return { toggleOrderedList: () => ({ commands: t, chain: e }) => this.options.keepAttributes ? e().toggleList(this.name, this.options.itemTypeName, this.options.keepMarks).updateAttributes(Ot, this.editor.getAttributes(_)).run() : t.toggleList(this.name, this.options.itemTypeName, this.options.keepMarks) };
  },
  addKeyboardShortcuts() {
    return { "Mod-Shift-7": () => this.editor.commands.toggleOrderedList() };
  },
  addProseMirrorPlugins() {
    return [new Y({ props: { handlePaste: (t, e) => {
      var n, s;
      const r = (n = e.clipboardData) === null || n === void 0 ? void 0 : n.getData("text/html");
      if (r?.trim()) return !1;
      const i = (s = e.clipboardData) === null || s === void 0 ? void 0 : s.getData("text/plain");
      if (!i) return !1;
      const a = St(i);
      if (!a) return !1;
      try {
        const o = t.state.schema.nodeFromJSON(a), u = t.state.tr.replaceSelectionWith(o);
        return t.dispatch(u), !0;
      } catch {
        return !1;
      }
    } } })];
  },
  addInputRules() {
    const t = (n, s) => (!s.attrs.type || s.attrs.type === "1") && s.childCount + s.attrs.start === +n[1];
    let e = g({
      find: j,
      type: this.type,
      getAttributes: (n) => ({ start: +n[1] }),
      joinPredicate: t
    });
    return (this.options.keepMarks || this.options.keepAttributes) && (e = g({
      find: j,
      type: this.type,
      keepMarks: this.options.keepMarks,
      keepAttributes: this.options.keepAttributes,
      getAttributes: (n) => ({
        start: +n[1],
        ...this.editor.getAttributes(_)
      }),
      joinPredicate: t,
      editor: this.editor
    })), [e];
  }
}), Pt = /^\s*(\[([( |x])?\])\s$/, Ht = "position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0", Bt = (t, e, n) => {
  var s;
  return (n == null || (s = n.checkboxLabel) === null || s === void 0 ? void 0 : s.call(n, t, e)) || `Task item checkbox for ${t.textContent || "empty task item"}`;
}, _t = T.create({
  name: "taskItem",
  addOptions() {
    return {
      nested: !1,
      HTMLAttributes: {},
      taskListTypeName: "taskList",
      a11y: void 0
    };
  },
  content() {
    return this.options.nested ? "paragraph block*" : "paragraph+";
  },
  defining: !0,
  addAttributes() {
    return { checked: {
      default: !1,
      keepOnSplit: !1,
      parseHTML: (t) => {
        const e = t.getAttribute("data-checked");
        return e === "" || e === "true";
      },
      renderHTML: (t) => ({ "data-checked": t.checked })
    } };
  },
  parseHTML() {
    return [{
      tag: `li[data-type="${this.name}"]`,
      priority: 51,
      contentElement: (t) => {
        var e;
        return (e = t.querySelector("div")) !== null && e !== void 0 ? e : t;
      }
    }];
  },
  renderHTML({ node: t, HTMLAttributes: e }) {
    return [
      "li",
      I(this.options.HTMLAttributes, e, { "data-type": this.name }),
      [
        "label",
        ["input", {
          type: "checkbox",
          checked: t.attrs.checked ? "checked" : null
        }],
        ["span"]
      ],
      ["div", 0]
    ];
  },
  parseMarkdown: (t, e) => {
    const n = [];
    if (t.tokens && t.tokens.length > 0 ? n.push(e.createNode("paragraph", {}, e.parseInline(t.tokens))) : t.text ? n.push(e.createNode("paragraph", {}, [e.createNode("text", { text: t.text })])) : n.push(e.createNode("paragraph", {}, [])), t.nestedTokens && t.nestedTokens.length > 0) {
      const s = e.parseChildren(t.nestedTokens);
      n.push(...s);
    }
    return e.createNode("taskItem", { checked: t.checked || !1 }, n);
  },
  renderMarkdown: (t, e) => {
    var n;
    return z(t, e, `- [${!((n = t.attrs) === null || n === void 0) && n.checked ? "x" : " "}] `);
  },
  addExtensions() {
    return this.options.nested ? [F(this.name, [this.options.taskListTypeName])] : [];
  },
  addKeyboardShortcuts() {
    const t = {
      Enter: () => this.editor.commands.splitListItem(this.name),
      "Shift-Tab": () => this.editor.commands.liftListItem(this.name)
    };
    return this.options.nested ? {
      ...t,
      Tab: () => this.editor.commands.sinkListItem(this.name)
    } : t;
  },
  addNodeView() {
    return ({ node: t, HTMLAttributes: e, getPos: n, editor: s }) => {
      const r = document.createElement("li"), i = document.createElement("label"), a = document.createElement("span"), o = document.createElement("input"), u = document.createElement("div");
      a.style.cssText = Ht;
      const h = (c) => {
        const l = Bt(c, c.attrs.checked, this.options.a11y);
        o.setAttribute("aria-label", l), a.textContent = l;
      };
      h(t), i.contentEditable = "false", o.type = "checkbox", o.addEventListener("mousedown", (c) => c.preventDefault()), o.addEventListener("change", (c) => {
        if (!s.isEditable && !this.options.onReadOnlyChecked) {
          o.checked = !o.checked;
          return;
        }
        const { checked: l } = c.target;
        s.isEditable && typeof n == "function" && s.chain().focus(void 0, { scrollIntoView: !1 }).command(({ tr: p }) => {
          const f = n();
          if (typeof f != "number") return !1;
          const m = p.doc.nodeAt(f);
          return p.setNodeMarkup(f, void 0, {
            ...m?.attrs,
            checked: l
          }), !0;
        }).run(), !s.isEditable && this.options.onReadOnlyChecked && (this.options.onReadOnlyChecked(t, l) || (o.checked = !o.checked));
      }), Object.entries(this.options.HTMLAttributes).forEach(([c, l]) => {
        r.setAttribute(c, l);
      }), r.dataset.checked = t.attrs.checked, o.checked = t.attrs.checked, i.append(o, a), r.append(i, u), Object.entries(e).forEach(([c, l]) => {
        r.setAttribute(c, l);
      });
      let d = new Set(Object.keys(e));
      return {
        dom: r,
        contentDOM: u,
        update: (c) => {
          if (c.type !== this.type) return !1;
          r.dataset.checked = c.attrs.checked, o.checked = c.attrs.checked, h(c);
          const l = s.extensionManager.attributes, p = J(c, l), f = new Set(Object.keys(p)), m = this.options.HTMLAttributes;
          return d.forEach((k) => {
            f.has(k) || (k in m ? r.setAttribute(k, m[k]) : r.removeAttribute(k));
          }), Object.entries(p).forEach(([k, y]) => {
            y == null ? k in m ? r.setAttribute(k, m[k]) : r.removeAttribute(k) : r.setAttribute(k, y);
          }), d = f, !0;
        }
      };
    };
  },
  addInputRules() {
    return [g({
      find: Pt,
      type: this.type,
      getAttributes: (t) => ({ checked: t[t.length - 1] === "x" })
    })];
  }
}), jt = T.create({
  name: "taskList",
  addOptions() {
    return {
      itemTypeName: "taskItem",
      HTMLAttributes: {}
    };
  },
  group: "block list",
  content() {
    return `${this.options.itemTypeName}+`;
  },
  parseHTML() {
    return [{
      tag: `ul[data-type="${this.name}"]`,
      priority: 51
    }];
  },
  renderHTML({ HTMLAttributes: t }) {
    return [
      "ul",
      I(this.options.HTMLAttributes, t, { "data-type": this.name }),
      0
    ];
  },
  parseMarkdown: (t, e) => e.createNode("taskList", {}, e.parseChildren(t.items || [])),
  renderMarkdown: (t, e) => t.content ? e.renderChildren(t.content, `
`) : "",
  markdownTokenizer: {
    name: "taskList",
    level: "block",
    start(t) {
      var e;
      const n = (e = t.match(/^\s*[-+*]\s+\[([ xX])\]\s+/)) === null || e === void 0 ? void 0 : e.index;
      return n !== void 0 ? n : -1;
    },
    tokenize(t, e, n) {
      const s = (i) => {
        const a = O(i, {
          itemPattern: /^(\s*)([-+*])\s+\[([ xX])\]\s+(.*)$/,
          extractItemData: (o) => ({
            indentLevel: o[1].length,
            mainContent: o[4],
            checked: o[3].toLowerCase() === "x"
          }),
          createToken: (o, u) => ({
            type: "taskItem",
            raw: "",
            mainContent: o.mainContent,
            indentLevel: o.indentLevel,
            checked: o.checked,
            text: o.mainContent,
            tokens: n.inlineTokens(o.mainContent),
            nestedTokens: u
          }),
          customNestedParser: s
        }, n);
        if (a) {
          const o = {
            type: "taskList",
            raw: a.raw,
            items: a.items
          }, u = i.slice(a.raw.length);
          return u.trim() ? [o, ...n.blockTokens(u)] : [o];
        }
        return n.blockTokens(i);
      }, r = O(t, {
        itemPattern: /^(\s*)([-+*])\s+\[([ xX])\]\s+(.*)$/,
        extractItemData: (i) => ({
          indentLevel: i[1].length,
          mainContent: i[4],
          checked: i[3].toLowerCase() === "x"
        }),
        createToken: (i, a) => ({
          type: "taskItem",
          raw: "",
          mainContent: i.mainContent,
          indentLevel: i.indentLevel,
          checked: i.checked,
          text: i.mainContent,
          tokens: n.inlineTokens(i.mainContent),
          nestedTokens: a
        }),
        customNestedParser: s
      }, n);
      if (r)
        return {
          type: "taskList",
          raw: r.raw,
          items: r.items
        };
    }
  },
  markdownOptions: { indentsContent: !0 },
  addCommands() {
    return { toggleTaskList: () => ({ commands: t }) => t.toggleList(this.name, this.options.itemTypeName) };
  },
  addKeyboardShortcuts() {
    return { "Mod-Shift-9": () => this.editor.commands.toggleTaskList() };
  }
});
E.create({
  name: "listKit",
  addExtensions() {
    const t = [];
    return this.options.bulletList !== !1 && t.push(ot.configure(this.options.bulletList)), this.options.listItem !== !1 && t.push(bt.configure(this.options.listItem)), this.options.listKeymap !== !1 && t.push(At.configure(this.options.listKeymap)), this.options.orderedList !== !1 && t.push(Dt.configure(this.options.orderedList)), this.options.taskItem !== !1 && t.push(_t.configure(this.options.taskItem)), this.options.taskList !== !1 && t.push(jt.configure(this.options.taskList)), t;
  }
});
export {
  ot as B,
  bt as L,
  Dt as O,
  jt as T,
  At as a,
  _t as b
};
