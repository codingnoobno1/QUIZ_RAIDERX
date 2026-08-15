// Single source of truth for the Quiz Raider X palette + scales.
// Consumed by the MUI theme (src/theme/index.js), CSS variables (globals.css),
// and scoped component styles. Change a value here, it changes everywhere.

export const color = {
  // Calmer than the neon the marketing page uses. The brand is still cyan and
  // the app is still dark — but the accent is desaturated so it can be used for
  // meaning (a live round, the primary action) instead of decoration. When
  // everything glows, nothing reads as urgent.
  bg: '#090A0E',
  surface: '#111319',
  surface2: '#171A21',
  border: '#262A34',
  borderStrong: '#333845',
  text: '#F4F5F7',
  textMuted: '#969CA8',
  textFaint: '#646B77',

  // brand + accents
  brand: '#38B9D3', // cyan (PIXEL) — primary action, active nav, selection
  violet: '#9A82E2', // invitations, teams, community identity
  indigo: '#6366f1',
  amber: '#D9A441',
  green: '#65BD91', // accepted, registered, live success
  red: '#D76D74',
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
