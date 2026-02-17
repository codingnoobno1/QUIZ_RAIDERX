'use client';
import EventQuizSection from './EventQuizSection';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import DialogTitle from '@mui/material/DialogTitle';
import Alert from '@mui/material/Alert';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Fade from '@mui/material/Fade';
import Paper from '@mui/material/Paper';
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
        minHeight: '100vh',
        color: '#e5e7eb',
        px: { xs: 1.5, md: 2.5 },
        py: 2,
        width: '100%',
        maxWidth: 1400,
        ml: 0,
      }}
    >
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
        <Typography
          variant="h4"
          fontWeight={700}
          sx={{ mb: 0.5, ml: 1, textAlign: 'left' }}
        >
          Quiz Hub
        </Typography>

        <Typography sx={{ color: '#888', mb: 3 }}>
          Select a mentor to access quizzes
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
          <Box sx={{ mt: 2 }}>
            <Grid
              container
              spacing={3}
              sx={{
                width: '100%',
                maxWidth: 1400,
              }}
            >
              {facultyData.map((faculty, idx) => (
                <Grid
                  item
                  key={faculty.uuid || faculty.name}
                  xs={6}
                  sm={4}
                  md={3}
                  lg={3}
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    whileHover={{ y: -4 }}
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
          </Box>
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
            backgroundColor: '#0b0b0c',
            borderLeft: '1px solid #222',
            color: '#fff',
            p: 0,
          },
        }}
      >
        {selectedFaculty && (
          <Box sx={{ maxWidth: 1200, mx: 'auto', width: '100%', height: '100%', p: { xs: 2, md: 6 }, overflowY: 'auto' }}>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
              <Box sx={{ mb: 4 }}>
                <Typography variant="h5" fontWeight={700}>
                  {selectedFaculty.name}
                </Typography>
                <Typography sx={{ color: '#888', fontSize: 14 }}>
                  {selectedFaculty.department}
                </Typography>
              </Box>
            </motion.div>

            <Grid container spacing={4}>
              {/* Left Panel: Selection */}
              <Grid item xs={12} md={3}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    border: '1px solid #222',
                    bgcolor: '#111113',
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="subtitle2" fontWeight={600} color="#888" mb={2} display="flex" alignItems="center" gap={1}>
                    Filter Options
                  </Typography>
                  <Stack spacing={2.5}>
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
              <Grid item xs={12} md={9}>

                {!selectedBatch || !selectedSubject ? (
                  <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" minHeight={300} sx={{ opacity: 0.5 }}>
                    <SubjectIcon sx={{ fontSize: 60, mb: 2 }} />
                    <Typography variant="h6">Please select a Batch and Subject to view quizzes.</Typography>
                  </Box>
                ) : (
                  <Box>
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
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
                      <Grid container spacing={2}>
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
    </Box >
  );
}
