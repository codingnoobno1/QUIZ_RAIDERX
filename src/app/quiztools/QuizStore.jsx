// src/store/QuizStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useQuizStore = create(
  persist(
    (set, get) => ({
      currentBatch: null,
      currentSubject: null,
      selectedQuiz: null,
      questions: [],

      setCurrentBatch: (batch) => set({ currentBatch: batch }),
      setCurrentSubject: (subject) => set({ currentSubject: subject }),
      setSelectedQuiz: (quiz) => set({ selectedQuiz: quiz }),

      addQuestion: (question) =>
        set((state) => ({ questions: [...state.questions, question] })),

      clearQuiz: () =>
        set({
          currentBatch: null,
          currentSubject: null,
          selectedQuiz: null,
          questions: [],
        }),
    }),
    { name: 'quiz-meta-store' }
  )
);

export default useQuizStore;
