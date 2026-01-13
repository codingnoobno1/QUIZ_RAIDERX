"use client";

import { useState, useEffect } from "react";
import { Box, Grid, CircularProgress, Typography, Button } from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import ResearchCard from "./ResearchCard";
import Link from "next/link";

export default function ResearchPapers() {
  const [researchPapers, setResearchPapers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch all approved research papers from API
    fetch('/api/research')
      .then(res => res.json())
      .then(data => {
        setResearchPapers(data.papers || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching research papers:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress sx={{ color: '#ffcb05' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* Header with Submit Button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#ffcb05' }}>
          Research Papers
        </Typography>
        <Button
          component={Link}
          href="/submit-research"
          variant="contained"
          startIcon={<AddIcon />}
          sx={{
            background: 'linear-gradient(135deg, #FF1493 0%, #00FFFF 100%)',
            fontWeight: 'bold',
          }}
        >
          Submit Research
        </Button>
      </Box>

      {researchPapers.length === 0 ? (
        <Typography sx={{ textAlign: 'center', color: '#9ca3af', py: 4 }}>
          No research papers available yet. Be the first to submit!
        </Typography>
      ) : (
        <Grid container spacing={4} justifyContent="center">
          {researchPapers.map((paper) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={paper._id}>
              <ResearchCard data={paper} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
