'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, Typography, Button, CardMedia, Grid, Avatar, Divider } from '@mui/material';
import QuizQuestion from './QuizQuestion';
import PageTitle from '../ui/PageTitle';

const facultyData = [
  {
    name: 'Faculty 1',
    subject: 'DSA',
    numberOfQuizzes: 4,
    questionLevel: 'Gate/Interview Style',
    imageUrl: 'https://media.geeksforgeeks.org/wp-content/cdn-uploads/20200922124319/Singly-Linked-List1.png',
    quizzes: [
      { title: 'DSA - Graphs', id: 'graph' },
      { title: 'DSA - Linked List', id: 'linked-list' },
    ]
  },
  {
    name: 'Faculty 2',
    subject: 'Algorithms',
    numberOfQuizzes: 3,
    questionLevel: 'Competitive Programming',
    imageUrl: 'https://media.geeksforgeeks.org/wp-content/uploads/20200630123458/tree_vs_graph.jpg',
    quizzes: [
      { title: 'Algorithms - Sorting', id: 'sorting' },
      { title: 'Algorithms - Searching', id: 'searching' },
    ]
  },
  {
    name: 'Faculty 3',
    subject: 'Data Structures',
    numberOfQuizzes: 5,
    questionLevel: 'Interview Style',
    imageUrl: 'https://media.geeksforgeeks.org/wp-content/cdn-uploads/20200922124319/Singly-Linked-List1.png',
    quizzes: [
      { title: 'DS - Stack', id: 'stack' },
      { title: 'DS - Queue', id: 'queue' },
    ]
  }
];

export default function QuizSection() {
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [quizScore, setQuizScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [selectedQuiz, setSelectedQuiz] = useState(null);

  const currentQuiz = facultyData
    .find(faculty => faculty.name === selectedFaculty)
    ?.quizzes.find(quiz => quiz.id === selectedQuiz);

  const handleNext = () => {
    if (selectedAnswer === currentQuiz?.answer) {
      setQuizScore((prev) => prev + 1);
    }
    if (quizIndex + 1 < quizQuestions.length) {
      setQuizIndex((prev) => prev + 1);
      setSelectedAnswer(null);
    } else {
      setIsFinished(true);
    }
  };

  return (
    <motion.div
      className="bg-white p-6 rounded-lg shadow-lg max-w-lg mx-auto"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <PageTitle>Quiz</PageTitle>

      {/* Faculty Selector */}
      <Grid container spacing={3}>
        {facultyData.map((faculty) => (
          <Grid item xs={12} sm={6} md={4} key={faculty.name}>
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card sx={{ maxWidth: 345, cursor: 'pointer' }} onClick={() => setSelectedFaculty(faculty.name)}>
                <CardMedia
                  component="img"
                  height="140"
                  image={faculty.imageUrl}
                  alt="Faculty Image"
                />
                <CardContent>
                  <Typography variant="h6" component="div">{faculty.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{faculty.subject}</Typography>
                  <Typography variant="body2" color="text.secondary">Quizzes: {faculty.numberOfQuizzes}</Typography>
                  <Typography variant="body2" color="text.secondary">Level: {faculty.questionLevel}</Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Display Quizzes under selected Faculty */}
      {selectedFaculty && (
        <motion.div
          className="mt-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Typography variant="h5" gutterBottom>Choose a Quiz under {selectedFaculty}</Typography>
          <Grid container spacing={3}>
            {facultyData
              .find(faculty => faculty.name === selectedFaculty)
              ?.quizzes.map((quiz) => (
                <Grid item xs={12} sm={6} md={4} key={quiz.id}>
                  <Card sx={{ maxWidth: 345 }}>
                    <CardContent>
                      <Typography variant="h6" component="div">{quiz.title}</Typography>
                    </CardContent>
                    <Divider />
                    <Button
                      variant="contained"
                      onClick={() => setSelectedQuiz(quiz.id)}
                      fullWidth
                    >
                      Start Quiz
                    </Button>
                  </Card>
                </Grid>
              ))}
          </Grid>
        </motion.div>
      )}

      {/* Quiz Component */}
      {selectedQuiz && !isFinished && (
        <>
          <QuizQuestion
            question={currentQuiz?.question}
            options={currentQuiz?.options}
            selected={selectedAnswer}
            onSelect={setSelectedAnswer}
          />
          <Button
            onClick={handleNext}
            variant="contained"
            color="primary"
            className="mt-4 w-full"
          >
            {quizIndex + 1 < quizQuestions.length ? 'Next' : 'Finish Quiz'}
          </Button>
        </>
      )}

      {/* Quiz Completion */}
      {isFinished && (
        <div className="text-center">
          <Typography variant="h5" gutterBottom>Quiz Completed!</Typography>
          <Typography variant="h6">Your Score: {quizScore}/{quizQuestions.length}</Typography>
        </div>
      )}
    </motion.div>
  );
}
