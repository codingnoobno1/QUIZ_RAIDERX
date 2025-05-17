// src/store/useUserStore.js
import { create } from 'zustand';

// Constants
const SESSION_DURATION_MS = 15 * 60 * 1000; // 15 minutes

const useUserStore = create((set, get) => {
  // Load from localStorage if still valid
  const savedUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user')) : null;
  const savedLoginTime = typeof window !== 'undefined' ? parseInt(localStorage.getItem('loginTime')) : null;

  // If expired, clear
  const isSessionValid = savedLoginTime && (Date.now() - savedLoginTime < SESSION_DURATION_MS);
  if (!isSessionValid) {
    localStorage.removeItem('user');
    localStorage.removeItem('loginTime');
  }

  // Zustand store definition
  const initialState = {
    user: isSessionValid ? savedUser : null,
    loginTime: isSessionValid ? savedLoginTime : null,

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
