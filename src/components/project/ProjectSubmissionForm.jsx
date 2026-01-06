"use client";

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
import { useProjectForm } from "./projectState";
import ProjectProgress from "./ProjectProgress";

export default function ProjectSubmissionForm() {
  const {
    form,
    handleChange,
    handleSubmit,
    loading,
    isSubmitted,
    status,
    message,
    errors,
  } = useProjectForm();

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
        opacity: isSubmitted ? 0.5 : 1,
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
        value={form.title || ""}
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
        value={form.abstract || ""}
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
      <RadioGroup
        row
        name="type"
        value={form.type || ""}
        onChange={handleChange}
      >
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
        value={form.name || ""}
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
        value={form.enrollment || ""}
        onChange={handleChange}
        margin="normal"
        required
        disabled={isSubmitted}
        error={!!errors.enrollment}
        helperText={errors.enrollment}
      />

      <TextField
        fullWidth
        label="Branch / Major"
        name="major"
        value={form.major || ""}
        onChange={handleChange}
        margin="normal"
        required
        disabled={isSubmitted}
        error={!!errors.major}
        helperText={errors.major}
      />

      <Divider sx={{ my: 2 }} />

      <Typography variant="h6" gutterBottom>
        Suggested Group Members (Optional, Max 3)
      </Typography>

      {[1, 2, 3].map((n) => (
        <Box key={n}>
          <TextField
            fullWidth
            label={`Member ${n} Name`}
            name={`member${n}`}
            value={form[`member${n}`] || ""}
            onChange={handleChange}
            margin="normal"
            disabled={isSubmitted}
          />
          <TextField
            fullWidth
            label={`Member ${n} Enrollment`}
            name={`member${n}Enrollment`}
            value={form[`member${n}Enrollment`] || ""}
            onChange={handleChange}
            margin="normal"
            disabled={isSubmitted}
          />
        </Box>
      ))}

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

      {status === "accepted" && <ProjectProgress />}
    </Box>
  );
}
