"use client";

import { useState, useMemo, useEffect } from "react";
import { Box, Card, Typography } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";

import AllProjects from "@components/project/AllProjects";
import MyProjects from "@components/project/MyProjects";
import ResearchPapers from "@components/project/ResearchPapers";
import MyResearch from "@components/project/MyResearch";
import CourseProject from "@components/project/CourseProject";
import InHouseInternshipForm from "@components/project/InHouseInternshipForm";
import ProjectNavbar from "@components/project/ProjectNavbar";

const tabs = {
    all: AllProjects,
    my: MyProjects,
    research: ResearchPapers,
    myresearch: MyResearch,
    course: CourseProject,
    internship: InHouseInternshipForm,
};

export default function ProjectsClient() {
    const searchParams = useSearchParams();
    const tabFromUrl = searchParams.get("tab") || "all";
    const [activeTab, setActiveTab] = useState(tabFromUrl);

    useEffect(() => {
        const tab = searchParams.get("tab") || "all";
        if (tabs[tab]) setActiveTab(tab);
    }, [searchParams]);

    const ContentComponent = useMemo(() => {
        return (
            tabs[activeTab] ||
            (() => (
                <Typography variant="h6" color="error">
                    Component for "{activeTab}" not found.
                </Typography>
            ))
        );
    }, [activeTab]);

    return (
        <Box
            sx={{
                minHeight: "100vh",
                position: "relative",
                overflow: "hidden",
                background: "#020617",
                py: { xs: 4, md: 8 },
                px: { xs: 2, md: 4 },
            }}
        >
            {/* Animated Glow Orbs */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    x: [0, 100, 0],
                    y: [0, 50, 0],
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                style={{
                    position: "absolute",
                    top: "-10%",
                    left: "10%",
                    width: "40vw",
                    height: "40vw",
                    background: "radial-gradient(circle, rgba(0, 255, 255, 0.08) 0%, transparent 70%)",
                    borderRadius: "50%",
                    zIndex: 0,
                }}
            />
            <motion.div
                animate={{
                    scale: [1, 1.3, 1],
                    x: [0, -80, 0],
                    y: [0, 120, 0],
                }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                style={{
                    position: "absolute",
                    bottom: "-5%",
                    right: "5%",
                    width: "35vw",
                    height: "35vw",
                    background: "radial-gradient(circle, rgba(255, 46, 136, 0.05) 0%, transparent 70%)",
                    borderRadius: "50%",
                    zIndex: 0,
                }}
            />

            <Box sx={{ position: "relative", zIndex: 1, maxWidth: "1600px", mx: "auto" }}>
                <Card
                    elevation={0}
                    sx={{
                        borderRadius: "32px",
                        p: { xs: 2.5, md: 6 },
                        background: "rgba(15, 23, 42, 0.6)",
                        backdropFilter: "blur(30px) saturate(150%)",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                    }}
                >
                    {/* Header Section */}
                    <Box sx={{ mb: 6, textAlign: { xs: "center", md: "left" } }}>
                        <Typography
                            variant="h2"
                            sx={{
                                fontWeight: 900,
                                color: "#f8fafc",
                                letterSpacing: -2,
                                fontSize: { xs: "2.5rem", md: "4.5rem" },
                                mb: 1,
                                background: "linear-gradient(to right, #f8fafc, #64748b)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                            }}
                        >
                            PROJECTS
                        </Typography>
                        <Typography
                            variant="h6"
                            sx={{
                                color: "rgba(148, 163, 184, 0.7)",
                                fontWeight: 500,
                                letterSpacing: 1,
                                maxWidth: "600px",
                            }}
                        >
                            Explore the fusion of research, code, and innovation.
                        </Typography>
                    </Box>

                    {/* Navigation */}
                    <ProjectNavbar />

                    {/* Content Area */}
                    <Box sx={{ mt: 2 }}>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
                                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                                exit={{ opacity: 0, y: -30, filter: "blur(10px)" }}
                                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                            >
                                <ContentComponent />
                            </motion.div>
                        </AnimatePresence>
                    </Box>
                </Card>
            </Box>
        </Box>
    );
}
