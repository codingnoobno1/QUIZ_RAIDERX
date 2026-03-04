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
import { motion, AnimatePresence } from "framer-motion";

const neonCyan = "#00FFFF";
const neonPink = "#FF2E88";
const slate800 = "#1e293b";
const slate900 = "#0f172a";

export default function ProjectCard({ data }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState(0);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  // If data is passed as a prop, use it. Otherwise, this component might be used in a way that it needs to handle its own state or it's a template.
  // In ProjectCard.jsx, it was originally using data.json directly, but AllProjects.js passes 'data' prop.
  const project = data;

  if (!project) return null;

  return (
    <>
      <motion.div
        whileHover={{ y: -10, scale: 1.02 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <Card
          onClick={handleOpen}
          sx={{
            background: "rgba(30, 41, 59, 0.4)",
            backdropFilter: "blur(12px)",
            borderRadius: "24px",
            color: "#f1f5f9",
            height: "100%",
            minHeight: 400,
            cursor: "pointer",
            position: "relative",
            overflow: "hidden",
            border: "1px solid rgba(255, 255, 255, 0.05)",
            transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
            "&:hover": {
              border: `1px solid ${neonCyan}44`,
              boxShadow: `0 20px 40px rgba(0, 0, 0, 0.4), 0 0 20px ${neonCyan}11`,
              "& .card-glow": { opacity: 1 },
            },
          }}
        >
          {/* Glowing Accent */}
          <Box
            className="card-glow"
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "4px",
              background: `linear-gradient(90deg, ${neonCyan}, ${neonPink})`,
              opacity: 0.3,
              transition: "opacity 0.4s",
            }}
          />

          <CardContent sx={{ p: 0, height: "100%", display: "flex", flexDirection: "column" }}>
            {/* Image Container */}
            <Box sx={{ position: "relative", height: 180, overflow: "hidden" }}>
              <Box
                component="img"
                src={project.image || "/placeholder.jpg"}
                alt={project.title}
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transition: "transform 0.6s",
                  filter: "brightness(0.8) contrast(1.1)",
                }}
              />
              <Box
                sx={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: "linear-gradient(to top, rgba(15, 23, 42, 0.9), transparent)",
                  p: 2,
                }}
              >
                <Chip
                  label={project.type || "Project"}
                  size="small"
                  sx={{
                    background: "rgba(255, 255, 255, 0.1)",
                    backdropFilter: "blur(4px)",
                    color: "#f8fafc",
                    fontWeight: 700,
                    fontSize: "0.65rem",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                />
              </Box>
            </Box>

            <Box sx={{ p: 3, flexGrow: 1, display: "flex", flexDirection: "column" }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  color: "#f1f5f9",
                  mb: 1,
                  lineHeight: 1.2,
                  fontSize: "1.25rem",
                }}
              >
                {project.title}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "rgba(148, 163, 184, 0.8)",
                  mb: 3,
                  fontSize: "0.9rem",
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {project.description}
              </Typography>

              <Box sx={{ mt: "auto" }}>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
                  {project.stack?.slice(0, 3).map((tech, i) => (
                    <Typography
                      key={i}
                      variant="caption"
                      sx={{
                        color: neonCyan,
                        fontWeight: 700,
                        fontSize: "0.7rem",
                        letterSpacing: 0.5,
                      }}
                    >
                      #{tech.toUpperCase()}
                    </Typography>
                  ))}
                </Box>

                <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.05)", mb: 2 }} />

                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Avatar sx={{ width: 24, height: 24, fontSize: "0.75rem", bgcolor: slate800, color: neonCyan, border: `1px solid ${neonCyan}44` }}>
                      {project.teamLead?.[0] || "L"}
                    </Avatar>
                    <Typography variant="caption" sx={{ ml: 1, color: "rgba(255, 255, 255, 0.5)", fontWeight: 600 }}>
                      {project.teamLead || "Lead"}
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ color: neonPink, fontWeight: 800 }}>
                    VIEW DETAILS →
                  </Typography>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </motion.div>

      {/* Redesigned Dialog */}
      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            bgcolor: "#020617",
            backgroundImage: "none",
            borderRadius: "32px",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 50px 100px -20px rgba(0, 0, 0, 0.7)",
            overflow: "hidden",
          }
        }}
      >
        <DialogContent sx={{ p: 0, position: "relative", minHeight: 500 }}>
          <IconButton
            onClick={handleClose}
            sx={{
              position: "absolute",
              top: 20,
              right: 20,
              zIndex: 10,
              bgcolor: "rgba(0,0,0,0.3)",
              backdropFilter: "blur(8px)",
              color: "#fff",
              "&:hover": { bgcolor: neonPink, color: "#fff" }
            }}
          >
            <CloseIcon />
          </IconButton>

          <Box sx={{ position: "relative", height: 250 }}>
            <Box
              component="img"
              src={project.image || "/placeholder.jpg"}
              sx={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.5)" }}
            />
            <Box sx={{ position: "absolute", bottom: 0, left: 0, right: 0, p: 4, background: "linear-gradient(to top, #020617, transparent)" }}>
              <Typography variant="h3" sx={{ fontWeight: 900, color: "#fff", letterSpacing: -1 }}>
                {project.title}
              </Typography>
              <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                <Chip label={project.type} size="small" sx={{ bgcolor: neonCyan, color: "#000", fontWeight: 700 }} />
                {project.usp && <Chip label={project.usp} size="small" sx={{ bgcolor: neonPink, color: "#fff", fontWeight: 700 }} />}
              </Box>
            </Box>
          </Box>

          <Tabs
            value={tab}
            onChange={(e, newVal) => setTab(newVal)}
            variant="fullWidth"
            sx={{
              borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
              "& .MuiTab-root": { color: "rgba(255, 255, 255, 0.5)", fontWeight: 700 },
              "& .Mui-selected": { color: neonCyan },
              "& .MuiTabs-indicator": { bgcolor: neonCyan, height: 3 },
            }}
          >
            <Tab label="OVERVIEW" />
            <Tab label="TECH STACK" />
            <Tab label="LINKS" />
            <Tab label="TEAM" />
          </Tabs>

          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Box sx={{ p: 4, color: "#cbd5e1" }}>
                {tab === 0 && (
                  <Box>
                    <Typography variant="h6" sx={{ color: neonCyan, mb: 2, fontWeight: 800 }}>Project Essence</Typography>
                    <Typography variant="body1" sx={{ lineHeight: 1.8 }}>{project.description}</Typography>
                  </Box>
                )}

                {tab === 1 && (
                  <Box>
                    <Typography variant="h6" sx={{ color: neonCyan, mb: 2, fontWeight: 800 }}>Technology Framework</Typography>
                    <Grid container spacing={1}>
                      {project.stack?.map((tech, i) => (
                        <Grid item key={i}>
                          <Chip
                            label={tech}
                            sx={{
                              bgcolor: "rgba(0, 255, 255, 0.05)",
                              border: `1px solid ${neonCyan}33`,
                              color: neonCyan,
                              fontWeight: 600
                            }}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}

                {tab === 2 && (
                  <Box>
                    <Typography variant="h6" sx={{ color: neonCyan, mb: 3, fontWeight: 800 }}>Access Points</Typography>
                    <Grid container spacing={3}>
                      {project.github && (
                        <Grid item xs={12} sm={4}>
                          <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<GitHubIcon />}
                            href={project.github}
                            target="_blank"
                            sx={{ borderColor: "rgba(255,255,255,0.1)", color: "#fff", borderRadius: "12px", py: 1.5 }}
                          >
                            CODEBASE
                          </Button>
                        </Grid>
                      )}
                      {project.deployment && (
                        <Grid item xs={12} sm={4}>
                          <Button
                            fullWidth
                            variant="contained"
                            startIcon={<CloudIcon />}
                            href={project.deployment}
                            target="_blank"
                            sx={{ bgcolor: neonCyan, color: "#000", "&:hover": { bgcolor: "#00cccc" }, borderRadius: "12px", py: 1.5, fontWeight: 800 }}
                          >
                            LIVE DEMO
                          </Button>
                        </Grid>
                      )}
                      {project.gdrive && (
                        <Grid item xs={12} sm={4}>
                          <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<DriveFolderUploadIcon />}
                            href={project.gdrive}
                            target="_blank"
                            sx={{ borderColor: "rgba(255,255,255,0.1)", color: "#fff", borderRadius: "12px", py: 1.5 }}
                          >
                            RESOURCES
                          </Button>
                        </Grid>
                      )}
                    </Grid>
                  </Box>
                )}

                {tab === 3 && (
                  <Box>
                    <Typography variant="h6" sx={{ color: neonCyan, mb: 3, fontWeight: 800 }}>Project Leadership</Typography>
                    <Box sx={{ display: "flex", alignItems: "center", p: 2, bgcolor: "rgba(255,255,255,0.03)", borderRadius: "16px", mb: 4 }}>
                      <Avatar sx={{ width: 48, height: 48, bgcolor: neonCyan, color: "#000", fontWeight: 800, mr: 2 }}>{project.teamLead?.[0]}</Avatar>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#fff" }}>{project.teamLead}</Typography>
                        <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)" }}>ARCHITECT / TEAM LEAD</Typography>
                      </Box>
                    </Box>

                    <Typography variant="h6" sx={{ color: neonPink, mb: 2, fontWeight: 800 }}>Collaborators</Typography>
                    <Grid container spacing={2}>
                      {project.groupMembers?.map((member, i) => (
                        <Grid item xs={6} md={4} key={i}>
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Avatar sx={{ width: 28, height: 28, fontSize: "0.7rem", mr: 1 }}>{member[0]}</Avatar>
                            <Typography variant="body2">{member}</Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}
              </Box>
            </motion.div>
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </>
  );
}
