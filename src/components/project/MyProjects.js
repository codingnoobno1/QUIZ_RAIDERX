"use client";

import { useState, useEffect } from "react";
import {
  Box, TextField, Typography, Button, Grid, Chip, IconButton,
  CircularProgress, Dialog, DialogTitle, DialogContent, Avatar
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import { motion, AnimatePresence } from "framer-motion";
import ProjectCard from "./ProjectCard";

const neonCyan = "#00FFFF";
const neonPink = "#FF2E88";
const slate800 = "#1e293b";

export default function MyProjects() {
  const [myProjects, setMyProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    tags: "",
    category: "Web App",
    imageUrl: "",
    githubUrl: "",
    liveUrl: "",
    authorName: "",
  });

  useEffect(() => {
    const authorName = localStorage.getItem('studentName') || '';
    if (authorName) {
      fetch(`/api/portfolio-projects?authorName=${encodeURIComponent(authorName)}`)
        .then(res => res.json())
        .then(data => {
          setMyProjects(data.projects || []);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error fetching projects:', err);
          setLoading(false);
        });
      setFormData(prev => ({ ...prev, authorName }));
    } else {
      setLoading(false);
    }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const authorName = formData.authorName || localStorage.getItem('studentName') || 'Anonymous';
      const response = await fetch('/api/portfolio-projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          authorName,
          tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Project deployed to the staging sector! Waiting for approval.' });
        setShowForm(false);
        const refreshRes = await fetch(`/api/portfolio-projects?authorName=${encodeURIComponent(authorName)}`);
        const refreshData = await refreshRes.json();
        setMyProjects(refreshData.projects || []);
        setFormData({
          title: "",
          description: "",
          tags: "",
          category: "Web App",
          imageUrl: "",
          githubUrl: "",
          liveUrl: "",
          authorName,
        });
      } else {
        setMessage({ type: 'error', text: data.error || 'Uplink failed. Transmission interrupted.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Critical Error: ' + error.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <CircularProgress sx={{ color: neonCyan }} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, color: "#fff", letterSpacing: -1 }}>
            MY EXPEDITIONS
          </Typography>
          <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.4)", fontWeight: 500 }}>
            Track your contributions to the collective index.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowForm(true)}
          sx={{
            background: `linear-gradient(135deg, ${neonCyan} 0%, ${neonPink} 100%)`,
            fontWeight: 800,
            px: 3,
            py: 1.5,
            borderRadius: "16px",
            boxShadow: `0 8px 16px ${neonCyan}33`,
            "&:hover": { transform: "translateY(-2px)", boxShadow: `0 12px 24px ${neonCyan}44` },
            transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
          }}
        >
          NEW INITIATIVE
        </Button>
      </Box>

      {/* Status Message */}
      <AnimatePresence>
        {message && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <Box sx={{
              p: 2,
              mb: 4,
              borderRadius: "16px",
              background: message.type === 'success' ? `${neonCyan}11` : `${neonPink}11`,
              border: `1px solid ${message.type === 'success' ? neonCyan : neonPink}44`,
              color: message.type === 'success' ? neonCyan : neonPink,
              fontWeight: 600,
              display: "flex",
              alignItems: "center"
            }}>
              {message.text}
            </Box>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Projects Grid */}
      {myProjects.length === 0 ? (
        <Box sx={{
          textAlign: 'center',
          py: 10,
          border: "1px dashed rgba(255, 255, 255, 0.1)",
          borderRadius: "32px",
          background: "rgba(255, 255, 255, 0.02)"
        }}>
          <Typography sx={{ color: 'rgba(255, 255, 255, 0.3)', mb: 3, fontWeight: 500 }}>
            No records found for your signature. Start a new expedition.
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setShowForm(true)}
            sx={{ borderColor: neonCyan, color: neonCyan, borderRadius: "12px", "&:hover": { borderColor: neonPink, color: neonPink } }}
          >
            INITIALIZE FIRST PROJECT
          </Button>
        </Box>
      ) : (
        <Grid container spacing={4}>
          {myProjects.map((project) => (
            <Grid item xs={12} sm={6} md={4} key={project._id}>
              <ProjectCard data={project} />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Submission Form Dialog */}
      <Dialog
        open={showForm}
        onClose={() => setShowForm(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: "#020617",
            color: "#fff",
            borderRadius: "32px",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 50px 100px -20px rgba(0, 0, 0, 0.7)",
            backgroundImage: "none",
          }
        }}
      >
        <DialogTitle sx={{ p: 4, pb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 900, color: neonCyan, letterSpacing: -1 }}>NEW EXPEDITION</Typography>
          <IconButton onClick={() => setShowForm(false)} sx={{ color: 'rgba(255,255,255,0.4)', "&:hover": { color: neonPink } }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 4, pt: 2 }}>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="title"
                  label="Project Designation"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  variant="filled"
                  sx={{ bgcolor: "rgba(255, 255, 255, 0.03)", borderRadius: "12px", "& .MuiFilledInput-root": { borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" } }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="description"
                  label="Mission Briefing"
                  multiline
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  required
                  variant="filled"
                  sx={{ bgcolor: "rgba(255, 255, 255, 0.03)", borderRadius: "12px", "& .MuiFilledInput-root": { borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="tags"
                  label="Tech Tags"
                  placeholder="React, AI, etc."
                  value={formData.tags}
                  onChange={handleChange}
                  variant="filled"
                  sx={{ bgcolor: "rgba(255, 255, 255, 0.03)", borderRadius: "12px", "& .MuiFilledInput-root": { borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="category"
                  label="Classification"
                  select
                  SelectProps={{ native: true }}
                  value={formData.category}
                  onChange={handleChange}
                  variant="filled"
                  sx={{ bgcolor: "rgba(255, 255, 255, 0.03)", borderRadius: "12px", "& .MuiFilledInput-root": { borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" } }}
                >
                  {['Web App', 'Mobile App', 'AI/ML', 'Blockchain', 'IoT', 'Game Dev', 'Other'].map(cat => (
                    <option key={cat} value={cat} style={{ background: "#0f172a" }}>{cat}</option>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="imageUrl"
                  label="Visual Metadata (URL)"
                  value={formData.imageUrl}
                  onChange={handleChange}
                  variant="filled"
                  sx={{ bgcolor: "rgba(255, 255, 255, 0.03)", borderRadius: "12px", "& .MuiFilledInput-root": { borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="githubUrl"
                  label="Uplink (GitHub)"
                  value={formData.githubUrl}
                  onChange={handleChange}
                  variant="filled"
                  sx={{ bgcolor: "rgba(255, 255, 255, 0.03)", borderRadius: "12px", "& .MuiFilledInput-root": { borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="liveUrl"
                  label="Live Sector"
                  value={formData.liveUrl}
                  onChange={handleChange}
                  variant="filled"
                  sx={{ bgcolor: "rgba(255, 255, 255, 0.03)", borderRadius: "12px", "& .MuiFilledInput-root": { borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" } }}
                />
              </Grid>
            </Grid>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={submitting}
              sx={{
                mt: 4,
                py: 2,
                background: `linear-gradient(135deg, ${neonCyan} 0%, ${neonPink} 100%)`,
                fontWeight: 900,
                borderRadius: "16px",
                fontSize: "1rem",
                letterSpacing: 1,
                boxShadow: `0 8px 16px ${neonCyan}33`,
                "&:hover": { boxShadow: `0 12px 24px ${neonCyan}44` }
              }}
            >
              {submitting ? 'TRANSMITTING...' : 'INITIALIZE UPLINK'}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
