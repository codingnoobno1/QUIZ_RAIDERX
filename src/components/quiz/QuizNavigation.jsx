"use client";
import React from "react";
import { Box, Button } from "@mui/material";
import { motion } from "framer-motion";
import { NavigateNext, NavigateBefore, Send } from "@mui/icons-material";

export default function QuizNavigation({ current, total, onNext, onPrev, onSubmit, isSubmitting }) {
    const isLast = current === total - 1;

    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'space-between',
                mt: 6,
                p: 2,
                border: '1px solid var(--quiz-border)',
                borderRadius: 4,
                background: 'var(--quiz-surface)',
                boxShadow: '0 12px 32px rgba(45,35,83,.12)',
                backdropFilter: 'blur(16px)',
                position: 'sticky',
                bottom: 20,
                zIndex: 10
            }}
        >
            <motion.div whileHover={{ x: -4 }} whileTap={{ scale: 0.95 }}>
                <Button
                    variant="outlined"
                    onClick={onPrev}
                    disabled={current === 0 || isSubmitting}
                    startIcon={<NavigateBefore />}
                    sx={{
                        borderRadius: 3,
                        px: 4,
                        py: 1.5,
                        borderColor: 'var(--quiz-border)',
                        color: 'var(--quiz-text-muted)',
                        '&:hover': {
                            borderColor: 'var(--quiz-primary)',
                            background: 'var(--quiz-soft)'
                        },
                        '&.Mui-disabled': {
                            color: 'color-mix(in srgb, var(--quiz-text-muted) 45%, transparent)',
                            borderColor: 'var(--quiz-border)'
                        }
                    }}
                >
                    Back
                </Button>
            </motion.div>

            <motion.div whileHover={{ x: 4 }} whileTap={{ scale: 0.95 }}>
                {isLast ? (
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={onSubmit}
                        disabled={isSubmitting}
                        endIcon={<Send />}
                        sx={{
                            borderRadius: 3,
                            px: 5,
                            py: 1.5,
                            fontWeight: 'bold',
                            background: 'linear-gradient(135deg, var(--quiz-primary) 0%, var(--quiz-blue) 100%)',
                            boxShadow: '0 4px 15px rgba(124, 58, 237, 0.4)',
                            '&:hover': {
                                background: 'linear-gradient(135deg, var(--quiz-primary-strong) 0%, var(--quiz-blue) 100%)',
                                boxShadow: '0 6px 20px rgba(124, 58, 237, 0.6)',
                            },
                        }}
                    >
                        {isSubmitting ? "Submitting..." : "Submit Quiz"}
                    </Button>
                ) : (
                    <Button
                        variant="contained"
                        onClick={onNext}
                        disabled={isSubmitting}
                        endIcon={<NavigateNext />}
                        sx={{
                            borderRadius: 3,
                            px: 5,
                            py: 1.5,
                            fontWeight: 'bold',
                            background: 'var(--quiz-surface-solid)',
                            color: 'var(--quiz-text)',
                            border: '1px solid var(--quiz-border)',
                            '&:hover': {
                                background: 'var(--quiz-soft)',
                                borderColor: 'var(--quiz-primary)'
                            },
                        }}
                    >
                        Continue
                    </Button>
                )}
            </motion.div>
        </Box>
    );
}
