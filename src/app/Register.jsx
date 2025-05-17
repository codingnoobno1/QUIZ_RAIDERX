"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  TextField,
  Button,
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
} from "@mui/material";

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    enrollmentNumber: "",
    course: "",
    semester: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const { name, enrollmentNumber, course, semester, email, password, confirmPassword } = formData;

    // Client-side validation
    if ([name, enrollmentNumber, course, semester, email, password, confirmPassword].some(field => field.trim() === "")) {
      setError("All fields are required");
      setLoading(false);
      return;
    }

    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Registration failed");

      setSuccess("User registered successfully! Redirecting...");
      setTimeout(() => router.push("/login"), 2000); // Redirect to login
    } catch (err) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      bgcolor="#f0f4f8"
    >
      <Paper elevation={6} sx={{ p: 4, maxWidth: 400, width: "100%" }}>
        <Typography
          variant="h5"
          fontWeight="bold"
          color="primary"
          mb={2}
          textAlign="center"
        >
          Register
        </Typography>
        <form onSubmit={handleSubmit} noValidate>
          <InputField label="Name" name="name" value={formData.name} onChange={handleChange} />
          <InputField label="Email" name="email" type="email" value={formData.email} onChange={handleChange} />
          <InputField label="Enrollment Number" name="enrollmentNumber" value={formData.enrollmentNumber} onChange={handleChange} />
          <InputField label="Course" name="course" value={formData.course} onChange={handleChange} />
          <InputField label="Semester" name="semester" value={formData.semester} onChange={handleChange} />
          <InputField label="Password" name="password" type="password" value={formData.password} onChange={handleChange} />
          <InputField label="Confirm Password" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} />

          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : "Register"}
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

const InputField = ({ label, name, type = "text", value, onChange }) => (
  <TextField
    label={label}
    name={name}
    type={type}
    value={value}
    onChange={onChange}
    fullWidth
    margin="normal"
    variant="outlined"
    required
  />
);

export default RegisterPage;
