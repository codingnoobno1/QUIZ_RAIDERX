import React from 'react';
import { Box, Typography, Stack, Button } from '@mui/material';
import { useRouter } from 'next/navigation'; // Import useRouter

const QuizSelector = ({ selectedBatch, selectedSemester, selectedSubject, onBack, faculty, quizzes = [] }) => {
  const router = useRouter();

  const filteredQuizzes = quizzes.filter(quiz =>
    quiz.batch === selectedBatch &&
    quiz.semester === selectedSemester &&
    // Assuming subjectId in quiz matches selectedSubject string
    // You might need to adjust this logic based on how subjectId is stored in your mock data
    quiz.subjectId === selectedSubject
  );

  const handleQuizSelect = (quizId) => {
    router.push(`/quizmode/${quizId}`);
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        Choose Quiz for <strong>{selectedSubject}</strong>
      </Typography>

      <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap" sx={{ mt: 2 }}>
        {filteredQuizzes.length === 0 ? (
          <Typography variant="body2" sx={{ color: '#ccc' }}>
            No quizzes found for this selection.
          </Typography>
        ) : (
          filteredQuizzes.map((quiz) => (
            <Button
              key={quiz._id}
              variant="outlined"
              onClick={() => handleQuizSelect(quiz._id)}
              sx={{
                borderColor: '#FFD700',
                color: '#FFD700',
                fontWeight: 'bold',
                m: 1,
                '&:hover': {
                  backgroundColor: '#FFD700',
                  color: '#000',
                  transform: 'scale(1.1)',
                },
              }}
            >
              {quiz.title}
            </Button>
          ))
        )}
      </Stack>

      <Button onClick={onBack} sx={{ mt: 3, color: '#00BFFF', textTransform: 'none' }}>
        ← Change Subject
      </Button>
    </Box>
  );
};

export default QuizSelector;
