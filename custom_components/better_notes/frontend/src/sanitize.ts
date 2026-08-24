// Ported verbatim from the current www/better-notes-card.js _sanitizeHtml —
// used by the card's single-note view, which renders note HTML directly.
const ALLOWED_TAGS = new Set([
  'p', 'br', 'strong', 'b', 'em', 'i', 's', 'u', 'mark',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'a', 'blockquote', 'code', 'pre',
  'input', 'label', 'span', 'div',
]);
const ALLOWED_ATTRS_BY_TAG: Record<string, string[]> = {
  a: ['href', 'target', 'rel'],
  input: ['type', 'checked', 'disabled'],
};
const SAFE_PROTOCOLS = /^(https?:|mailto:)/i;

function sanitizeNode(node: Node): void {
  if (node.nodeType === Node.TEXT_NODE) return;
  if (node.nodeType !== Node.ELEMENT_NODE) {
    node.parentNode?.removeChild(node);
    return;
  }
  const el = node as Element;
  const tag = el.tagName.toLowerCase();
  if (!ALLOWED_TAGS.has(tag)) {
    const parent = el.parentNode;
    while (el.firstChild) parent?.insertBefore(el.firstChild, el);
    parent?.removeChild(el);
    return;
  }
  const allowed = ALLOWED_ATTRS_BY_TAG[tag] || [];
  Array.from(el.attributes).forEach(attr => {
    if (!allowed.includes(attr.name) && attr.name !== 'data-type' && attr.name !== 'data-checked') {
      el.removeAttribute(attr.name);
    }
  });
  if (tag === 'a') {
    const href = el.getAttribute('href') || '';
    if (!SAFE_PROTOCOLS.test(href)) el.removeAttribute('href');
    el.setAttribute('rel', 'noopener noreferrer');
  }
  Array.from(el.childNodes).forEach(sanitizeNode);
}

export function sanitizeNoteHtml(htmlText: string): string {
  const doc = new DOMParser().parseFromString(htmlText, 'text/html');
  Array.from(doc.body.childNodes).forEach(sanitizeNode);
  return doc.body.innerHTML;
}
