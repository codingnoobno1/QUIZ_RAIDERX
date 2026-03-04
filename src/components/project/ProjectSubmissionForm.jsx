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
  Grid,
  Paper
} from "@mui/material";
import { useProjectForm } from "./projectState";
import ProjectProgress from "./ProjectProgress";
import { motion, AnimatePresence } from "framer-motion";

const neonCyan = "#00FFFF";
const neonPink = "#FF2E88";

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
    "& .MuiInputLabel-root": { color: "rgba(255, 255, 255, 0.4)" },
    "& .MuiInputLabel-root.Mui-focused": { color: neonCyan }
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
          opacity: isSubmitted ? 0.7 : 1,
          position: "relative",
          overflow: "hidden"
        }}
      >
        {/* Decorative Glow */}
        <Box sx={{
          position: "absolute",
          top: -100,
          right: -100,
          width: 300,
          height: 300,
          background: `radial-gradient(circle, ${neonPink}11 0%, transparent 70%)`
        }} />

        <Typography variant="h4" sx={{ fontWeight: 900, color: "#fff", letterSpacing: -1, mb: 1 }}>
          MISSION PROPOSAL
        </Typography>
        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.4)", mb: 4, fontWeight: 500 }}>
          Submit your academic initiative for technical review and indexing.
        </Typography>

        <TextField
          fullWidth
          label="Project Designation"
          name="title"
          variant="filled"
          value={form.title || ""}
          onChange={handleChange}
          required
          disabled={isSubmitted}
          error={!!errors.title}
          helperText={errors.title}
          sx={fieldStyle}
        />

        <TextField
          fullWidth
          label="Mission Abstract"
          name="abstract"
          variant="filled"
          value={form.abstract || ""}
          onChange={handleChange}
          multiline
          rows={4}
          required
          disabled={isSubmitted}
          error={!!errors.abstract}
          helperText={errors.abstract}
          sx={fieldStyle}
        />

        <Box sx={{ my: 3 }}>
          <Typography variant="subtitle2" sx={{ color: neonCyan, fontWeight: 800, mb: 1, letterSpacing: 1 }}>
            CLASSIFICATION
          </Typography>
          <RadioGroup
            row
            name="type"
            value={form.type || ""}
            onChange={handleChange}
          >
            {[
              { value: "internship", label: "INTERNSHIP" },
              { value: "minor", label: "MINOR PROJECT" },
              { value: "major", label: "MAJOR EXPEDITION" }
            ].map((type) => (
              <FormControlLabel
                key={type.value}
                value={type.value}
                disabled={isSubmitted}
                control={<Radio sx={{ color: "rgba(255,255,255,0.2)", "&.Mui-checked": { color: neonPink } }} />}
                label={<Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: form.type === type.value ? "#fff" : "rgba(255,255,255,0.4)" }}>{type.label}</Typography>}
              />
            ))}
          </RadioGroup>
        </Box>

        <Divider sx={{ my: 4, borderColor: "rgba(255,255,255,0.05)" }} />

        <Typography variant="h6" sx={{ color: "#fff", fontWeight: 800, mb: 3 }}>CONTRIBUTOR DATA</Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Full Identity"
              name="name"
              variant="filled"
              value={form.name || ""}
              onChange={handleChange}
              required
              disabled={isSubmitted}
              error={!!errors.name}
              sx={fieldStyle}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Enrollment Index"
              name="enrollment"
              variant="filled"
              value={form.enrollment || ""}
              onChange={handleChange}
              required
              disabled={isSubmitted}
              error={!!errors.enrollment}
              sx={fieldStyle}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Academic Sector (Branch)"
              name="major"
              variant="filled"
              value={form.major || ""}
              onChange={handleChange}
              required
              disabled={isSubmitted}
              error={!!errors.major}
              sx={fieldStyle}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 4, borderColor: "rgba(255,255,255,0.05)" }} />

        <Typography variant="h6" sx={{ color: "#fff", fontWeight: 800, mb: 3 }}>EXTENDED UNIT (OPTIONAL)</Typography>

        <Grid container spacing={2}>
          {[1, 2, 3].map((n) => (
            <Grid item xs={12} key={n}>
              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField
                  fullWidth
                  label={`Member ${n} Identity`}
                  name={`member${n}`}
                  variant="filled"
                  value={form[`member${n}`] || ""}
                  onChange={handleChange}
                  disabled={isSubmitted}
                  sx={fieldStyle}
                />
                <TextField
                  fullWidth
                  label={`Index`}
                  name={`member${n}Enrollment`}
                  variant="filled"
                  value={form[`member${n}Enrollment`] || ""}
                  onChange={handleChange}
                  disabled={isSubmitted}
                  sx={fieldStyle}
                />
              </Box>
            </Grid>
          ))}
        </Grid>

        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={loading || isSubmitted}
          sx={{
            mt: 4,
            py: 2,
            background: `linear-gradient(135deg, ${neonCyan} 0%, ${neonPink} 100%)`,
            fontWeight: 900,
            borderRadius: "16px",
            fontSize: "1rem",
            letterSpacing: 1,
            boxShadow: `0 8px 16px ${neonCyan}33`,
            "&:hover": { boxShadow: `0 12px 24px ${neonCyan}44`, transform: "translateY(-2px)" },
            transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
          }}
        >
          {loading ? <CircularProgress size={24} sx={{ color: "#fff" }} /> : "INITIALIZE UPLINK"}
        </Button>

        <AnimatePresence>
          {message && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Typography sx={{
                mt: 3,
                textAlign: "center",
                color: message.includes("success") ? neonCyan : neonPink,
                fontWeight: 600,
                p: 2,
                borderRadius: "12px",
                background: "rgba(255,255,255,0.05)"
              }}>
                {message.toUpperCase()}
              </Typography>
            </motion.div>
          )}
        </AnimatePresence>

        {status === "accepted" && <ProjectProgress />}
      </Box>
    </motion.div>
  );
}
