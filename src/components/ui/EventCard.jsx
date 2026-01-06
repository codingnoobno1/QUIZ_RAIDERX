import { Box, Typography, Button, Paper, Stack } from '@mui/material';
import { motion } from 'framer-motion';
import EventIcon from '@mui/icons-material/Event';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

const EventCard = ({ event, onClick }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 160, damping: 16 }}
      onClick={() => onClick(event)}
      style={{ width: '100%' }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 2,
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #e0f7fa, #b2ebf2)',
          color: '#004d40',
          cursor: 'pointer',
          '&:hover': {
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
          },
        }}
      >
        {event.imageUrl && (
          <Box
            component="img"
            src={event.imageUrl}
            alt={event.title}
            sx={{
              width: '100%',
              height: 150,
              objectFit: 'cover',
              borderRadius: '8px',
              mb: 1.5,
            }}
          />
        )}
        <Stack direction="row" alignItems="center" spacing={1} mb={1}>
          <EventIcon sx={{ color: '#00796b' }} />
          <Typography variant="h6" fontWeight={600}>
            {event.title}
          </Typography>
        </Stack>
        <Typography variant="body2" color="#00695c" mb={1}>
          {event.description}
        </Typography>
        <Stack direction="row" alignItems="center" spacing={0.5} mb={0.5}>
          <LocationOnIcon sx={{ fontSize: 16, color: '#00796b' }} />
          <Typography variant="body2" color="#00695c">
            {event.location}
          </Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={0.5} mb={1.5}>
          <AccessTimeIcon sx={{ fontSize: 16, color: '#00796b' }} />
          <Typography variant="body2" color="#00695c">
            {new Date(event.date).toLocaleDateString()} at {event.time}
          </Typography>
        </Stack>
        {event.onDuty && (
          <Chip
            label="On Duty"
            size="small"
            color="success"
            sx={{ fontWeight: 'bold', mb: 1.5 }}
          />
        )}
        <Button
          variant="contained"
          size="small"
          sx={{
            backgroundColor: '#00796b',
            '&:hover': { backgroundColor: '#004d40' },
            color: 'white',
            borderRadius: '8px',
            textTransform: 'none',
          }}
          onClick={(e) => {
            e.stopPropagation(); // Prevent onClick of the parent Box
            onClick(event);
          }}
        >
          View Details
        </Button>
      </Paper>
    </motion.div>
  );
};

export default EventCard;
