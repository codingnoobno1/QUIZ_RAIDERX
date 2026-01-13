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

// Tabs with associated component mapping
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
    const tabFromUrl = searchParams.get('tab') || 'all';
    const [activeTab, setActiveTab] = useState(tabFromUrl);

    // Sync activeTab with URL changes
    useEffect(() => {
        const tab = searchParams.get('tab') || 'all';
        if (tabs[tab]) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    const ContentComponent = useMemo(() => {
        return tabs[activeTab] || (() => (
            <Typography variant="h6" color="error">
                Component for "{activeTab}" not found.
            </Typography>
        ));
    }, [activeTab]);

    return (
        <Box
            component={Card}
            elevation={6}
            sx={{
                flexGrow: 1,
                m: { xs: 2, md: 3 },
                p: { xs: 2, md: 4 },
                borderRadius: 4,
                overflow: "auto",
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(0, 255, 255, 0.1)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
            }}
        >
            <ProjectNavbar />
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.35, ease: "easeInOut" }}
                >
                    <ContentComponent />
                </motion.div>
            </AnimatePresence>
        </Box>
    );
}
