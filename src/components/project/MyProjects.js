"use client";

import { useState, useEffect } from "react";
import {
  Box, TextField, Typography, Button, Grid, Chip, IconButton,
  CircularProgress, Card, CardContent, CardActions, Dialog, DialogTitle, DialogContent
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import GitHubIcon from "@mui/icons-material/GitHub";
import LaunchIcon from "@mui/icons-material/Launch";
import CloseIcon from "@mui/icons-material/Close";
import Link from "next/link";

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
    // Get author name from localStorage
    const authorName = localStorage.getItem('studentName') || '';

    if (authorName) {
      // Fetch user's projects from API
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
        setMessage({ type: 'success', text: 'Project submitted for review!' });
        setShowForm(false);
        // Refresh the projects list
        const refreshRes = await fetch(`/api/portfolio-projects?authorName=${encodeURIComponent(authorName)}`);
        const refreshData = await refreshRes.json();
        setMyProjects(refreshData.projects || []);
        // Reset form
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
        setMessage({ type: 'error', text: data.error || 'Failed to submit project' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error: ' + error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress sx={{ color: '#00FFFF' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#00FFFF' }}>
          My Projects
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowForm(true)}
          sx={{
            background: 'linear-gradient(135deg, #00FFFF 0%, #FF1493 100%)',
            fontWeight: 'bold',
          }}
        >
          Submit New Project
        </Button>
      </Box>

      {/* Success/Error Message */}
      {message && (
        <Box sx={{
          p: 2,
          mb: 3,
          borderRadius: 2,
          bgcolor: message.type === 'success' ? 'rgba(0,255,0,0.1)' : 'rgba(255,0,0,0.1)',
          border: `1px solid ${message.type === 'success' ? '#00FF00' : '#FF0000'}`,
          color: message.type === 'success' ? '#00FF00' : '#FF0000'
        }}>
          {message.text}
        </Box>
      )}

      {/* Projects Grid */}
      {myProjects.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography sx={{ color: '#9ca3af', mb: 2 }}>
            You have not submitted any projects yet.
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setShowForm(true)}
            sx={{ borderColor: '#00FFFF', color: '#00FFFF' }}
          >
            Submit Your First Project
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {myProjects.map((project) => (
            <Grid item xs={12} sm={6} md={4} key={project._id}>
              <Card sx={{
                bgcolor: '#111827',
                color: '#fff',
                borderRadius: 3,
                border: '1px solid #1f2937',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.3s, box-shadow 0.3s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 30px rgba(0,255,255,0.2)',
                }
              }}>
                {project.imageUrl && (
                  <Box
                    component="img"
                    src={project.imageUrl}
                    alt={project.title}
                    sx={{ width: '100%', height: 150, objectFit: 'cover' }}
                  />
                )}
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#00FFFF' }}>
                      {project.title}
                    </Typography>
                    <Chip
                      label={project.status}
                      size="small"
                      color={getStatusColor(project.status)}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ color: '#9ca3af', mb: 2 }}>
                    {project.description?.slice(0, 100)}...
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {project.tags?.slice(0, 3).map((tag, i) => (
                      <Chip
                        key={i}
                        label={tag}
                        size="small"
                        sx={{ bgcolor: 'rgba(0,255,255,0.1)', color: '#00FFFF', fontSize: '0.7rem' }}
                      />
                    ))}
                  </Box>
                </CardContent>
                <CardActions sx={{ px: 2, pb: 2 }}>
                  {project.githubUrl && (
                    <Button
                      size="small"
                      startIcon={<GitHubIcon />}
                      href={project.githubUrl}
                      target="_blank"
                      sx={{ color: '#fff' }}
                    >
                      Code
                    </Button>
                  )}
                  {project.liveUrl && (
                    <Button
                      size="small"
                      startIcon={<LaunchIcon />}
                      href={project.liveUrl}
                      target="_blank"
                      sx={{ color: '#FF1493' }}
                    >
                      Live
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Submit Form Dialog */}
      <Dialog
        open={showForm}
        onClose={() => setShowForm(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#0f172a',
            color: '#fff',
            borderRadius: 3,
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ color: '#00FFFF' }}>Submit New Project</Typography>
          <IconButton onClick={() => setShowForm(false)} sx={{ color: '#fff' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              name="title"
              label="Project Title"
              value={formData.title}
              onChange={handleChange}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              name="description"
              label="Description"
              multiline
              rows={3}
              value={formData.description}
              onChange={handleChange}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              name="tags"
              label="Tags (comma-separated)"
              placeholder="React, Node.js, MongoDB"
              value={formData.tags}
              onChange={handleChange}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              name="category"
              label="Category"
              select
              SelectProps={{ native: true }}
              value={formData.category}
              onChange={handleChange}
              sx={{ mb: 2 }}
            >
              {['Web App', 'Mobile App', 'AI/ML', 'Blockchain', 'IoT', 'Game Dev', 'Other'].map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </TextField>
            <TextField
              fullWidth
              name="imageUrl"
              label="Image URL (optional)"
              value={formData.imageUrl}
              onChange={handleChange}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              name="githubUrl"
              label="GitHub URL (optional)"
              value={formData.githubUrl}
              onChange={handleChange}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              name="liveUrl"
              label="Live Demo URL (optional)"
              value={formData.liveUrl}
              onChange={handleChange}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              name="authorName"
              label="Your Name"
              value={formData.authorName}
              onChange={handleChange}
              required
              sx={{ mb: 3 }}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={submitting}
              sx={{
                py: 1.5,
                background: 'linear-gradient(135deg, #00FFFF 0%, #FF1493 100%)',
                fontWeight: 'bold',
              }}
            >
              {submitting ? 'Submitting...' : 'Submit Project'}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
