"use client";

import { Box, Grid, Typography } from "@mui/material";
import ProjectCard from "./ProjectCard";
import projectData from "./projectdata.json";  // Example data source for projects

export default function AllProjects() {
  // Filter major, minor, and all projects
  const majorProjects = projectData.filter(item => item.type === "major");
  const minorProjects = projectData.filter(item => item.type === "minor");
  const allProjects = projectData.filter(item => item.type === "project");

  return (
    <Box sx={{ p: 4 }}>
      {/* All Projects Section */}
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        All Projects
      </Typography>
      <Grid container spacing={4} justifyContent="center">
        {allProjects.map((item) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
            <ProjectCard data={item} />
          </Grid>
        ))}
      </Grid>

      {/* Major Projects Section */}
      <Typography variant="h4" sx={{ mt: 6, mb: 3, fontWeight: 'bold' }}>
        Major Projects
      </Typography>
      <Grid container spacing={4} justifyContent="center">
        {majorProjects.length === 0 ? (
          <Typography variant="body1" sx={{ mt: 2 }}>
            No major projects available.
          </Typography>
        ) : (
          majorProjects.map((item) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
              <ProjectCard data={item} />
            </Grid>
          ))
        )}
      </Grid>

      {/* Minor Projects Section */}
      <Typography variant="h4" sx={{ mt: 6, mb: 3, fontWeight: 'bold' }}>
        Minor Projects
      </Typography>
      <Grid container spacing={4} justifyContent="center">
        {minorProjects.length === 0 ? (
          <Typography variant="body1" sx={{ mt: 2 }}>
            No minor projects available.
          </Typography>
        ) : (
          minorProjects.map((item) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
              <ProjectCard data={item} />
            </Grid>
          ))
        )}
      </Grid>
    </Box>
  );
}
