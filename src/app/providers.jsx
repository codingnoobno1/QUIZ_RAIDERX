'use client';

import { useState } from 'react';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import * as Tooltip from '@radix-ui/react-tooltip';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import theme from '@/theme';
import { ApiErrorType } from '@/lib/apiClient';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        // apiClient already retries transient failures with backoff; retrying
        // again here would multiply the wait. Only 5xx gets one more shot.
        retry: (failureCount, error) =>
          failureCount < 1 && error?.type === ApiErrorType.SERVER_ERROR,
      },
      mutations: { retry: false },
    },
  });
}

export default function Providers({ children }) {
  // One client per browser session; useState so it survives re-renders but is
  // never shared across requests during SSR.
  const [queryClient] = useState(makeQueryClient);

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline enableColorScheme />
          <Tooltip.Provider delayDuration={250}>
            {children}
          </Tooltip.Provider>
          <Toaster position="top-center" reverseOrder={false} />
        </ThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
