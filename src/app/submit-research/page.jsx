'use client';

import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import InputAdornment from '@mui/material/InputAdornment';
import Fade from '@mui/material/Fade';
import Grow from '@mui/material/Grow';
import { SectionTitle, GlassCard } from '@/components/homeui/sections/CommonUI';
import CodeFlowBackground from '@/components/homeui/animations/CodeFlowBackground';
import { useRouter } from 'next/navigation';
import ArticleIcon from '@mui/icons-material/Article';
import PeopleIcon from '@mui/icons-material/People';
import PublicIcon from '@mui/icons-material/Public';
import ScienceIcon from '@mui/icons-material/Science';
import LinkIcon from '@mui/icons-material/Link';

const publicationTypes = ['Journal', 'Conference', 'Preprint', 'Workshop', 'Book Chapter'];

// Custom styled TextField with neon cyber aesthetics
const CyberTextField = ({ icon, maxLength, showCounter, ...props }) => {
    const [focused, setFocused] = useState(false);
    const currentLength = props.value?.length || 0;

    return (
        <Box sx={{ position: 'relative', width: '100%' }}>
            <TextField
                {...props}
                onFocus={(e) => {
                    setFocused(true);
                    props.onFocus?.(e);
                }}
                onBlur={(e) => {
                    setFocused(false);
                    props.onBlur?.(e);
                }}
                InputProps={{
                    startAdornment: icon ? (
                        <InputAdornment position="start">
                            <Box sx={{ color: focused ? '#00FFFF' : 'rgba(0, 255, 255, 0.5)', transition: 'all 0.3s' }}>
                                {icon}
                            </Box>
                        </InputAdornment>
                    ) : undefined,
                    ...props.InputProps,
                }}
                sx={{
                    '& .MuiOutlinedInput-root': {
                        color: '#fff',
                        backgroundColor: 'rgba(0, 255, 255, 0.03)',
                        borderRadius: '8px',
                        transition: 'all 0.3s ease',
                        '& fieldset': {
                            borderColor: 'rgba(0, 255, 255, 0.3)',
                            borderWidth: '2px',
                            transition: 'all 0.3s ease',
                        },
                        '&:hover fieldset': {
                            borderColor: 'rgba(0, 255, 255, 0.6)',
                            boxShadow: '0 0 15px rgba(0, 255, 255, 0.2)',
                        },
                        '&.Mui-focused fieldset': {
                            borderColor: '#00FFFF',
                            borderWidth: '2px',
                            boxShadow: '0 0 25px rgba(0, 255, 255, 0.4), inset 0 0 20px rgba(0, 255, 255, 0.05)',
                        },
                        '&.Mui-focused': {
                            backgroundColor: 'rgba(0, 255, 255, 0.05)',
                        },
                    },
                    '& .MuiInputLabel-root': {
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontWeight: 500,
                        '&.Mui-focused': {
                            color: '#00FFFF',
                            fontWeight: 600,
                        },
                    },
                    '& .MuiInputBase-input': {
                        color: '#fff',
                        fontSize: '1rem',
                        '&::placeholder': {
                            color: 'rgba(255, 255, 255, 0.4)',
                            opacity: 1,
                        },
                    },
                    '& .MuiSelect-icon': {
                        color: focused ? '#00FFFF' : 'rgba(0, 255, 255, 0.5)',
                    },
                    ...props.sx,
                }}
            />
            {showCounter && maxLength && (
                <Typography
                    variant="caption"
                    sx={{
                        position: 'absolute',
                        right: 8,
                        bottom: -20,
                        color: currentLength > maxLength * 0.9 ? '#FF1493' : 'rgba(255, 255, 255, 0.5)',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                    }}
                >
                    {currentLength} / {maxLength}
                </Typography>
            )}
        </Box>
    );
};

export default function SubmitResearchPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        title: '',
        abstract: '',
        authors: '',
        coAuthors: '',
        publicationType: 'Journal',
        publisher: '',
        conference: '',
        journal: '',
        publishedDate: '',
        doi: '',
        pdfUrl: '',
        keywords: '',
        references: '',
        patent: '',
        submitterName: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage(null);

        try {
            const submitterName = formData.submitterName || localStorage.getItem('studentName') || 'Anonymous';

            const response = await fetch('/api/research', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    submitterName,
                    authors: formData.authors.split(',').map(a => a.trim()).filter(Boolean),
                    coAuthors: formData.coAuthors ? formData.coAuthors.split(',').map(a => a.trim()).filter(Boolean) : [],
                    keywords: formData.keywords.split(',').map(k => k.trim()).filter(Boolean),
                    references: formData.references ? formData.references.split('\n').map(r => r.trim()).filter(Boolean) : []
                })
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({ type: 'success', text: 'Research paper submitted for review! 🎉' });
                setTimeout(() => router.push('/research-papers'), 2000);
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to submit research' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Network error: ' + error.message });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Box sx={{ minHeight: '100vh', position: 'relative', overflow: 'hidden', bgcolor: '#000' }}>
            {/* Flowing Code Background */}
            <CodeFlowBackground />

            {/* Animated gradient orbs */}
            <Box sx={{
                position: 'fixed',
                top: '10%',
                right: '10%',
                width: '400px',
                height: '400px',
                background: 'radial-gradient(circle, rgba(0, 255, 255, 0.15) 0%, transparent 70%)',
                borderRadius: '50%',
                filter: 'blur(60px)',
                zIndex: 0,
                animation: 'float 8s ease-in-out infinite',
                '@keyframes float': {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-30px)' },
                }
            }} />
            <Box sx={{
                position: 'fixed',
                bottom: '10%',
                left: '10%',
                width: '300px',
                height: '300px',
                background: 'radial-gradient(circle, rgba(255, 20, 147, 0.15) 0%, transparent 70%)',
                borderRadius: '50%',
                filter: 'blur(50px)',
                zIndex: 0,
                animation: 'float 6s ease-in-out infinite',
            }} />

            {/* Form Container */}
            <Container maxWidth="md" sx={{ position: 'relative', zIndex: 2, py: 8 }}>
                <Fade in timeout={800}>
                    <Box>
                        <SectionTitle>Submit Research Paper</SectionTitle>

                        <Typography
                            variant="body1"
                            sx={{
                                color: 'rgba(255,255,255,0.7)',
                                textAlign: 'center',
                                mb: 1,
                                fontSize: '1.1rem',
                            }}
                        >
                            Share your published research with the community
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mb: 4, flexWrap: 'wrap' }}>
                            <Chip
                                icon={<ArticleIcon />}
                                label="Peer-Reviewed"
                                size="small"
                                sx={{
                                    bgcolor: 'rgba(0, 255, 255, 0.1)',
                                    color: '#00FFFF',
                                    border: '1px solid rgba(0, 255, 255, 0.3)',
                                    fontWeight: 600,
                                }}
                            />
                            <Chip
                                icon={<ScienceIcon />}
                                label="Original Research"
                                size="small"
                                sx={{
                                    bgcolor: 'rgba(255, 20, 147, 0.1)',
                                    color: '#FF1493',
                                    border: '1px solid rgba(255, 20, 147, 0.3)',
                                    fontWeight: 600,
                                }}
                            />
                        </Box>
                    </Box>
                </Fade>

                <Grow in timeout={1000}>
                    <GlassCard sx={{ p: { xs: 3, md: 5 }, backdropFilter: 'blur(30px)', backgroundColor: 'rgba(10, 10, 10, 0.8)', border: '1px solid rgba(0, 255, 255, 0.2)' }}>
                        <Box component="form" onSubmit={handleSubmit}>

                            {/* SECTION 1: Basic Information */}
                            <Box sx={{ mb: 5 }}>
                                <Typography
                                    variant="h6"
                                    sx={{
                                        color: '#00FFFF',
                                        fontWeight: 700,
                                        mb: 3,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        textTransform: 'uppercase',
                                        letterSpacing: '2px',
                                        fontSize: '0.9rem',
                                    }}
                                >
                                    <ArticleIcon /> Paper Details
                                </Typography>

                                <Grid container spacing={3}>
                                    <Grid item xs={12}>
                                        <CyberTextField
                                            fullWidth
                                            label="Paper Title *"
                                            required
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            placeholder="Enter the complete title of your research paper"
                                        />
                                    </Grid>

                                    <Grid item xs={12}>
                                        <CyberTextField
                                            fullWidth
                                            label="Abstract *"
                                            required
                                            multiline
                                            rows={6}
                                            value={formData.abstract}
                                            onChange={(e) => setFormData({ ...formData, abstract: e.target.value })}
                                            placeholder="Provide a comprehensive abstract summarizing your research objectives, methodology, results, and conclusions..."
                                            maxLength={5000}
                                            showCounter
                                        />
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <CyberTextField
                                            select
                                            fullWidth
                                            label="Publication Type *"
                                            value={formData.publicationType}
                                            onChange={(e) => setFormData({ ...formData, publicationType: e.target.value })}
                                            icon={<ArticleIcon />}
                                        >
                                            {publicationTypes.map((type) => (
                                                <MenuItem key={type} value={type} sx={{ color: '#000' }}>{type}</MenuItem>
                                            ))}
                                        </CyberTextField>
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <CyberTextField
                                            fullWidth
                                            label="Published Date"
                                            type="date"
                                            InputLabelProps={{ shrink: true }}
                                            value={formData.publishedDate}
                                            onChange={(e) => setFormData({ ...formData, publishedDate: e.target.value })}
                                        />
                                    </Grid>

                                    <Grid item xs={12}>
                                        <CyberTextField
                                            fullWidth
                                            label="Keywords (comma-separated)"
                                            placeholder="Machine Learning, Neural Networks, Computer Vision, Deep Learning"
                                            value={formData.keywords}
                                            onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                                        />
                                    </Grid>
                                </Grid>
                            </Box>

                            <Divider sx={{ my: 4, borderColor: 'rgba(0, 255, 255, 0.2)', borderWidth: '1px' }} />

                            {/* SECTION 2: Authors */}
                            <Box sx={{ mb: 5 }}>
                                <Typography
                                    variant="h6"
                                    sx={{
                                        color: '#FF1493',
                                        fontWeight: 700,
                                        mb: 3,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        textTransform: 'uppercase',
                                        letterSpacing: '2px',
                                        fontSize: '0.9rem',
                                    }}
                                >
                                    <PeopleIcon /> Authors & Contributors
                                </Typography>

                                <Grid container spacing={3}>
                                    <Grid item xs={12}>
                                        <CyberTextField
                                            fullWidth
                                            label="Primary Authors (comma-separated)"
                                            placeholder="Dr. John Doe, Dr. Jane Smith, Prof. Alice Johnson"
                                            value={formData.authors}
                                            onChange={(e) => setFormData({ ...formData, authors: e.target.value })}
                                            icon={<PeopleIcon />}
                                        />
                                    </Grid>

                                    <Grid item xs={12}>
                                        <CyberTextField
                                            fullWidth
                                            label="Co-Authors (optional, comma-separated)"
                                            placeholder="Research Assistants, Contributors"
                                            value={formData.coAuthors}
                                            onChange={(e) => setFormData({ ...formData, coAuthors: e.target.value })}
                                        />
                                    </Grid>

                                    <Grid item xs={12}>
                                        <CyberTextField
                                            fullWidth
                                            label="Your Name *"
                                            required
                                            placeholder="Submitter's full name"
                                            value={formData.submitterName}
                                            onChange={(e) => setFormData({ ...formData, submitterName: e.target.value })}
                                        />
                                    </Grid>
                                </Grid>
                            </Box>

                            <Divider sx={{ my: 4, borderColor: 'rgba(0, 255, 255, 0.2)', borderWidth: '1px' }} />

                            {/* SECTION 3: Publication Details */}
                            <Box sx={{ mb: 5 }}>
                                <Typography
                                    variant="h6"
                                    sx={{
                                        color: '#00FFFF',
                                        fontWeight: 700,
                                        mb: 3,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        textTransform: 'uppercase',
                                        letterSpacing: '2px',
                                        fontSize: '0.9rem',
                                    }}
                                >
                                    <PublicIcon /> Publication Information
                                </Typography>

                                <Grid container spacing={3}>
                                    <Grid item xs={12} md={6}>
                                        <CyberTextField
                                            fullWidth
                                            label="Publisher"
                                            placeholder="IEEE, Springer, ACM, Elsevier, etc."
                                            value={formData.publisher}
                                            onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                                            icon={<PublicIcon />}
                                        />
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <CyberTextField
                                            fullWidth
                                            label="Journal Name"
                                            placeholder="e.g., IEEE Transactions on Neural Networks"
                                            value={formData.journal}
                                            onChange={(e) => setFormData({ ...formData, journal: e.target.value })}
                                        />
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <CyberTextField
                                            fullWidth
                                            label="Conference Name"
                                            placeholder="e.g., CVPR 2024, NeurIPS 2024"
                                            value={formData.conference}
                                            onChange={(e) => setFormData({ ...formData, conference: e.target.value })}
                                        />
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <CyberTextField
                                            fullWidth
                                            label="DOI"
                                            placeholder="10.1109/EXAMPLE.2024.12345"
                                            value={formData.doi}
                                            onChange={(e) => setFormData({ ...formData, doi: e.target.value })}
                                            icon={<ScienceIcon />}
                                        />
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <CyberTextField
                                            fullWidth
                                            label="PDF URL"
                                            placeholder="https://arxiv.org/pdf/..."
                                            value={formData.pdfUrl}
                                            onChange={(e) => setFormData({ ...formData, pdfUrl: e.target.value })}
                                            icon={<LinkIcon />}
                                        />
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <CyberTextField
                                            fullWidth
                                            label="Related Patent (optional)"
                                            placeholder="Patent number or description"
                                            value={formData.patent}
                                            onChange={(e) => setFormData({ ...formData, patent: e.target.value })}
                                        />
                                    </Grid>
                                </Grid>
                            </Box>

                            <Divider sx={{ my: 4, borderColor: 'rgba(0, 255, 255, 0.2)', borderWidth: '1px' }} />

                            {/* SECTION 4: References */}
                            <Box sx={{ mb: 4 }}>
                                <Typography
                                    variant="h6"
                                    sx={{
                                        color: '#FF1493',
                                        fontWeight: 700,
                                        mb: 3,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        textTransform: 'uppercase',
                                        letterSpacing: '2px',
                                        fontSize: '0.9rem',
                                    }}
                                >
                                    <ArticleIcon /> References
                                </Typography>

                                <CyberTextField
                                    fullWidth
                                    label="References (optional, one per line)"
                                    multiline
                                    rows={4}
                                    placeholder="[1] Author A. et al. (2023). Title of Paper. Journal Name.&#10;[2] Author B. et al. (2022). Another Paper. Conference Name."
                                    value={formData.references}
                                    onChange={(e) => setFormData({ ...formData, references: e.target.value })}
                                />
                            </Box>

                            {/* Alert Message */}
                            {message && (
                                <Fade in>
                                    <Alert
                                        severity={message.type}
                                        sx={{
                                            mb: 3,
                                            bgcolor: message.type === 'success' ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 0, 0, 0.1)',
                                            color: message.type === 'success' ? '#00FF00' : '#FF4444',
                                            border: `1px solid ${message.type === 'success' ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 0, 0, 0.3)'}`,
                                            '& .MuiAlert-icon': {
                                                color: message.type === 'success' ? '#00FF00' : '#FF4444',
                                            }
                                        }}
                                    >
                                        {message.text}
                                    </Alert>
                                </Fade>
                            )}

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                variant="contained"
                                fullWidth
                                disabled={submitting}
                                sx={{
                                    py: 2,
                                    background: 'linear-gradient(135deg, #FF1493 0%, #00FFFF 100%)',
                                    fontWeight: 'bold',
                                    fontSize: '1.2rem',
                                    letterSpacing: '2px',
                                    textTransform: 'uppercase',
                                    borderRadius: '8px',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 10px 40px rgba(255, 20, 147, 0.5), 0 0 30px rgba(0, 255, 255, 0.3)',
                                    },
                                    '&:active': {
                                        transform: 'translateY(0px)',
                                    },
                                    '&:disabled': {
                                        background: 'rgba(100, 100, 100, 0.3)',
                                        color: 'rgba(255, 255, 255, 0.4)',
                                    },
                                    transition: 'all 0.3s ease',
                                    '&::before': {
                                        content: '""',
                                        position: 'absolute',
                                        top: '-50%',
                                        left: '-50%',
                                        width: '200%',
                                        height: '200%',
                                        background: 'linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
                                        transform: 'rotate(45deg)',
                                        animation: 'shine 3s infinite',
                                    },
                                    '@keyframes shine': {
                                        '0%': { transform: 'translateX(-100%) rotate(45deg)' },
                                        '100%': { transform: 'translateX(100%) rotate(45deg)' },
                                    },
                                }}
                            >
                                {submitting ? '⚡ Submitting...' : '🚀 Submit Research Paper'}
                            </Button>
                        </Box>
                    </GlassCard>
                </Grow>
            </Container>
        </Box>
    );
}
