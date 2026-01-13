"use client";

import { useState, useEffect } from "react";
import { Box, TextField, Button, Typography, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import projectList from "./projects.json"; // static import from same folder

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

  // Load from static import
  useEffect(() => {
    setProjectsData(projectList);
    setMentors(projectList.map(entry => entry.mentor));
  }, []);

  // Update available projects when supervisor changes
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

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Typography variant="h5" fontWeight="bold">
        In-House Training June–July 2025 – ASET
      </Typography>

      <TextField label="Name" name="name" value={formData.name} onChange={handleChange} required />
      <TextField label="Enrolment Number" name="enrolment" value={formData.enrolment} onChange={handleChange} required />
      <TextField label="Phone Number" name="phone" type="tel" value={formData.phone} onChange={handleChange} required />

      <FormControl required>
        <InputLabel id="programme-label">Programme</InputLabel>
        <Select
          labelId="programme-label"
          name="programme"
          value={formData.programme}
          onChange={handleChange}
          label="Programme"
        >
          <MenuItem value="B.Tech">B.Tech</MenuItem>
          <MenuItem value="MCA">MCA</MenuItem>
          <MenuItem value="BCA">BCA</MenuItem>
          <MenuItem value="B.Sc(IT)">B.Sc(IT)</MenuItem>
          <MenuItem value="B.Sc(AGD)">B.Sc(AGD)</MenuItem>
        </Select>
      </FormControl>

      <FormControl required>
        <InputLabel id="semester-label">Semester</InputLabel>
        <Select
          labelId="semester-label"
          name="semester"
          value={formData.semester}
          onChange={handleChange}
          label="Semester"
        >
          <MenuItem value="II">II</MenuItem>
          <MenuItem value="IV">IV</MenuItem>
          <MenuItem value="VI">VI</MenuItem>
        </Select>
      </FormControl>

      <FormControl required>
        <InputLabel id="supervisor-label">Supervisor</InputLabel>
        <Select
          labelId="supervisor-label"
          name="supervisor"
          value={formData.supervisor}
          onChange={handleChange}
          label="Supervisor"
        >
          {mentors.map((mentor, idx) => (
            <MenuItem key={idx} value={mentor}>{mentor}</MenuItem>
          ))}
        </Select>
      </FormControl>

      {formData.supervisor && (
        <FormControl required>
          <InputLabel id="project-label">Project</InputLabel>
          <Select
            labelId="project-label"
            name="project"
            value={formData.project}
            onChange={handleChange}
            label="Project"
          >
            {availableProjects.map((proj, i) => (
              <MenuItem key={i} value={proj}>{proj}</MenuItem>
            ))}
            <MenuItem value="custom">Other (custom project)</MenuItem>
          </Select>
        </FormControl>
      )}

      {formData.project === "custom" && (
        <TextField
          label="Custom Project Title"
          name="customProject"
          value={formData.customProject}
          onChange={handleChange}
          required
        />
      )}

      <Button variant="contained" color="primary" type="submit">
        Submit
      </Button>
    </Box>
  );
}
