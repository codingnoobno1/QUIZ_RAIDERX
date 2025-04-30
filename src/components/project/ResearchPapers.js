"use client";

import { Box, Grid } from "@mui/material";
import ResearchCard from "./ResearchCard";
import projectData from "./projectdata.json"; // Example data source

export default function ResearchPapers() {
  // Filter to get only the research papers
  const researchPapers = projectData.filter(item => item.type === "research");

  return (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={4} justifyContent="center">
        {/* Display Research Papers */}
        {researchPapers.map((item) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
            <ResearchCard data={item} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
