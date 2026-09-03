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
  // together with no separator — insert one before parsing.
  const spaced = html
    .replace(/<\/(li|p|div|h[1-6]|tr)>/gi, '</$1> ')
    .replace(/<br\s*\/?>/gi, ' ');
  return new DOMParser().parseFromString(spaced, 'text/html').body.textContent || '';
}
