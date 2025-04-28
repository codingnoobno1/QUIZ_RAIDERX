'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, Typography, Button, CardMedia, Box, Grid } from '@mui/material';
import { Face } from '@mui/icons-material';
import { useRouter } from 'next/router';

// Image URLs
const facultyImage = "https://media.geeksforgeeks.org/wp-content/cdn-uploads/20200922124319/Singly-Linked-List1.png";
const quizImage = "https://media.geeksforgeeks.org/wp-content/uploads/20200630123458/tree_vs_graph.jpg";

// List of available quizzes
const quizzes = [
  { name: 'DSA - Graphs', img: quizImage },
  { name: 'DSA - Linked List', img: quizImage },
];

export default function QuizCard() {
  const router = useRouter();
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [quizStarted, setQuizStarted] = useState(false);

  const handleFacultySelect = (faculty) => {
    setSelectedFaculty(faculty);
  };

  const startQuiz = () => {
    setQuizStarted(true);
    // Navigate to the quiz page or show quiz questions (e.g., using router.push)
  };

  return (
    <motion.div
      className="flex justify-center items-center h-screen bg-gray-100"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {!quizStarted ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Card sx={{ width: 300, margin: 2 }}>
            <CardMedia
              component="img"
              height="200"
              image={facultyImage}
              alt="Faculty"
            />
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Faculty 1: DSA
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Name: Prof. John Doe
                <br />
                Subject: Data Structures & Algorithms
                <br />
                Quizzes Offered: 4
              </Typography>
              <Button variant="contained" color="primary" onClick={() => handleFacultySelect('Faculty 1')}>
                Choose Faculty
              </Button>
            </CardContent>
          </Card>

          {selectedFaculty && (
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Typography variant="h6" align="center" className="mt-6">Quizzes under {selectedFaculty}</Typography>
              <Grid container spacing={2} justifyContent="center">
                {quizzes.map((quiz, index) => (
                  <Grid item key={index}>
                    <Card sx={{ width: 200, boxShadow: 3 }}>
                      <CardMedia
                        component="img"
                        height="140"
                        image={quiz.img}
                        alt={quiz.name}
                      />
                      <CardContent>
                        <Typography variant="h6">{quiz.name}</Typography>
                        <Button
                          variant="contained"
                          color="primary"
                          fullWidth
                          className="mt-2"
                          onClick={startQuiz}
                        >
                          Start Quiz
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </motion.div>
          )}
        </Box>
      ) : (
        <div className="text-center">
          <Typography variant="h4">Quiz Started</Typography>
          {/* Render quiz questions here */}
        </div>
      )}
    </motion.div>
  );
}
