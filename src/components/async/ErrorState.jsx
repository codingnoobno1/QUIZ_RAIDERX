'use client';

/**
 * The one error surface. Ported from `widgets/error_dialog.dart`.
 *
 * Shows the typed message the API client produced (a human sentence, not
 * "Failed to load"), and always offers a retry.
 */

import { Box, Button, Typography } from '@mui/material';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import ReportGmailerrorredRoundedIcon from '@mui/icons-material/ReportGmailerrorredRounded';
import WifiOffRoundedIcon from '@mui/icons-material/WifiOffRounded';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { color, radius, tint } from '@/theme/tokens';
import { ApiErrorType } from '@/lib/apiClient';

const ICONS = {
  [ApiErrorType.NETWORK]: WifiOffRoundedIcon,
  [ApiErrorType.TIMEOUT]: WifiOffRoundedIcon,
  [ApiErrorType.UNAUTHORIZED]: LockOutlinedIcon,
  [ApiErrorType.FORBIDDEN]: LockOutlinedIcon,
};

export default function ErrorState({ error, onRetry, compact = false }) {
  const Icon = ICONS[error?.type] ?? ReportGmailerrorredRoundedIcon;
  const message = error?.message || 'Something unexpected happened.';

  return (
    <Box
      role="alert"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1.5,
        textAlign: 'center',
        px: 3,
        py: compact ? 3 : 6,
        mx: 'auto',
        maxWidth: 420,
      }}
    >
      <Box
        sx={{
          width: 56,
          height: 56,
          display: 'grid',
          placeItems: 'center',
          borderRadius: '50%',
          bgcolor: tint(color.red, 0.1),
          border: `1px solid ${tint(color.red, 0.25)}`,
        }}
      >
        <Icon sx={{ color: color.red, fontSize: 28 }} />
      </Box>

      <Typography sx={{ color: color.text, fontWeight: 700, fontSize: '1rem' }}>
        That didn&apos;t load
      </Typography>

      <Typography variant="body2" sx={{ color: color.textMuted }}>
        {message}
      </Typography>

      {error?.status ? (
        <Typography variant="caption" sx={{ color: color.textFaint, letterSpacing: 1 }}>
          ERROR {error.status}
        </Typography>
      ) : null}

      {onRetry && (
        <Button
          onClick={() => onRetry()}
          startIcon={<RefreshRoundedIcon />}
          variant="outlined"
          sx={{
            mt: 1,
            minHeight: 44, // iOS minimum touch target
            borderRadius: `${radius.md}px`,
            textTransform: 'none',
            fontWeight: 700,
            color: color.brand,
            borderColor: tint(color.brand, 0.4),
            '&:hover': { borderColor: color.brand, bgcolor: tint(color.brand, 0.08) },
          }}
        >
          Try again
        </Button>
      )}
    </Box>
  );
}
