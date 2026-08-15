'use client';

/**
 * The one loading indicator. Ported from `widgets/cyber_loading.dart`.
 * Colour comes from the design tokens — never a literal.
 */

import { Box, CircularProgress, Typography } from '@mui/material';
import { color, tint } from '@/theme/tokens';

export default function Loading({ label = 'Loading', fullScreen = false, size = 44 }) {
  return (
    <Box
      role="status"
      aria-live="polite"
      aria-label={label}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        py: 6,
        px: 3,
        width: '100%',
        // 100dvh, not 100vh — iOS Safari's collapsing toolbar makes vh overflow.
        minHeight: fullScreen ? '100dvh' : 200,
      }}
    >
      <Box sx={{ position: 'relative', display: 'grid', placeItems: 'center' }}>
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            width: size + 22,
            height: size + 22,
            borderRadius: '50%',
            border: `2px solid ${tint(color.brand, 0.18)}`,
            animation: 'pulseRing 1.6s ease-in-out infinite',
            '@keyframes pulseRing': {
              '0%': { transform: 'scale(1)', opacity: 0.7 },
              '100%': { transform: 'scale(1.35)', opacity: 0 },
            },
            '@media (prefers-reduced-motion: reduce)': { animation: 'none', opacity: 0.3 },
          }}
        />
        <CircularProgress size={size} thickness={3} sx={{ color: color.brand }} />
      </Box>

      {label && (
        <Typography
          variant="caption"
          sx={{
            color: color.textMuted,
            letterSpacing: 2,
            fontWeight: 700,
            textTransform: 'uppercase',
            textAlign: 'center',
          }}
        >
          {label}
        </Typography>
      )}
    </Box>
  );
}
