"use client";
import React, { useState } from 'react';
import { Box, Typography, TextField, Paper } from '@mui/material';
import { motion } from 'framer-motion';

export default function CodeQuestion({ question, onAnswer, value }) {
    if (!question) return null;

    const [code, setCode] = useState(value || question.codeTemplate || "");

    const handleChange = (e) => {
        const val = e.target.value;
        setCode(val);
        onAnswer(val);
    };

    return (
        <Box>
            <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.9)', mb: 3, fontWeight: 600 }}>
                {question.text}
            </Typography>

            {/* Simple Code Editor Area */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
                <Paper
                    elevation={0}
                    sx={{
                        bgcolor: '#0f172a',
                        p: 1.5,
                        borderRadius: 3,
                        border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                    }}
                >
                    <TextField
                        multiline
                        minRows={8}
                        maxRows={16}
                        fullWidth
                        value={code}
                        onChange={handleChange}
                        variant="standard"
                        InputProps={{
                            disableUnderline: true,
                            sx: {
                                color: '#94a3b8',
                                fontFamily: '"Fira Code", "Source Code Pro", Consolas, monospace',
                                fontSize: '0.9rem',
                                lineHeight: 1.6,
                                padding: 1
                            }
                        }}
                        placeholder="// Type your code solution here..."
                    />
                </Paper>
            </motion.div>

            {/* Test Cases Display */}
            {question.testCases && question.testCases.length > 0 && (
                <Box mt={4}>
                    <Typography variant="overline" sx={{ color: '#444', fontWeight: 'bold' }}>
                        Test Scenarios
                    </Typography>
                    <Box display="grid" gridTemplateColumns={{ xs: '1r', sm: '1fr 1fr' }} gap={2} mt={1}>
                        {question.testCases.map((tc, idx) => (
                            <Paper
                                key={idx}
                                sx={{
                                    p: 2,
                                    bgcolor: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    borderRadius: 3
                                }}
                            >
                                <Typography variant="caption" sx={{ color: '#555', fontWeight: 'bold' }}>INPUT</Typography>
                                <Typography variant="body2" sx={{ color: '#888', fontFamily: 'monospace', mb: 1 }}>{tc.input || "No input required"}</Typography>
                                <Typography variant="caption" sx={{ color: '#555', fontWeight: 'bold' }}>EXPECTED OUTPUT</Typography>
                                <Typography variant="body2" sx={{ color: '#3b82f6', fontFamily: 'monospace' }}>{tc.output}</Typography>
                            </Paper>
                        ))}
                    </Box>
                </Box>
            )}
        </Box>
    );
}
