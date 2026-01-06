"use client";
import React from "react";
import { Box, Typography, Paper, Chip, Container } from "@mui/material";
import { CheckCircle, Cancel, AccessTime, ArrowBack } from "@mui/icons-material";
import { motion } from "framer-motion";
import Link from "next/link";

export default function QuizResult({ result }) {
    const { score, review } = result;

    if (!review || review.length === 0) {
        return (
            <Box p={4} textAlign="center">
                <Typography variant="h5" color="text.secondary">No results available to display.</Typography>
            </Box>
        );
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <Container maxWidth="md" sx={{ py: 6 }}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
                <Paper
                    elevation={0}
                    sx={{
                        p: 6,
                        borderRadius: 6,
                        mb: 6,
                        textAlign: 'center',
                        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
                        color: 'white',
                        border: '1px solid rgba(255,255,255,0.05)',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
                    }}
                >
                    <Typography variant="overline" sx={{ letterSpacing: 4, fontWeight: 'bold', opacity: 0.6 }}>Quiz Performance</Typography>
                    <Typography variant="h2" fontWeight="900" mt={2} mb={1}>
                        {score.toFixed(1)} / {review.reduce((acc, r) => acc + (r.pointsAwarded || 1), 0).toFixed(1)}
                    </Typography>
                    <Typography variant="h6" sx={{ opacity: 0.8, fontWeight: 'medium' }}>
                        {score >= 8 ? "Excellent Work! 🎉" : score >= 5 ? "Good Progress! 👍" : "Keep Learning! 💪"}
                    </Typography>
                </Paper>
            </motion.div>

            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                <Typography variant="h5" fontWeight="800" color="text.primary">
                    Execution Review
                </Typography>
                <Link href="/coding-club/quiz" style={{ textDecoration: 'none' }}>
                    <Chip
                        icon={<ArrowBack sx={{ fontSize: '1rem !important' }} />}
                        label="Back to Quizzes"
                        clickable
                        sx={{ bgcolor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', py: 2 }}
                    />
                </Link>
            </Box>

            <motion.div variants={containerVariants} initial="hidden" animate="visible">
                <Box display="flex" flexDirection="column" gap={3}>
                    {review.map((item, index) => (
                        <motion.div key={index} variants={itemVariants}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 3,
                                    borderRadius: 4,
                                    bgcolor: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >
                                {/* Status Indicator Strip */}
                                <Box sx={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 4, bgcolor: item.isCorrect ? '#10b981' : '#ef4444' }} />

                                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2} pl={1}>
                                    <Typography variant="h6" fontWeight="700" color="text.primary" sx={{ maxWidth: '80%' }}>
                                        {item.questionText}
                                    </Typography>
                                    <Box display="flex" flexDirection="column" alignItems="flex-end">
                                        <Typography variant="caption" sx={{ color: item.isCorrect ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
                                            {item.isCorrect ? "CORRECT" : "INCORRECT"}
                                        </Typography>
                                        <Typography variant="h6" fontWeight="900">
                                            +{item.pointsAwarded.toFixed(1)}
                                        </Typography>
                                    </Box>
                                </Box>

                                <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr 100px' }} gap={3} sx={{ bgcolor: 'rgba(0,0,0,0.2)', p: 2, borderRadius: 3 }}>
                                    <Box>
                                        <Typography variant="caption" sx={{ color: '#555', fontWeight: 'bold' }}>YOUR INPUT</Typography>
                                        <Typography variant="body2" sx={{ color: item.isCorrect ? '#10b981' : '#ef4444', fontWeight: 'bold', mt: 0.5 }}>
                                            {String(item.userAnswer || "No Response")}
                                        </Typography>
                                    </Box>

                                    {!item.isCorrect && (
                                        <Box>
                                            <Typography variant="caption" sx={{ color: '#555', fontWeight: 'bold' }}>EXPECTED</Typography>
                                            <Typography variant="body2" sx={{ color: '#10b981', fontWeight: 'bold', mt: 0.5 }}>
                                                {String(item.correctAnswer)}
                                            </Typography>
                                        </Box>
                                    )}

                                    <Box ml="auto" textAlign="right">
                                        <Typography variant="caption" sx={{ color: '#555', fontWeight: 'bold' }}>TIME</Typography>
                                        <Box display="flex" alignItems="center" justifyContent="flex-end" gap={0.5} mt={0.5}>
                                            <AccessTime sx={{ fontSize: '0.85rem', color: '#555' }} />
                                            <Typography variant="body2" fontWeight="medium" color="#888">{item.timeTaken}s</Typography>
                                        </Box>
                                    </Box>
                                </Box>

                                {item.explanation && (
                                    <Box mt={2} pl={1}>
                                        <Typography variant="caption" sx={{ color: '#6366f1', fontWeight: 'bold' }}>INSIGHT</Typography>
                                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 0.5 }}>
                                            {item.explanation}
                                        </Typography>
                                    </Box>
                                )}
                            </Paper>
                        </motion.div>
                    ))}
                </Box>
            </motion.div>
        </Container>
    );
}
