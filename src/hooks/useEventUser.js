'use client';

/**
 * Event-attendee session, in one place.
 *
 * The old dashboard read `localStorage` inline in three different effects and
 * raced its own redirect on a 200ms timer. This hook is the single source:
 * hydrate once, expose a settled `status`, and let callers decide.
 *
 * (This still uses the localStorage `eventUser` store — collapsing the app's
 * parallel auth systems is gap G38 and is deliberately out of scope here.)
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useEventUserStore from '@/store/useEventUserStore';

export default function useEventUser({ redirectTo = '/event' } = {}) {
  const router = useRouter();
  const user = useEventUserStore((s) => s.user);
  const hydrateUser = useEventUserStore((s) => s.hydrateUser);
  const logout = useEventUserStore((s) => s.logout);

  // 'loading' until hydration has actually run — otherwise the first paint
  // looks unauthenticated and we bounce a signed-in user to the login page.
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    hydrateUser();
    setStatus('settled');
  }, [hydrateUser]);

  useEffect(() => {
    if (status === 'settled' && !user && redirectTo) router.replace(redirectTo);
  }, [status, user, redirectTo, router]);

  return {
    user,
    isLoading: status === 'loading',
    isAuthenticated: Boolean(user),
    /** Stable id for the live-engine endpoints. */
    participantId: user?.email ?? null,
    signOut: () => {
      logout();
      router.replace(redirectTo);
    },
  };
}
