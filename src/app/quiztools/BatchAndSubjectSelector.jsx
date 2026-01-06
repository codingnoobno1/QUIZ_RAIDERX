'use client';

import React, { useMemo } from 'react';
import {
  TextField,
  MenuItem,
  Typography,
  Box,
  Grid,
} from '@mui/material';

export default function BatchAndSubjectSelector({
  assignments = [],
  subjects = [],
  selectedBatchIdx,
  setSelectedBatchIdx,
  selectedSubject,
  setSelectedSubject,
}) {
  // Get selected batch object based on index
  const selectedBatch = useMemo(() => {
    if (
      assignments.length === 0 ||
      selectedBatchIdx === null ||
      selectedBatchIdx === undefined
    )
      return null;

    return assignments[Number(selectedBatchIdx)] ?? null;
  }, [assignments, selectedBatchIdx]);

  // Display label for batch
  const getBatchLabel = (a) =>
    `${a.batch || a.course} | Sem: ${a.semester} | Sec: ${a.section} | Room: ${a.roomNumber}`;

  return (
    <Box mb={4} width="100%">
      <Grid container spacing={3}>
        {/* Batch Selector */}
        <Grid item xs={12} md={6}>
          <Typography variant="h6" mb={1} fontWeight={700} color="#2874A6">
            Assigned Batch
          </Typography>
          <TextField
            select
            fullWidth
            label="Select Batch"
            value={selectedBatchIdx ?? ''}
            onChange={(e) => setSelectedBatchIdx(Number(e.target.value))}
            variant="filled"
            sx={{
              background: 'rgba(255,255,255,0.95)',
              borderRadius: 2,
              boxShadow: 2,
            }}
            SelectProps={{
              native: false,
              MenuProps: {
                PaperProps: {
                  sx: {
                    bgcolor: '#fff',
                    color: '#154360',
                    borderRadius: 2,
                    mt: 1,
                    boxShadow: 4,
                    maxHeight: 300,
                  },
                },
              },
            }}
          >
            {assignments.length === 0 ? (
              <MenuItem disabled>No batches assigned</MenuItem>
            ) : (
              assignments.map((a, idx) => (
                <MenuItem
                  key={idx}
                  value={idx}
                  sx={{
                    background:
                      String(selectedBatchIdx) === String(idx)
                        ? '#F9E79F'
                        : '#fff',
                    fontWeight: 700,
                    mb: 1,
                    borderRadius: 2,
                    '&:hover': { background: '#FCF3CF' },
                    transition: 'background 0.2s',
                  }}
                >
                  {getBatchLabel(a)}
                </MenuItem>
              ))
            )}
          </TextField>
        </Grid>

        {/* Subject Selector */}
        <Grid item xs={12} md={6}>
          <Typography variant="h6" mb={1} fontWeight={700} color="#CA6F1E">
            Subjects
          </Typography>
          <TextField
            select
            fullWidth
            label="Select Subject"
            value={selectedSubject || ''}
            onChange={(e) => setSelectedSubject(e.target.value)}
            variant="filled"
            disabled={subjects.length === 0}
            sx={{
              background: 'rgba(255,255,255,0.95)',
              borderRadius: 2,
              boxShadow: 2,
            }}
            SelectProps={{
              native: false,
              MenuProps: {
                PaperProps: {
                  sx: {
                    bgcolor: '#fff',
                    color: '#873600',
                    borderRadius: 2,
                    mt: 1,
                    boxShadow: 4,
                    maxHeight: 300,
                  },
                },
              },
            }}
          >
            {subjects.length === 0 ? (
              <MenuItem disabled>No subjects available</MenuItem>
            ) : (
              subjects.map((subj, idx) => (
                <MenuItem
                  key={idx}
                  value={subj}
                  sx={{
                    background: selectedSubject === subj ? '#FAD7A0' : '#fff',
                    fontWeight: 700,
                    mb: 1,
                    borderRadius: 2,
                    '&:hover': { background: '#FDEBD0' },
                    transition: 'background 0.2s',
                  }}
                >
                  {subj}
                </MenuItem>
              ))
            )}
          </TextField>
        </Grid>
      </Grid>
    </Box>
  );
}
