// /app/layouts/ResponsiveLayout.jsx
'use client';

import { useMediaQuery, useTheme } from '@mui/material';
import DesktopLayout from './DesktopLayout';
import MobileLayout from './MobileLayout';

export default function ResponsiveLayout({ children }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return isMobile ? (
    <MobileLayout>{children}</MobileLayout>
  ) : (
    <DesktopLayout>{children}</DesktopLayout>
  );
}
