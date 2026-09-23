"use client";

import { Moon, Sun } from "lucide-react";

export default function QuizThemeToggle({ theme, onToggle }) {
  const isBright = theme === "bright";

  return (
    <button
      type="button"
      className="quiz-theme-toggle"
      onClick={onToggle}
      aria-label={`Switch to ${isBright ? "dark" : "bright"} theme`}
      title={`Switch to ${isBright ? "dark" : "bright"} theme`}
    >
      <span className="quiz-theme-toggle__icon" aria-hidden="true">
        {isBright ? <Sun size={17} /> : <Moon size={17} />}
      </span>
      <span>{isBright ? "Bright" : "Dark"}</span>
    </button>
  );
}
