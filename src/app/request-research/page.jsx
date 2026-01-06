'use client';

import React, { useState } from 'react';
import { Box, Container, TextField, Button, MenuItem, Alert, Typography, Chip } from '@mui/material';
import { SectionTitle } from '@/components/homeui/sections/CommonUI';
import { useRouter } from 'next/navigation';

const researchAreas = ['AI/ML', 'Blockchain', 'IoT', 'Cybersecurity', 'Web Development', 'Mobile Development', 'Data Science', 'Other'];

export default function RequestResearchPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        studentName: '',
        studentEmail: '',
        studentEnrollment: '',
        facultyName: '',
        researchArea: 'AI/ML',
        proposedTopic: '',
        motivation: '',
        skills: '',
        previousWork: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState(null);

    // Auto-fill student name from localStorage on mount
    React.useEffect(() => {
        const savedName = localStorage.getItem('studentName');
        if (savedName) {
            setFormData(prev => ({ ...prev, studentName: savedName }));
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage(null);

        try {
            const response = await fetch('/api/research-requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean)
                })
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({ type: 'success', text: 'Research request submitted successfully! You will be notified once reviewed.' });
                // Reset form
                setTimeout(() => {
                    setFormData({
                        studentName: localStorage.getItem('studentName') || '',
                        studentEmail: '',
                        studentEnrollment: '',
                        facultyName: '',
                        researchArea: 'AI/ML',
                        proposedTopic: '',
                        motivation: '',
                        skills: '',
                        previousWork: ''
                    });
                }, 2000);
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to submit request' });
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
                <SectionTitle>Request Research Opportunity</SectionTitle>

                <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center', mb: 4 }}>
                    Apply to work on research under a faculty member
                </Typography>

                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 4 }}>
                    {/* Student Information */}
                    <Typography variant="h6" sx={{ color: '#00FFFF', mb: 2 }}>Student Information</Typography>

                    <TextField
                        fullWidth
                        label="Your Name"
                        required
                        value={formData.studentName}
                        onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                        sx={{ mb: 3 }}
                    />

                    <TextField
                        fullWidth
                        label="Email Address"
                        type="email"
                        value={formData.studentEmail}
                        onChange={(e) => setFormData({ ...formData, studentEmail: e.target.value })}
                        sx={{ mb: 3 }}
                    />

                    <TextField
                        fullWidth
                        label="Enrollment Number"
                        value={formData.studentEnrollment}
                        onChange={(e) => setFormData({ ...formData, studentEnrollment: e.target.value })}
                        sx={{ mb: 3 }}
                    />

                    {/* Research Details */}
                    <Typography variant="h6" sx={{ color: '#00FFFF', mb: 2, mt: 4 }}>Research Details</Typography>

                    <TextField
                        fullWidth
                        label="Faculty Name"
                        required
                        placeholder="e.g., Dr. John Smith"
                        value={formData.facultyName}
                        onChange={(e) => setFormData({ ...formData, facultyName: e.target.value })}
                        sx={{ mb: 3 }}
                    />

                    <TextField
                        select
                        fullWidth
                        label="Research Area"
                        required
                        value={formData.researchArea}
                        onChange={(e) => setFormData({ ...formData, researchArea: e.target.value })}
                        sx={{ mb: 3 }}
                    >
                        {researchAreas.map((area) => (
                            <MenuItem key={area} value={area}>{area}</MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        fullWidth
                        label="Proposed Topic (Optional)"
                        placeholder="Brief overview of what you'd like to research"
                        value={formData.proposedTopic}
                        onChange={(e) => setFormData({ ...formData, proposedTopic: e.target.value })}
                        sx={{ mb: 3 }}
                    />

                    <TextField
                        fullWidth
                        label="Motivation"
                        required
                        multiline
                        rows={5}
                        placeholder="Why do you want to work on this research? What interests you about this area?"
                        value={formData.motivation}
                        onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
                        sx={{ mb: 3 }}
                    />

                    <TextField
                        fullWidth
                        label="Skills (comma-separated)"
                        placeholder="Python, Machine Learning, Data Analysis"
                        value={formData.skills}
                        onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                        helperText="List relevant skills separated by commas"
                        sx={{ mb: 3 }}
                    />

                    <TextField
                        fullWidth
                        label="Previous Work / Portfolio (Optional)"
                        placeholder="GitHub profile, research papers, projects, etc."
                        multiline
                        rows={2}
                        value={formData.previousWork}
                        onChange={(e) => setFormData({ ...formData, previousWork: e.target.value })}
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
                        {submitting ? 'Submitting...' : 'Submit Research Request'}
                    </Button>
                </Box>
            </Container>
        </Box>
    );
}
