// Single source of truth for the Quiz Raider X palette + scales.
// Consumed by the MUI theme (src/theme/index.js), CSS variables (globals.css),
// and scoped component styles. Change a value here, it changes everywhere.

export const color = {
  bg: '#0a0a0f',
  surface: '#111118',
  surface2: '#16161f',
  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.16)',
  text: '#e7e7ea',
  textMuted: 'rgba(255,255,255,0.55)',
  textFaint: 'rgba(255,255,255,0.35)',

  // brand + accents
  brand: '#22d3ee', // cyan (PIXEL)
  violet: '#a855f7',
  indigo: '#6366f1',
  amber: '#f59e0b',
  green: '#22c55e',
  red: '#ef4444',
};

export const radius = { sm: 8, md: 12, lg: 16, xl: 20, pill: 999 };

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const motion = { fast: 0.18, base: 0.25, slow: 0.4 };

// Per-accent helpers (used by cards: border/glow tints from one accent)
export const tint = (hex, alpha) => {
  // hex like #rrggbb -> rgba(r,g,b,alpha)
  const v = hex.replace('#', '');
  const r = parseInt(v.slice(0, 2), 16);
  const g = parseInt(v.slice(2, 4), 16);
  const b = parseInt(v.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
