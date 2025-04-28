'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
} from '@mui/material';
import Sidebar from '@/components/Sidebar'; // Make sure Sidebar.jsx exists properly
import FacultyCard from '@/components/ui/profilecard'; // Ensure FacultyCard.jsx exists

const facultyData = [
  {
    name: 'Dr. Rata Chauhan',
    department: 'Computer Science',
    role: 'Head of Department',
    subjects: ['Artificial Intelligence', 'Machine Learning', 'Deep Learning'],
    imageUrl: '/himanshu.jpg',
  },
  {
    name: 'Prof. Neha Sharma',
    department: 'Information Technology',
    role: 'Professor',
    subjects: ['Web Development', 'Database Systems', 'Cloud Computing'],
    imageUrl: '/neha.jpg',
  },
  {
    name: 'Dr. Rajat Verma',
    department: 'Electronics',
    role: 'Associate Professor',
    subjects: ['Digital Circuits', 'VLSI Design', 'Microprocessors'],
    imageUrl: '/rajat.jpg',
  },
  {
    name: 'Ms. Priya Singh',
    department: 'Computer Applications',
    role: 'Assistant Professor',
    subjects: ['Data Structures', 'Operating Systems', 'Python Programming'],
    imageUrl: '/priya.jpg',
  },
  {
    name: 'Mr. Aman Kapoor',
    department: 'Mechanical Engineering',
    role: 'Lecturer',
    subjects: ['Thermodynamics', 'Fluid Mechanics', 'Heat Transfer'],
    imageUrl: '/aman.jpg',
  },
];

export default function FacultyPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFaculty, setSelectedFaculty] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0d0d0d' }}>
      
      {/* Sidebar Section */}
      <Box
        component="aside"
        sx={{
          width: { xs: '60px', sm: '240px' },
          backgroundColor: '#111',
          height: '100vh',
          position: 'fixed',
          overflowY: 'auto',
          borderRight: '1px solid #1e1e1e',
        }}
      >
        <Sidebar />
      </Box>

      {/* Main Content Section */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          ml: { xs: '60px', sm: '240px' },
          p: { xs: 2, sm: 4 },
          background: 'linear-gradient(135deg, #0f0f0f, #1a1a1a)',
          minHeight: '100vh',
          color: '#fff',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <Typography
            variant="h3"
            align="center"
            gutterBottom
            sx={{
              fontWeight: 'bold',
              color: '#00BFFF',
              textShadow: '0 0 15px #00BFFF',
              mb: 6,
            }}
          >
            Quiz Raider X
          </Typography>

          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 10 }}>
              <CircularProgress size={60} sx={{ color: '#FF3C3C' }} />
            </Box>
          ) : (
            <Grid container spacing={4} justifyContent="center">
              {facultyData.map((faculty) => (
                <Grid item xs={12} sm={6} md={4} key={faculty.name}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: 'spring', stiffness: 260 }}
                  >
                    <FacultyCard faculty={faculty} onClick={() => setSelectedFaculty(faculty)} />
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          )}
        </motion.div>

        {/* Faculty Details Modal */}
        <Dialog
          open={!!selectedFaculty}
          onClose={() => setSelectedFaculty(null)}
          fullScreen
          PaperProps={{
            sx: {
              backgroundColor: 'rgba(10, 10, 10, 0.95)',
              backdropFilter: 'blur(8px)',
              color: 'white',
              p: 3,
            },
          }}
          TransitionComponent={motion.div}
          transition={{ type: 'spring', stiffness: 100 }}
        >
          {selectedFaculty && (
            <>
              <DialogTitle
                sx={{
                  fontSize: '2.2rem',
                  fontWeight: 600,
                  textAlign: 'center',
                  color: '#00BFFF',
                  mb: 2,
                  textShadow: '0 0 10px #00BFFF',
                }}
              >
                {selectedFaculty.name}
              </DialogTitle>

              <DialogContent sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Department: {selectedFaculty.department}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  Role: {selectedFaculty.role}
                </Typography>
                <Typography variant="body1" sx={{ mb: 3 }}>
                  Subjects: {selectedFaculty.subjects.join(', ')}
                </Typography>

                {/* Quiz Selection Buttons */}
                <Box display="flex" flexWrap="wrap" justifyContent="center" gap={2} mt={2}>
                  {[1, 2, 3, 4, 5].map((quizNumber) => (
                    <Button
                      key={quizNumber}
                      variant="outlined"
                      sx={{
                        borderColor: '#FF3C3C',
                        color: '#FF3C3C',
                        fontWeight: 'bold',
                        minWidth: 120,
                        '&:hover': {
                          backgroundColor: '#FF3C3C',
                          color: 'white',
                        },
                      }}
                      onClick={() => {
                        // You can later handle navigation or actions here
                        console.log(`Selected Quiz ${quizNumber} for ${selectedFaculty.name}`);
                      }}
                    >
                      Quiz {quizNumber}
                    </Button>
                  ))}
                </Box>
              </DialogContent>

              <DialogActions sx={{ justifyContent: 'center', mt: 3 }}>
                <Button
                  onClick={() => setSelectedFaculty(null)}
                  variant="contained"
                  sx={{
                    backgroundColor: '#00BFFF',
                    fontWeight: 'bold',
                    '&:hover': {
                      backgroundColor: '#1dc4ff',
                    },
                  }}
                >
                  Close
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>
      </Box>
    </Box>
  );
}
