// ❌ DO NOT put 'use client' here

import Providers from './providers';
import MainAppWrapper from '@/components/layouts/MainAppWrapper';

export const metadata = {
  title: 'Pixel Quiz Raiderx',

  description: 'A simple login/register page',
};

/**
 * `viewportFit: 'cover'` is what makes `env(safe-area-inset-*)` resolve to real
 * numbers on iPhone. Without it the bottom nav sits under the home indicator.
 * `maximumScale: 1` on an app-shell UI stops iOS zooming the whole page when a
 * field is focused — inputs are set to 16px so nothing is unreadable.
 */
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#0a0a0f',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>
        <Providers>
          <MainAppWrapper>
            {children}
          </MainAppWrapper>
        </Providers>
      </body>
    </html>
  );
}
