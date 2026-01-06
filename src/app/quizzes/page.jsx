'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
    Box,
    Typography,
    Grid,
    CircularProgress,
    Container,
    Paper,
    TextField,
    MenuItem,
    Stack,
    Alert,
} from '@mui/material';
import QuizCard from '@/components/ui/QuizCard';

export default function QuizzesPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Filters
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedSemester, setSelectedSemester] = useState('');

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (status === 'authenticated') {
            fetchQuizzes();
        }
    }, [status, router]);

    const fetchQuizzes = async () => {
        setLoading(true);
        setError('');
        try {
            // Get user's batch and semester from session
            const batch = session?.user?.course || 'BTECH';
            const semester = session?.user?.semester || 5;
            const subjectName = selectedSubject || 'daa'; // Default subject

            const response = await fetch(
                `/api/fetchquizzes?batch=${encodeURIComponent(batch)}&subject=${encodeURIComponent(subjectName)}&semester=${semester}`
            );

            if (response.ok) {
                const data = await response.json();
                setQuizzes(data.quizzes || []);
            } else {
                setError('Failed to load quizzes');
            }
        } catch (err) {
            console.error('Error fetching quizzes:', err);
            setError('Error loading quizzes');
        } finally {
            setLoading(false);
        }
    };

    // Extract unique subjects and semesters
    const subjects = [...new Set(quizzes.map(q => q.subjectId?.name).filter(Boolean))];
    const semesters = [...new Set(quizzes.map(q => q.semester).filter(Boolean))].sort();

    if (status === 'loading' || loading) {
        return (
            <Box
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
                minHeight="100vh"
                sx={{
                    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
                }}
            >
                <CircularProgress sx={{ color: '#FFD700' }} size={60} />
                <Typography mt={3} color="#FFD700" variant="h6">
                    Loading Quizzes...
                </Typography>
            </Box>
        );
    }

    return (
        <Box
            minHeight="100vh"
            sx={{
                background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
                py: 4,
            }}
        >
            <Container maxWidth="lg">
                {/* Header */}
                <Paper
                    elevation={8}
                    sx={{
                        p: 4,
                        mb: 4,
                        borderRadius: 4,
                        bgcolor: '#0e0e0e',
                        border: '1px solid rgba(255, 215, 0, 0.3)',
                        boxShadow: '0 0 20px rgba(255, 215, 0, 0.2)',
                    }}
                >
                    <Typography
                        variant="h3"
                        fontWeight={900}
                        sx={{
                            background: 'linear-gradient(135deg, #FFD700 0%, #FFC700 100%)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            mb: 1,
                            textAlign: 'center',
                        }}
                    >
                        Available Quizzes
                    </Typography>
                    <Typography
                        variant="subtitle1"
                        sx={{
                            color: '#f3ce3c',
                            textAlign: 'center',
                        }}
                    >
                        {quizzes.length} {quizzes.length === 1 ? 'quiz' : 'quizzes'} available
                    </Typography>
                </Paper>

                {/* Filters */}
                {subjects.length > 0 && (
                    <Paper
                        elevation={4}
                        sx={{
                            p: 3,
                            mb: 4,
                            borderRadius: 3,
                            bgcolor: '#0e0e0e',
                            border: '1px solid rgba(255, 215, 0, 0.2)',
                        }}
                    >
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                            <TextField
                                select
                                label="Subject"
                                value={selectedSubject}
                                onChange={(e) => setSelectedSubject(e.target.value)}
                                fullWidth
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        color: '#FFD700',
                                        '& fieldset': { borderColor: 'rgba(255, 215, 0, 0.3)' },
                                        '&:hover fieldset': { borderColor: '#FFD700' },
                                    },
                                    '& .MuiInputLabel-root': { color: '#f3ce3c' },
                                }}
                            >
                                <MenuItem value="">All Subjects</MenuItem>
                                {subjects.map((subj) => (
                                    <MenuItem key={subj} value={subj}>
                                        {subj}
                                    </MenuItem>
                                ))}
                            </TextField>

                            <TextField
                                select
                                label="Semester"
                                value={selectedSemester}
                                onChange={(e) => setSelectedSemester(e.target.value)}
                                fullWidth
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        color: '#FFD700',
                                        '& fieldset': { borderColor: 'rgba(255, 215, 0, 0.3)' },
                                        '&:hover fieldset': { borderColor: '#FFD700' },
                                    },
                                    '& .MuiInputLabel-root': { color: '#f3ce3c' },
                                }}
                            >
                                <MenuItem value="">All Semesters</MenuItem>
                                {semesters.map((sem) => (
                                    <MenuItem key={sem} value={sem}>
                                        Semester {sem}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Stack>
                    </Paper>
                )}

                {/* Error Message */}
                {error && (
                    <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                        {error}
                    </Alert>
                )}

                {/* Quiz Grid */}
                {quizzes.length === 0 ? (
                    <Paper
                        elevation={4}
                        sx={{
                            p: 6,
                            borderRadius: 4,
                            textAlign: 'center',
                            bgcolor: '#0e0e0e',
                            border: '1px solid rgba(255, 215, 0, 0.2)',
                        }}
                    >
                        <Typography variant="h6" color="#f3ce3c" mb={2}>
                            No quizzes available at the moment
                        </Typography>
                        <Typography variant="body2" color="#ccc">
                            Check back later for new quizzes
                        </Typography>
                    </Paper>
                ) : (
                    <Grid container spacing={3}>
                        {quizzes
                            .filter((quiz) => !selectedSubject || quiz.subjectId?.name === selectedSubject)
                            .filter((quiz) => !selectedSemester || quiz.semester === selectedSemester)
                            .map((quiz) => (
                                <Grid item xs={12} sm={6} md={4} key={quiz._id}>
                                    <QuizCard quiz={quiz} />
                                </Grid>
                            ))}
                    </Grid>
                )}
            </Container>
        </Box>
    );
}
