'use client';
import { useState, useEffect } from 'react';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Container from '@mui/material/Container';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import Badge from '@mui/material/Badge';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import FacultyCard from '@/components/ui/profilecard'; // Make sure this uses the Unacademy style

export default function QuizHome({ setSelectedFaculty }) {
  const [facultyData, setFacultyData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchFacultyData() {
      try {
        const res = await fetch('/api/quizcardfetch');
        if (!res.ok) throw new Error('Failed to fetch faculty data');
        const data = await res.json();
        setFacultyData(data);
      } catch (err) {
        console.error('Error loading faculty:', err);
        setError('Failed to load faculty data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchFacultyData();
  }, []);

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f9fbfd, #e8f0ff)',
      }}
    >
      {/* Sidebar */}
      <Box
        component="aside"
        sx={{
          width: { xs: 60, sm: 220 },
          bgcolor: '#ffffff',
          height: '100vh',
          position: 'fixed',
          overflowY: 'auto',
          borderRight: '1px solid #d0e3ef',
        }}
      >
        <Sidebar />
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          ml: { xs: 7.5, sm: 27.5 },
          py: 4,
          px: { xs: 2, sm: 6 },
          minHeight: '100vh',
          color: '#1a1a1a',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          {/* Logo + Title */}
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            gap={2}
            mb={4}
            flexDirection="column"
          >
            <Avatar
              src="/unacademy-logo.svg"
              alt="Unacademy Logo"
              sx={{ width: 60, height: 60 }}
            />
            <Typography
              variant="h4"
              sx={{
                fontWeight: 'bold',
                color: '#22c1c3',
                textShadow: '0 0 8px rgba(34, 193, 195, 0.3)',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              Quiz Raider X
            </Typography>
          </Box>

          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 12 }}>
              <CircularProgress size={60} sx={{ color: '#22c1c3' }} />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mb: 4 }}>
              {error}
            </Alert>
          ) : facultyData.length === 0 ? (
            <Typography
              align="center"
              variant="h6"
              sx={{ mt: 5, color: '#666' }}
            >
              No faculty data available.
            </Typography>
          ) : (
            <Container maxWidth="lg">
              <Grid container spacing={4} justifyContent="center">
                {facultyData.map((faculty) => {
                  const quizCount = faculty?.quizCount || 0;

                  return (
                    <Grid item xs={12} sm={6} md={4} key={faculty.uuid || faculty.name}>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.97 }}
                        transition={{ type: 'spring', stiffness: 220, damping: 15 }}
                        style={{
                          borderRadius: '20px',
                          background: 'linear-gradient(to bottom right, #ffffff, #e8f0ff)',
                          padding: '20px',
                          boxShadow: '0 4px 20px rgba(34, 193, 195, 0.12)',
                        }}
                      >
                        <Box display="flex" justifyContent="flex-end" mb={1}>
                          <Tooltip title="Quizzes Assigned">
                            <Badge
                              badgeContent={quizCount}
                              color="primary"
                              sx={{
                                '& .MuiBadge-badge': {
                                  backgroundColor: '#22c1c3',
                                  color: 'white',
                                  fontWeight: 'bold',
                                  fontSize: '0.75rem',
                                },
                              }}
                            />
                          </Tooltip>
                        </Box>

                        <FacultyCard
                          faculty={faculty}
                          onClick={() => setSelectedFaculty(faculty)}
                        />
                      </motion.div>
                    </Grid>
                  );
                })}
              </Grid>
            </Container>
          )}
        </motion.div>
      </Box>
    </Box>
  );
}
