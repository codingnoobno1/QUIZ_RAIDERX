"use client";

import {
  Box, TextField, Typography, Button, Grid, Chip, IconButton
} from "@mui/material";
import { useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

export default function ProjectFormPage() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "project",
    stack: [],
    newTech: "",
    usp: "",
    github: "",
    gdrive: "",
    deployment: "",
    teamLead: "",
    groupMembers: [],
    newMember: "",
    image: "",
    owner: "my_user", // This should ideally come from your auth context
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const addTech = () => {
    if (formData.newTech.trim()) {
      setFormData({
        ...formData,
        stack: [...formData.stack, formData.newTech.trim()],
        newTech: "",
      });
    }
  };

  const removeTech = (techToRemove) => {
    setFormData({
      ...formData,
      stack: formData.stack.filter((tech) => tech !== techToRemove),
    });
  };

  const addMember = () => {
    if (formData.newMember.trim()) {
      setFormData({
        ...formData,
        groupMembers: [...formData.groupMembers, formData.newMember.trim()],
        newMember: "",
      });
    }
  };

  const removeMember = (memberToRemove) => {
    setFormData({
      ...formData,
      groupMembers: formData.groupMembers.filter((m) => m !== memberToRemove),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log("Submitting project:", formData);
      // You can send this to your backend using fetch/axios here.
      // await axios.post("/api/projects", formData);
    } catch (err) {
      console.error("Error submitting project:", err);
    }
  };

  return (
    <Box sx={{ p: 4, maxWidth: 800, mx: "auto" }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
        Submit a Project
      </Typography>
      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField fullWidth name="title" label="Project Title" value={formData.title} onChange={handleChange} required />
          </Grid>
          <Grid item xs={12}>
            <TextField
              multiline
              rows={4}
              fullWidth
              name="description"
              label="Project Description"
              value={formData.description}
              onChange={handleChange}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth name="usp" label="USP (Unique Point)" value={formData.usp} onChange={handleChange} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth name="image" label="Image URL" value={formData.image} onChange={handleChange} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth name="github" label="GitHub Link" value={formData.github} onChange={handleChange} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth name="gdrive" label="Google Drive Link" value={formData.gdrive} onChange={handleChange} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth name="deployment" label="Live Deployment Link" value={formData.deployment} onChange={handleChange} />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ mt: 2 }}>
              Tech Stack
            </Typography>
            <Box sx={{ display: "flex", gap: 1, mt: 1, flexWrap: "wrap" }}>
              {formData.stack.map((tech, idx) => (
                <Chip
                  key={idx}
                  label={tech}
                  onDelete={() => removeTech(tech)}
                  color="primary"
                />
              ))}
              <TextField
                size="small"
                label="Add Tech"
                value={formData.newTech}
                onChange={(e) => setFormData({ ...formData, newTech: e.target.value })}
              />
              <IconButton onClick={addTech}><AddIcon /></IconButton>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <TextField fullWidth name="teamLead" label="Team Lead" value={formData.teamLead} onChange={handleChange} />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ mt: 2 }}>
              Group Members
            </Typography>
            <Box sx={{ display: "flex", gap: 1, mt: 1, flexWrap: "wrap" }}>
              {formData.groupMembers.map((member, idx) => (
                <Chip
                  key={idx}
                  label={member}
                  onDelete={() => removeMember(member)}
                  color="secondary"
                />
              ))}
              <TextField
                size="small"
                label="Add Member"
                value={formData.newMember}
                onChange={(e) => setFormData({ ...formData, newMember: e.target.value })}
              />
              <IconButton onClick={addMember}><AddIcon /></IconButton>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Button type="submit" variant="contained" sx={{ mt: 3 }}>
              Submit Project
            </Button>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
}
