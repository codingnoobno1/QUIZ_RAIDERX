"use client";
import React from "react";
import { Box, Typography, Paper } from "@mui/material";
import { motion } from "framer-motion";

export default function MCQQuestion({ question, onAnswer, value }) {
    if (!question || !question.options) return null;

    return (
        <Box>
            <Box display="flex" flexDirection="column" gap={2}>
                {question.options.map((option, idx) => {
                    const isSelected = value === option;
                    return (
                        <motion.div
                            key={idx}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Paper
                                onClick={() => onAnswer(option)}
                                sx={{
                                    p: 2.5,
                                    cursor: 'pointer',
                                    borderRadius: 3,
                                    background: isSelected
                                        ? 'linear-gradient(135deg, color-mix(in srgb, var(--quiz-primary) 14%, var(--quiz-surface-solid)), color-mix(in srgb, var(--quiz-blue) 12%, var(--quiz-surface-solid)))'
                                        : 'var(--quiz-surface-solid)',
                                    border: `2px solid ${isSelected ? 'var(--quiz-primary)' : 'var(--quiz-border)'}`,
                                    color: isSelected ? 'var(--quiz-primary-strong)' : 'var(--quiz-text)',
                                    boxShadow: isSelected ? '0 10px 28px color-mix(in srgb, var(--quiz-primary) 16%, transparent)' : 'none',
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2,
                                    '&:hover': {
                                        background: isSelected
                                            ? 'linear-gradient(135deg, color-mix(in srgb, var(--quiz-primary) 18%, var(--quiz-surface-solid)), color-mix(in srgb, var(--quiz-blue) 15%, var(--quiz-surface-solid)))'
                                            : 'var(--quiz-soft)',
                                        borderColor: isSelected ? 'var(--quiz-primary)' : 'color-mix(in srgb, var(--quiz-primary) 28%, var(--quiz-border))'
                                    }
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 28,
                                        height: 28,
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: isSelected ? 'var(--quiz-primary)' : 'var(--quiz-soft)',
                                        color: isSelected ? 'white' : 'var(--quiz-text-muted)',
                                        fontSize: '0.85rem',
                                        fontWeight: 'bold',
                                        border: isSelected ? 'none' : '1px solid var(--quiz-border)'
                                    }}
                                >
                                    {String.fromCharCode(65 + idx)}
                                </Box>
                                <Typography variant="body1" fontWeight={isSelected ? 600 : 400}>
                                    {option}
                                </Typography>
                            </Paper>
                        </motion.div>
                    );
                })}
            </Box>
        </Box>
    );
}
