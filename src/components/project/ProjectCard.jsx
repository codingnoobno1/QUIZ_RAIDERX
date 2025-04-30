"use client";

import { useState } from "react";
import {
  Card, CardContent, Typography, Grid, Dialog, DialogContent,
  IconButton, Link, Divider, Avatar, Chip, Box, Tabs, Tab, Tooltip
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import GitHubIcon from "@mui/icons-material/GitHub";
import CloudIcon from "@mui/icons-material/Cloud";
import DriveFolderUploadIcon from "@mui/icons-material/DriveFolderUpload";
import projectData from "./data.json";

export default function ProjectCard() {
  const [open, setOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState(null);
  const [tab, setTab] = useState(0);

  const handleOpen = (project) => {
    setCurrentProject(project);
    setTab(0);
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const goldenStyle = {
    color: "#ffcb05",
    fontWeight: 600,
    fontFamily: "serif",
  };

  const cardStyle = {
    background: "#111827",
    borderRadius: 4,
    color: "#e5e7eb",
    height: 370,
    cursor: "pointer",
    boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
    border: "1px solid #1f2937",
    transition: "transform 0.3s",
    "&:hover": {
      transform: "scale(1.03)",
      boxShadow: "0 6px 30px rgba(255,203,5,0.2)",
    },
  };

  return (
    <>
      <Grid container spacing={3} sx={{ px: 2, py: 4 }}>
        {projectData.map((project, idx) => (
          <Grid item xs={12} sm={6} md={4} key={idx}>
            <Card sx={cardStyle} onClick={() => handleOpen(project)}>
              <CardContent>
                <Box sx={{ textAlign: "center", mb: 2 }}>
                  <img
                    src={project.image || "/placeholder.jpg"}
                    alt="project"
                    style={{ width: "100%", height: 150, objectFit: "cover", borderRadius: 8 }}
                  />
                </Box>
                <Typography variant="h6" sx={{ ...goldenStyle, mb: 1 }}>
                  {project.title}
                </Typography>
                <Typography variant="body2" sx={{ color: "#9ca3af", mb: 2 }}>
                  {project.description?.slice(0, 70)}...
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {project.stack?.slice(0, 3).map((tech, i) => (
                    <Chip
                      key={i}
                      label={tech}
                      size="small"
                      variant="outlined"
                      sx={{ color: "#ffcb05", borderColor: "#ffcb05" }}
                    />
                  ))}
                </Box>
                {project.usp && (
                  <Box sx={{ mt: 2 }}>
                    <Chip label={project.usp} color="success" size="small" />
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
        <DialogContent sx={{ p: 0, bgcolor: tab === 0 ? "#0f172a" : "#fff", minHeight: "600px" }}>
          <IconButton onClick={handleClose} sx={{ position: "absolute", top: 10, right: 10, zIndex: 1 }}>
            <CloseIcon sx={{ color: tab === 0 ? "#fff" : "#000" }} />
          </IconButton>

          <Tabs
            value={tab}
            onChange={(e, newVal) => setTab(newVal)}
            variant="fullWidth"
            sx={{
              bgcolor: tab === 0 ? "#1e293b" : "#f5f5f5",
              borderBottom: 1,
              borderColor: "#ccc",
              color: tab === 0 ? "#fff" : "#000",
            }}
          >
            <Tab label="Title Page" />
            <Tab label="Overview" />
            <Tab label="Tech & Links" />
            <Tab label="Team" />
          </Tabs>

          {tab === 0 && (
            <Box sx={{ p: 5, textAlign: "center", color: "#ffcb05" }}>
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
                {currentProject?.title}
              </Typography>
              <Typography variant="subtitle1" sx={{ fontFamily: "serif", color: "#bbb" }}>
                Project Report | {currentProject?.type}
              </Typography>
            </Box>
          )}

          {tab === 1 && (
            <Box sx={{ p: 4 }}>
              <Typography variant="h5" sx={{ ...goldenStyle, mb: 2 }}>Description</Typography>
              <Typography variant="body1" sx={{ color: "#333" }}>{currentProject?.description}</Typography>
              {currentProject?.usp && (
                <Box mt={3}>
                  <Chip label={`USP: ${currentProject.usp}`} color="success" />
                </Box>
              )}
            </Box>
          )}

          {tab === 2 && (
            <Box sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ ...goldenStyle }}>Tech Stack</Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
                {currentProject?.stack?.map((tech, i) => (
                  <Chip key={i} label={tech} color="info" size="small" />
                ))}
              </Box>

              <Typography variant="h6" sx={{ ...goldenStyle, mt: 4 }}>Project Links</Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {currentProject?.github && (
                  <Grid item>
                    <Tooltip title="GitHub Repository">
                      <Link href={currentProject.github} target="_blank" underline="hover">
                        <GitHubIcon sx={{ mr: 0.5 }} /> GitHub
                      </Link>
                    </Tooltip>
                  </Grid>
                )}
                {currentProject?.gdrive && (
                  <Grid item>
                    <Tooltip title="Google Drive Docs">
                      <Link href={currentProject.gdrive} target="_blank" underline="hover">
                        <DriveFolderUploadIcon sx={{ mr: 0.5 }} /> Drive
                      </Link>
                    </Tooltip>
                  </Grid>
                )}
                {currentProject?.deployment && (
                  <Grid item>
                    <Tooltip title="Live Deployment">
                      <Link href={currentProject.deployment} target="_blank" underline="hover">
                        <CloudIcon sx={{ mr: 0.5 }} /> Live
                      </Link>
                    </Tooltip>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}

          {tab === 3 && (
            <Box sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ ...goldenStyle }}>Team Lead</Typography>
              <Typography>{currentProject?.teamLead}</Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" sx={{ ...goldenStyle }}>Group Members</Typography>
              {currentProject?.groupMembers?.map((member, index) => (
                <Box key={index} sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                  <Avatar sx={{ width: 32, height: 32, mr: 1 }}>{member[0]}</Avatar>
                  <Typography>{member}</Typography>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
