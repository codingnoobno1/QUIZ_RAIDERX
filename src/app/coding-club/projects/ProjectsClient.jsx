"use client";

import { useState, useMemo, useEffect } from "react";
import { Box, Card, useTheme, Typography } from "@mui/material";
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
    const theme = useTheme();

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
                backgroundColor: theme.palette.background.paper,
                boxShadow: theme.shadows[5],
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
