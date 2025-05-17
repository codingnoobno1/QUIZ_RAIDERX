// components/session.js
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useSessionStore from '../store/session_store';

const Session = () => {
  const router = useRouter();
  const { loginTime, setLoginTime, clearSession } = useSessionStore();

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch('/api/session');
        const data = await res.json();

        if (data.loginTime) {
          setLoginTime(data.loginTime);
        } else {
          clearSession();
          router.push('/');
        }
      } catch (err) {
        console.error('Session fetch failed:', err);
        clearSession();
        router.push('/');
      }
    };

    fetchSession();

    const interval = setInterval(() => {
      const storedTime = useSessionStore.getState().loginTime;
      if (!storedTime) return;

      const now = Date.now();
      const diff = now - storedTime;

      if (diff > 15 * 60 * 1000) { // 15 minutes
        console.warn('Session expired');
        clearSession();
        router.push('/');
      }
    }, 10000); // check every 10 seconds

    return () => clearInterval(interval);
  }, []);

  return null;
};

export default Session;
