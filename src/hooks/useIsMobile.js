'use client';

import { useState, useEffect } from 'react';

/**
 * SSR-safe mobile detection. Returns false on the server and on first client
 * render (so the desktop tree hydrates without mismatch), then syncs to the real
 * viewport on mount and on resize/orientation change.
 */
export default function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const update = () => setIsMobile(mql.matches);
    update();
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, [breakpoint]);

  return isMobile;
}
