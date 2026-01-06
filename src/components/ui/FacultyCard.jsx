// @components/ui/quizcard.jsx
import {
  Box,
  Typography,
  Avatar,
  Chip,
  Stack,
  Button,
  Badge,
  Tooltip,
} from '@mui/material';
import { motion } from 'framer-motion';
import SchoolIcon from '@mui/icons-material/School';
import QuizIcon from '@mui/icons-material/AssignmentTurnedIn';

const QuizCard = ({ faculty, onClick }) => {
  const quizCount = faculty.quizCount || 4; // Optional field if available

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 160, damping: 16 }}
      onClick={onClick}
      style={{ width: '100%' }}
    >
      <Box
        sx={{
          borderRadius: '24px',
          background: 'linear-gradient(135deg, #f9fbfd, #e8f0ff)',
          color: '#1a1a1a',
          p: 3,
          boxShadow: '0 6px 20px rgba(0, 0, 0, 0.08)',
          border: '1px solid #e0e6f0',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          minHeight: 260,
          transition: '0.3s',
          cursor: 'pointer',
          '&:hover': {
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
          },
        }}
      >
        {/* Header with Avatar and Quiz Count Badge */}
        <Box display="flex" alignItems="center" gap={2}>
          <Badge
            overlap="circular"
            badgeContent={
              <Tooltip title="Quizzes Created">
                <Box
                  sx={{
                    backgroundColor: '#22c1c3',
                    color: '#fff',
                    fontSize: '0.65rem',
                    px: 1,
                    py: 0.5,
                    borderRadius: '10px',
                    fontWeight: 'bold',
                  }}
                >
                  {quizCount}
                </Box>
              </Tooltip>
            }
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          >
            <Avatar
              sx={{
                width: 56,
                height: 56,
                bgcolor: '#d1ecf1',
                color: '#007b83',
                fontWeight: 'bold',
                fontSize: 24,
              }}
            >
              {faculty.name?.charAt(0)}
            </Avatar>
          </Badge>
          <Box>
            <Typography variant="subtitle1" fontWeight={600}>
              {faculty.name}
            </Typography>
            <Typography variant="body2" sx={{ color: '#4e5d6c' }}>
              {faculty.role} • {faculty.department}
            </Typography>
          </Box>
        </Box>

        {/* Subjects */}
        <Box mt={1}>
          <Typography
            variant="caption"
            sx={{ color: '#007b83', mb: 1, fontWeight: 600 }}
          >
            Assigned Subjects
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {(faculty.subjects || []).map((subject, idx) => (
              <Chip
                key={idx}
                icon={<SchoolIcon sx={{ color: '#007b83' }} />}
                label={subject}
                size="small"
                sx={{
                  bgcolor: '#e0f7f9',
                  color: '#007b83',
                  fontWeight: 500,
                  borderRadius: '10px',
                }}
              />
            ))}
            {(!faculty.subjects || faculty.subjects.length === 0) && (
              <Chip
                label="No Subjects"
                size="small"
                sx={{
                  bgcolor: '#f0f0f0',
                  color: '#aaa',
                  fontSize: '0.75rem',
                  borderRadius: '10px',
                }}
              />
            )}
          </Stack>
        </Box>

        {/* Action Button */}
        <Box mt="auto" display="flex" justifyContent="flex-end">
          <Button
            variant="contained"
            startIcon={<QuizIcon />}
            sx={{
              textTransform: 'none',
              background: 'linear-gradient(to right, #22c1c3, #42e695)',
              color: '#fff',
              borderRadius: '16px',
              px: 3,
              py: 1,
              fontWeight: 600,
              '&:hover': {
                background: 'linear-gradient(to right, #1ba39c, #32cd95)',
              },
            }}
          >
            View Quizzes
          </Button>
        </Box>
      </Box>
    </motion.div>
  );
};

export default QuizCard;
