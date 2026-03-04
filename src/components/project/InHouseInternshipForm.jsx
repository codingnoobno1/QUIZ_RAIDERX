"use client";

import { useState, useEffect } from "react";
import {
  Box, TextField, Button, Typography, FormControl,
  InputLabel, Select, MenuItem, Grid, Paper, Divider
} from "@mui/material";
import projectList from "./projects.json";
import { motion, AnimatePresence } from "framer-motion";

const neonCyan = "#00FFFF";
const neonPink = "#FF2E88";
const slate900 = "#020617";

export default function InHouseInternshipForm() {
  const [formData, setFormData] = useState({
    name: "",
    enrolment: "",
    phone: "",
    programme: "",
    semester: "",
    supervisor: "",
    project: "",
    customProject: ""
  });

  const [projectsData, setProjectsData] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [availableProjects, setAvailableProjects] = useState([]);

  useEffect(() => {
    setProjectsData(projectList);
    setMentors(projectList.map(entry => entry.mentor));
  }, []);

  useEffect(() => {
    const entry = projectsData.find(m => m.mentor === formData.supervisor);
    setAvailableProjects(entry ? entry.projects : []);
    setFormData(prev => ({ ...prev, project: "", customProject: "" }));
  }, [formData.supervisor, projectsData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalProject = formData.project === "custom" ? formData.customProject : formData.project;
    const finalData = { ...formData, project: finalProject };
    console.log("Submitted Data:", finalData);
  };

  const fieldStyle = {
    mb: 2,
    "& .MuiFilledInput-root": {
      bgcolor: "rgba(255, 255, 255, 0.03)",
      borderRadius: "12px",
      border: "1px solid rgba(255, 255, 255, 0.05)",
      color: "#fff",
      "&:hover": { bgcolor: "rgba(255, 255, 255, 0.05)" },
      "&.Mui-focused": { border: `1px solid ${neonCyan}33` },
      "&:before, &:after": { display: "none" }
    },
    "& .MuiInputLabel-root": { color: "rgba(255, 255, 255, 0.4)", fontSize: "0.9rem" },
    "& .MuiInputLabel-root.Mui-focused": { color: neonCyan },
    "& .MuiSelect-icon": { color: "rgba(255,255,255,0.4)" }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          maxWidth: 800,
          mx: "auto",
          p: { xs: 3, md: 6 },
          background: "rgba(30, 41, 59, 0.1)",
          backdropFilter: "blur(20px)",
          borderRadius: "32px",
          border: "1px solid rgba(255, 255, 255, 0.05)",
          position: "relative",
          overflow: "hidden"
        }}
      >
        {/* Decorative Glow */}
        <Box sx={{
          position: "absolute",
          bottom: -100,
          left: -100,
          width: 300,
          height: 300,
          background: `radial-gradient(circle, ${neonCyan}11 0%, transparent 70%)`
        }} />

        <Typography variant="h4" sx={{ fontWeight: 900, color: "#fff", letterSpacing: -1, mb: 1 }}>
          IN-HOUSE TRAINING
        </Typography>
        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.4)", mb: 4, fontWeight: 500 }}>
          Enrollment for June–July 2025 – ASET Technical Portal.
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField fullWidth label="Full Name" name="name" variant="filled" value={formData.name} onChange={handleChange} required sx={fieldStyle} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Enrollment Index" name="enrolment" variant="filled" value={formData.enrolment} onChange={handleChange} required sx={fieldStyle} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Communication Uplink (Phone)" name="phone" type="tel" variant="filled" value={formData.phone} onChange={handleChange} required sx={fieldStyle} />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth required variant="filled" sx={fieldStyle}>
              <InputLabel id="programme-label">Programme</InputLabel>
              <Select labelId="programme-label" name="programme" value={formData.programme} onChange={handleChange}>
                {["B.Tech", "MCA", "BCA", "B.Sc(IT)", "B.Sc(AGD)"].map(val => (
                  <MenuItem key={val} value={val} sx={{ bgcolor: slate900, color: "#fff", "&:hover": { bgcolor: "rgba(0,255,255,0.1)" } }}>{val}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth required variant="filled" sx={fieldStyle}>
              <InputLabel id="semester-label">Semester Cycle</InputLabel>
              <Select labelId="semester-label" name="semester" value={formData.semester} onChange={handleChange}>
                {["II", "IV", "VI"].map(val => (
                  <MenuItem key={val} value={val} sx={{ bgcolor: slate900, color: "#fff" }}>{val}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.05)" }} />
            <Typography variant="h6" sx={{ color: "#fff", fontWeight: 800, mb: 2, mt: 1 }}>MENTORSHIP & PROJECT</Typography>
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth required variant="filled" sx={fieldStyle}>
              <InputLabel id="supervisor-label">Project Supervisor</InputLabel>
              <Select labelId="supervisor-label" name="supervisor" value={formData.supervisor} onChange={handleChange}>
                {mentors.map((mentor, idx) => (
                  <MenuItem key={idx} value={mentor} sx={{ bgcolor: slate900, color: "#fff" }}>{mentor}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <AnimatePresence>
            {formData.supervisor && (
              <Grid item xs={12} component={motion.div} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                <FormControl fullWidth required variant="filled" sx={fieldStyle}>
                  <InputLabel id="project-label">Initiative Designation</InputLabel>
                  <Select labelId="project-label" name="project" value={formData.project} onChange={handleChange}>
                    {availableProjects.map((proj, i) => (
                      <MenuItem key={i} value={proj} sx={{ bgcolor: slate900, color: "#fff" }}>{proj}</MenuItem>
                    ))}
                    <MenuItem value="custom" sx={{ bgcolor: slate900, color: neonPink }}>OTHER (CUSTOM INITIATIVE)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {formData.project === "custom" && (
              <Grid item xs={12} component={motion.div} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                <TextField fullWidth label="Custom Project Title" name="customProject" variant="filled" value={formData.customProject} onChange={handleChange} required sx={fieldStyle} />
              </Grid>
            )}
          </AnimatePresence>
        </Grid>

        <Button
          type="submit"
          variant="contained"
          fullWidth
          sx={{
            mt: 4,
            py: 2,
            background: `linear-gradient(135deg, ${neonPink} 0%, ${neonCyan} 100%)`,
            fontWeight: 900,
            borderRadius: "16px",
            fontSize: "1rem",
            letterSpacing: 1,
            boxShadow: `0 8px 16px ${neonPink}33`,
            "&:hover": { boxShadow: `0 12px 24px ${neonPink}44`, transform: "translateY(-2px)" },
            transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
          }}
        >
          INITIALIZE TRAINING ENROLLMENT
        </Button>
      </Box>
    </motion.div>
  );
}
