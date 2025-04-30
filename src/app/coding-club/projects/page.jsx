"use client";

import { useState } from "react";
import { Box, Card, useTheme } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import ProjectNav from "@components/project/ProjectNav";
import AllProjects from "@components/project/AllProjects";
import MyProjects from "@components/project/MyProjects";
import ResearchPapers from "@components/project/ResearchPapers";
import MyResearch from "@components/project/MyResearch";

const tabs = {
  all: AllProjects,
  my: MyProjects,
  research: ResearchPapers,
  myresearch: MyResearch,
};

export default function ProjectsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const ContentComponent = tabs[activeTab] || AllProjects;
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: theme.palette.background.default,
      }}
    >
      <ProjectNav activeTab={activeTab} setActiveTab={setActiveTab} />

      <Box
        component={Card}
        elevation={6}
        sx={{
          flexGrow: 1,
          m: 3,
          p: 4,
          borderRadius: 4,
          overflow: "hidden",
          background: theme.palette.background.paper,
          boxShadow: theme.shadows[5],
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <ContentComponent />
          </motion.div>
        </AnimatePresence>
      </Box>
    </Box>
  );
}
