// src/app/quiztools/createquiz/quizdata.jsx

// Simple in-memory quiz store
class QuizStoreClass {
  constructor() {
    this.questions = [];
  }

  // Add a question
  addQuestion(question) {
    this.questions.push(question);
  }

  // Remove question by index
  removeQuestion(index) {
    this.questions = this.questions.filter((_, i) => i !== index);
  }

  // Get all questions
  getAllQuestions() {
    return [...this.questions];
  }

  // Reset store
  reset() {
    this.questions = [];
  }
}

// Export a singleton instance
export const QuizStore = new QuizStoreClass();
