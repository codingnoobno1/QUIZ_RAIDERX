'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  Button,
  Stack,
  Paper,
  CircularProgress,
} from '@mui/material';
// import { useRouter } from 'next/navigation';

const QUIZ_TYPES = [
  ...Array.from({ length: 8 }, (_, i) => `Surprise Test ${i + 1}`),
  'Mid Sem',
  'End Sem',
  'Mid Sem Practical',
  'End Sem Practical',
];

export default function QuizGrid({ batch, subject, batchIdx, onCreateQuiz }) {
  const [quizStatusMap, setQuizStatusMap] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!batch || !subject) return;

    const fetchQuizStatus = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/fetchquizzes?batch=${encodeURIComponent(batch.batch || batch.course)}&subject=${encodeURIComponent(subject)}`
        );
        const data = await res.json();

        const map = {};
        data.forEach((quiz) => {
          map[quiz.quizType] = {
            status: 'created',
            quizId: quiz._id,
            scheduledDate: quiz.scheduledDate,
          };
        });

        setQuizStatusMap(map);
      } catch (err) {
        console.error('Failed to fetch quiz statuses', err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizStatus();
  }, [batch, subject]);

  const handleCreateQuiz = (quizType) => {
    if (!batch || !subject) {
      alert('⚠️ Please select batch and subject first.');
      return;
    }
    if (onCreateQuiz) {
      onCreateQuiz({
        quizType,
      });
    }
  };

  const handleEditQuiz = (quizId) => {
    router.push(`/dashboard/quiz_controller/editquiz?id=${quizId}`);
  };

  return (
    <Box>
      <Typography fontWeight={700} mb={2}>
        Quizzes for {batch?.batch} — {subject}
      </Typography>

      {loading ? (
        <CircularProgress />
      ) : (
        <Stack spacing={2}>
          {QUIZ_TYPES.map((quizType) => {
            const quiz = quizStatusMap[quizType];
            const status = quiz ? 'created' : 'not_created';
            const chipLabel = status === 'created' ? 'Created' : 'Not Created';
            const chipColor = status === 'created' ? 'warning' : 'default';

            return (
              <Paper
                key={quizType}
                elevation={2}
                sx={{
                  p: 2,
                  borderRadius: 3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  bgcolor: '#fafafa',
                }}
              >
                <Box>
                  <Typography fontWeight={700} color="#6C3483">
                    {quizType}
                  </Typography>
                  {quiz?.scheduledDate && (
                    <Typography fontSize={13} color="text.secondary">
                      Scheduled: {new Date(quiz.scheduledDate).toLocaleString()}
                    </Typography>
                  )}
                </Box>

                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip label={chipLabel} color={chipColor} sx={{ fontWeight: 600 }} />

                  {status === 'not_created' && (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => handleCreateQuiz(quizType)}
                      size="small"
                    >
                      Create
                    </Button>
                  )}

                  {status === 'created' && (
                    <Button
                      variant="outlined"
                      color="secondary"
                      onClick={() => handleEditQuiz(quiz.quizId)}
                      size="small"
                    >
                      Edit Quiz
                    </Button>
                  )}
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}
