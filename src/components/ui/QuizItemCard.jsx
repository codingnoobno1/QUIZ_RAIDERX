import { Box, Typography, Button, Paper, Stack } from '@mui/material';
import { motion } from 'framer-motion';
import QuizIcon from '@mui/icons-material/AssignmentTurnedIn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

const QuizItemCard = ({ quiz, onClick }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 160, damping: 16 }}
      onClick={() => onClick(quiz)}
      style={{ width: '100%' }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 2,
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #e0f7fa, #b2ebf2)',
          color: '#004d40',
          cursor: 'pointer',
          '&:hover': {
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
          },
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1} mb={1}>
          <QuizIcon sx={{ color: '#00796b' }} />
          <Typography variant="h6" fontWeight={600}>
            {quiz.title}
          </Typography>
        </Stack>
        <Typography variant="body2" color="#00695c" mb={1}>
          Subject: {quiz.subjectId?.name || 'N/A'}
        </Typography>
        <Typography variant="body2" color="#00695c" mb={1}>
          Created By: {quiz.createdBy?.name || 'N/A'}
        </Typography>
        <Stack direction="row" alignItems="center" spacing={0.5} mb={2}>
          <AccessTimeIcon sx={{ fontSize: 16, color: '#00796b' }} />
          <Typography variant="body2" color="#00695c">
            Time Limit: {quiz.timeLimit || 'N/A'} minutes
          </Typography>
        </Stack>
        <Button
          variant="contained"
          size="small"
          sx={{
            backgroundColor: '#00796b',
            '&:hover': { backgroundColor: '#004d40' },
            color: 'white',
            borderRadius: '8px',
            textTransform: 'none',
          }}
          onClick={(e) => {
            e.stopPropagation(); // Prevent onClick of the parent Box
            onClick(quiz);
          }}
        >
          Start Quiz
        </Button>
      </Paper>
    </motion.div>
  );
};

export default QuizItemCard;
