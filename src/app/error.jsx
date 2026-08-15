'use client';

/**
 * Root route boundary.
 *
 * Anything that throws while rendering a page lands here instead of unmounting
 * the tree into a white screen. The root layout (and therefore Providers, the
 * theme and the nav) is still mounted above this, so it can use the real
 * error surface.
 */

import { Box } from '@mui/material';
import ErrorState from '@/components/async/ErrorState';
import { color } from '@/theme/tokens';

export default function RootError({ error, reset }) {
  return (
    <Box
      sx={{
        minHeight: '60dvh',
        display: 'grid',
        placeItems: 'center',
        bgcolor: color.bg,
        px: 2,
      }}
    >
      <ErrorState
        error={{ message: friendlyMessage(error), status: null }}
        onRetry={reset}
      />
    </Box>
  );
}

/**
 * A render-time throw is not an API error, so it has no typed message. Show
 * something a student can act on and keep the raw text for development.
 */
function friendlyMessage(error) {
  if (process.env.NODE_ENV !== 'production' && error?.message) return error.message;
  return 'This page hit an unexpected problem. Trying again usually clears it.';
}
