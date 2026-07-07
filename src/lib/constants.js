/**
 * Shared constants used across vault and arena components.
 */

export const EXAM_COLORS = {
  CAT: '#8b7dff',
  JEE: '#05f2c7',
  GATE: '#ffd166',
  GRE: '#ff6b6b',
  GMAT: '#3a86ff',
}

/**
 * Returns the dot color for a given exam context string.
 * Falls back to the CSS accent variable if no match found.
 */
export function getDotColor(examContext) {
  if (!examContext) return 'var(--text-muted)'
  const key = examContext.toUpperCase()
  return EXAM_COLORS[key] || 'var(--accent)'
}
