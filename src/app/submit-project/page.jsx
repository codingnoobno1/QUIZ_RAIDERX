'use client';

import React, { useState } from 'react';
import { Box, Container, TextField, Button, MenuItem, Alert, Typography } from '@mui/material';
import { SectionTitle } from '@/components/homeui/sections/CommonUI';
import { useRouter } from 'next/navigation';

const categories = ['Web App', 'Mobile App', 'AI/ML', 'Blockchain', 'IoT', 'Game Dev', 'Other'];

export default function SubmitProjectPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        tags: '',
        category: 'Web App',
        imageUrl: '',
        githubUrl: '',
        liveUrl: '',
        authorName: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage(null);

        try {
            // Get author name from localStorage or form
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
                setTimeout(() => router.push('/projects'), 2000);
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to submit project' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Network error: ' + error.message });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#0a0a0a', py: 8 }}>
            <Container maxWidth="md">
                <SectionTitle>Submit Your Project</SectionTitle>

                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 4 }}>
                    <TextField
                        fullWidth
                        label="Project Title"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        sx={{ mb: 3 }}
                    />

                    <TextField
                        fullWidth
                        label="Description"
                        required
                        multiline
                        rows={4}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        sx={{ mb: 3 }}
                    />

                    <TextField
                        fullWidth
                        label="Tags (comma-separated)"
                        placeholder="Next.js, MongoDB, AI"
                        value={formData.tags}
                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                        sx={{ mb: 3 }}
                    />

                    <TextField
                        select
                        fullWidth
                        label="Category"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        sx={{ mb: 3 }}
                    >
                        {categories.map((cat) => (
                            <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        fullWidth
                        label="Image URL (optional)"
                        value={formData.imageUrl}
                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                        sx={{ mb: 3 }}
                    />

                    <TextField
                        fullWidth
                        label="GitHub URL (optional)"
                        value={formData.githubUrl}
                        onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                        sx={{ mb: 3 }}
                    />

                    <TextField
                        fullWidth
                        label="Live Demo URL (optional)"
                        value={formData.liveUrl}
                        onChange={(e) => setFormData({ ...formData, liveUrl: e.target.value })}
                        sx={{ mb: 3 }}
                    />

                    <TextField
                        fullWidth
                        label="Your Name"
                        required
                        value={formData.authorName}
                        onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                        sx={{ mb: 3 }}
                    />

                    {message && (
                        <Alert severity={message.type} sx={{ mb: 3 }}>{message.text}</Alert>
                    )}

                    <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        disabled={submitting}
                        sx={{
                            py: 1.5,
                            background: 'linear-gradient(135deg, #00FFFF 0%, #FF1493 100%)',
                            fontWeight: 'bold',
                            fontSize: '1.1rem'
                        }}
                    >
                        {submitting ? 'Submitting...' : 'Submit Project'}
                    </Button>
                </Box>
            </Container>
        </Box>
    );
}
