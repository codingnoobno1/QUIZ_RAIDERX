'use client';

import { useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import { motion } from 'framer-motion';
import { Sparkles, User, BookOpenCheck } from 'lucide-react';
import CardFullscreen from './CardFullscreen';

const FacultyCard = ({ faculty, quizzes = [], onClick }) => {
  const [openDialog, setOpenDialog] = useState(false);

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else {
      setOpenDialog(true);
    }
  };

  const handleClose = () => setOpenDialog(false);

  // ✅ Extract subjects from classAssignments safely
  const allSubjects = useMemo(() => {
    return faculty.classAssignments?.flatMap((a) => a.subjects) || [];
  }, [faculty.classAssignments]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.05 }}
        transition={{ type: 'spring', stiffness: 220, damping: 18 }}
      >
        <Card
          onClick={handleCardClick}
          sx={{
            position: 'relative',
            width: 360,
            minHeight: 520,
            borderRadius: '20px',
            backgroundColor: '#0e0e0e',
            color: '#FFD700',
            boxShadow: '0 0 20px rgba(255, 215, 0, 0.3)',
            border: '1.5px solid rgba(255, 215, 0, 0.5)',
            overflow: 'hidden',
            cursor: 'pointer',
            backdropFilter: 'blur(12px)',
            '&:hover': {
              boxShadow: '0 0 40px rgba(255, 215, 0, 0.6)',
              transform: 'translateY(-4px)',
            },
          }}
        >
          {/* Background */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundImage:
                "url('https://img.freepik.com/premium-photo/circuit-board-patterns_198067-353259.jpg')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: 0.08,
              zIndex: 0,
              filter: 'contrast(1.3)',
            }}
          />

          {/* Amity Logo */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mt: 2.5,
              position: 'relative',
              zIndex: 2,
            }}
          >
            <Box
              component="img"
              src="https://www.amity.edu/volunteer/image/logo.jpg"
              alt="Amity University"
              sx={{
                width: 100,
                height: 'auto',
                borderRadius: 2,
                boxShadow: '0 0 20px rgba(255,215,0,0.5)',
                backgroundColor: '#111',
                p: 0.5,
              }}
            />
          </Box>

          {/* Avatar */}
          <Box display="flex" justifyContent="center" mt={1.5} zIndex={2}>
            <Avatar
              src={faculty.imageUrl || '/default-avatar.png'}
              sx={{
                width: 100,
                height: 100,
                border: '3px solid #FFD700',
                boxShadow: '0 0 12px rgba(255,215,0,0.4)',
              }}
            />
          </Box>

          {/* Main Content */}
          <CardContent sx={{ textAlign: 'center', zIndex: 2 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: '#FFEB3B',
                mt: 1.2,
              }}
            >
              <User size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
              {faculty.name}
            </Typography>

            <Typography variant="body2" sx={{ color: '#f3ce3c', mt: 0.5 }}>
              <Sparkles size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
              {faculty.position || faculty.Position}
            </Typography>

            <Typography variant="body2" sx={{ color: '#ccc', mb: 2 }}>
              Department: {faculty.department}
            </Typography>

            {/* Subjects */}
            <Box
              sx={{
                borderTop: '1px solid rgba(255,215,0,0.25)',
                borderBottom: '1px solid rgba(255,215,0,0.25)',
                py: 1.5,
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#FFD700' }}>
                Assigned Subjects
              </Typography>
              <Grid container spacing={1} justifyContent="center">
                {allSubjects.length > 0 ? (
                  allSubjects.map((subj, idx) => (
                    <Grid item key={idx}>
                      <Chip
                        label={typeof subj === 'object' ? subj.name : subj}
                        size="small"
                        sx={{
                          fontSize: '0.75rem',
                          bgcolor: '#141414',
                          border: '1px solid #FFD700',
                          color: '#FFD700',
                        }}
                      />
                    </Grid>
                  ))
                ) : (
                  <Chip label="No Subjects" size="small" sx={{ color: '#999' }} />
                )}
              </Grid>
            </Box>

            <Button
              variant="outlined"
              fullWidth
              sx={{
                mt: 2,
                color: '#FFD700',
                borderColor: '#FFD700',
                borderRadius: 3,
                fontWeight: 600,
                textTransform: 'none',
                '&:hover': {
                  backgroundColor: '#FFD700',
                  color: '#101010',
                },
              }}
              startIcon={<BookOpenCheck size={16} />}
            >
              View Quizzes
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Fullscreen Modal */}
      {openDialog && (
        <CardFullscreen
          open={openDialog}
          handleClose={handleClose}
          faculty={faculty}
          quizzes={quizzes}
        />
      )}
    </>
  );
};

export default FacultyCard;
