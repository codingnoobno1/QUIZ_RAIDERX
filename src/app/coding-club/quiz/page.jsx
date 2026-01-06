'use client';
import EventQuizSection from './EventQuizSection';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Grid,
  Button,
  Typography,
  CircularProgress,
  Box,
  Dialog,
  DialogContent,
  DialogActions,
  DialogTitle,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Stack,
  Chip,
  Fade,
  Paper
} from '@mui/material';
import { School, Class, Subject as SubjectIcon } from '@mui/icons-material';
import FacultyCard from '@/components/ui/profilecard';
import QuizCard from '@/components/ui/QuizCard';

export default function FacultyPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [facultyData, setFacultyData] = useState([]);
  // ... (keep state variables same)
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [quizzes, setQuizzes] = useState([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchFacultyData() {
      try {
        const res = await fetch('/api/quizcardfetch');
        if (res.ok) {
          const data = await res.json();
          setFacultyData(data);
        } else {
          setError('Failed to fetch faculty data');
        }
      } catch (err) {
        setError('Error connecting to API');
      } finally {
        setIsLoading(false);
      }
    }
    fetchFacultyData();
  }, []);

  // Fetch quizzes when faculty, batch, and subject are selected
  useEffect(() => {
    if (selectedFaculty && selectedBatch && selectedSubject) {
      fetchQuizzes();
    }
  }, [selectedFaculty, selectedBatch, selectedSubject]);

  const fetchQuizzes = async () => {
    setLoadingQuizzes(true);
    try {
      const assignment = selectedFaculty.classAssignments.find(
        a => a.batch === selectedBatch
      );
      const semester = assignment?.semester || 5;

      const response = await fetch(
        `/api/fetchquizzes?batch=${encodeURIComponent(selectedBatch)}&subject=${encodeURIComponent(selectedSubject)}&semester=${semester}`
      );

      if (response.ok) {
        const data = await response.json();
        setQuizzes(data.quizzes || []);
      } else {
        setQuizzes([]);
      }
    } catch (err) {
      console.error('Error fetching quizzes:', err);
      setQuizzes([]);
    } finally {
      setLoadingQuizzes(false);
    }
  };

  // Get available batches and subjects for selected faculty
  const getAvailableBatches = () => {
    if (!selectedFaculty) return [];
    return selectedFaculty.classAssignments?.map(a => a.batch).filter(Boolean) || [];
  };

  const getAvailableSubjects = () => {
    if (!selectedFaculty || !selectedBatch) return [];
    const assignment = selectedFaculty.classAssignments?.find(a => a.batch === selectedBatch);
    return assignment?.subjects?.map(s => s.name || s) || [];
  };

  return (
    <Box
      sx={{
        backgroundColor: '#0a0a0a',
        minHeight: '100vh',
        color: '#e6e6e6',
        px: { xs: 2, md: 8 },
        py: 6,
        background: 'radial-gradient(circle at 50% 10%, #1a1a1a 0%, #0a0a0a 100%)'
      }}
    >
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
        <Typography
          variant="h2"
          sx={{
            textAlign: 'center',
            fontWeight: 800,
            letterSpacing: -2,
            mb: 2,
            background: 'linear-gradient(90deg, #00f260, #0575E6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 40px rgba(5, 117, 230, 0.3)'
          }}
        >
          QUIZ HUB
        </Typography>

        <Typography
          variant="h6"
          sx={{ textAlign: 'center', color: '#888', mb: 8, maxWidth: 600, mx: 'auto', fontWeight: 300 }}
        >
          Select a mentor to access their specialized assessment modules.
        </Typography>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={60} thickness={4} sx={{ color: '#0575E6' }} />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ maxWidth: 600, mx: 'auto', borderRadius: 4 }}>
            {error}
          </Alert>
        ) : facultyData.length === 0 ? (
          <Typography sx={{ textAlign: 'center', color: '#666' }}>
            No mentors found.
          </Typography>
        ) : (
          <Grid container spacing={4} justifyContent="center">
            {facultyData.map((faculty, idx) => (
              <Grid item xs={12} sm={6} md={4} key={faculty.uuid || faculty.name}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ y: -10 }}
                >
                  <FacultyCard
                    faculty={faculty}
                    quizzes={faculty.quizzes}
                    onClick={() => {
                      setSelectedFaculty(faculty);
                      setSelectedBatch('');
                      setSelectedSubject('');
                      setQuizzes([]);
                    }}
                  />
                </motion.div>
              </Grid>
            ))}
          </Grid>
        )}
      </motion.div>

      {/* Enhanced Modal */}
      <Dialog
        open={!!selectedFaculty}
        onClose={() => setSelectedFaculty(null)}
        fullScreen
        TransitionComponent={Fade}
        TransitionProps={{ timeout: 500 }}
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(15, 23, 42, 0.98)',
            backdropFilter: 'blur(20px)',
            color: '#fff',
            p: 0,
          },
        }}
      >
        {selectedFaculty && (
          <Box sx={{ maxWidth: 1200, mx: 'auto', width: '100%', height: '100%', p: { xs: 2, md: 6 }, overflowY: 'auto' }}>

            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <Box display="flex" flexDirection="column" alignItems="center" mb={6}>
                <Typography variant="h3" fontWeight="800" sx={{ background: 'linear-gradient(to right, #4facfe 0%, #00f2fe 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', mb: 1 }}>
                  {selectedFaculty.name}
                </Typography>
                <Chip label={selectedFaculty.department} sx={{ bgcolor: 'rgba(79, 172, 254, 0.2)', color: '#4facfe', fontWeight: 'bold' }} />
              </Box>
            </motion.div>

            <Grid container spacing={4}>
              {/* Left Panel: Selection */}
              <Grid item xs={12} md={4}>
                <Paper elevation={0} sx={{ p: 4, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <Typography variant="h6" color="primary" mb={3} display="flex" alignItems="center" gap={1}>
                    <Class /> Filter Options
                  </Typography>
                  <Stack spacing={4}>
                    <FormControl fullWidth>
                      <InputLabel sx={{ color: '#aaa' }}>Select Batch</InputLabel>
                      <Select
                        value={selectedBatch}
                        label="Select Batch"
                        onChange={(e) => {
                          setSelectedBatch(e.target.value);
                          setSelectedSubject('');
                          setQuizzes([]);
                        }}
                        sx={{
                          color: '#fff',
                          '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#4facfe' },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#4facfe' },
                        }}
                      >
                        {getAvailableBatches().map((batch) => (
                          <MenuItem key={batch} value={batch}>{batch}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl fullWidth disabled={!selectedBatch}>
                      <InputLabel sx={{ color: '#aaa' }}>Select Subject</InputLabel>
                      <Select
                        value={selectedSubject}
                        label="Select Subject"
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        sx={{
                          color: '#fff',
                          '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#4facfe' },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#4facfe' },
                        }}
                      >
                        {getAvailableSubjects().map((subject) => (
                          <MenuItem key={subject} value={subject}>{subject}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Stack>

                  <Button
                    fullWidth
                    variant="outlined"
                    color="error"
                    sx={{ mt: 4, py: 1.5, borderRadius: 3 }}
                    onClick={() => setSelectedFaculty(null)}
                  >
                    Back to Mentors
                  </Button>
                </Paper>
              </Grid>

              {/* Right Panel: Quizzes */}
              <Grid item xs={12} md={8}>

                {!selectedBatch || !selectedSubject ? (
                  <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" minHeight={300} sx={{ opacity: 0.5 }}>
                    <SubjectIcon sx={{ fontSize: 60, mb: 2 }} />
                    <Typography variant="h6">Please select a Batch and Subject to view quizzes.</Typography>
                  </Box>
                ) : (
                  <Box>
                    <Typography variant="h5" fontWeight="bold" mb={3} sx={{ color: '#fff' }}>
                      Available Quizzes
                    </Typography>

                    {loadingQuizzes ? (
                      <Box display="flex" justifyContent="center" p={8}>
                        <CircularProgress size={50} sx={{ color: '#4facfe' }} />
                      </Box>
                    ) : quizzes.length === 0 ? (
                      <Alert severity="info" variant="outlined" sx={{ color: '#4facfe', borderColor: '#4facfe' }}>
                        No quizzes currently available for this selection.
                      </Alert>
                    ) : (
                      <Grid container spacing={3}>
                        <AnimatePresence>
                          {quizzes.map((quiz, i) => (
                            <Grid item xs={12} key={quiz._id}>
                              <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                              >
                                {/* Reusing existing QuizCard but formatted nicely? Assuming QuizCard handles its own display */}
                                <QuizCard quiz={quiz} />
                              </motion.div>
                            </Grid>
                          ))}
                        </AnimatePresence>
                      </Grid>
                    )}
                  </Box>
                )}

              </Grid>
            </Grid>
          </Box>
        )}
      </Dialog>
    </Box>
  );
}
