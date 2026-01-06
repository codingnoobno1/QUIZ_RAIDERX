'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  Box,
  Avatar,
  Chip,
  Divider,
  Paper,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  User,
  Mail,
  BookOpen,
  Calendar,
  Award,
  BookOpenCheck,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import QuizSelector from './QuizSelector';

const CardFullscreen = ({ open, handleClose, faculty, quizzes = [] }) => {
  if (!faculty) return null;

  return (
    <Dialog
      fullScreen
      open={open}
      onClose={handleClose}
      sx={{
        '& .MuiDialog-paper': {
          bgcolor: '#050505',
          color: '#FFD700',
          p: 0,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        },
      }}
    >
      <Box sx={{ position: 'relative', minHeight: '100vh', py: 8, px: { xs: 2, md: 8 } }}>
        <Button
          onClick={handleClose}
          sx={{
            position: 'fixed',
            top: 24,
            right: 24,
            color: '#FFD700',
            zIndex: 10,
            bgcolor: 'rgba(0,0,0,0.5)',
            '&:hover': { bgcolor: 'rgba(50,50,50,0.5)' },
          }}
        >
          <X size={32} />
        </Button>

        <Grid container spacing={6}>
          {/* Left Column - Profile Details */}
          <Grid item xs={12} md={4}>
            <motion.div
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  bgcolor: '#0e0e0e',
                  borderRadius: 6,
                  border: '1px solid rgba(255,215,0,0.3)',
                  textAlign: 'center',
                }}
              >
                <Avatar
                  src={faculty.imageUrl || '/default-avatar.png'}
                  sx={{
                    width: 200,
                    height: 200,
                    mx: 'auto',
                    mb: 3,
                    border: '4px solid #FFD700',
                    boxShadow: '0 0 30px rgba(255,215,0,0.4)',
                  }}
                />
                <Typography variant="h4" fontWeight={800} sx={{ color: '#FFD700', mb: 1 }}>
                  {faculty.name}
                </Typography>
                <Typography variant="h6" sx={{ color: '#f3ce3c', mb: 3 }}>
                  {faculty.position || faculty.Position}
                </Typography>

                <Divider sx={{ bgcolor: 'rgba(255,215,0,0.2)', my: 3 }} />

                <Box sx={{ textAlign: 'left' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5 }}>
                    <BookOpen size={20} color="#FFD700" style={{ marginRight: 12 }} />
                    <Typography variant="body1" sx={{ color: '#ccc' }}>
                      {faculty.department}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Award size={20} color="#FFD700" style={{ marginRight: 12 }} />
                    <Typography variant="body1" sx={{ color: '#ccc' }}>
                      Senior Faculty
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </motion.div>
          </Grid>

          {/* Right Column - Quizzes & Assignments */}
          <Grid item xs={12} md={8}>
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Box sx={{ mb: 6 }}>
                <Typography
                  variant="h3"
                  fontWeight={900}
                  sx={{
                    color: '#FFD700',
                    mb: 4,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                  }}
                >
                  <TrendingUp size={40} />
                  Academic Profile
                </Typography>

                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#FFD700' }}>
                  Managed Subjects
                </Typography>
                <Grid container spacing={1.5}>
                  {faculty.classAssignments?.flatMap(a => a.subjects).map((subj, idx) => (
                    <Grid item key={idx}>
                      <Chip
                        label={subj.name || subj}
                        sx={{
                          bgcolor: '#141414',
                          border: '1px solid rgba(255,215,0,0.4)',
                          color: '#FFD700',
                          fontWeight: 500,
                          '&:hover': { bgcolor: '#222' }
                        }}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Box>

              <Box>
                <Typography
                  variant="h4"
                  fontWeight={800}
                  sx={{
                    color: '#FFD700',
                    mb: 4,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                  }}
                >
                  <BookOpenCheck size={32} />
                  Available Quizzes
                </Typography>

                <QuizSelector faculty={faculty} />
              </Box>
            </motion.div>
          </Grid>
        </Grid>
      </Box>
    </Dialog>
  );
};

export default CardFullscreen;
