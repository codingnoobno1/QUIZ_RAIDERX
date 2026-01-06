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
                pt: 3,
                borderTop: '1px solid rgba(255,255,255,0.05)',
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
                        borderColor: 'rgba(255,255,255,0.1)',
                        color: 'rgba(255,255,255,0.6)',
                        '&:hover': {
                            borderColor: 'rgba(255,255,255,0.3)',
                            background: 'rgba(255,255,255,0.03)'
                        },
                        '&.Mui-disabled': {
                            color: 'rgba(255,255,255,0.2)',
                            borderColor: 'rgba(255,255,255,0.05)'
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
                            background: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)',
                            boxShadow: '0 4px 15px rgba(124, 58, 237, 0.4)',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #6d28d9 0%, #2563eb 100%)',
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
                            background: 'rgba(255,255,255,0.05)',
                            color: 'white',
                            border: '1px solid rgba(255,255,255,0.1)',
                            '&:hover': {
                                background: 'rgba(255,255,255,0.1)',
                                borderColor: 'rgba(255,255,255,0.2)'
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
