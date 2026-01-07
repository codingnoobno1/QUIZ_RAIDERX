// src/store/useUserStore.js
import { create } from 'zustand';

// Constants
const SESSION_DURATION_MS = 15 * 60 * 1000; // 15 minutes

const useUserStore = create((set, get) => {
  // Zustand store definition
  const initialState = {
    user: null,
    loginTime: null,

    // Hydration method to be called in a Client Component
    hydrateUser: () => {
      if (typeof window === 'undefined') return;

      const savedUser = JSON.parse(localStorage.getItem('user'));
      const savedLoginTime = parseInt(localStorage.getItem('loginTime'));

      const isSessionValid = savedLoginTime && (Date.now() - savedLoginTime < SESSION_DURATION_MS);

      if (!isSessionValid) {
        localStorage.removeItem('user');
        localStorage.removeItem('loginTime');
        set({ user: null, loginTime: null });
      } else {
        set({ user: savedUser, loginTime: savedLoginTime });
      }
    },

    setUser: (userData, loginTime) => {
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('loginTime', loginTime.toString());
      set({
        user: {
          ...userData,
          enrollmentNumber: userData.enrollmentNumber,
          course: userData.course,
          semester: userData.semester,
        },
        loginTime,
      });
    },

    logout: () => {
      localStorage.removeItem('user');
      localStorage.removeItem('loginTime');
      set({ user: null, loginTime: null });
    },
  };

  return initialState;
});

export default useUserStore;
