'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
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
                    minHeight: 300,
                    borderRadius: '12px',
                    backgroundColor: '#111113',
                    color: '#e5e7eb',
                    border: '1px solid #232323',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                        borderColor: '#333',
                        transform: 'translateY(-2px)',
                    },
                }}
            >

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
                            fontWeight: 600,
                            fontSize: '0.65rem',
                            borderRadius: '4px',
                        }}
                    />
                </Box>

                {/* Main Content */}
                <CardContent sx={{ position: 'relative', zIndex: 2, pt: 4 }}>
                    {/* Quiz Icon */}
                    <Box display="flex" justifyContent="center" mb={2}>
                        <Box
                            sx={{
                                width: 48,
                                height: 48,
                                borderRadius: '8px',
                                bgcolor: '#1a1a1a',
                                border: '1px solid #333',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <BookOpen size={20} color="#e5e7eb" />
                        </Box>
                    </Box>

                    {/* Quiz Title */}
                    <Typography
                        variant="h6"
                        sx={{
                            fontWeight: 600,
                            color: '#e5e7eb',
                            textAlign: 'center',
                            mb: 0.5,
                            minHeight: 50,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.1rem',
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
                                bgcolor: '#1a1a1a',
                                border: '1px solid #333',
                                color: '#9ca3af',
                                fontSize: '0.75rem',
                            }}
                        />
                        <Chip
                            icon={<Award size={14} />}
                            label={`${quiz.maxMarks} marks`}
                            size="small"
                            sx={{
                                bgcolor: '#1a1a1a',
                                border: '1px solid #333',
                                color: '#9ca3af',
                                fontSize: '0.75rem',
                            }}
                        />
                        <Chip
                            icon={<BookOpen size={14} />}
                            label={`${quiz.questions?.length || 0} questions`}
                            size="small"
                            sx={{
                                bgcolor: '#1a1a1a',
                                border: '1px solid #333',
                                color: '#9ca3af',
                                fontSize: '0.75rem',
                            }}
                        />
                    </Stack>

                    {/* Subject & Semester */}
                    <Box
                        sx={{
                            borderTop: '1px solid #232323',
                            borderBottom: '1px solid #232323',
                            py: 1.5,
                            mb: 2,
                        }}
                    >
                        <Typography
                            variant="body2"
                            sx={{
                                color: '#9ca3af',
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
                                    color: '#6b7280',
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
                            bgcolor: quiz.availabilityStatus === 'on' ? '#e5e7eb' : '#333',
                            color: quiz.availabilityStatus === 'on' ? '#000' : '#666',
                            borderRadius: 2,
                            fontWeight: 600,
                            textTransform: 'none',
                            py: 1.2,
                            fontSize: '0.9rem',
                            boxShadow: 'none',
                            '&:hover': {
                                bgcolor: quiz.availabilityStatus === 'on' ? '#fff' : '#333',
                                boxShadow: 'none',
                            },
                        }}
                        startIcon={<Play size={16} />}
                    >
                        {quiz.availabilityStatus === 'on' ? 'Start Quiz' : 'Not Available'}
                    </Button>
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default QuizCard;
