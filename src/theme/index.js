'use client';

import { createTheme } from '@mui/material/styles';
import { color, radius } from './tokens';

// App-wide MUI dark theme. Wrapping the app in this (with CssBaseline) makes every
// MUI surface default to dark — this is what eliminates the white <Paper> bug across
// the 45+ MUI files without touching each one.
const theme = createTheme({
  palette: {
    mode: 'dark',
    background: { default: color.bg, paper: color.surface },
    text: { primary: color.text, secondary: color.textMuted },
    primary: { main: color.brand },
    secondary: { main: color.violet },
    success: { main: color.green },
    warning: { main: color.amber },
    error: { main: color.red },
    info: { main: color.indigo },
    divider: color.border,
  },
  shape: { borderRadius: radius.md },
  typography: {
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    h1: { fontWeight: 800 },
    h2: { fontWeight: 800 },
    h3: { fontWeight: 800 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none', border: `1px solid ${color.border}` },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { borderRadius: radius.md } },
    },
    MuiTextField: { defaultProps: { variant: 'outlined' } },
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: color.bg, color: color.text },
      },
    },
  },
});

export default theme;
