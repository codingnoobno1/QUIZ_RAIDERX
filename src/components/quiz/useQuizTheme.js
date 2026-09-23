"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "quiz-raider-theme";

export default function useQuizTheme() {
  const [theme, setTheme] = useState("bright");

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(STORAGE_KEY);
    const initialTheme = savedTheme === "dark" ? "dark" : "bright";
    setTheme(initialTheme);
    document.documentElement.dataset.quizTheme = initialTheme;
  }, []);

  const updateTheme = (nextTheme) => {
    setTheme(nextTheme);
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
    document.documentElement.dataset.quizTheme = nextTheme;
  };

  const toggleTheme = () => updateTheme(theme === "bright" ? "dark" : "bright");

  return { theme, setTheme: updateTheme, toggleTheme };
}
