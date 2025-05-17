"use client";

import { useState } from "react";
import {
  Box,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  Button,
  Typography,
  CircularProgress,
  Divider,
} from "@mui/material";
import ProjectProgress from "./ProjectProgress"; // Import progress tracker

export default function ProjectSubmissionForm() {
  const [form, setForm] = useState({
    title: "",
    abstract: "",
    type: "internship",
    name: "",
    enrollment: "",
    major: "",
    member1: "",
    member2: "",
    member3: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false); // Track if submitted
  const [status, setStatus] = useState("pending"); // Track project status
  const [errors, setErrors] = useState({}); // To track field-specific errors

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const newErrors = {};
    Object.keys(form).forEach((key) => {
      // Only validate required fields (exclude member1, member2, member3)
      if (form[key].trim() === "" && key !== "member1" && key !== "member2" && key !== "member3" && key !== "major") {
        newErrors[key] = "This field is required";
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // Return false if there are any errors
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setMessage("Please fill all required fields.");
      return;
    }

    setLoading(true);
    setMessage("");
    setErrors({}); // Clear any previous error messages

    try {
      // Replace with API call to handle project submission
      const response = await fetch(`/api/submit_${form.type}_project`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      if (data.status === "submitted") {
        setIsSubmitted(true);
        setStatus("pending");
        setMessage("Project submitted successfully with status: pending.");
      } else {
        setMessage("Error submitting project.");
      }
    } catch (error) {
      setMessage("Error submitting project. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        maxWidth: 700,
        mx: "auto",
        p: 3,
        boxShadow: 2,
        borderRadius: 2,
        opacity: isSubmitted ? 0.5 : 1, // Make form transparent if submitted
      }}
    >
      <Typography variant="h4" gutterBottom>
        Project Submission Form
      </Typography>

      <Divider sx={{ my: 2 }} />

      <TextField
        fullWidth
        label="Project Title"
        name="title"
        value={form.title}
        onChange={handleChange}
        margin="normal"
        required
        disabled={isSubmitted}
        error={!!errors.title}
        helperText={errors.title}
      />

      <TextField
        fullWidth
        label="Abstract / Project Description"
        name="abstract"
        value={form.abstract}
        onChange={handleChange}
        margin="normal"
        multiline
        rows={4}
        required
        disabled={isSubmitted}
        error={!!errors.abstract}
        helperText={errors.abstract}
      />

      <Typography variant="subtitle1" sx={{ mt: 2 }}>
        Project Type:
      </Typography>
      <RadioGroup row name="type" value={form.type} onChange={handleChange}>
        <FormControlLabel
          value="internship"
          control={<Radio />}
          label="Internship"
          disabled={isSubmitted}
        />
        <FormControlLabel
          value="minor"
          control={<Radio />}
          label="Minor Project"
          disabled={isSubmitted}
        />
        <FormControlLabel
          value="major"
          control={<Radio />}
          label="Major Project"
          disabled={isSubmitted}
        />
      </RadioGroup>

      <Divider sx={{ my: 2 }} />

      <Typography variant="h6" gutterBottom>
        Your Details
      </Typography>

      <TextField
        fullWidth
        label="Your Full Name"
        name="name"
        value={form.name}
        onChange={handleChange}
        margin="normal"
        required
        disabled={isSubmitted}
        error={!!errors.name}
        helperText={errors.name}
      />

      <TextField
        fullWidth
        label="Enrollment Number"
        name="enrollment"
        value={form.enrollment}
        onChange={handleChange}
        margin="normal"
        required
        disabled={isSubmitted}
        error={!!errors.enrollment}
        helperText={errors.enrollment}
      />

      <Divider sx={{ my: 2 }} />

      <Typography variant="h6" gutterBottom>
        Suggested Group Members (Optional, Max 3)
      </Typography>

      <TextField
        fullWidth
        label="Member 1 Name"
        name="member1"
        value={form.member1}
        onChange={handleChange}
        margin="normal"
        disabled={isSubmitted}
      />
      <TextField
        fullWidth
        label="Member 2 Name"
        name="member2"
        value={form.member2}
        onChange={handleChange}
        margin="normal"
        disabled={isSubmitted}
      />
      <TextField
        fullWidth
        label="Member 3 Name"
        name="member3"
        value={form.member3}
        onChange={handleChange}
        margin="normal"
        disabled={isSubmitted}
      />

      <Button
        variant="contained"
        color="primary"
        type="submit"
        disabled={loading || isSubmitted}
        sx={{ mt: 3 }}
      >
        {loading ? <CircularProgress size={24} /> : "Submit Proposal"}
      </Button>

      {message && (
        <Typography color="secondary" sx={{ mt: 2 }}>
          {message}
        </Typography>
      )}

      {/* Display Project Progress if accepted */}
      {status === "accepted" && <ProjectProgress />}
    </Box>
  );
}
