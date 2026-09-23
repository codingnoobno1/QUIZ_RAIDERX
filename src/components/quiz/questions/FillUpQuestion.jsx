"use client";
import React from "react";
import { Box, Typography, TextField } from "@mui/material";
import { motion } from "framer-motion";

export default function FillUpQuestion({ question, onAnswer, value }) {
    if (!question) return null;

    return (
        <Box>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
            >
                <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Type your answer here..."
                    value={value || ""}
                    onChange={(e) => onAnswer(e.target.value)}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            color: 'var(--quiz-text)',
                            height: 60,
                            borderRadius: 3,
                            bgcolor: 'var(--quiz-surface-solid)',
                            fontSize: '1.2rem',
                            '& fieldset': {
                                borderColor: 'var(--quiz-border)',
                                borderWidth: '2px',
                                transition: 'all 0.2s'
                            },
                            '&:hover fieldset': {
                                borderColor: 'color-mix(in srgb, var(--quiz-primary) 35%, var(--quiz-border))',
                            },
                            '&.Mui-focused fieldset': {
                                borderColor: 'var(--quiz-primary)',
                            },
                        },
                        '& .MuiInputBase-input::placeholder': {
                            color: 'var(--quiz-text-muted)',
                            opacity: 1
                        }
                    }}
                />
            </motion.div>
        </Box>
    );
}
