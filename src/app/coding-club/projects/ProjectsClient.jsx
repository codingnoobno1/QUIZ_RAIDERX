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
                minHeight: "100%",
                p: { xs: 2, md: 4 },
                background:
                    "linear-gradient(180deg, #0f172a 0%, #020617 100%)",
            }}
        >
            <Card
                elevation={0}
                sx={{
                    borderRadius: 3,
                    p: { xs: 2, md: 4 },
                    background: "#0f172a",
                    border: "1px solid rgba(255,255,255,0.06)",
                    boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
                }}
            >
                {/* Header */}
                <Box
                    sx={{
                        mb: 3,
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                        pb: 2,
                    }}
                >
                    <Typography
                        variant="h4"
                        sx={{
                            fontWeight: 700,
                            color: "#f1f5f9",
                            letterSpacing: 0.5,
                        }}
                    >
                        Projects
                    </Typography>

                    <Typography
                        variant="body2"
                        sx={{
                            color: "rgba(255,255,255,0.5)",
                            mt: 0.5,
                        }}
                    >
                        Manage projects, research papers, and internships
                    </Typography>
                </Box>

                {/* Navbar */}
                <ProjectNavbar />

                {/* Content */}
                <Box
                    sx={{
                        mt: 3,
                        background: "#020617",
                        borderRadius: 2,
                        p: { xs: 2, md: 3 },
                        border: "1px solid rgba(255,255,255,0.05)",
                    }}
                >
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.3 }}
                        >
                            <ContentComponent />
                        </motion.div>
                    </AnimatePresence>
                </Box>
            </Card>
        </Box>
    );
}