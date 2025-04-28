'use client';

import { useRef, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Avatar,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Stack,
} from '@mui/material';
import { motion } from 'framer-motion';

const FacultyCard = ({ faculty }) => {
  const [openDialog, setOpenDialog] = useState(false);
  const dialogRef = useRef(null);

  const handleClickOpen = async () => {
    setOpenDialog(true);

    // Trigger fullscreen after short delay
    setTimeout(() => {
      if (dialogRef.current && dialogRef.current.requestFullscreen) {
        dialogRef.current.requestFullscreen().catch((err) => {
          console.error('Fullscreen error:', err);
        });
      }
    }, 200); // Delay ensures dialog is rendered
  };

  const handleClose = () => {
    setOpenDialog(false);

    // Exit fullscreen if active
    if (document.fullscreenElement) {
      document.exitFullscreen().catch((err) => {
        console.error('Exit fullscreen error:', err);
      });
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card
          onClick={handleClickOpen}
          sx={{
            background: 'linear-gradient(145deg, #1c1c1c, #111)',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            maxWidth: 400,
            minHeight: 350,
            cursor: 'pointer',
            borderRadius: 4,
            boxShadow: '0 0 15px #ff0000',
            transition: '0.4s',
            '&:hover': {
              boxShadow: '0 0 25px #ff0000',
              transform: 'scale(1.05)',
            },
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Avatar
              alt={faculty.name}
              src={faculty.imageUrl || '/default-avatar.png'}
              sx={{
                width: 120,
                height: 120,
                border: '4px solid #FF3C3C',
                boxShadow: '0 0 10px #FF3C3C',
              }}
            />
          </Box>

          <CardContent sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
              {faculty.name}
            </Typography>
            <Typography variant="body2"><strong>Role:</strong> {faculty.role}</Typography>
            <Typography variant="body2"><strong>Dept:</strong> {faculty.department}</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              <strong>Subjects:</strong> {faculty.subjects.join(', ')}
            </Typography>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog
        open={openDialog}
        onClose={handleClose}
        fullWidth
        maxWidth="sm"
        ref={dialogRef}
        sx={{
          backdropFilter: 'blur(8px)',
          '& .MuiDialog-paper': {
            background: 'linear-gradient(145deg, #0d0d0d, #1a1a1a)',
            color: 'white',
            borderRadius: '20px',
            padding: '20px',
            boxShadow: '0 0 30px #FF3C3C',
          },
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold', color: '#00BFFF', textShadow: '0 0 10px #00BFFF' }}>
          {faculty.name} - Select Quiz
        </DialogTitle>

        <DialogContent sx={{ textAlign: 'center' }}>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Choose a Quiz to Begin
          </Typography>

          <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap" sx={{ mt: 2 }}>
            {[1, 2, 3, 4, 5].map((num) => (
              <Button
                key={num}
                variant="outlined"
                sx={{
                  borderColor: '#FF3C3C',
                  color: '#FF3C3C',
                  fontWeight: 'bold',
                  width: 80,
                  height: 50,
                  '&:hover': {
                    backgroundColor: '#FF3C3C',
                    color: 'white',
                    transform: 'scale(1.1)',
                  },
                }}
                onClick={() => alert(`Quiz ${num} selected for ${faculty.name}`)}
              >
                Quiz {num}
              </Button>
            ))}
          </Stack>

          <Box sx={{ mt: 4 }}>
            <Typography variant="body2" sx={{ opacity: 0.7 }}>
              Department: {faculty.department}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.7 }}>
              Subjects: {faculty.subjects.join(', ')}
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions sx={{ justifyContent: 'center', mb: 2 }}>
          <Button
            onClick={handleClose}
            variant="contained"
            sx={{
              backgroundColor: '#FF3C3C',
              fontWeight: 'bold',
              '&:hover': { backgroundColor: '#ff5e5e' },
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default FacultyCard;
