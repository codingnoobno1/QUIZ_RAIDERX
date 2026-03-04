"use client";

import { Box, Grid, Typography } from "@mui/material";
import ResearchCard from "./ResearchCard";
import projectData from "./projectdata.json";
import { motion } from "framer-motion";

const neonCyan = "#00FFFF";

export default function ResearchPapers() {
  const researchPapers = projectData.filter(item => item.type === "research");

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  return (
    <Box sx={{ pb: 8 }}>
      <Box sx={{ mb: 4, display: "flex", alignItems: "center", gap: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 900, color: "#fff", letterSpacing: -1 }}>
          PUBLISHED ARCHIVES
        </Typography>
        <Box sx={{ flexGrow: 1, height: "1px", background: `linear-gradient(90deg, ${neonCyan}44, transparent)` }} />
      </Box>

      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        <Grid container spacing={4}>
          {researchPapers.length === 0 ? (
            <Grid item xs={12}>
              <Typography sx={{ color: "rgba(255,255,255,0.3)", textAlign: "center", py: 8 }}>
                No research papers identified in this sector.
              </Typography>
            </Grid>
          ) : (
            researchPapers.map((item) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
                <ResearchCard data={item} />
              </Grid>
            ))
          )}
        </Grid>
      </motion.div>
    </Box>
  );
}
