// ❌ DO NOT put 'use client' here

import Providers from './providers';
import MainAppWrapper from '@/components/layouts/MainAppWrapper';

export const metadata = {
  title: 'Pixel Quiz Raiderx',

  description: 'A simple login/register page',
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
