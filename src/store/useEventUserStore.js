// src/store/useEventUserStore.js
import { create } from 'zustand';

const SESSION_DURATION_MS = 15 * 60 * 1000; // 15 minutes

const useEventUserStore = create((set) => {
    return {
        user: null,
        loginTime: null,

        hydrateUser: () => {
            if (typeof window === 'undefined') return;

            const savedUser = JSON.parse(localStorage.getItem('eventUser'));
            const savedLoginTime = parseInt(localStorage.getItem('eventLoginTime'));

            const isSessionValid = savedLoginTime && (Date.now() - savedLoginTime < SESSION_DURATION_MS);

            if (!isSessionValid) {
                localStorage.removeItem('eventUser');
                localStorage.removeItem('eventLoginTime');
                set({ user: null, loginTime: null });
            } else {
                set({ user: savedUser, loginTime: savedLoginTime });
            }
        },

        setUser: (userData, loginTime) => {
            localStorage.setItem('eventUser', JSON.stringify(userData));
            localStorage.setItem('eventLoginTime', loginTime.toString());
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
            localStorage.removeItem('eventUser');
            localStorage.removeItem('eventLoginTime');
            set({ user: null, loginTime: null });
        },
    };
});

export default useEventUserStore;
