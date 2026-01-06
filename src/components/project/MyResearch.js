"use client";

import { Box, Grid, CircularProgress } from "@mui/material";
import { useState, useEffect } from "react";
import ResearchCard from "./ResearchCard";

export default function MyResearch() {
  const [myResearch, setMyResearch] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get submitter name from localStorage
    const submitterName = localStorage.getItem('studentName') || 'Anonymous';

    // Fetch user's research papers from database
    fetch(`/api/research?submitterName=${submitterName}`)
      .then(res => res.json())
      .then(data => {
        setMyResearch(data.papers || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching research:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={4} justifyContent="center">
        {/* Display My Research */}
        {myResearch.map((item) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={item._id}>
            <ResearchCard data={item} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
