"use client";

import { Box, Grid, Typography, CircularProgress } from "@mui/material";
import { useState, useEffect } from "react";
import ProjectCard from "./ProjectCard";

export default function AllProjects() {
  const [projectData, setProjectData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch all projects from database (both academic projects and portfolio projects)
    Promise.all([
      fetch('/api/projects').then(res => res.json()),
      fetch('/api/portfolio-projects').then(res => res.json())
    ])
      .then(([academicData, portfolioData]) => {
        const combined = [
          ...(academicData.projects || []),
          ...(portfolioData.projects || [])
        ];
        setProjectData(combined);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching projects:', err);
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

  // Filter major, minor, and all projects
  const majorProjects = projectData.filter(item => item.type === "major");
  const minorProjects = projectData.filter(item => item.type === "minor");
  const allProjects = projectData.filter(item => item.type === "project" || !item.type);

  return (
    <Box sx={{ p: 4 }}>
      {/* All Projects Section */}
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        All Projects
      </Typography>
      <Grid container spacing={4} justifyContent="center">
        {allProjects.map((item) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={item._id || item.id}>
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
            <Grid item xs={12} sm={6} md={4} lg={3} key={item._id || item.id}>
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
            <Grid item xs={12} sm={6} md={4} lg={3} key={item._id || item.id}>
              <ProjectCard data={item} />
            </Grid>
          ))
        )}
      </Grid>
    </Box>
  );
}
