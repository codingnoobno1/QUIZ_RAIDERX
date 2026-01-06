// src/hooks/useQuizEditor.js
import { useState } from 'react';

export default function useQuizEditor() {
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState([]);

  const addQuestion = (q) => setQuestions((prev) => [...prev, q]);
  const updateQuestion = (index, q) => {
    const copy = [...questions];
    copy[index] = q;
    setQuestions(copy);
  };
  const removeQuestion = (index) => {
    const copy = [...questions];
    copy.splice(index, 1);
    setQuestions(copy);
  };

  const resetQuiz = () => {
    setTitle('');
    setQuestions([]);
  };

  return {
    title,
    setTitle,
    questions,
    addQuestion,
    updateQuestion,
    removeQuestion,
    resetQuiz,
  };
}
