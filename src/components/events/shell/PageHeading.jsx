'use client';

import { Box, Stack, Typography } from '@mui/material';
import { color } from '@/theme/tokens';

/** One heading treatment for every page in the shell. */
export default function PageHeading({ title, subtitle, action }) {
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="flex-end"
      spacing={2}
      sx={{ mb: 2.5 }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ color: color.text, fontSize: '1.55rem', fontWeight: 700, letterSpacing: '-0.7px' }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography sx={{ color: color.textMuted, fontSize: '0.78rem', mt: 0.5 }}>{subtitle}</Typography>
        )}
      </Box>
      {action}
    </Stack>
  );
}
