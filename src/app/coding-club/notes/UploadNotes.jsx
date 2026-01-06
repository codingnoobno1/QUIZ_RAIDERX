// app/coding-club/notes/UploadNotes.jsx
'use client';

import React, { useState } from 'react';
import {
  Typography,
  Paper,
  Box,
  TextField,
  Button,
  Grid,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';

export default function UploadNotes() {
  const [subject, setSubject] = useState('');
  const [noteType, setNoteType] = useState('');
  const [department, setDepartment] = useState('');
  const [course, setCourse] = useState('');
  const [semester, setSemester] = useState('');
  const [file, setFile] = useState(null);

  const handleUpload = () => {
    console.log('Uploading:', {
      subject,
      noteType,
      department,
      course,
      semester,
      file,
    });

    // Reset fields
    setSubject('');
    setNoteType('');
    setDepartment('');
    setCourse('');
    setSemester('');
    setFile(null);
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Paper
        elevation={4}
        sx={{
          p: 4,
          borderRadius: 3,
          backgroundColor: '#fff',
          boxShadow: '0 6px 24px rgba(0,0,0,0.08)',
          maxWidth: '100%',
        }}
      >
        <Typography variant="h5" fontWeight="bold" color="primary" gutterBottom>
          📤 Upload Notes / Question Papers
        </Typography>

        <Grid container spacing={3} mt={1}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Subject"
              fullWidth
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={noteType}
                onChange={(e) => setNoteType(e.target.value)}
                label="Type"
                required
              >
                <MenuItem value="notes">Notes</MenuItem>
                <MenuItem value="pyq">Previous Year Question Paper</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              label="Department"
              fullWidth
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              required
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              label="Course"
              fullWidth
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              required
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              label="Semester"
              fullWidth
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              required
            />
          </Grid>

          <Grid item xs={12}>
            <Button
              component="label"
              variant="outlined"
              fullWidth
              startIcon={<UploadFileIcon />}
            >
              {file ? file.name : 'Upload PDF / DOC'}
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                hidden
                onChange={(e) => setFile(e.target.files[0])}
              />
            </Button>
          </Grid>

          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              onClick={handleUpload}
              disabled={!subject || !noteType || !department || !course || !semester || !file}
            >
              Submit
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
