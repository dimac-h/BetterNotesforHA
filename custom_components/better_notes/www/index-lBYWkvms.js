import { M as a, a as s, b as l, m as u, y as d } from "./index-pa5U7i3D.js";
const h = /(?:^|\s)(==(?!\s+==)((?:[^=]+))==(?!\s+==))$/, g = /(?:^|\s)(==(?!\s+==)((?:[^=]+))==(?!\s+==))/g, c = a.create({
  name: "highlight",
  addOptions() {
    return {
      multicolor: !1,
      HTMLAttributes: {}
    };
  },
  addAttributes() {
    return this.options.multicolor ? { color: {
      default: null,
      parseHTML: (t) => t.getAttribute("data-color") || d(t, "background-color") || t.style.backgroundColor,
      renderHTML: (t) => t.color ? {
        "data-color": t.color,
        style: `background-color: ${t.color}; color: inherit`
      } : {}
    } } : {};
  },
  parseHTML() {
    return [{ tag: "mark" }];
  },
  renderHTML({ HTMLAttributes: t }) {
    return [
      "mark",
      u(this.options.HTMLAttributes, t),
      0
    ];
  },
  renderMarkdown: (t, r) => `==${r.renderChildren(t)}==`,
  parseMarkdown: (t, r) => r.applyMark("highlight", r.parseInline(t.tokens || [])),
  markdownTokenizer: {
    name: "highlight",
    level: "inline",
    start: (t) => t.indexOf("=="),
    tokenize(t, r, o) {
      const e = /^(==)([^=]+)(==)/.exec(t);
      if (e) {
        const n = e[2].trim(), i = o.inlineTokens(n);
        return {
          type: "highlight",
          raw: e[0],
          text: n,
          tokens: i
        };
      }
    }
  },
  addCommands() {
    return {
      setHighlight: (t) => ({ commands: r }) => r.setMark(this.name, t),
      toggleHighlight: (t) => ({ commands: r }) => r.toggleMark(this.name, t),
      unsetHighlight: () => ({ commands: t }) => t.unsetMark(this.name)
    };
  },
  addKeyboardShortcuts() {
    return { "Mod-Shift-h": () => this.editor.commands.toggleHighlight() };
  },
  addInputRules() {
    return [l({
      find: h,
      type: this.type
    })];
  },
  addPasteRules() {
    return [s({
      find: g,
      type: this.type
    })];
  }
});
var k = c;
export {
  c as Highlight,
  k as default,
  h as inputRegex,
  g as pasteRegex
};
