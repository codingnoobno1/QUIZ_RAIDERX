'use client';

import { Box, Typography, Button } from '@mui/material';

const CircuitCard = ({ name, role, subjects = [], onQuizSelect }) => {
  return (
    <Box
      sx={{
        position: 'relative',
        width: 360,
        minHeight: 500,
        borderRadius: 3,
        overflow: 'hidden',
        backgroundColor: '#0c0c0c',
        border: '2px solid #FFD700',
        boxShadow: '0 0 30px rgba(255, 215, 0, 0.2)',
        '&::before, &::after': {
          content: '""',
          position: 'absolute',
          backgroundColor: '#FFD700',
        },
        '&::before': {
          top: '20px',
          left: '20px',
          width: 'calc(100% - 40px)',
          height: '2px',
        },
        '&::after': {
          top: '20px',
          left: '20px',
          width: '2px',
          height: 'calc(100% - 40px)',
        },
      }}
    >
      <Box
        sx={{
          position: 'relative',
          zIndex: 2,
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '100%',
          color: '#FFD700',
          fontFamily: 'Poppins, sans-serif',
        }}
      >
        {/* Name */}
        <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
          {name}
        </Typography>

        {/* Role */}
        <Typography variant="body2" sx={{ color: '#aaa', mb: 3 }}>
          <strong>Role:</strong> {role}
        </Typography>

        {/* Subjects Grid */}
        <Box sx={{ width: '100%', mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Assigned Subjects
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))',
              gap: 8,
              justifyItems: 'center',
            }}
          >
            {subjects.length > 0 ? (
              subjects.map((subj, idx) => (
                <Box
                  key={idx}
                  sx={{
                    fontSize: '0.75rem',
                    px: 1.5,
                    py: 0.5,
                    borderRadius: '6px',
                    border: '1px solid #FFD700',
                    color: '#FFD700',
                    textAlign: 'center',
                    backgroundColor: '#1a1a1a',
                  }}
                >
                  {subj}
                </Box>
              ))
            ) : (
              <Typography variant="body2" sx={{ color: '#777' }}>
                No Subjects Assigned
              </Typography>
            )}
          </Box>
        </Box>

        {/* Button */}
        <Box textAlign="center" sx={{ width: '100%' }}>
          <Button
            fullWidth
            variant="outlined"
            onClick={onQuizSelect}
            sx={{
              borderColor: '#FFD700',
              color: '#FFD700',
              fontWeight: 'bold',
              textTransform: 'none',
              borderRadius: '6px',
              '&:hover': {
                backgroundColor: '#FFD700',
                color: '#0c0c0c',
              },
            }}
          >
            View Quizzes
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default CircuitCard;
