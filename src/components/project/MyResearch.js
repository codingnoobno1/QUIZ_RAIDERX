"use client";

import { Box, Grid, CircularProgress, Typography, Button } from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import { useState, useEffect } from "react";
import ResearchCard from "./ResearchCard";
import Link from "next/link";

export default function MyResearch() {
  const [myResearch, setMyResearch] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get submitter name from localStorage
    const submitterName = localStorage.getItem('studentName') || '';

    if (submitterName) {
      // Fetch user's research papers from database
      fetch(`/api/research?submitterName=${encodeURIComponent(submitterName)}`)
        .then(res => res.json())
        .then(data => {
          setMyResearch(data.papers || []);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error fetching research:', err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
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
      {/* Header - matches ResearchPapers */}
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
          My Research
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
          Submit New Research
        </Button>
      </Box>

      {myResearch.length === 0 ? (
        <Box sx={{
          textAlign: 'center',
          py: 8,
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.5) 0%, rgba(15, 23, 42, 0.5) 100%)',
          borderRadius: 3,
          border: '1px dashed rgba(0, 255, 255, 0.3)',
        }}>
          <Typography sx={{ color: '#9ca3af', mb: 2, fontSize: '1.1rem' }}>
            You have not submitted any research papers yet.
          </Typography>
          <Button
            component={Link}
            href="/submit-research"
            variant="outlined"
            startIcon={<AddIcon />}
            sx={{
              borderColor: '#00FFFF',
              color: '#00FFFF',
              '&:hover': {
                borderColor: '#FF1493',
                color: '#FF1493',
                bgcolor: 'rgba(255,20,147,0.1)',
              }
            }}
          >
            Submit Your First Research
          </Button>
        </Box>
      ) : (
        <Grid container spacing={4}>
          {myResearch.map((item) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={item._id}>
              <ResearchCard data={item} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
