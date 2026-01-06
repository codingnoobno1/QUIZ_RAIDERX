'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Custom cookie-based storage
const cookieStorage = {
  getItem: (name) => {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  },
  setItem: (name, value) => {
    if (typeof document === 'undefined') return;
    const expires = new Date(Date.now() + 15 * 60 * 1000).toUTCString(); // 15 minutes
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
  },
  removeItem: (name) => {
    if (typeof document === 'undefined') return;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
  },
};

export const useLoginTokenStore = create(
  persist(
    (set, get) => ({
      token: null,
      sessionId: null,
      userInfo: null,
      loginTime: null,
      expiryTime: null,

      setLoginData: ({ token, sessionId, userInfo, loginTime, expiryTime }) => {
        set({ token, sessionId, userInfo, loginTime, expiryTime });
      },

      clearLoginData: () => {
        ['token', 'sessionId', 'userInfo', 'loginTime', 'expiryTime'].forEach((key) =>
          cookieStorage.removeItem(`login-token-storage-${key}`)
        );
        set({
          token: null,
          sessionId: null,
          userInfo: null,
          loginTime: null,
          expiryTime: null,
        });
      },

      isSessionValid: () => {
        const expiry = get().expiryTime;
        return expiry && Date.now() < expiry;
      },
    }),
    {
      name: 'login-token-storage',
      storage: cookieStorage,
      partialize: (state) => ({
        token: state.token,
        sessionId: state.sessionId,
        userInfo: JSON.stringify(state.userInfo),
        loginTime: state.loginTime,
        expiryTime: state.expiryTime,
      }),
    }
  )
);
