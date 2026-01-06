'use client';

import {
  Box,
  Button,
  Typography,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Chip,
  Stack,
} from '@mui/material';
import { useState } from 'react';

export default function QuizSelection({ selectedFaculty, setSelectedFaculty }) {
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);

  const resetSelections = () => {
    setSelectedBatch(null);
    setSelectedSemester(null);
    setSelectedSubject(null);
  };

  return (
    <Dialog
      open={!!selectedFaculty}
      onClose={() => setSelectedFaculty(null)}
      fullScreen
      PaperProps={{
        sx: {
          backgroundColor: '#ffffff',
          backdropFilter: 'blur(6px)',
          color: '#1a1a1a',
          p: 3,
        },
      }}
    >
      {selectedFaculty && (
        <>
          {/* Title */}
          <DialogTitle
            sx={{
              fontSize: '2.2rem',
              fontWeight: 600,
              textAlign: 'center',
              color: '#22c1c3',
              mb: 2,
              textShadow: '0 0 8px rgba(34, 193, 195, 0.2)',
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            {selectedFaculty.name}
          </DialogTitle>

          {/* Content */}
          <DialogContent sx={{ textAlign: 'center' }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Department: {selectedFaculty.department}
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              Role: {selectedFaculty.position || selectedFaculty.role}
            </Typography>

            {/* Batch Selection */}
            {!selectedBatch && selectedFaculty.classAssignments && (
              <>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Select Batch
                </Typography>
                <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" mb={3}>
                  {[...new Set(selectedFaculty.classAssignments.map((ca) => ca.batch))].map((batch) => (
                    <Chip
                      key={batch}
                      label={batch}
                      onClick={() => setSelectedBatch(batch)}
                      clickable
                      sx={{
                        backgroundColor: '#e0f7f9',
                        color: '#007b83',
                        fontWeight: 'bold',
                        fontSize: '0.9rem',
                      }}
                    />
                  ))}
                </Stack>
              </>
            )}

            {/* Semester Selection */}
            {selectedBatch && !selectedSemester && (
              <>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Select Semester
                </Typography>
                <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" mb={3}>
                  {[...new Set(selectedFaculty.classAssignments.filter((ca) => ca.batch === selectedBatch).map((ca) => ca.semester))].map((sem) => (
                    <Chip
                      key={sem}
                      label={`Semester ${sem}`}
                      onClick={() => setSelectedSemester(sem)}
                      clickable
                      sx={{
                        backgroundColor: '#d9f2ff',
                        color: '#006494',
                        fontWeight: 'bold',
                        fontSize: '0.9rem',
                      }}
                    />
                  ))}
                </Stack>
              </>
            )}

            {/* Subject Selection */}
            {selectedBatch && selectedSemester && !selectedSubject && (
              <>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Select Subject
                </Typography>
                <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" mb={3}>
                  {(selectedFaculty.classAssignments.find(
                    (ca) => ca.batch === selectedBatch && ca.semester === selectedSemester
                  )?.subjects || []).map((subject) => (
                    <Chip
                      key={subject}
                      label={subject}
                      onClick={() => setSelectedSubject(subject)}
                      clickable
                      sx={{
                        backgroundColor: '#e6ffe6',
                        color: '#007b55',
                        fontWeight: 'bold',
                        fontSize: '0.9rem',
                      }}
                    />
                  ))}
                </Stack>
              </>
            )}

            {/* Quiz Selection */}
            {selectedBatch && selectedSemester && selectedSubject && (
              <>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Choose Quiz for <strong>{selectedSubject}</strong>
                </Typography>
                <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap" mb={2}>
                  {[1, 2, 3].map((quiz) => (
                    <Button
                      key={quiz}
                      variant="outlined"
                      onClick={() =>
                        console.log(
                          `Selected Quiz ${quiz} | Batch: ${selectedBatch}, Semester: ${selectedSemester}, Subject: ${selectedSubject}`
                        )
                      }
                      sx={{
                        borderColor: '#22c1c3',
                        color: '#22c1c3',
                        fontWeight: 'bold',
                        borderRadius: '10px',
                        px: 3,
                        '&:hover': {
                          backgroundColor: '#22c1c3',
                          color: 'white',
                        },
                      }}
                    >
                      Quiz {quiz}
                    </Button>
                  ))}
                </Stack>
                <Button
                  onClick={resetSelections}
                  color="warning"
                  sx={{ fontWeight: 'bold', textTransform: 'none' }}
                >
                  ← Reset Selection
                </Button>
              </>
            )}
          </DialogContent>

          {/* Close Button */}
          <DialogActions sx={{ justifyContent: 'center', mt: 3 }}>
            <Button
              onClick={() => setSelectedFaculty(null)}
              variant="contained"
              sx={{
                backgroundColor: '#22c1c3',
                color: '#fff',
                fontWeight: 'bold',
                px: 4,
                py: 1,
                borderRadius: '12px',
                '&:hover': {
                  backgroundColor: '#1ba39c',
                },
              }}
            >
              Close
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}
