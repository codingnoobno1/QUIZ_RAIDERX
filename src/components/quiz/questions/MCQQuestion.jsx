"use client";
import React from "react";
import { Box, Typography, Paper } from "@mui/material";
import { motion } from "framer-motion";

export default function MCQQuestion({ question, onAnswer, value }) {
    if (!question || !question.options) return null;

    return (
        <Box>
            <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.9)', mb: 3, fontWeight: 600 }}>
                {question.text}
            </Typography>

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
                                        ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)'
                                        : 'rgba(255, 255, 255, 0.03)',
                                    border: `2px solid ${isSelected ? '#7c3aed' : 'rgba(255, 255, 255, 0.08)'}`,
                                    color: isSelected ? '#a78bfa' : 'rgba(255,255,255,0.7)',
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2,
                                    '&:hover': {
                                        background: isSelected
                                            ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.25) 0%, rgba(59, 130, 246, 0.25) 100%)'
                                            : 'rgba(255, 255, 255, 0.05)',
                                        borderColor: isSelected ? '#7c3aed' : 'rgba(255, 255, 255, 0.15)'
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
                                        background: isSelected ? '#7c3aed' : 'rgba(255, 255, 255, 0.1)',
                                        color: isSelected ? 'white' : 'rgba(255, 255, 255, 0.4)',
                                        fontSize: '0.85rem',
                                        fontWeight: 'bold',
                                        border: isSelected ? 'none' : '1px solid rgba(255, 255, 255, 0.2)'
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
