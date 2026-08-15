'use client';

/**
 * A boundary you can put *inside* a page.
 *
 * Next's `error.jsx` catches at the route segment, which means a broken
 * activity view takes the whole lobby down with it — including the poll that
 * would have told us the organiser already moved on. Wrapping just the activity
 * keeps the lobby alive: the header, the LIVE badge and the 30s poll survive,
 * and the participant can step back and rejoin.
 *
 * React only supports class components for this.
 */

import { Component } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { color, radius, tint } from '@/theme/tokens';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', this.props.label ?? 'component', error, info?.componentStack);
    this.props.onError?.(error);
  }

  /**
   * Remount the subtree. `resetKey` changing does the same automatically, which
   * is what makes a new activity clear a previous activity's crash.
   */
  reset = () => this.setState({ error: null });

  componentDidUpdate(prevProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.reset();
    }
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    if (this.props.fallback) {
      return typeof this.props.fallback === 'function'
        ? this.props.fallback(error, this.reset)
        : this.props.fallback;
    }

    return (
      <Box role="alert" sx={{ p: 3, textAlign: 'center' }}>
        <Typography sx={{ color: color.text, fontWeight: 700 }}>
          This part couldn&apos;t be displayed
        </Typography>
        <Typography sx={{ color: color.textMuted, mt: 1, fontSize: '0.88rem', lineHeight: 1.6 }}>
          The rest of the page is still live and still updating.
        </Typography>

        {process.env.NODE_ENV !== 'production' && (
          <Typography sx={{ mt: 1.5, color: color.textFaint, fontSize: '0.72rem', fontFamily: 'monospace' }}>
            {error.message}
          </Typography>
        )}

        <Button
          onClick={this.reset}
          variant="outlined"
          sx={{
            mt: 2.5,
            minHeight: 44,
            px: 3,
            borderRadius: `${radius.md}px`,
            textTransform: 'none',
            fontWeight: 700,
            color: color.brand,
            borderColor: tint(color.brand, 0.4),
          }}
        >
          Reload this section
        </Button>
      </Box>
    );
  }
}
