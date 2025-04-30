"use client";

import { Box, Grid } from "@mui/material";
import ResearchCard from "./ResearchCard";
import projectData from "./projectdata.json"; // Example data source

export default function MyResearch() {
  // Filter the research papers for the user (modify based on the data structure)
  const myResearch = projectData.filter(item => item.type === "research" && item.owner === "my_user");

  return (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={4} justifyContent="center">
        {/* Display My Research */}
        {myResearch.map((item) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
            <ResearchCard data={item} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
