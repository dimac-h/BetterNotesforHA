// Ported verbatim from the current www/better-notes-panel.js COLORS array —
// this is the toolbar/create-note palette, distinct from const.py's
// DEFAULT_COLORS (which the backend uses only for schema validation
// defaults, not anything the frontend reads).
export const NOTE_COLORS = [
  '#E8D44D', // warm yellow
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

export function safeColor(color: string | undefined | null): string {
  return color && /^#[0-9a-fA-F]{6}$|^#[0-9a-fA-F]{3}$/.test(color) ? color : '#FFEB3B';
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
  return new DOMParser().parseFromString(html, 'text/html').body.textContent || '';
}
