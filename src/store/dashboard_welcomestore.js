'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const getStorage = () => {
  if (typeof window !== 'undefined') return localStorage;
  return {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  };
};

export const useDashboardWelcomeStore = create(
  persist(
    (set) => ({
      userInfo: null,
      setUserInfo: (userInfo) => set({ userInfo }),
      clearUserInfo: () => set({ userInfo: null }),
    }),
    {
      name: 'dashboard-welcome-storage',
      storage: getStorage,  // pass function, NOT getStorage()
      partialize: (state) => ({ userInfo: state.userInfo }),
    }
  )
);
