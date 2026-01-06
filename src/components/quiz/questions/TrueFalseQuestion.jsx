"use client";
import React from "react";
import { Box, Typography, Paper } from "@mui/material";
import { motion } from "framer-motion";

export default function TrueFalseQuestion({ question, onAnswer, value }) {
    if (!question) return null;

    const options = ["True", "False"];

    return (
        <Box>
            <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.9)', mb: 4, fontWeight: 600 }}>
                {question.text}
            </Typography>

            <Box display="flex" gap={3}>
                {options.map((option) => {
                    const isSelected = value === option;
                    const isTrue = option === "True";
                    return (
                        <motion.div
                            key={option}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            style={{ flex: 1 }}
                        >
                            <Paper
                                onClick={() => onAnswer(option)}
                                sx={{
                                    py: 4,
                                    cursor: 'pointer',
                                    borderRadius: 4,
                                    textAlign: 'center',
                                    background: isSelected
                                        ? (isTrue ? 'rgba(76, 175, 80, 0.15)' : 'rgba(244, 67, 54, 0.15)')
                                        : 'rgba(255, 255, 255, 0.03)',
                                    border: `3px solid ${isSelected ? (isTrue ? '#4caf50' : '#f44336') : 'rgba(255, 255, 255, 0.08)'}`,
                                    color: isSelected ? (isTrue ? '#81c784' : '#e57373') : 'rgba(255, 255, 255, 0.5)',
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        background: isSelected
                                            ? (isTrue ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)')
                                            : 'rgba(255, 255, 255, 0.07)',
                                    }
                                }}
                            >
                                <Typography variant="h5" fontWeight="900" textTransform="uppercase">
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
