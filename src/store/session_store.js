// store/session_store.js
import { create } from 'zustand';

const useSessionStore = create((set) => ({
  loginTime: null,
  setLoginTime: (time) => set({ loginTime: time }),
  clearSession: () => set({ loginTime: null }),
}));

export default useSessionStore;
