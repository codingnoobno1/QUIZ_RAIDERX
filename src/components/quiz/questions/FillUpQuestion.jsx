"use client";
import React from "react";
import { Box, Typography, TextField } from "@mui/material";
import { motion } from "framer-motion";

export default function FillUpQuestion({ question, onAnswer, value }) {
    if (!question) return null;

    return (
        <Box>
            <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.9)', mb: 3, fontWeight: 600 }}>
                {question.text}
            </Typography>

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
                            color: 'white',
                            height: 60,
                            borderRadius: 3,
                            bgcolor: 'rgba(255, 255, 255, 0.03)',
                            fontSize: '1.2rem',
                            '& fieldset': {
                                borderColor: 'rgba(255, 255, 255, 0.1)',
                                borderWidth: '2px',
                                transition: 'all 0.2s'
                            },
                            '&:hover fieldset': {
                                borderColor: 'rgba(255, 255, 255, 0.2)',
                            },
                            '&.Mui-focused fieldset': {
                                borderColor: '#7c3aed',
                            },
                        },
                        '& .MuiInputBase-input::placeholder': {
                            color: 'rgba(255, 255, 255, 0.3)',
                            opacity: 1
                        }
                    }}
                />
            </motion.div>
        </Box>
    );
}
