// src/app/api/quizfetch/[quizId]/route.js
import { NextResponse } from 'next/server';

const mockQuestions = {
  "65c7a1b2c3d4e5f6a7b8c9d0": [ // Quiz ID for "Data Structures Basics"
    {
      id: "q1_ds",
      type: "mcq",
      text: "What is a stack?",
      options: ["LIFO", "FIFO", "Random", "Indexed"],
      answer: "LIFO",
      level: "Easy",
      time: 30,
      score: 10
    },
    {
      id: "q2_ds",
      type: "fillup",
      text: "A queue is a ____ data structure.",
      answer: "FIFO",
      level: "Medium",
      time: 45,
      score: 15
    }
  ],
  "65c7a1b2c3d4e5f6a7b8c9d1": [ // Quiz ID for "Algorithms Advanced"
    {
      id: "q3_algo",
      type: "mcq",
      text: "Which algorithm has the best worst-case time complexity for sorting?",
      options: ["Bubble Sort", "Quick Sort", "Merge Sort", "Insertion Sort"],
      answer: "Merge Sort",
      level: "Hard",
      time: 60,
      score: 20
    },
    {
      id: "q4_algo",
      type: "truefalse",
      text: "Dijkstra's algorithm works with negative edge weights.",
      answer: "False",
      level: "Medium",
      time: 40,
      score: 15
    }
  ],
  "65c7a1b2c3d4e5f6a7b8c9d2": [ // Quiz ID for "Database Fundamentals"
    {
      id: "q5_db",
      type: "mcq",
      text: "What does SQL stand for?",
      options: ["Structured Query Language", "Standard Question Language", "Simple Query Logic", "Sequential Query Language"],
      answer: "Structured Query Language",
      level: "Easy",
      time: 25,
      score: 10
    },
    {
      id: "q6_db",
      type: "fillup",
      text: "A primary key uniquely identifies a ____ in a table.",
      answer: "record",
      level: "Medium",
      time: 35,
      score: 12
    }
  ],
  "65c7a1b2c3d4e5f6a7b8c9d3": [ // Quiz ID for "Web Dev Basics"
    {
      id: "q7_web",
      type: "mcq",
      text: "Which language is used for styling web pages?",
      options: ["HTML", "JavaScript", "CSS", "Python"],
      answer: "CSS",
      level: "Easy",
      time: 20,
      score: 8
    },
    {
      id: "q8_web",
      type: "truefalse",
      text: "JavaScript is a compiled language.",
      answer: "False",
      level: "Medium",
      time: 30,
      score: 10
    }
  ]
};

export async function GET(request, { params }) {
  const { quizId } = params;

  if (!quizId) {
    return NextResponse.json({ error: 'Quiz ID is required' }, { status: 400 });
  }

  const questions = mockQuestions[quizId];

  if (!questions) {
    return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
  }

  return NextResponse.json({ questions });
}
