"use client";

import { useState } from "react";
import {
  TextField, Button, Box, Chip, Typography, Grid, InputAdornment
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import AddIcon from "@mui/icons-material/Add";
import { goldenStyle } from "../utils/styles"; // optional: extract for reusability

export default function ProjectForm() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "",
    usp: "",
    image: "",
    github: "",
    gdrive: "",
    deployment: "",
    teamLead: "",
    groupMembers: [],
    stack: [],
  });

  const [memberInput, setMemberInput] = useState("");
  const [stackInput, setStackInput] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddMember = () => {
    if (memberInput.trim()) {
      setForm({ ...form, groupMembers: [...form.groupMembers, memberInput.trim()] });
      setMemberInput("");
    }
  };

  const handleAddStack = () => {
    if (stackInput.trim()) {
      setForm({ ...form, stack: [...form.stack, stackInput.trim()] });
      setStackInput("");
    }
  };

  const handleSubmit = async () => {
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) alert("Project saved successfully!");
      else alert("Error saving project");
    } catch (err) {
      console.error(err);
      alert("Network error");
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", py: 4, px: 3 }}>
      <Typography variant="h4" sx={{ ...goldenStyle, mb: 3 }}>
        Submit New Project
      </Typography>

      <Grid container spacing={2}>
        {["title", "description", "type", "usp", "image", "github", "gdrive", "deployment", "teamLead"].map((field) => (
          <Grid item xs={12} key={field}>
            <TextField
              name={field}
              label={field.charAt(0).toUpperCase() + field.slice(1)}
              fullWidth
              value={form[field]}
              onChange={handleChange}
              multiline={field === "description"}
              rows={field === "description" ? 3 : 1}
              InputProps={{
                style: { color: "#fff" },
              }}
              InputLabelProps={{ style: { color: "#bbb" } }}
              sx={{ backgroundColor: "#1f2937", borderRadius: 1 }}
            />
          </Grid>
        ))}

        {/* Stack Input */}
        <Grid item xs={12} sm={6}>
          <TextField
            label="Add Tech Stack"
            value={stackInput}
            onChange={(e) => setStackInput(e.target.value)}
            fullWidth
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Button onClick={handleAddStack} color="primary" variant="outlined" size="small">Add</Button>
                </InputAdornment>
              ),
              style: { color: "#fff" },
            }}
            InputLabelProps={{ style: { color: "#bbb" } }}
            sx={{ backgroundColor: "#1f2937", borderRadius: 1 }}
          />
          <Box sx={{ mt: 1, display: "flex", gap: 1, flexWrap: "wrap" }}>
            {form.stack.map((tech, idx) => (
              <Chip key={idx} label={tech} color="info" size="small" />
            ))}
          </Box>
        </Grid>

        {/* Members Input */}
        <Grid item xs={12} sm={6}>
          <TextField
            label="Add Group Member"
            value={memberInput}
            onChange={(e) => setMemberInput(e.target.value)}
            fullWidth
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Button onClick={handleAddMember} color="primary" variant="outlined" size="small">Add</Button>
                </InputAdornment>
              ),
              style: { color: "#fff" },
            }}
            InputLabelProps={{ style: { color: "#bbb" } }}
            sx={{ backgroundColor: "#1f2937", borderRadius: 1 }}
          />
          <Box sx={{ mt: 1, display: "flex", gap: 1, flexWrap: "wrap" }}>
            {form.groupMembers.map((member, idx) => (
              <Chip key={idx} label={member} color="secondary" size="small" />
            ))}
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Button
            variant="contained"
            fullWidth
            color="warning"
            startIcon={<CloudUploadIcon />}
            onClick={handleSubmit}
          >
            Submit Project
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}
