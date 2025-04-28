"use client";

import { useState, useEffect } from "react";
import { Box, Grid } from "@mui/material";
import { motion } from "framer-motion";
import ProjectNav from "@/components/project/ProjectNav";
import ProjectCard from "@/components/project/ProjectCard";
import ResearchCard from "@/components/project/ResearchCard";
import projectData from "./projectdata.json";

export default function ProjectsPage() {
  const [activeTab, setActiveTab] = useState("all"); // "all", "my", "research", "myresearch"
  const [filteredData, setFilteredData] = useState([]);

  useEffect(() => {
    let data = projectData;
    if (activeTab === "research" || activeTab === "myresearch") {
      data = projectData.filter((item) => item.type === "research");
    } else {
      data = projectData.filter((item) => item.type === "project");
    }
    setFilteredData(data);
  }, [activeTab]);

  return (
    <Box
      sx={{
        display: "flex",
        background: "linear-gradient(180deg, #0d0d0d 0%, #1a1a1a 100%)",
        color: "white",
        minHeight: "100vh",
        overflowX: "hidden",
      }}
    >
      {/* Sidebar Navigation */}
      <ProjectNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Content Area */}
      <Box sx={{ flexGrow: 1, p: { xs: 2, md: 4 } }}>
        
        {/* Page Title */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          style={{
            fontSize: "2rem",
            marginBottom: "2rem",
            color: "#00bfff",
            textAlign: "center",
          }}
        >
          Explore Projects
        </motion.h1>

        {/* Grid Display */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: {
              transition: {
                staggerChildren: 0.1,
              },
            },
          }}
        >
          <Grid container spacing={4} justifyContent="center">
            {filteredData.map((item) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={item.id} display="flex">
                <motion.div
                  style={{ width: "100%" }}
                  variants={{
                    hidden: { opacity: 0, y: 30 },
                    show: { opacity: 1, y: 0 },
                  }}
                  whileHover={{ scale: 1.05 }}
                >
                  {item.type === "project" ? (
                    <ProjectCard data={item} />
                  ) : (
                    <ResearchCard data={item} />
                  )}
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </motion.div>
      </Box>
    </Box>
  );
}
