import { N as S, w as Ce, m as v, S as Q, T, M as _, a as R, b as O, P as k, c as I, t as Y, d as D, n as be, e as xe, i as ae, f as ee, g as Te, F as ne, k as Ae, D as A, h as K, j as Se, E as C, l as Ie, o as Ee, p as le, q as Pe } from "./index-pa5U7i3D.js";
import { Link as Le } from "./index-Vi6toNLn.js";
import { B as Re, L as Oe, a as He, O as Ne } from "./index-CFNjyuuH.js";
const de = /* @__PURE__ */ new WeakSet(), ue = /* @__PURE__ */ new WeakSet();
function P(e) {
  const t = e;
  return de.add(t), t;
}
function J(e) {
  return Array.isArray(e) && de.has(e);
}
function ce(e) {
  return e.flatMap((t) => t == null ? [] : Array.isArray(t) && ue.has(t) && !J(t) ? ce(t) : [t]);
}
function Be(e, t) {
  if (e === "slot") return 0;
  if (e instanceof Function) {
    const s = e(t);
    return Array.isArray(s) && !J(s) && !ue.has(s) ? P(s) : s;
  }
  const { children: n, ...r } = t ?? {};
  if (e === "svg") throw new Error("SVG elements are not supported in the JSX syntax, use the array syntax instead");
  if (Array.isArray(n)) {
    if (J(n)) return P([
      e,
      r,
      n
    ]);
    if (n.length === 0) return P([e, r]);
    const s = ce(n);
    return s.length === 0 ? P([e, r]) : P([
      e,
      r,
      ...s
    ]);
  }
  return n != null ? P([
    e,
    r,
    n
  ]) : P([e, r]);
}
const F = (e, t) => Be(e, t), De = (e, t) => {
  var n;
  const { state: r } = e, { selection: s } = r;
  if (!s.empty) return !1;
  const { $from: o } = s;
  if (o.parentOffset !== 0) return !1;
  const i = o.depth - 1;
  if (i < 0) return !1;
  const a = o.node(i), l = o.index(i);
  if (l === 0) return !1;
  if (a.type === t) return e.commands.lift(t.name);
  const d = a.child(l - 1);
  if (d.type !== t || !(!((n = d.lastChild) === null || n === void 0) && n.isTextblock)) return !1;
  const c = o.before() - 1 - 1;
  return e.commands.command(({ tr: u, dispatch: p }) => {
    if (!p) return !0;
    const f = o.parent.content, m = new Q(f, 0, 0);
    return u.replace(c, o.after(), m), u.setSelection(T.create(u.doc, c + f.size)), u.scrollIntoView(), p(u), !0;
  });
}, _e = /^\s*>\s$/, ze = S.create({
  name: "blockquote",
  addOptions() {
    return { HTMLAttributes: {} };
  },
  content: "block+",
  group: "block",
  defining: !0,
  parseHTML() {
    return [{ tag: "blockquote" }];
  },
  renderHTML({ HTMLAttributes: e }) {
    return /* @__PURE__ */ F("blockquote", {
      ...v(this.options.HTMLAttributes, e),
      children: /* @__PURE__ */ F("slot", {})
    });
  },
  parseMarkdown: (e, t) => {
    var n;
    const r = (n = t.parseBlockChildren) !== null && n !== void 0 ? n : t.parseChildren;
    return t.createNode("blockquote", void 0, r(e.tokens || []));
  },
  renderMarkdown: (e, t) => {
    if (!e.content) return "";
    const n = ">", r = [];
    return e.content.forEach((s, o) => {
      var i, a;
      const l = ((i = (a = t.renderChild) === null || a === void 0 ? void 0 : a.call(t, s, o)) !== null && i !== void 0 ? i : t.renderChildren([s])).split(`
`).map((d) => d.trim() === "" ? n : `${n} ${d}`);
      r.push(l.join(`
`));
    }), r.join(`
${n}
`);
  },
  addCommands() {
    return {
      setBlockquote: () => ({ commands: e }) => e.wrapIn(this.name),
      toggleBlockquote: () => ({ commands: e }) => e.toggleWrap(this.name),
      unsetBlockquote: () => ({ commands: e }) => e.lift(this.name)
    };
  },
  addKeyboardShortcuts() {
    return {
      "Mod-Shift-b": () => this.editor.commands.toggleBlockquote(),
      Backspace: () => De(this.editor, this.type)
    };
  },
  addInputRules() {
    return [Ce({
      find: _e,
      type: this.type
    })];
  }
}), $e = /(?:^|\s)(\*\*(?!\s+\*\*)((?:[^*]+))\*\*(?!\s+\*\*))$/, We = /(?:^|\s)(\*\*(?!\s+\*\*)((?:[^*]+))\*\*(?!\s+\*\*))/g, Fe = /(?:^|\s)(__(?!\s+__)((?:[^_]+))__(?!\s+__))$/, Ve = /(?:^|\s)(__(?!\s+__)((?:[^_]+))__(?!\s+__))/g, Ke = _.create({
  name: "bold",
  addOptions() {
    return { HTMLAttributes: {} };
  },
  parseHTML() {
    return [
      { tag: "strong" },
      {
        tag: "b",
        getAttrs: (e) => e.style.fontWeight !== "normal" && null
      },
      {
        style: "font-weight=400",
        clearMark: (e) => e.type.name === this.name
      },
      {
        style: "font-weight",
        getAttrs: (e) => /^(bold(er)?|[5-9]\d{2,})$/.test(e) && null
      }
    ];
  },
  renderHTML({ HTMLAttributes: e }) {
    return /* @__PURE__ */ F("strong", {
      ...v(this.options.HTMLAttributes, e),
      children: /* @__PURE__ */ F("slot", {})
    });
  },
  markdownTokenName: "strong",
  parseMarkdown: (e, t) => t.applyMark("bold", t.parseInline(e.tokens || [])),
  markdownOptions: { htmlReopen: {
    open: "<strong>",
    close: "</strong>"
  } },
  renderMarkdown: (e, t) => `**${t.renderChildren(e)}**`,
  addCommands() {
    return {
      setBold: () => ({ commands: e }) => e.setMark(this.name),
      toggleBold: () => ({ commands: e }) => e.toggleMark(this.name),
      unsetBold: () => ({ commands: e }) => e.unsetMark(this.name)
    };
  },
  addKeyboardShortcuts() {
    return {
      "Mod-b": () => this.editor.commands.toggleBold(),
      "Mod-B": () => this.editor.commands.toggleBold()
    };
  },
  addInputRules() {
    return [O({
      find: $e,
      type: this.type
    }), O({
      find: Fe,
      type: this.type
    })];
  },
  addPasteRules() {
    return [R({
      find: We,
      type: this.type
    }), R({
      find: Ve,
      type: this.type
    })];
  }
}), Ue = (e) => {
  const t = /`([^`]+)`(?!`)$/.exec(e);
  return !t || t.index > 0 && e[t.index - 1] === "`" ? null : {
    index: t.index,
    text: t[0],
    replaceWith: t[1]
  };
}, je = (e) => {
  const t = /`([^`]+)`(?!`)/g, n = [];
  let r;
  for (; (r = t.exec(e)) !== null; )
    r.index > 0 && e[r.index - 1] === "`" || n.push({
      index: r.index,
      text: r[0],
      replaceWith: r[1]
    });
  return n;
}, Ge = _.create({
  name: "code",
  addOptions() {
    return { HTMLAttributes: {} };
  },
  excludes: "_",
  code: !0,
  exitable: !0,
  parseHTML() {
    return [{ tag: "code" }];
  },
  renderHTML({ HTMLAttributes: e }) {
    return [
      "code",
      v(this.options.HTMLAttributes, e),
      0
    ];
  },
  markdownTokenName: "codespan",
  parseMarkdown: (e, t) => t.applyMark("code", [{
    type: "text",
    text: e.text || ""
  }]),
  renderMarkdown: (e, t) => e.content ? `\`${t.renderChildren(e.content)}\`` : "",
  addCommands() {
    return {
      setCode: () => ({ commands: e }) => e.setMark(this.name),
      toggleCode: () => ({ commands: e }) => e.toggleMark(this.name),
      unsetCode: () => ({ commands: e }) => e.unsetMark(this.name)
    };
  },
  addKeyboardShortcuts() {
    return { "Mod-e": () => this.editor.commands.toggleCode() };
  },
  addInputRules() {
    return [O({
      find: Ue,
      type: this.type
    })];
  },
  addPasteRules() {
    return [R({
      find: je,
      type: this.type
    })];
  }
}), j = 4, qe = /^```([a-z]+)?[\s\n]$/, Xe = /^~~~([a-z]+)?[\s\n]$/, Ye = S.create({
  name: "codeBlock",
  addOptions() {
    return {
      languageClassPrefix: "language-",
      exitOnTripleEnter: !0,
      exitOnArrowDown: !0,
      exitOnArrowUp: !0,
      defaultLanguage: null,
      enableTabIndentation: !1,
      tabSize: j,
      HTMLAttributes: {}
    };
  },
  content: "text*",
  marks: "",
  group: "block",
  code: !0,
  defining: !0,
  addAttributes() {
    return { language: {
      default: this.options.defaultLanguage,
      parseHTML: (e) => {
        var t;
        const { languageClassPrefix: n } = this.options;
        if (!n) return null;
        const r = [...((t = e.firstElementChild) === null || t === void 0 ? void 0 : t.classList) || []].filter((s) => s.startsWith(n)).map((s) => s.replace(n, ""))[0];
        return r || null;
      },
      rendered: !1
    } };
  },
  parseHTML() {
    return [{
      tag: "pre",
      preserveWhitespace: "full"
    }];
  },
  renderHTML({ node: e, HTMLAttributes: t }) {
    return [
      "pre",
      v(this.options.HTMLAttributes, t),
      [
        "code",
        { class: e.attrs.language ? this.options.languageClassPrefix + e.attrs.language : null },
        0
      ]
    ];
  },
  markdownTokenName: "code",
  parseMarkdown: (e, t) => {
    var n, r;
    return ((n = e.raw) === null || n === void 0 ? void 0 : n.startsWith("```")) === !1 && ((r = e.raw) === null || r === void 0 ? void 0 : r.startsWith("~~~")) === !1 && e.codeBlockStyle !== "indented" ? [] : t.createNode("codeBlock", { language: e.lang || null }, e.text ? [t.createTextNode(e.text)] : []);
  },
  renderMarkdown: (e, t) => {
    var n;
    let r = "";
    const s = ((n = e.attrs) === null || n === void 0 ? void 0 : n.language) || "";
    return e.content ? r = [
      `\`\`\`${s}`,
      t.renderChildren(e.content),
      "```"
    ].join(`
`) : r = `\`\`\`${s}

\`\`\``, r;
  },
  addCommands() {
    return {
      setCodeBlock: (e) => ({ commands: t }) => t.setNode(this.name, e),
      toggleCodeBlock: (e) => ({ commands: t }) => t.toggleNode(this.name, "paragraph", e)
    };
  },
  addKeyboardShortcuts() {
    return {
      "Mod-Alt-c": () => this.editor.commands.toggleCodeBlock(),
      Backspace: () => {
        const { empty: e, $anchor: t } = this.editor.state.selection, n = t.pos === 1;
        return !e || t.parent.type.name !== this.name ? !1 : n || !t.parent.textContent.length ? this.editor.commands.clearNodes() : !1;
      },
      Tab: ({ editor: e }) => {
        var t;
        if (!this.options.enableTabIndentation) return !1;
        const n = (t = this.options.tabSize) !== null && t !== void 0 ? t : j, { state: r } = e, { selection: s } = r, { $from: o, empty: i } = s;
        if (o.parent.type !== this.type) return !1;
        const a = " ".repeat(n);
        return i ? e.commands.insertContent(a) : e.commands.command(({ tr: l }) => {
          const { from: d, to: c } = s, u = r.doc.textBetween(d, c, `
`, `
`).split(`
`).map((p) => a + p).join(`
`);
          return l.replaceWith(d, c, r.schema.text(u)), !0;
        });
      },
      "Shift-Tab": ({ editor: e }) => {
        var t;
        if (!this.options.enableTabIndentation) return !1;
        const n = (t = this.options.tabSize) !== null && t !== void 0 ? t : j, { state: r } = e, { selection: s } = r, { $from: o, empty: i } = s;
        return o.parent.type !== this.type ? !1 : i ? e.commands.command(({ tr: a }) => {
          var l;
          const { pos: d } = o, c = o.start(), u = o.end(), p = r.doc.textBetween(c, u, `
`, `
`).split(`
`);
          let f = 0, m = 0;
          const b = d - c;
          for (let w = 0; w < p.length; w += 1) {
            if (m + p[w].length >= b) {
              f = w;
              break;
            }
            m += p[w].length + 1;
          }
          const E = ((l = p[f].match(/^ */)) === null || l === void 0 ? void 0 : l[0]) || "", U = Math.min(E.length, n);
          if (U === 0) return !0;
          let H = c;
          for (let w = 0; w < f; w += 1) H += p[w].length + 1;
          return a.delete(H, H + U), d - H <= U && a.setSelection(T.create(a.doc, H)), !0;
        }) : e.commands.command(({ tr: a }) => {
          const { from: l, to: d } = s, c = r.doc.textBetween(l, d, `
`, `
`).split(`
`).map((u) => {
            var p;
            const f = ((p = u.match(/^ */)) === null || p === void 0 ? void 0 : p[0]) || "", m = Math.min(f.length, n);
            return u.slice(m);
          }).join(`
`);
          return a.replaceWith(l, d, r.schema.text(c)), !0;
        });
      },
      Enter: ({ editor: e }) => {
        if (!this.options.exitOnTripleEnter) return !1;
        const { state: t } = e, { selection: n } = t, { $from: r, empty: s } = n;
        if (!s || r.parent.type !== this.type) return !1;
        const o = r.parentOffset === r.parent.nodeSize - 2, i = r.parent.textContent.endsWith(`

`);
        return !o || !i ? !1 : e.chain().command(({ tr: a }) => (a.delete(r.pos - 2, r.pos), !0)).exitCode().run();
      },
      ArrowUp: ({ editor: e }) => {
        if (!this.options.exitOnArrowUp) return !1;
        const { state: t } = e, { selection: n } = t, { $from: r, empty: s } = n;
        if (!s || r.parent.type !== this.type || r.parentOffset !== 0) return !1;
        const o = r.before();
        return o > 0 ? !1 : e.commands.insertDefaultBlock({ pos: o });
      },
      ArrowDown: ({ editor: e }) => {
        if (!this.options.exitOnArrowDown) return !1;
        const { state: t } = e, { selection: n, doc: r } = t, { $from: s, empty: o } = n;
        if (!o || s.parent.type !== this.type || s.parentOffset !== s.parent.nodeSize - 2) return !1;
        const i = s.after();
        return i === void 0 ? !1 : r.nodeAt(i) ? e.commands.command(({ tr: a }) => (a.setSelection(D.near(r.resolve(i))), !0)) : e.commands.exitCode();
      }
    };
  },
  addInputRules() {
    return [Y({
      find: qe,
      type: this.type,
      getAttributes: (e) => ({ language: e[1] })
    }), Y({
      find: Xe,
      type: this.type,
      getAttributes: (e) => ({ language: e[1] })
    })];
  },
  addProseMirrorPlugins() {
    return [new k({
      key: new I("codeBlockVSCodeHandler"),
      props: { handlePaste: (e, t) => {
        if (!t.clipboardData || this.editor.isActive(this.type.name)) return !1;
        const n = t.clipboardData.getData("text/plain"), r = t.clipboardData.getData("vscode-editor-data"), s = r ? JSON.parse(r) : void 0, o = s?.mode;
        if (!n || !o) return !1;
        const { tr: i, schema: a } = e.state, l = a.text(n.replace(/\r\n?/g, `
`));
        return i.replaceSelectionWith(this.type.create({ language: o }, l)), i.selection.$from.parent.type !== this.type && i.setSelection(T.near(i.doc.resolve(Math.max(0, i.selection.from - 2)))), i.setMeta("paste", !0), e.dispatch(i), !0;
      } }
    })];
  }
}), Je = S.create({
  name: "doc",
  topNode: !0,
  content: "block+",
  renderMarkdown: (e, t) => e.content ? t.renderChildren(e.content, `

`) : ""
}), Ze = S.create({
  name: "hardBreak",
  markdownTokenName: "br",
  addOptions() {
    return {
      keepMarks: !0,
      HTMLAttributes: {}
    };
  },
  inline: !0,
  group: "inline",
  selectable: !1,
  linebreakReplacement: !0,
  parseHTML() {
    return [{ tag: "br" }];
  },
  renderHTML({ HTMLAttributes: e }) {
    return ["br", v(this.options.HTMLAttributes, e)];
  },
  renderText() {
    return `
`;
  },
  renderMarkdown: () => `  
`,
  parseMarkdown: () => ({ type: "hardBreak" }),
  addCommands() {
    return { setHardBreak: () => ({ commands: e, chain: t, state: n, editor: r }) => e.first([() => e.exitCode(), () => e.command(() => {
      const { selection: s, storedMarks: o } = n;
      if (s.$from.parent.type.spec.isolating) return !1;
      const { keepMarks: i } = this.options, { splittableMarks: a } = r.extensionManager, l = o || s.$to.parentOffset && s.$from.marks();
      return t().insertContent({ type: this.name }).command(({ tr: d, dispatch: c }) => {
        if (c && l && i) {
          const u = l.filter((p) => a.includes(p.type.name));
          d.ensureMarks(u);
        }
        return !0;
      }).scrollIntoView().run();
    })]) };
  },
  addKeyboardShortcuts() {
    return {
      "Mod-Enter": () => this.editor.commands.setHardBreak(),
      "Shift-Enter": () => this.editor.commands.setHardBreak()
    };
  }
}), Qe = S.create({
  name: "heading",
  addOptions() {
    return {
      levels: [
        1,
        2,
        3,
        4,
        5,
        6
      ],
      HTMLAttributes: {}
    };
  },
  content: "inline*",
  group: "block",
  defining: !0,
  addAttributes() {
    return { level: {
      default: 1,
      rendered: !1
    } };
  },
  parseHTML() {
    return this.options.levels.map((e) => ({
      tag: `h${e}`,
      attrs: { level: e }
    }));
  },
  renderHTML({ node: e, HTMLAttributes: t }) {
    return [
      `h${this.options.levels.includes(e.attrs.level) ? e.attrs.level : this.options.levels[0]}`,
      v(this.options.HTMLAttributes, t),
      0
    ];
  },
  parseMarkdown: (e, t) => t.createNode("heading", { level: e.depth || 1 }, t.parseInline(e.tokens || [])),
  renderMarkdown: (e, t) => {
    var n;
    const r = !((n = e.attrs) === null || n === void 0) && n.level ? parseInt(e.attrs.level, 10) : 1, s = "#".repeat(r);
    return e.content ? `${s} ${t.renderChildren(e.content)}` : "";
  },
  addCommands() {
    return {
      setHeading: (e) => ({ commands: t }) => this.options.levels.includes(e.level) ? t.setNode(this.name, e) : !1,
      toggleHeading: (e) => ({ commands: t }) => this.options.levels.includes(e.level) ? t.toggleNode(this.name, "paragraph", e) : !1
    };
  },
  addKeyboardShortcuts() {
    return this.options.levels.reduce((e, t) => ({
      ...e,
      [`Mod-Alt-${t}`]: () => this.editor.commands.toggleHeading({ level: t })
    }), {});
  },
  addInputRules() {
    return this.options.levels.map((e) => Y({
      find: new RegExp(`^(#{${Math.min(...this.options.levels)},${e}})\\s$`),
      type: this.type,
      getAttributes: { level: e }
    }));
  }
}), et = S.create({
  name: "horizontalRule",
  addOptions() {
    return {
      HTMLAttributes: {},
      nextNodeType: "paragraph"
    };
  },
  group: "block",
  parseHTML() {
    return [{ tag: "hr" }];
  },
  renderHTML({ HTMLAttributes: e }) {
    return ["hr", v(this.options.HTMLAttributes, e)];
  },
  markdownTokenName: "hr",
  parseMarkdown: (e, t) => t.createNode("horizontalRule"),
  renderMarkdown: () => "---",
  addCommands() {
    return { setHorizontalRule: () => ({ chain: e, state: t }) => {
      if (!xe(t, t.schema.nodes[this.name])) return !1;
      const { selection: n } = t, { $to: r } = n, s = e();
      return ae(n) ? s.insertContentAt(r.pos, { type: this.name }) : s.insertContent({ type: this.name }), s.command(({ state: o, tr: i, dispatch: a }) => {
        if (a) {
          const { $to: l } = i.selection, d = l.end();
          if (l.nodeAfter) l.nodeAfter.isTextblock ? i.setSelection(T.create(i.doc, l.pos + 1)) : l.nodeAfter.isBlock ? i.setSelection(ee.create(i.doc, l.pos)) : i.setSelection(T.create(i.doc, l.pos));
          else {
            const c = o.schema.nodes[this.options.nextNodeType] || l.parent.type.contentMatch.defaultType, u = c?.create();
            u && (i.insert(d, u), i.setSelection(T.create(i.doc, d + 1)));
          }
          i.scrollIntoView();
        }
        return !0;
      }).run();
    } };
  },
  addInputRules() {
    return [be({
      find: /^(?:---|—-|___\s|\*\*\*\s)$/,
      type: this.type
    })];
  }
}), tt = /(?:^|\s)(\*(?!\s+\*)((?:[^*]+))\*(?!\s+\*))$/, nt = /(?:^|\s)(\*(?!\s+\*)((?:[^*]+))\*(?!\s+\*))/g, rt = /(?:^|\s)(_(?!\s+_)((?:[^_]+))_(?!\s+_))$/, st = /(?:^|\s)(_(?!\s+_)((?:[^_]+))_(?!\s+_))/g, ot = _.create({
  name: "italic",
  addOptions() {
    return { HTMLAttributes: {} };
  },
  parseHTML() {
    return [
      { tag: "em" },
      {
        tag: "i",
        getAttrs: (e) => e.style.fontStyle !== "normal" && null
      },
      {
        style: "font-style=normal",
        clearMark: (e) => e.type.name === this.name
      },
      { style: "font-style=italic" }
    ];
  },
  renderHTML({ HTMLAttributes: e }) {
    return [
      "em",
      v(this.options.HTMLAttributes, e),
      0
    ];
  },
  addCommands() {
    return {
      setItalic: () => ({ commands: e }) => e.setMark(this.name),
      toggleItalic: () => ({ commands: e }) => e.toggleMark(this.name),
      unsetItalic: () => ({ commands: e }) => e.unsetMark(this.name)
    };
  },
  markdownTokenName: "em",
  parseMarkdown: (e, t) => t.applyMark("italic", t.parseInline(e.tokens || [])),
  markdownOptions: { htmlReopen: {
    open: "<em>",
    close: "</em>"
  } },
  renderMarkdown: (e, t) => `*${t.renderChildren(e)}*`,
  addKeyboardShortcuts() {
    return {
      "Mod-i": () => this.editor.commands.toggleItalic(),
      "Mod-I": () => this.editor.commands.toggleItalic()
    };
  },
  addInputRules() {
    return [O({
      find: tt,
      type: this.type
    }), O({
      find: rt,
      type: this.type
    })];
  },
  addPasteRules() {
    return [R({
      find: nt,
      type: this.type
    }), R({
      find: st,
      type: this.type
    })];
  }
}), z = "&nbsp;", G = " ", it = S.create({
  name: "paragraph",
  priority: 1e3,
  addOptions() {
    return { HTMLAttributes: {} };
  },
  group: "block",
  content: "inline*",
  parseHTML() {
    return [{ tag: "p" }];
  },
  renderHTML({ HTMLAttributes: e }) {
    return [
      "p",
      v(this.options.HTMLAttributes, e),
      0
    ];
  },
  parseMarkdown: (e, t) => {
    const n = e.tokens || [];
    if (n.length === 1 && n[0].type === "image") return t.parseChildren([n[0]]);
    const r = t.parseInline(n);
    return n.length === 1 && n[0].type === "text" && (n[0].raw === z || n[0].text === z || n[0].raw === G || n[0].text === G) && r.length === 1 && r[0].type === "text" && (r[0].text === z || r[0].text === G) ? t.createNode("paragraph", void 0, []) : t.createNode("paragraph", void 0, r);
  },
  renderMarkdown: (e, t, n) => {
    if (!e) return "";
    const r = Array.isArray(e.content) ? e.content : [];
    if (r.length === 0) {
      var s, o;
      const i = Array.isArray(n == null || (s = n.previousNode) === null || s === void 0 ? void 0 : s.content) ? n.previousNode.content : [];
      return (n == null || (o = n.previousNode) === null || o === void 0 ? void 0 : o.type) === "paragraph" && i.length === 0 ? z : "";
    }
    return t.renderChildren(r);
  },
  addCommands() {
    return { setParagraph: () => ({ commands: e }) => e.setNode(this.name) };
  },
  addKeyboardShortcuts() {
    return { "Mod-Alt-0": () => this.editor.commands.setParagraph() };
  }
}), at = /(?:^|\s)(~~(?!\s+~~)((?:[^~]+))~~(?!\s+~~))$/, lt = /(?:^|\s)(~~(?!\s+~~)((?:[^~]+))~~(?!\s+~~))/g, dt = _.create({
  name: "strike",
  addOptions() {
    return { HTMLAttributes: {} };
  },
  parseHTML() {
    return [
      { tag: "s" },
      { tag: "del" },
      { tag: "strike" },
      {
        style: "text-decoration",
        consuming: !1,
        getAttrs: (e) => e.includes("line-through") ? {} : !1
      }
    ];
  },
  renderHTML({ HTMLAttributes: e }) {
    return [
      "s",
      v(this.options.HTMLAttributes, e),
      0
    ];
  },
  markdownTokenName: "del",
  parseMarkdown: (e, t) => t.applyMark("strike", t.parseInline(e.tokens || [])),
  renderMarkdown: (e, t) => `~~${t.renderChildren(e)}~~`,
  addCommands() {
    return {
      setStrike: () => ({ commands: e }) => e.setMark(this.name),
      toggleStrike: () => ({ commands: e }) => e.toggleMark(this.name),
      unsetStrike: () => ({ commands: e }) => e.unsetMark(this.name)
    };
  },
  addKeyboardShortcuts() {
    return { "Mod-Shift-s": () => this.editor.commands.toggleStrike() };
  },
  addInputRules() {
    return [O({
      find: at,
      type: this.type
    })];
  },
  addPasteRules() {
    return [R({
      find: lt,
      type: this.type
    })];
  }
}), ut = S.create({
  name: "text",
  group: "inline",
  parseMarkdown: (e) => ({
    type: "text",
    text: e.text || ""
  }),
  renderMarkdown: (e) => e.text || ""
}), ct = _.create({
  name: "underline",
  addOptions() {
    return { HTMLAttributes: {} };
  },
  parseHTML() {
    return [{ tag: "u" }, {
      style: "text-decoration",
      consuming: !1,
      getAttrs: (e) => e.includes("underline") ? {} : !1
    }];
  },
  renderHTML({ HTMLAttributes: e }) {
    return [
      "u",
      v(this.options.HTMLAttributes, e),
      0
    ];
  },
  parseMarkdown(e, t) {
    return t.applyMark(this.name || "underline", t.parseInline(e.tokens || []));
  },
  renderMarkdown(e, t) {
    return `++${t.renderChildren(e)}++`;
  },
  markdownTokenizer: {
    name: "underline",
    level: "inline",
    start(e) {
      return e.indexOf("++");
    },
    tokenize(e, t, n) {
      const r = /^(\+\+)([\s\S]+?)(\+\+)/.exec(e);
      if (!r) return;
      const s = r[2].trim();
      return {
        type: "underline",
        raw: r[0],
        text: s,
        tokens: n.inlineTokens(s)
      };
    }
  },
  addCommands() {
    return {
      setUnderline: () => ({ commands: e }) => e.setMark(this.name),
      toggleUnderline: () => ({ commands: e }) => e.toggleMark(this.name),
      unsetUnderline: () => ({ commands: e }) => e.unsetMark(this.name)
    };
  },
  addKeyboardShortcuts() {
    return {
      "Mod-u": () => this.editor.commands.toggleUnderline(),
      "Mod-U": () => this.editor.commands.toggleUnderline()
    };
  }
});
function pt(e = {}) {
  return new k({
    view(t) {
      return new ft(t, e);
    }
  });
}
class ft {
  constructor(t, n) {
    var r;
    this.editorView = t, this.cursorPos = null, this.element = null, this.timeout = -1, this.lastDragEvent = null, this.width = (r = n.width) !== null && r !== void 0 ? r : 1, this.color = n.color === !1 ? void 0 : n.color || "black", this.class = n.class, this.handlers = ["dragover", "dragend", "drop", "dragleave"].map((s) => {
      let o = (i) => {
        this[s](i);
      };
      return t.dom.addEventListener(s, o), { name: s, handler: o };
    });
  }
  destroy() {
    this.handlers.forEach(({ name: t, handler: n }) => this.editorView.dom.removeEventListener(t, n));
  }
  update(t, n) {
    if (this.cursorPos != null && n.doc != t.state.doc)
      if (this.lastDragEvent) {
        let r = this.computeTarget(this.lastDragEvent);
        r == this.cursorPos ? this.updateOverlay() : this.setCursor(r);
      } else
        this.updateOverlay();
  }
  setCursor(t) {
    t != this.cursorPos && (this.cursorPos = t, t == null ? (this.element.parentNode.removeChild(this.element), this.element = null) : this.updateOverlay());
  }
  updateOverlay() {
    let t = this.editorView.state.doc.resolve(this.cursorPos), n = !t.parent.inlineContent, r, s = this.editorView.dom, o = s.getBoundingClientRect(), i = o.width / s.offsetWidth, a = o.height / s.offsetHeight;
    if (n) {
      let u = t.nodeBefore, p = t.nodeAfter;
      if (u || p) {
        let f = this.editorView.nodeDOM(this.cursorPos - (u ? u.nodeSize : 0));
        if (f) {
          let m = f.getBoundingClientRect(), b = u ? m.bottom : m.top;
          u && p && (b = (b + this.editorView.nodeDOM(this.cursorPos).getBoundingClientRect().top) / 2);
          let E = this.width / 2 * a;
          r = { left: m.left, right: m.right, top: b - E, bottom: b + E };
        }
      }
    }
    if (!r) {
      let u = this.editorView.coordsAtPos(this.cursorPos), p = this.width / 2 * i;
      r = { left: u.left - p, right: u.left + p, top: u.top, bottom: u.bottom };
    }
    let l = this.editorView.dom.offsetParent;
    this.element || (this.element = l.appendChild(document.createElement("div")), this.class && (this.element.className = this.class), this.element.style.cssText = "position: absolute; z-index: 50; pointer-events: none;", this.color && (this.element.style.backgroundColor = this.color)), this.element.classList.toggle("prosemirror-dropcursor-block", n), this.element.classList.toggle("prosemirror-dropcursor-inline", !n);
    let d, c;
    if (!l || l == document.body && getComputedStyle(l).position == "static")
      d = -pageXOffset, c = -pageYOffset;
    else {
      let u = l.getBoundingClientRect(), p = u.width / l.offsetWidth, f = u.height / l.offsetHeight;
      d = u.left - l.scrollLeft * p, c = u.top - l.scrollTop * f;
    }
    this.element.style.left = (r.left - d) / i + "px", this.element.style.top = (r.top - c) / a + "px", this.element.style.width = (r.right - r.left) / i + "px", this.element.style.height = (r.bottom - r.top) / a + "px";
  }
  scheduleRemoval(t) {
    clearTimeout(this.timeout), this.timeout = setTimeout(() => this.setCursor(null), t);
  }
  computeTarget(t) {
    let n = this.editorView.posAtCoords({ left: t.clientX, top: t.clientY }), r = n && n.inside >= 0 && this.editorView.state.doc.nodeAt(n.inside), s = r && r.type.spec.disableDropCursor, o = typeof s == "function" ? s(this.editorView, n, t) : s;
    if (!n || o)
      return null;
    let i = n.pos;
    if (this.editorView.dragging && this.editorView.dragging.slice) {
      let a = Te(this.editorView.state.doc, i, this.editorView.dragging.slice);
      a != null && (i = a);
    }
    return i;
  }
  dragover(t) {
    if (!this.editorView.editable)
      return;
    this.lastDragEvent = t;
    let n = this.computeTarget(t);
    n != null && (this.setCursor(n), this.scheduleRemoval(5e3));
  }
  dragend() {
    this.scheduleRemoval(20);
  }
  drop() {
    this.scheduleRemoval(20);
  }
  dragleave(t) {
    this.editorView.dom.contains(t.relatedTarget) || this.setCursor(null);
  }
}
class h extends D {
  /**
  Create a gap cursor.
  */
  constructor(t) {
    super(t, t);
  }
  map(t, n) {
    let r = t.resolve(n.map(this.head));
    return h.valid(r) ? new h(r) : D.near(r);
  }
  content() {
    return Q.empty;
  }
  eq(t) {
    return t instanceof h && t.head == this.head;
  }
  toJSON() {
    return { type: "gapcursor", pos: this.head };
  }
  /**
  @internal
  */
  static fromJSON(t, n) {
    if (typeof n.pos != "number")
      throw new RangeError("Invalid input for GapCursor.fromJSON");
    return new h(t.resolve(n.pos));
  }
  /**
  @internal
  */
  getBookmark() {
    return new te(this.anchor);
  }
  /**
  @internal
  */
  static valid(t) {
    let n = t.parent;
    if (n.inlineContent || !ht(t) || !mt(t))
      return !1;
    let r = n.type.spec.allowGapCursor;
    if (r != null)
      return r;
    let s = n.contentMatchAt(t.index()).defaultType;
    return s && s.isTextblock;
  }
  /**
  @internal
  */
  static findGapCursorFrom(t, n, r = !1) {
    e: for (; ; ) {
      if (!r && h.valid(t))
        return t;
      let s = t.pos, o = null;
      for (let i = t.depth; ; i--) {
        let a = t.node(i);
        if (n > 0 ? t.indexAfter(i) < a.childCount : t.index(i) > 0) {
          o = a.child(n > 0 ? t.indexAfter(i) : t.index(i) - 1);
          break;
        } else if (i == 0)
          return null;
        s += n;
        let l = t.doc.resolve(s);
        if (h.valid(l))
          return l;
      }
      for (; ; ) {
        let i = n > 0 ? o.firstChild : o.lastChild;
        if (!i) {
          if (o.isAtom && !o.isText && !ee.isSelectable(o)) {
            t = t.doc.resolve(s + o.nodeSize * n), r = !1;
            continue e;
          }
          break;
        }
        o = i, s += n;
        let a = t.doc.resolve(s);
        if (h.valid(a))
          return a;
      }
      return null;
    }
  }
}
h.prototype.visible = !1;
h.findFrom = h.findGapCursorFrom;
D.jsonID("gapcursor", h);
class te {
  constructor(t) {
    this.pos = t;
  }
  map(t) {
    return new te(t.map(this.pos));
  }
  resolve(t) {
    let n = t.resolve(this.pos);
    return h.valid(n) ? new h(n) : D.near(n);
  }
}
function pe(e) {
  return e.isAtom || e.spec.isolating || e.spec.createGapCursor;
}
function ht(e) {
  for (let t = e.depth; t >= 0; t--) {
    let n = e.index(t), r = e.node(t);
    if (n == 0) {
      if (r.type.spec.isolating)
        return !0;
      continue;
    }
    for (let s = r.child(n - 1); ; s = s.lastChild) {
      if (s.childCount == 0 && !s.inlineContent || pe(s.type))
        return !0;
      if (s.inlineContent)
        return !1;
    }
  }
  return !0;
}
function mt(e) {
  for (let t = e.depth; t >= 0; t--) {
    let n = e.indexAfter(t), r = e.node(t);
    if (n == r.childCount) {
      if (r.type.spec.isolating)
        return !0;
      continue;
    }
    for (let s = r.child(n); ; s = s.firstChild) {
      if (s.childCount == 0 && !s.inlineContent || pe(s.type))
        return !0;
      if (s.inlineContent)
        return !1;
    }
  }
  return !0;
}
function gt() {
  return new k({
    props: {
      decorations: wt,
      createSelectionBetween(e, t, n) {
        return t.pos == n.pos && h.valid(n) ? new h(n) : null;
      },
      handleClick: vt,
      handleKeyDown: yt,
      handleDOMEvents: { beforeinput: Mt }
    }
  });
}
const yt = Ae({
  ArrowLeft: $("horiz", -1),
  ArrowRight: $("horiz", 1),
  ArrowUp: $("vert", -1),
  ArrowDown: $("vert", 1)
});
function $(e, t) {
  const n = e == "vert" ? t > 0 ? "down" : "up" : t > 0 ? "right" : "left";
  return function(r, s, o) {
    let i = r.selection, a = t > 0 ? i.$to : i.$from, l = i.empty;
    if (i instanceof T) {
      if (!o.endOfTextblock(n) || a.depth == 0)
        return !1;
      l = !1, a = r.doc.resolve(t > 0 ? a.after() : a.before());
    }
    let d = h.findGapCursorFrom(a, t, l);
    return d ? (s && s(r.tr.setSelection(new h(d))), !0) : !1;
  };
}
function vt(e, t, n) {
  if (!e || !e.editable)
    return !1;
  let r = e.state.doc.resolve(t);
  if (!h.valid(r))
    return !1;
  let s = e.posAtCoords({ left: n.clientX, top: n.clientY });
  return s && s.inside > -1 && ee.isSelectable(e.state.doc.nodeAt(s.inside)) ? !1 : (e.dispatch(e.state.tr.setSelection(new h(r))), !0);
}
function Mt(e, t) {
  if (t.inputType != "insertCompositionText" || !(e.state.selection instanceof h))
    return !1;
  let { $from: n } = e.state.selection, r = n.parent.contentMatchAt(n.index()).findWrapping(e.state.schema.nodes.text);
  if (!r)
    return !1;
  let s = ne.empty;
  for (let i = r.length - 1; i >= 0; i--)
    s = ne.from(r[i].createAndFill(null, s));
  let o = e.state.tr.replace(n.pos, n.pos, new Q(s, 0, 0));
  return o.setSelection(T.near(o.doc.resolve(n.pos + 1))), e.dispatch(o), !1;
}
function wt(e) {
  if (!(e.selection instanceof h))
    return null;
  let t = document.createElement("div");
  return t.className = "ProseMirror-gapcursor", A.create(e.doc, [K.widget(e.selection.head, t, { key: "gapcursor" })]);
}
var V = 200, g = function() {
};
g.prototype.append = function(t) {
  return t.length ? (t = g.from(t), !this.length && t || t.length < V && this.leafAppend(t) || this.length < V && t.leafPrepend(this) || this.appendInner(t)) : this;
};
g.prototype.prepend = function(t) {
  return t.length ? g.from(t).append(this) : this;
};
g.prototype.appendInner = function(t) {
  return new kt(this, t);
};
g.prototype.slice = function(t, n) {
  return t === void 0 && (t = 0), n === void 0 && (n = this.length), t >= n ? g.empty : this.sliceInner(Math.max(0, t), Math.min(this.length, n));
};
g.prototype.get = function(t) {
  if (!(t < 0 || t >= this.length))
    return this.getInner(t);
};
g.prototype.forEach = function(t, n, r) {
  n === void 0 && (n = 0), r === void 0 && (r = this.length), n <= r ? this.forEachInner(t, n, r, 0) : this.forEachInvertedInner(t, n, r, 0);
};
g.prototype.map = function(t, n, r) {
  n === void 0 && (n = 0), r === void 0 && (r = this.length);
  var s = [];
  return this.forEach(function(o, i) {
    return s.push(t(o, i));
  }, n, r), s;
};
g.from = function(t) {
  return t instanceof g ? t : t && t.length ? new fe(t) : g.empty;
};
var fe = /* @__PURE__ */ (function(e) {
  function t(r) {
    e.call(this), this.values = r;
  }
  e && (t.__proto__ = e), t.prototype = Object.create(e && e.prototype), t.prototype.constructor = t;
  var n = { length: { configurable: !0 }, depth: { configurable: !0 } };
  return t.prototype.flatten = function() {
    return this.values;
  }, t.prototype.sliceInner = function(s, o) {
    return s == 0 && o == this.length ? this : new t(this.values.slice(s, o));
  }, t.prototype.getInner = function(s) {
    return this.values[s];
  }, t.prototype.forEachInner = function(s, o, i, a) {
    for (var l = o; l < i; l++)
      if (s(this.values[l], a + l) === !1)
        return !1;
  }, t.prototype.forEachInvertedInner = function(s, o, i, a) {
    for (var l = o - 1; l >= i; l--)
      if (s(this.values[l], a + l) === !1)
        return !1;
  }, t.prototype.leafAppend = function(s) {
    if (this.length + s.length <= V)
      return new t(this.values.concat(s.flatten()));
  }, t.prototype.leafPrepend = function(s) {
    if (this.length + s.length <= V)
      return new t(s.flatten().concat(this.values));
  }, n.length.get = function() {
    return this.values.length;
  }, n.depth.get = function() {
    return 0;
  }, Object.defineProperties(t.prototype, n), t;
})(g);
g.empty = new fe([]);
var kt = /* @__PURE__ */ (function(e) {
  function t(n, r) {
    e.call(this), this.left = n, this.right = r, this.length = n.length + r.length, this.depth = Math.max(n.depth, r.depth) + 1;
  }
  return e && (t.__proto__ = e), t.prototype = Object.create(e && e.prototype), t.prototype.constructor = t, t.prototype.flatten = function() {
    return this.left.flatten().concat(this.right.flatten());
  }, t.prototype.getInner = function(r) {
    return r < this.left.length ? this.left.get(r) : this.right.get(r - this.left.length);
  }, t.prototype.forEachInner = function(r, s, o, i) {
    var a = this.left.length;
    if (s < a && this.left.forEachInner(r, s, Math.min(o, a), i) === !1 || o > a && this.right.forEachInner(r, Math.max(s - a, 0), Math.min(this.length, o) - a, i + a) === !1)
      return !1;
  }, t.prototype.forEachInvertedInner = function(r, s, o, i) {
    var a = this.left.length;
    if (s > a && this.right.forEachInvertedInner(r, s - a, Math.max(o, a) - a, i + a) === !1 || o < a && this.left.forEachInvertedInner(r, Math.min(s, a), o, i) === !1)
      return !1;
  }, t.prototype.sliceInner = function(r, s) {
    if (r == 0 && s == this.length)
      return this;
    var o = this.left.length;
    return s <= o ? this.left.slice(r, s) : r >= o ? this.right.slice(r - o, s - o) : this.left.slice(r, o).append(this.right.slice(0, s - o));
  }, t.prototype.leafAppend = function(r) {
    var s = this.right.leafAppend(r);
    if (s)
      return new t(this.left, s);
  }, t.prototype.leafPrepend = function(r) {
    var s = this.left.leafPrepend(r);
    if (s)
      return new t(s, this.right);
  }, t.prototype.appendInner = function(r) {
    return this.left.depth >= Math.max(this.right.depth, r.depth) + 1 ? new t(this.left, new t(this.right, r)) : new t(this, r);
  }, t;
})(g);
const Ct = 500;
class y {
  constructor(t, n) {
    this.items = t, this.eventCount = n;
  }
  // Pop the latest event off the branch's history and apply it
  // to a document transform.
  popEvent(t, n) {
    if (this.eventCount == 0)
      return null;
    let r = this.items.length;
    for (; ; r--)
      if (this.items.get(r - 1).selection) {
        --r;
        break;
      }
    let s, o;
    n && (s = this.remapping(r, this.items.length), o = s.maps.length);
    let i = t.tr, a, l, d = [], c = [];
    return this.items.forEach((u, p) => {
      if (!u.step) {
        s || (s = this.remapping(r, p + 1), o = s.maps.length), o--, c.push(u);
        return;
      }
      if (s) {
        c.push(new M(u.map));
        let f = u.step.map(s.slice(o)), m;
        f && i.maybeStep(f).doc && (m = i.mapping.maps[i.mapping.maps.length - 1], d.push(new M(m, void 0, void 0, d.length + c.length))), o--, m && s.appendMap(m, o);
      } else
        i.maybeStep(u.step);
      if (u.selection)
        return a = s ? u.selection.map(s.slice(o)) : u.selection, l = new y(this.items.slice(0, r).append(c.reverse().concat(d)), this.eventCount - 1), !1;
    }, this.items.length, 0), { remaining: l, transform: i, selection: a };
  }
  // Create a new branch with the given transform added.
  addTransform(t, n, r, s) {
    let o = [], i = this.eventCount, a = this.items, l = !s && a.length ? a.get(a.length - 1) : null;
    for (let c = 0; c < t.steps.length; c++) {
      let u = t.steps[c].invert(t.docs[c]), p = new M(t.mapping.maps[c], u, n), f;
      (f = l && l.merge(p)) && (p = f, c ? o.pop() : a = a.slice(0, a.length - 1)), o.push(p), n && (i++, n = void 0), s || (l = p);
    }
    let d = i - r.depth;
    return d > xt && (a = bt(a, d), i -= d), new y(a.append(o), i);
  }
  remapping(t, n) {
    let r = new Se();
    return this.items.forEach((s, o) => {
      let i = s.mirrorOffset != null && o - s.mirrorOffset >= t ? r.maps.length - s.mirrorOffset : void 0;
      r.appendMap(s.map, i);
    }, t, n), r;
  }
  addMaps(t) {
    return this.eventCount == 0 ? this : new y(this.items.append(t.map((n) => new M(n))), this.eventCount);
  }
  // When the collab module receives remote changes, the history has
  // to know about those, so that it can adjust the steps that were
  // rebased on top of the remote changes, and include the position
  // maps for the remote changes in its array of items.
  rebased(t, n) {
    if (!this.eventCount)
      return this;
    let r = [], s = Math.max(0, this.items.length - n), o = t.mapping, i = t.steps.length, a = this.eventCount;
    this.items.forEach((p) => {
      p.selection && a--;
    }, s);
    let l = n;
    this.items.forEach((p) => {
      let f = o.getMirror(--l);
      if (f == null)
        return;
      i = Math.min(i, f);
      let m = o.maps[f];
      if (p.step) {
        let b = t.steps[f].invert(t.docs[f]), E = p.selection && p.selection.map(o.slice(l + 1, f));
        E && a++, r.push(new M(m, b, E));
      } else
        r.push(new M(m));
    }, s);
    let d = [];
    for (let p = n; p < i; p++)
      d.push(new M(o.maps[p]));
    let c = this.items.slice(0, s).append(d).append(r), u = new y(c, a);
    return u.emptyItemCount() > Ct && (u = u.compress(this.items.length - r.length)), u;
  }
  emptyItemCount() {
    let t = 0;
    return this.items.forEach((n) => {
      n.step || t++;
    }), t;
  }
  // Compressing a branch means rewriting it to push the air (map-only
  // items) out. During collaboration, these naturally accumulate
  // because each remote change adds one. The `upto` argument is used
  // to ensure that only the items below a given level are compressed,
  // because `rebased` relies on a clean, untouched set of items in
  // order to associate old items with rebased steps.
  compress(t = this.items.length) {
    let n = this.remapping(0, t), r = n.maps.length, s = [], o = 0;
    return this.items.forEach((i, a) => {
      if (a >= t)
        s.push(i), i.selection && o++;
      else if (i.step) {
        let l = i.step.map(n.slice(r)), d = l && l.getMap();
        if (r--, d && n.appendMap(d, r), l) {
          let c = i.selection && i.selection.map(n.slice(r));
          c && o++;
          let u = new M(d.invert(), l, c), p, f = s.length - 1;
          (p = s.length && s[f].merge(u)) ? s[f] = p : s.push(u);
        }
      } else i.map && r--;
    }, this.items.length, 0), new y(g.from(s.reverse()), o);
  }
}
y.empty = new y(g.empty, 0);
function bt(e, t) {
  let n;
  return e.forEach((r, s) => {
    if (r.selection && t-- == 0)
      return n = s, !1;
  }), e.slice(n);
}
class M {
  constructor(t, n, r, s) {
    this.map = t, this.step = n, this.selection = r, this.mirrorOffset = s;
  }
  merge(t) {
    if (this.step && t.step && !t.selection) {
      let n = t.step.merge(this.step);
      if (n)
        return new M(n.getMap().invert(), n, this.selection);
    }
  }
}
class x {
  constructor(t, n, r, s, o) {
    this.done = t, this.undone = n, this.prevRanges = r, this.prevTime = s, this.prevComposition = o;
  }
}
const xt = 20;
function Tt(e, t, n, r) {
  let s = n.getMeta(L), o;
  if (s)
    return s.historyState;
  n.getMeta(It) && (e = new x(e.done, e.undone, null, 0, -1));
  let i = n.getMeta("appendedTransaction");
  if (n.steps.length == 0)
    return e;
  if (i && i.getMeta(L))
    return i.getMeta(L).redo ? new x(e.done.addTransform(n, void 0, r, W(t)), e.undone, re(n.mapping.maps), e.prevTime, e.prevComposition) : new x(e.done, e.undone.addTransform(n, void 0, r, W(t)), null, e.prevTime, e.prevComposition);
  if (n.getMeta("addToHistory") !== !1 && !(i && i.getMeta("addToHistory") === !1)) {
    let a = n.getMeta("composition"), l = e.prevTime == 0 || !i && e.prevComposition != a && (e.prevTime < (n.time || 0) - r.newGroupDelay || !At(n, e.prevRanges)), d = i ? q(e.prevRanges, n.mapping) : re(n.mapping.maps);
    return new x(e.done.addTransform(n, l ? t.selection.getBookmark() : void 0, r, W(t)), y.empty, d, n.time, a ?? e.prevComposition);
  } else return (o = n.getMeta("rebased")) ? new x(e.done.rebased(n, o), e.undone.rebased(n, o), q(e.prevRanges, n.mapping), e.prevTime, e.prevComposition) : new x(e.done.addMaps(n.mapping.maps), e.undone.addMaps(n.mapping.maps), q(e.prevRanges, n.mapping), e.prevTime, e.prevComposition);
}
function At(e, t) {
  if (!t)
    return !1;
  if (!e.docChanged)
    return !0;
  let n = !1;
  return e.mapping.maps[0].forEach((r, s) => {
    for (let o = 0; o < t.length; o += 2)
      r <= t[o + 1] && s >= t[o] && (n = !0);
  }), n;
}
function re(e) {
  let t = [];
  for (let n = e.length - 1; n >= 0 && t.length == 0; n--)
    e[n].forEach((r, s, o, i) => t.push(o, i));
  return t;
}
function q(e, t) {
  if (!e)
    return null;
  let n = [];
  for (let r = 0; r < e.length; r += 2) {
    let s = t.map(e[r], 1), o = t.map(e[r + 1], -1);
    s <= o && n.push(s, o);
  }
  return n;
}
function St(e, t, n) {
  let r = W(t), s = L.get(t).spec.config, o = (n ? e.undone : e.done).popEvent(t, r);
  if (!o)
    return null;
  let i = o.selection.resolve(o.transform.doc), a = (n ? e.done : e.undone).addTransform(o.transform, t.selection.getBookmark(), s, r), l = new x(n ? a : o.remaining, n ? o.remaining : a, null, 0, -1);
  return o.transform.setSelection(i).setMeta(L, { redo: n, historyState: l });
}
let X = !1, se = null;
function W(e) {
  let t = e.plugins;
  if (se != t) {
    X = !1, se = t;
    for (let n = 0; n < t.length; n++)
      if (t[n].spec.historyPreserveItems) {
        X = !0;
        break;
      }
  }
  return X;
}
const L = new I("history"), It = new I("closeHistory");
function Et(e = {}) {
  return e = {
    depth: e.depth || 100,
    newGroupDelay: e.newGroupDelay || 500
  }, new k({
    key: L,
    state: {
      init() {
        return new x(y.empty, y.empty, null, 0, -1);
      },
      apply(t, n, r) {
        return Tt(n, r, t, e);
      }
    },
    config: e,
    props: {
      handleDOMEvents: {
        beforeinput(t, n) {
          let r = n.inputType, s = r == "historyUndo" ? me : r == "historyRedo" ? ge : null;
          return !s || !t.editable ? !1 : (n.preventDefault(), s(t.state, t.dispatch));
        }
      }
    }
  });
}
function he(e, t) {
  return (n, r) => {
    let s = L.getState(n);
    if (!s || (e ? s.undone : s.done).eventCount == 0)
      return !1;
    if (r) {
      let o = St(s, n, e);
      o && r(t ? o.scrollIntoView() : o);
    }
    return !0;
  };
}
const me = he(!1, !0), ge = he(!0, !0);
C.create({
  name: "characterCount",
  addOptions() {
    return {
      limit: null,
      autoTrim: !0,
      mode: "textSize",
      textCounter: (e) => e.length,
      wordCounter: (e) => e.split(" ").filter((t) => t !== "").length
    };
  },
  addStorage() {
    return {
      characters: () => 0,
      words: () => 0
    };
  },
  onBeforeCreate() {
    this.storage.characters = (e) => {
      const t = e?.node || this.editor.state.doc;
      if ((e?.mode || this.options.mode) === "textSize") {
        const n = t.textBetween(0, t.content.size, void 0, " ");
        return this.options.textCounter(n);
      }
      return t.nodeSize;
    }, this.storage.words = (e) => {
      const t = e?.node || this.editor.state.doc, n = t.textBetween(0, t.content.size, " ", " ");
      return this.options.wordCounter(n);
    };
  },
  addProseMirrorPlugins() {
    let e = !1;
    return [new k({
      key: new I("characterCount"),
      appendTransaction: (t, n, r) => {
        if (e) return;
        const s = this.options.limit, o = this.options.autoTrim;
        if (s == null || s === 0 || o === !1) {
          e = !0;
          return;
        }
        const i = this.storage.characters({ node: r.doc });
        if (i > s) {
          const a = i - s, l = 0, d = a;
          console.warn(`[CharacterCount] Initial content exceeded limit of ${s} characters. Content was automatically trimmed.`);
          const c = r.tr.deleteRange(l, d);
          return e = !0, c;
        }
        e = !0;
      },
      filterTransaction: (t, n) => {
        const r = this.options.limit;
        if (!t.docChanged || r === 0 || r === null || r === void 0) return !0;
        const s = this.storage.characters({ node: n.doc }), o = this.storage.characters({ node: t.doc });
        if (o <= r || s > r && o > r && o <= s) return !0;
        if (s > r && o > r && o > s || !t.getMeta("paste")) return !1;
        const i = t.selection.$head.pos, a = i - (o - r), l = i;
        return t.deleteRange(a, l), !(this.storage.characters({ node: t.doc }) > r);
      }
    })];
  }
});
const Pt = C.create({
  name: "dropCursor",
  addOptions() {
    return {
      color: "currentColor",
      width: 1,
      class: void 0
    };
  },
  addProseMirrorPlugins() {
    return [pt(this.options)];
  }
});
C.create({
  name: "focus",
  addOptions() {
    return {
      className: "has-focus",
      mode: "all"
    };
  },
  addProseMirrorPlugins() {
    return [new k({
      key: new I("focus"),
      props: { decorations: ({ doc: e, selection: t }) => {
        const { isEditable: n, isFocused: r } = this.editor, { anchor: s } = t, o = [];
        if (!n || !r) return A.create(e, []);
        let i = 0;
        this.options.mode === "deepest" && e.descendants((l, d) => {
          if (!l.isText) {
            if (!(s >= d && s <= d + l.nodeSize - 1)) return !1;
            i += 1;
          }
        });
        let a = 0;
        return e.descendants((l, d) => {
          if (l.isText || !(s >= d && s <= d + l.nodeSize - 1)) return !1;
          if (a += 1, this.options.mode === "deepest" && i - a > 0 || this.options.mode === "shallowest" && a > 1) return this.options.mode === "deepest";
          o.push(K.node(d, d + l.nodeSize, { class: this.options.className }));
        }), A.create(e, o);
      } }
    })];
  }
});
const Lt = C.create({
  name: "gapCursor",
  addProseMirrorPlugins() {
    return [gt()];
  },
  extendNodeSchema(e) {
    var t;
    return { allowGapCursor: (t = Ie(Ee(e, "allowGapCursor", {
      name: e.name,
      options: e.options,
      storage: e.storage
    }))) !== null && t !== void 0 ? t : null };
  }
}), ye = "placeholder", oe = new I("tiptap__placeholder");
function ve(e) {
  const { editor: t, placeholder: n, dataAttribute: r, pos: s, node: o, isEmptyDoc: i, hasAnchor: a, classes: { emptyNode: l, emptyEditor: d } } = e, c = [l];
  return i && c.push(d), K.node(s, s + o.nodeSize, {
    class: c.join(" "),
    [r]: typeof n == "function" ? n({
      editor: t,
      node: o,
      pos: s,
      hasAnchor: a
    }) : n
  });
}
function Me(e, t) {
  return typeof e == "function" ? e(t) : e;
}
function we({ editor: e, options: t, dataAttribute: n, doc: r, selection: s, from: o, to: i }) {
  const { anchor: a } = s, l = [], d = e.isEmpty;
  return r.nodesBetween(o, i, (c, u) => {
    const p = a >= u && a <= u + c.nodeSize, f = !c.isLeaf && le(c);
    return c.type.isTextblock && (p || !t.showOnlyCurrent) && f && l.push(ve({
      editor: e,
      isEmptyDoc: d,
      dataAttribute: n,
      hasAnchor: p,
      placeholder: t.placeholder,
      classes: {
        emptyEditor: t.emptyEditorClass,
        emptyNode: Me(t.emptyNodeClass, {
          editor: e,
          node: c,
          pos: u,
          hasAnchor: p
        })
      },
      node: c,
      pos: u
    })), t.includeChildren;
  }), l;
}
function ke({ editor: e, options: t, dataAttribute: n, doc: r, selection: s }) {
  if (!(e.isEditable || !t.showOnlyWhenEditable)) return null;
  const { anchor: o } = s, i = [], a = e.isEmpty;
  if (t.showOnlyCurrent && !t.includeChildren) {
    const l = r.resolve(o), d = l.depth > 0 ? l.node(1) : l.nodeAfter, c = l.depth > 0 ? l.before(1) : o;
    if (d && d.type.isTextblock && le(d)) {
      const u = o >= c && o <= c + d.nodeSize;
      i.push(ve({
        editor: e,
        isEmptyDoc: a,
        dataAttribute: n,
        hasAnchor: u,
        placeholder: t.placeholder,
        classes: {
          emptyEditor: t.emptyEditorClass,
          emptyNode: Me(t.emptyNodeClass, {
            editor: e,
            node: d,
            pos: c,
            hasAnchor: u
          })
        },
        node: d,
        pos: c
      }));
    }
  } else i.push(...we({
    editor: e,
    options: t,
    dataAttribute: n,
    doc: r,
    selection: s,
    from: 0,
    to: r.content.size
  }));
  return A.create(r, i);
}
function N(e, t) {
  const n = e.resolve(t);
  if (n.depth === 0) {
    var r;
    const o = (r = n.nodeAfter) !== null && r !== void 0 ? r : n.nodeBefore;
    if (!o) return {
      from: t,
      to: t
    };
    const i = n.nodeAfter ? t : t - o.nodeSize;
    return {
      from: i,
      to: i + o.nodeSize
    };
  }
  const s = n.before(1);
  return {
    from: s,
    to: s + n.node(1).nodeSize
  };
}
function B(e, t) {
  return {
    from: Math.max(0, t.from - 1),
    to: Math.min(e.content.size, t.to - 1)
  };
}
function Rt(e, t, n) {
  const r = [];
  return e.forEach((s, o) => {
    const i = o, a = i + s.nodeSize, l = i + 1, d = a + 1;
    l < n && d > t && r.push({
      from: i,
      to: a
    });
  }), r;
}
function Ot(e) {
  if (e.length === 0) return [];
  const t = [...e].sort((r, s) => r.from - s.from), n = [{ ...t[0] }];
  for (let r = 1; r < t.length; r += 1) {
    const s = n[n.length - 1], o = t[r];
    o.from <= s.to ? s.to = Math.max(s.to, o.to) : n.push({ ...o });
  }
  return n;
}
function Ht(e, t) {
  const n = Rt(e, t.from, t.to);
  return n.push(B(e, N(e, t.from))), t.to > t.from ? n.push(B(e, N(e, Math.min(t.to, e.content.size + 1) - 1))) : t.from < e.content.size + 1 && n.push(B(e, N(e, Math.min(t.from + 1, e.content.size)))), n;
}
function Nt(e, t, n) {
  const r = [];
  if (e.docChanged) {
    const s = Pe(e);
    for (const o of s) r.push(...Ht(n.doc, o.newRange));
  }
  return e.selectionSet && (r.push(B(n.doc, N(n.doc, e.mapping.map(t.selection.anchor)))), r.push(B(n.doc, N(n.doc, n.selection.anchor)))), Ot(r);
}
function Bt(e, t, n) {
  const r = Math.max(0, Math.min(e, n.content.size));
  return {
    from: r,
    to: Math.max(r, Math.min(t, n.content.size))
  };
}
function Dt({ decorations: e, ranges: t, editor: n, options: r, dataAttribute: s, doc: o, selection: i }) {
  let a = e;
  for (const l of t) {
    const { from: d, to: c } = Bt(l.from, l.to, o), u = a.find(d, c).filter((f) => f.from >= d && f.to <= c);
    u.length && (a = a.remove(u));
    const p = we({
      editor: n,
      options: r,
      dataAttribute: s,
      doc: o,
      selection: i,
      from: d,
      to: c
    });
    p.length && (a = a.add(o, p));
  }
  return a;
}
function _t({ editor: e, options: t, dataAttribute: n }) {
  return {
    init(r, s) {
      const o = ke({
        editor: e,
        options: t,
        dataAttribute: n,
        doc: s.doc,
        selection: s.selection
      });
      return o ?? A.empty;
    },
    apply(r, s, o, i) {
      return !r.docChanged && !r.selectionSet ? s : Dt({
        decorations: s.map(r.mapping, r.doc),
        ranges: Nt(r, o, i),
        editor: e,
        options: t,
        dataAttribute: n,
        doc: i.doc,
        selection: i.selection
      });
    }
  };
}
function zt(e) {
  return e.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-]/g, "").replace(/^[0-9-]+/, "").replace(/^-+/, "").toLowerCase();
}
function $t({ editor: e, options: t }) {
  const n = t.dataAttribute ? `data-${zt(t.dataAttribute)}` : `data-${ye}`, r = t.showOnlyCurrent && !t.includeChildren;
  return new k({
    key: oe,
    ...r ? {} : { state: _t({
      editor: e,
      options: t,
      dataAttribute: n
    }) },
    props: { decorations: r ? ({ doc: s, selection: o }) => ke({
      editor: e,
      options: t,
      dataAttribute: n,
      doc: s,
      selection: o
    }) : (s) => {
      var o;
      return t.showOnlyWhenEditable && !e.isEditable ? A.empty : (o = oe.getState(s)) !== null && o !== void 0 ? o : A.empty;
    } }
  });
}
C.create({
  name: "placeholder",
  addOptions() {
    return {
      emptyEditorClass: "is-editor-empty",
      emptyNodeClass: "is-empty",
      dataAttribute: ye,
      placeholder: "Write something …",
      showOnlyWhenEditable: !0,
      showOnlyCurrent: !0,
      includeChildren: !1
    };
  },
  addProseMirrorPlugins() {
    return [$t({
      editor: this.editor,
      options: this.options
    })];
  }
});
function Z(e, t) {
  return !e.selection.empty && !ae(e.selection) && t.isEditable;
}
function Wt(e, t) {
  return Z(e, t) && !t.isFocused && !t.view.dragging;
}
function Ft() {
  var e;
  (e = window.getSelection()) === null || e === void 0 || e.removeAllRanges();
}
function Vt(e) {
  e.focus();
}
C.create({
  name: "selection",
  addOptions() {
    return { className: "selection" };
  },
  addProseMirrorPlugins() {
    const { editor: e, options: t } = this;
    return [new k({
      key: new I("selection"),
      props: {
        decorations(n) {
          return Wt(n, e) ? A.create(n.doc, [K.inline(n.selection.from, n.selection.to, { class: t.className })]) : null;
        },
        handleDOMEvents: {
          blur(n) {
            return Z(n.state, e) && Ft(), !1;
          },
          focus(n) {
            return Z(n.state, e) && requestAnimationFrame(() => {
              !e.isDestroyed && n.hasFocus() && Vt(n);
            }), !1;
          }
        }
      }
    })];
  }
});
function ie({ types: e, node: t }) {
  return t && Array.isArray(e) && e.includes(t.type) || t?.type === e;
}
const Kt = C.create({
  name: "trailingNode",
  addOptions() {
    return {
      node: void 0,
      notAfter: []
    };
  },
  addProseMirrorPlugins() {
    var e;
    const t = new I(this.name), n = this.options.node || ((e = this.editor.schema.topNodeType.contentMatch.defaultType) === null || e === void 0 ? void 0 : e.name) || "paragraph", r = Object.entries(this.editor.schema.nodes).map(([, s]) => s).filter((s) => (this.options.notAfter || []).concat(n).includes(s.name));
    return [new k({
      key: t,
      appendTransaction: (s, o, i) => {
        const { doc: a, tr: l, schema: d } = i, c = t.getState(i), u = a.content.size, p = d.nodes[n];
        if (!s.some((f) => f.getMeta("skipTrailingNode")) && c)
          return l.insert(u, p.create());
      },
      state: {
        init: (s, o) => {
          const i = o.tr.doc.lastChild;
          return !ie({
            node: i,
            types: r
          });
        },
        apply: (s, o) => {
          if (!s.docChanged || s.getMeta("__uniqueIDTransaction")) return o;
          const i = s.doc.lastChild;
          return !ie({
            node: i,
            types: r
          });
        }
      }
    })];
  }
}), Ut = C.create({
  name: "undoRedo",
  addOptions() {
    return {
      depth: 100,
      newGroupDelay: 500
    };
  },
  addCommands() {
    return {
      undo: () => ({ state: e, dispatch: t }) => me(e, t),
      redo: () => ({ state: e, dispatch: t }) => ge(e, t)
    };
  },
  addProseMirrorPlugins() {
    return [Et(this.options)];
  },
  addKeyboardShortcuts() {
    return {
      "Mod-z": () => this.editor.commands.undo(),
      "Shift-Mod-z": () => this.editor.commands.redo(),
      "Mod-y": () => this.editor.commands.redo(),
      "Mod-я": () => this.editor.commands.undo(),
      "Shift-Mod-я": () => this.editor.commands.redo()
    };
  }
}), jt = C.create({
  name: "starterKit",
  addExtensions() {
    const e = [];
    if (this.options.bold !== !1 && e.push(Ke.configure(this.options.bold)), this.options.blockquote !== !1 && e.push(ze.configure(this.options.blockquote)), this.options.bulletList !== !1 && e.push(Re.configure(this.options.bulletList)), this.options.code !== !1 && e.push(Ge.configure(this.options.code)), this.options.codeBlock !== !1 && e.push(Ye.configure(this.options.codeBlock)), this.options.document !== !1 && e.push(Je.configure(this.options.document)), this.options.dropcursor !== !1 && e.push(Pt.configure(this.options.dropcursor)), this.options.gapcursor !== !1 && e.push(Lt.configure(this.options.gapcursor)), this.options.hardBreak !== !1 && e.push(Ze.configure(this.options.hardBreak)), this.options.heading !== !1 && e.push(Qe.configure(this.options.heading)), this.options.undoRedo !== !1 && e.push(Ut.configure(this.options.undoRedo)), this.options.horizontalRule !== !1 && e.push(et.configure(this.options.horizontalRule)), this.options.italic !== !1 && e.push(ot.configure(this.options.italic)), this.options.listItem !== !1 && e.push(Oe.configure(this.options.listItem)), this.options.listKeymap !== !1) {
      var t;
      e.push(He.configure((t = this.options) === null || t === void 0 ? void 0 : t.listKeymap));
    }
    if (this.options.link !== !1) {
      var n;
      e.push(Le.configure((n = this.options) === null || n === void 0 ? void 0 : n.link));
    }
    if (this.options.orderedList !== !1 && e.push(Ne.configure(this.options.orderedList)), this.options.paragraph !== !1 && e.push(it.configure(this.options.paragraph)), this.options.strike !== !1 && e.push(dt.configure(this.options.strike)), this.options.text !== !1 && e.push(ut.configure(this.options.text)), this.options.underline !== !1) {
      var r;
      e.push(ct.configure((r = this.options) === null || r === void 0 ? void 0 : r.underline));
    }
    if (this.options.trailingNode !== !1) {
      var s;
      e.push(Kt.configure((s = this.options) === null || s === void 0 ? void 0 : s.trailingNode));
    }
    return e;
  }
});
var Yt = jt;
export {
  jt as StarterKit,
  Yt as default
};
