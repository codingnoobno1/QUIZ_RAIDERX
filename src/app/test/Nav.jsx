'use client';

import { Typography } from '@mui/material';
import { motion } from 'framer-motion';

export default function Nav() {
  return (
    <motion.nav
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      style={{
        width: '100%',
        padding: '1rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'linear-gradient(90deg, #0f2027, #203a43, #2c5364, #00c6ff)',
        backgroundSize: '400% 400%',
        animation: 'gradientShift 8s ease infinite',
        color: '#fff',
        boxShadow: '0 4px 20px rgba(0,255,255,0.2)',
        fontFamily: 'Segoe UI, Roboto, sans-serif',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
        MetaFlix
      </Typography>

      <div style={{ display: 'flex', gap: '2rem', fontWeight: 500 }}>
        <a href="#" style={linkStyle}>Home</a>
        <a href="#" style={linkStyle}>Trending</a>
        <a href="#" style={linkStyle}>Categories</a>
        <a href="#" style={linkStyle}>My List</a>
      </div>

      <style jsx>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </motion.nav>
  );
}

const linkStyle = {
  color: '#fff',
  textDecoration: 'none',
  transition: 'color 0.3s',
  fontSize: '1rem',
  cursor: 'pointer',
};
