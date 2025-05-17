"use client";

import { Box, List, ListItem, ListItemButton, ListItemText, Avatar } from "@mui/material";
import { motion } from "framer-motion";

// Define the tabs for navigation
const tabs = [
  { label: "All Projects", value: "all" },
  { label: "My Projects", value: "my" },
  { label: "Research Papers", value: "research" },
  { label: "My Research", value: "myresearch" },
  { label: "Course Project", value: "course" },  // New Course Project Tab
];

export default function ProjectNav({ activeTab, setActiveTab }) {
  return (
    <Box
      sx={{
        width: 240,
        bgcolor: "rgba(20, 20, 20, 0.85)",  // Sidebar background color
        color: "white",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "sticky",
        top: 0,
        borderRight: "1px solid #333",  // Sidebar border
        backdropFilter: "blur(8px)",  // Blurring effect for the sidebar
      }}
    >
      {/* Navigation Tabs */}
      <List sx={{ marginTop: 4 }}>
        {tabs.map((tab) => (
          <motion.div
            key={tab.value}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <ListItem disablePadding>
              <ListItemButton
                selected={activeTab === tab.value}
                onClick={() => setActiveTab(tab.value)}  // Update active tab on click
                sx={{
                  "&.Mui-selected": {
                    bgcolor: "#ff69b4",  // Highlight color for selected tab
                    color: "black",
                    fontWeight: "bold",
                    borderRadius: 2,
                  },
                  "&:hover": {
                    bgcolor: "#00bfff",  // Hover color for the tab
                    color: "black",
                    borderRadius: 2,
                  },
                  borderRadius: 2,
                  transition: "0.3s",  // Smooth transition for hover and selection
                }}
              >
                <ListItemText primary={tab.label} />
              </ListItemButton>
            </ListItem>
          </motion.div>
        ))}
      </List>

      {/* Spacer to push profile section to the bottom */}
      <Box sx={{ flexGrow: 1 }} />

      {/* Profile Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}  // Delay for profile picture fade-in
      >
        <Box sx={{ p: 2, display: "flex", justifyContent: "center" }}>
          <Avatar
            alt="Profile"
            src="/profile.jpg"  // Placeholder profile picture path
            sx={{
              width: 56,
              height: 56,
              border: "2px solid #00bfff",  // Border color for profile picture
              transition: "transform 0.3s",  // Smooth transform for hover effect
              "&:hover": {
                transform: "scale(1.1)",  // Slight zoom effect on hover
              },
            }}
          />
        </Box>
      </motion.div>
    </Box>
  );
}
