'use client';

/**
 * The one empty state. Ported from `widgets/empty_state.dart`.
 *
 * An empty list is a *designed* state, not a blank screen — icon, what it means,
 * and where to go next.
 */

import { Box, Button, Typography } from '@mui/material';
import { color, radius, tint } from '@/theme/tokens';

export default function EmptyState({
  icon: Icon,
  title,
  message,
  action, // { label, onClick } | { label, href }
  accent = color.brand,
  compact = false,
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1.5,
        textAlign: 'center',
        px: 3,
        py: compact ? 4 : 8,
        mx: 'auto',
        maxWidth: 420,
      }}
    >
      {Icon && (
        <Box
          sx={{
            width: 72,
            height: 72,
            display: 'grid',
            placeItems: 'center',
            borderRadius: '50%',
            bgcolor: tint(accent, 0.08),
            border: `1px solid ${tint(accent, 0.2)}`,
          }}
        >
          <Icon sx={{ fontSize: 34, color: tint(accent, 0.8) }} />
        </Box>
      )}

      <Typography sx={{ color: color.text, fontWeight: 700, fontSize: '1.05rem', mt: 0.5 }}>
        {title}
      </Typography>

      {message && (
        <Typography variant="body2" sx={{ color: color.textMuted, lineHeight: 1.6 }}>
          {message}
        </Typography>
      )}

      {action && (
        <Button
          onClick={action.onClick}
          href={action.href}
          variant="contained"
          disableElevation
          sx={{
            mt: 1.5,
            minHeight: 44,
            px: 3,
            borderRadius: `${radius.md}px`,
            textTransform: 'none',
            fontWeight: 700,
            bgcolor: accent,
            color: color.bg,
            '&:hover': { bgcolor: accent, filter: 'brightness(1.1)' },
          }}
        >
          {action.label}
        </Button>
      )}
    </Box>
  );
}
