'use client';

import { Paper, Typography, Button, Box, Avatar, Chip, Stack } from '@mui/material';
import Image from 'next/image';

export default function EventCard({
  eventName = 'Untitled Quiz',
  authorName = 'Anonymous',
  description = 'No description provided.',
  quizType = 'General',
  startDate,
  endDate,
  imageSrc = '/cardbg.png',
}) {
  return (
    <Paper
      elevation={8}
      sx={{
        position: 'relative',
        width: '100%',
        maxWidth: 360,
        height: { xs: 420, sm: 460 },
        borderRadius: 4,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        color: '#fff',
        boxShadow: '0 12px 36px rgba(0,0,0,0.3)',
        transition: 'transform 0.3s',
        '&:hover': { transform: 'translateY(-6px)' },
      }}
    >
      {/* Background Image */}
      <Box sx={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <Image
          src={imageSrc}
          alt="Event background"
          fill
          priority
          style={{ objectFit: 'cover' }}
        />
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0.2))',
          }}
        />
      </Box>

      {/* Content */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
      >
        {/* Header: Avatar + Author */}
        <Stack direction="row" spacing={2} alignItems="center" mb={2}>
          <Avatar
            src="/pixel.jpg"
            alt="Quiz Master"
            sx={{ width: 56, height: 56, borderRadius: 2, boxShadow: 2 }}
          />
          <Box>
            <Typography variant="subtitle2" color="gray.300">
              Quiz Master
            </Typography>
            <Typography variant="subtitle1" fontWeight={700}>
              {authorName}
            </Typography>
          </Box>
        </Stack>

        {/* Title */}
        <Typography
          variant="h6"
          fontWeight={800}
          sx={{ mb: 1, lineHeight: 1.2, minHeight: 48 }}
        >
          {eventName}
        </Typography>

        {/* Description */}
        <Typography
          variant="body2"
          color="gray.300"
          sx={{ flexGrow: 1, mb: 2, overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          {description}
        </Typography>

        {/* Tags / Info */}
        <Stack direction="row" spacing={1} mb={2} flexWrap="wrap">
          <Chip label={quizType} size="small" color="primary" />
          {startDate && endDate && (
            <Chip
              label={`${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`}
              size="small"
              sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: '#fff' }}
            />
          )}
        </Stack>

        {/* Start Button */}
        <Button
          variant="contained"
          fullWidth
          sx={{
            py: 1.3,
            borderRadius: 2,
            fontWeight: 700,
            fontSize: '0.95rem',
            textTransform: 'none',
            backgroundColor: '#22c1c3',
            boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
            '&:hover': { backgroundColor: '#1ba39c' },
          }}
          onClick={() => {
            console.log(`Starting ${eventName}`);
          }}
        >
          Start Quiz
        </Button>
      </Box>
    </Paper>
  );
}
