// Ported verbatim from the current www/better-notes-panel.js COLORS array —
// this is the toolbar/create-note palette, distinct from const.py's
// DEFAULT_COLORS (which the backend uses only for schema validation
// defaults, not anything the frontend reads).
export const NOTE_COLORS = [
  '#C9B356', // muted yellow
  '#E09455', // amber
  '#C96060', // muted red
  '#C4607A', // dusty rose
  '#9068A8', // muted purple
  '#5868A0', // slate indigo
  '#4A85B8', // sky blue
  '#3C9AAA', // teal-cyan
  '#3A9080', // teal
  '#52A068', // sage green
];

export const DEFAULT_NOTE_COLOR = '#3A9080'; // teal

export function safeColor(color: string | undefined | null): string {
  return color && /^#[0-9a-fA-F]{6}$|^#[0-9a-fA-F]{3}$/.test(color) ? color : DEFAULT_NOTE_COLOR;
}

function hexToRgb(hex: string): [number, number, number] {
  const full = hex.length === 4
    ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
    : hex;
  const num = parseInt(full.slice(1), 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

// Note colors are arbitrary user data, not theme tokens, so
// --primary-text-color/--secondary-text-color (tuned for HA's own
// surfaces) can't be trusted to stay readable on top of them —
// pick light or dark text from the note color's own luminance instead.
export function getNoteTextColor(color: string | undefined | null): { title: string; muted: string } {
  const [r, g, b] = hexToRgb(safeColor(color));
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55
    ? { title: 'rgba(0, 0, 0, 0.87)', muted: 'rgba(0, 0, 0, 0.6)' }
    : { title: 'rgba(255, 255, 255, 0.92)', muted: 'rgba(255, 255, 255, 0.68)' };
}

export function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
}

export function stripHtml(html: string): string {
  // textContent ignores block-level layout, so adjacent <li>/<p>/etc. run
  // together with no separator — insert a line break before parsing so
  // each block (e.g. each list item) lands on its own line.
  const spaced = html
    .replace(/<\/(li|p|div|h[1-6]|tr)>/gi, '</$1>\n')
    .replace(/<br\s*\/?>/gi, '\n');
  return new DOMParser().parseFromString(spaced, 'text/html').body.textContent || '';
}

const PREVIEW_ALLOWED_TAGS = new Set([
  'P', 'BR', 'UL', 'OL', 'LI', 'LABEL', 'SPAN', 'DIV',
  'STRONG', 'B', 'EM', 'I', 'S', 'U', 'MARK', 'INPUT',
]);

function cleanPreviewNode(node: Node): void {
  // Walk with an explicit next-sibling pointer captured before any mutation,
  // rather than a childNodes snapshot — a snapshot goes stale as soon as one
  // sibling is unwrapped/removed, and a later removeChild on another
  // already-detached sibling throws NotFoundError.
  let child = node.firstChild;
  while (child) {
    const next: ChildNode | null = child.nextSibling;
    if (child.nodeType === Node.TEXT_NODE) {
      child = next;
      continue;
    }
    if (child.nodeType !== Node.ELEMENT_NODE) {
      node.removeChild(child);
      child = next;
      continue;
    }
    const el = child as HTMLElement;
    if (!PREVIEW_ALLOWED_TAGS.has(el.tagName)) {
      // Unwrap disallowed elements (e.g. <a>) instead of dropping their
      // text — script/style are the only ones dropped outright.
      if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE') {
        el.remove();
        child = next;
        continue;
      }
      const firstMoved = el.firstChild;
      while (el.firstChild) node.insertBefore(el.firstChild, el);
      node.removeChild(el);
      // Re-visit the just-unwrapped content (it may itself contain disallowed
      // tags) before continuing on to `next`.
      child = firstMoved ?? next;
      continue;
    }
    Array.from(el.attributes).forEach((attr) => {
      const keep = (el.tagName === 'INPUT' && attr.name === 'checked')
        || (el.tagName === 'UL' && attr.name === 'data-type')
        || (el.tagName === 'LI' && attr.name === 'data-checked');
      if (!keep) el.removeAttribute(attr.name);
    });
    if (el.tagName === 'INPUT') {
      el.setAttribute('type', 'checkbox');
      el.setAttribute('disabled', '');
    }
    cleanPreviewNode(el);
    child = next;
  }
}

// Renders a trusted-but-structural preview of note content: real
// <ul>/<li>/checkbox markup (so the list preview shows bullets/checkboxes
// like the editor does) instead of flattened plain text, with everything
// but a small structural tag allowlist stripped to avoid injecting
// arbitrary markup/scripts from note content into the shadow DOM.
export function notePreviewHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  cleanPreviewNode(doc.body);
  Array.from(doc.body.querySelectorAll('p')).forEach((p) => {
    if (!p.textContent?.trim() && !p.querySelector('input')) p.remove();
  });
  return doc.body.innerHTML;
}
