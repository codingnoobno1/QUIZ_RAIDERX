'use client';

import { Grid, Typography } from '@mui/material';
import { motion } from 'framer-motion';

const videoIds = [
  'sUf2PtEZris',
  'dQw4w9WgXcQ',
  'kXYiU_JCYtU',
  '3JZ_D3ELwOQ',
  '9bZkp7q19f0',
  'V-_O7nl0Ii0',
  'RgKAFK5djSk',
  '2vjPBrBU-TM',
  'uelHwf8o7_U'
];

const MotionIframe = motion.iframe;

export default function VideoPlayer() {
  return (
    <div style={{ padding: '2rem', color: '#fff' }}>
      <Typography variant="h4" gutterBottom style={{ color: '#fff', marginBottom: '2rem' }}>
        🎬 Featured Videos
      </Typography>

      <Grid container spacing={3}>
        {videoIds.map((id, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <motion.div
              whileHover={{ scale: 1.05, zIndex: 10 }}
              transition={{ duration: 0.3 }}
              style={{
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(255,255,255,0.1)',
                backgroundColor: '#1c1c1c',
              }}
            >
              <MotionIframe
                src={`https://www.youtube.com/embed/${id}`}
                title={`YouTube video ${index + 1}`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                style={{
                  width: '100%',
                  height: '200px',
                  border: 'none',
                }}
              />
            </motion.div>
          </Grid>
        ))}
      </Grid>
    </div>
  );
}
