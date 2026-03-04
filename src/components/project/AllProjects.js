"use client";

import { Box, Grid, Typography, CircularProgress } from "@mui/material";
import { useState, useEffect } from "react";
import ProjectCard from "./ProjectCard";
import { motion } from "framer-motion";

const neonCyan = "#00FFFF";
const neonPink = "#FF2E88";

export default function AllProjects() {
  const [projectData, setProjectData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <CircularProgress sx={{ color: neonCyan }} />
      </Box>
    );
  }

  const majorProjects = projectData.filter(item => item.type === "major");
  const minorProjects = projectData.filter(item => item.type === "minor");
  const allProjects = projectData.filter(item => item.type === "project" || !item.type);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const SectionHeader = ({ title, color = neonCyan }) => (
    <Box sx={{ mb: 4, mt: 6, display: "flex", alignItems: "center", gap: 2 }}>
      <Typography variant="h4" sx={{ fontWeight: 900, color: "#fff", letterSpacing: -1 }}>
        {title.toUpperCase()}
      </Typography>
      <Box sx={{ flexGrow: 1, height: "1px", background: `linear-gradient(90deg, ${color}44, transparent)` }} />
    </Box>
  );

  return (
    <Box sx={{ pb: 8 }}>
      {/* Major Projects Section */}
      {majorProjects.length > 0 && (
        <>
          <SectionHeader title="Major Expeditions" color={neonPink} />
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <Grid container spacing={4}>
              {majorProjects.map((item) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={item._id || item.id}>
                  <ProjectCard data={item} />
                </Grid>
              ))}
            </Grid>
          </motion.div>
        </>
      )}

      {/* Minor Projects Section */}
      {minorProjects.length > 0 && (
        <>
          <SectionHeader title="Core Initiatives" color={neonCyan} />
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <Grid container spacing={4}>
              {minorProjects.map((item) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={item._id || item.id}>
                  <ProjectCard data={item} />
                </Grid>
              ))}
            </Grid>
          </motion.div>
        </>
      )}

      {/* All Projects Section */}
      <SectionHeader title="Archive / Other" color="rgba(255,255,255,0.2)" />
      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        <Grid container spacing={4}>
          {allProjects.length === 0 ? (
            <Grid item xs={12}>
              <Typography sx={{ color: "rgba(255,255,255,0.3)", textAlign: "center", py: 4 }}>
                No archives found in this sector.
              </Typography>
            </Grid>
          ) : (
            allProjects.map((item) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={item._id || item.id}>
                <ProjectCard data={item} />
              </Grid>
            ))
          )}
        </Grid>
      </motion.div>
    </Box>
  );
}
