'use client';

import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, CircularProgress,
    Chip, TextField, MenuItem, Alert
} from '@mui/material';
import { CheckCircle, Cancel, AccessTime } from '@mui/icons-material';

export default function QuizResultsPage() {
    const [results, setResults] = useState([]);
    const [filteredResults, setFilteredResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterQuiz, setFilterQuiz] = useState('all');
    const [quizzes, setQuizzes] = useState([]);

    useEffect(() => {
        fetchResults();
    }, []);

    useEffect(() => {
        if (filterQuiz === 'all') {
            setFilteredResults(results);
        } else {
            setFilteredResults(results.filter(r => r.quizTitle === filterQuiz));
        }
    }, [filterQuiz, results]);

    const fetchResults = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/quiz/results');

            if (!response.ok) {
                throw new Error('Failed to fetch results');
            }

            const data = await response.json();
            setResults(data.results || []);
            setFilteredResults(data.results || []);

            // Extract unique quiz titles for filter
            const uniqueQuizzes = [...new Set(data.results.map(r => r.quizTitle))];
            setQuizzes(uniqueQuizzes);

        } catch (err) {
            console.error('Error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#0a0a0a' }}>
                <CircularProgress />
                <Typography variant="h6" sx={{ ml: 2, color: 'white' }}>Loading results...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 4, bgcolor: '#0a0a0a', minHeight: '100vh' }}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#0a0a0a', py: 4, px: 2 }}>
            <Paper elevation={4} sx={{ p: 4, maxWidth: 1400, mx: 'auto', bgcolor: 'rgba(255,255,255,0.03)' }}>
                <Typography variant="h4" fontWeight={700} mb={3} sx={{
                    background: 'linear-gradient(135deg, #a78bfa 0%, #60a5fa 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    Quiz Results Dashboard
                </Typography>

                {/* Filter */}
                <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
                    <TextField
                        select
                        label="Filter by Quiz"
                        value={filterQuiz}
                        onChange={(e) => setFilterQuiz(e.target.value)}
                        sx={{ minWidth: 300 }}
                    >
                        <MenuItem value="all">All Quizzes</MenuItem>
                        {quizzes.map((quiz) => (
                            <MenuItem key={quiz} value={quiz}>{quiz}</MenuItem>
                        ))}
                    </TextField>
                    <Typography variant="body2" color="text.secondary">
                        Showing {filteredResults.length} of {results.length} results
                    </Typography>
                </Box>

                {/* Results Table */}
                {filteredResults.length === 0 ? (
                    <Alert severity="info">No quiz results found.</Alert>
                ) : (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ bgcolor: 'rgba(255,255,255,0.05)' }}>
                                    <TableCell sx={{ color: '#a78bfa', fontWeight: 700 }}>Student</TableCell>
                                    <TableCell sx={{ color: '#a78bfa', fontWeight: 700 }}>Quiz</TableCell>
                                    <TableCell sx={{ color: '#a78bfa', fontWeight: 700 }}>Batch/Sem</TableCell>
                                    <TableCell align="center" sx={{ color: '#a78bfa', fontWeight: 700 }}>Score</TableCell>
                                    <TableCell align="center" sx={{ color: '#a78bfa', fontWeight: 700 }}>Questions</TableCell>
                                    <TableCell sx={{ color: '#a78bfa', fontWeight: 700 }}>Time Taken</TableCell>
                                    <TableCell sx={{ color: '#a78bfa', fontWeight: 700 }}>Submitted</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredResults.map((result, index) => {
                                    const scorePercentage = parseFloat(result.percentage) || 0;
                                    const scoreColor = scorePercentage >= 70 ? '#10b981' : scorePercentage >= 50 ? '#f59e0b' : '#ef4444';

                                    return (
                                        <TableRow
                                            key={result.id}
                                            sx={{
                                                '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
                                                borderBottom: '1px solid rgba(255,255,255,0.05)'
                                            }}
                                        >
                                            <TableCell sx={{ color: 'white' }}>
                                                <Typography variant="body2" fontWeight={600}>{result.studentName}</Typography>
                                            </TableCell>
                                            <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>
                                                {result.quizTitle}
                                            </TableCell>
                                            <TableCell sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
                                                {result.quizBatch} / Sem {result.quizSemester}
                                            </TableCell>
                                            <TableCell align="center">
                                                <Box>
                                                    <Typography variant="h6" fontWeight={700} sx={{ color: scoreColor }}>
                                                        {result.score}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                                                        {result.percentage}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                                    <CheckCircle sx={{ fontSize: '1rem', color: '#10b981' }} />
                                                    <Typography variant="body2" sx={{ color: '#10b981' }}>{result.correctAnswers}</Typography>
                                                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.3)' }}>/ {result.totalQuestions}</Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <AccessTime sx={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)' }} />
                                                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                                                        {result.timeTaken}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
                                                {new Date(result.endTime).toLocaleDateString()}
                                                <br />
                                                {new Date(result.endTime).toLocaleTimeString()}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>
        </Box>
    );
}
