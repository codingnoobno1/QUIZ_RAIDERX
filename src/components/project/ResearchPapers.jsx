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
        <CircularProgress sx={{ color: '#00FFFF' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      {/* Header with Submit Button - matches AllProjects */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 3,
        flexWrap: 'wrap',
        gap: 2,
      }}>
        <Typography variant="h4" sx={{
          fontWeight: 'bold',
          background: 'linear-gradient(135deg, #00FFFF 0%, #FF1493 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
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
            px: 3,
            py: 1,
            borderRadius: 2,
            textTransform: 'none',
            fontSize: '0.95rem',
            boxShadow: '0 4px 15px rgba(255, 20, 147, 0.3)',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 6px 20px rgba(255, 20, 147, 0.4)',
            },
            transition: 'all 0.3s ease',
          }}
        >
          Submit Research
        </Button>
      </Box>

      {researchPapers.length === 0 ? (
        <Box sx={{
          textAlign: 'center',
          py: 8,
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.5) 0%, rgba(15, 23, 42, 0.5) 100%)',
          borderRadius: 3,
          border: '1px dashed rgba(0, 255, 255, 0.3)',
        }}>
          <Typography sx={{ color: '#9ca3af', mb: 2, fontSize: '1.1rem' }}>
            No research papers available yet.
          </Typography>
          <Typography sx={{ color: '#00FFFF', fontWeight: 600 }}>
            Be the first to submit your research!
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={4}>
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
