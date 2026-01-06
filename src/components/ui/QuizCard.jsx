'use client';

import { useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Chip,
    Button,
    Stack,
} from '@mui/material';
import { motion } from 'framer-motion';
import { BookOpen, Clock, Award, Calendar, Play } from 'lucide-react';
import { useRouter } from 'next/navigation';

const QuizCard = ({ quiz }) => {
    const router = useRouter();

    const handleStartQuiz = () => {
        router.push(`/quizmode/${quiz._id}`);
    };

    // Calculate status color
    const getStatusColor = () => {
        if (quiz.availabilityStatus === 'on') return '#4CAF50';
        if (quiz.availabilityStatus === 'scheduled') return '#FF9800';
        return '#9E9E9E';
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.03 }}
            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
        >
            <Card
                sx={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: 400,
                    minHeight: 320,
                    borderRadius: '20px',
                    backgroundColor: '#0e0e0e',
                    color: '#FFD700',
                    boxShadow: `0 0 20px ${getStatusColor()}40`,
                    border: `1.5px solid ${getStatusColor()}80`,
                    overflow: 'hidden',
                    backdropFilter: 'blur(12px)',
                    '&:hover': {
                        boxShadow: `0 0 40px ${getStatusColor()}60`,
                        transform: 'translateY(-4px)',
                    },
                }}
            >
                {/* Background Pattern */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundImage:
                            "url('https://img.freepik.com/premium-photo/circuit-board-patterns_198067-353259.jpg')",
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        opacity: 0.08,
                        zIndex: 0,
                        filter: 'contrast(1.3)',
                    }}
                />

                {/* Status Indicator */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        zIndex: 2,
                    }}
                >
                    <Chip
                        label={quiz.availabilityStatus === 'on' ? 'ACTIVE' : quiz.availabilityStatus === 'scheduled' ? 'SCHEDULED' : 'INACTIVE'}
                        size="small"
                        sx={{
                            bgcolor: getStatusColor(),
                            color: '#fff',
                            fontWeight: 700,
                            fontSize: '0.7rem',
                            boxShadow: `0 0 10px ${getStatusColor()}60`,
                        }}
                    />
                </Box>

                {/* Main Content */}
                <CardContent sx={{ position: 'relative', zIndex: 2, pt: 4 }}>
                    {/* Quiz Icon */}
                    <Box display="flex" justifyContent="center" mb={2}>
                        <Box
                            sx={{
                                width: 70,
                                height: 70,
                                borderRadius: '50%',
                                bgcolor: '#141414',
                                border: '2px solid #FFD700',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 0 15px rgba(255,215,0,0.4)',
                            }}
                        >
                            <BookOpen size={32} color="#FFD700" />
                        </Box>
                    </Box>

                    {/* Quiz Title */}
                    <Typography
                        variant="h6"
                        sx={{
                            fontWeight: 700,
                            color: '#FFEB3B',
                            textAlign: 'center',
                            mb: 1,
                            minHeight: 60,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        {quiz.title}
                    </Typography>

                    {/* Quiz Details */}
                    <Stack
                        direction="row"
                        spacing={1}
                        justifyContent="center"
                        flexWrap="wrap"
                        sx={{ mb: 2 }}
                    >
                        <Chip
                            icon={<Clock size={14} />}
                            label={`${quiz.timeLimit} min`}
                            size="small"
                            sx={{
                                bgcolor: '#141414',
                                border: '1px solid #FFD700',
                                color: '#FFD700',
                                fontSize: '0.75rem',
                            }}
                        />
                        <Chip
                            icon={<Award size={14} />}
                            label={`${quiz.maxMarks} marks`}
                            size="small"
                            sx={{
                                bgcolor: '#141414',
                                border: '1px solid #FFD700',
                                color: '#FFD700',
                                fontSize: '0.75rem',
                            }}
                        />
                        <Chip
                            icon={<BookOpen size={14} />}
                            label={`${quiz.questions?.length || 0} questions`}
                            size="small"
                            sx={{
                                bgcolor: '#141414',
                                border: '1px solid #FFD700',
                                color: '#FFD700',
                                fontSize: '0.75rem',
                            }}
                        />
                    </Stack>

                    {/* Subject & Semester */}
                    <Box
                        sx={{
                            borderTop: '1px solid rgba(255,215,0,0.25)',
                            borderBottom: '1px solid rgba(255,215,0,0.25)',
                            py: 1.5,
                            mb: 2,
                        }}
                    >
                        <Typography
                            variant="body2"
                            sx={{
                                color: '#f3ce3c',
                                textAlign: 'center',
                                fontSize: '0.85rem',
                            }}
                        >
                            {quiz.subjectId?.name || 'Unknown Subject'} • Semester {quiz.semester}
                        </Typography>
                        {quiz.description && (
                            <Typography
                                variant="caption"
                                sx={{
                                    color: '#ccc',
                                    textAlign: 'center',
                                    display: 'block',
                                    mt: 0.5,
                                    fontSize: '0.75rem',
                                }}
                            >
                                {quiz.description.length > 60
                                    ? quiz.description.substring(0, 60) + '...'
                                    : quiz.description}
                            </Typography>
                        )}
                    </Box>

                    {/* Start Quiz Button */}
                    <Button
                        variant="contained"
                        fullWidth
                        onClick={handleStartQuiz}
                        disabled={quiz.availabilityStatus !== 'on'}
                        sx={{
                            bgcolor: quiz.availabilityStatus === 'on' ? '#FFD700' : '#444',
                            color: quiz.availabilityStatus === 'on' ? '#101010' : '#888',
                            borderRadius: 3,
                            fontWeight: 700,
                            textTransform: 'none',
                            py: 1.2,
                            fontSize: '0.95rem',
                            boxShadow: quiz.availabilityStatus === 'on' ? '0 0 15px rgba(255,215,0,0.5)' : 'none',
                            '&:hover': {
                                bgcolor: quiz.availabilityStatus === 'on' ? '#FFC700' : '#444',
                                boxShadow: quiz.availabilityStatus === 'on' ? '0 0 25px rgba(255,215,0,0.7)' : 'none',
                            },
                            '&:disabled': {
                                bgcolor: '#333',
                                color: '#666',
                            },
                        }}
                        startIcon={<Play size={18} />}
                    >
                        {quiz.availabilityStatus === 'on' ? 'Start Quiz' : 'Not Available'}
                    </Button>
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default QuizCard;
