"use client";

import { Box, List, ListItem, ListItemButton, ListItemText, Avatar } from "@mui/material";
import { motion } from "framer-motion";

// Tabs definition
const tabs = [
  { label: "All Projects", value: "all" },
  { label: "My Projects", value: "my" },
  { label: "Research Papers", value: "research" },
  { label: "My Research", value: "myresearch" },
];

export default function ProjectNav({ activeTab, setActiveTab }) {
  return (
    <Box
      sx={{
        width: 240,
        bgcolor: "rgba(20, 20, 20, 0.85)",
        color: "white",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "sticky",
        top: 0,
        borderRight: "1px solid #333",
        backdropFilter: "blur(8px)",
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
                onClick={() => setActiveTab(tab.value)}
                sx={{
                  "&.Mui-selected": {
                    bgcolor: "#ff69b4",  // Highlight color
                    color: "black",
                    fontWeight: "bold",
                    borderRadius: 2,
                  },
                  "&:hover": {
                    bgcolor: "#00bfff", // Hover color
                    color: "black",
                    borderRadius: 2,
                  },
                  borderRadius: 2,
                  transition: "0.3s",
                }}
              >
                <ListItemText primary={tab.label} />
              </ListItemButton>
            </ListItem>
          </motion.div>
        ))}
      </List>

      {/* Profile Section */}
      <Box sx={{ flexGrow: 1 }} />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Box sx={{ p: 2, display: "flex", justifyContent: "center" }}>
          <Avatar
            alt="Profile"
            src="/profile.jpg" // optional profile pic
            sx={{
              width: 56,
              height: 56,
              border: "2px solid #00bfff", // Border color for profile
              transition: "transform 0.3s",
              "&:hover": {
                transform: "scale(1.1)", // Hover effect for profile picture
              },
            }}
          />
        </Box>
      </motion.div>
    </Box>
  );
}
