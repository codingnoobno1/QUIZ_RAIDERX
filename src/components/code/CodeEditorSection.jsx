'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Box, Typography, Select, MenuItem, FormControl, InputLabel, Paper } from '@mui/material';
import { styled } from '@mui/system';

// Metallic styled container
const MetallicContainer = styled(Paper)(({ theme }) => ({
  background: 'linear-gradient(135deg, #2e2e2e 0%, #1c1c1c 100%)',
  border: '1px solid #555',
  borderRadius: '16px',
  padding: theme.spacing(4),
  boxShadow: '0 6px 15px rgba(0, 0, 0, 0.8)',
}));

export default function CodeEditorSection({ code, setCode, language, setLanguage }) {
  const [question, setQuestion] = useState('Write a function to reverse a string.');

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Coding Question Section */}
      <MetallicContainer elevation={10}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 'bold',
            color: 'deepskyblue',
            mb: 2,
            fontFamily: 'monospace',
            letterSpacing: 1,
          }}
        >
          Coding Question:
        </Typography>

        {/* Display the full question dynamically */}
        <Box
          sx={{
            color: '#ccc',
            fontSize: '1.1rem',
            lineHeight: 1.6,
            fontFamily: 'Fira Code, monospace',
            backgroundColor: '#1e1e1e',
            padding: 2,
            borderRadius: 2,
            overflowX: 'auto',
            whiteSpace: 'pre-wrap',
          }}
        >
          <span style={{ color: '#CE9178' }}>{question}</span>
        </Box>
      </MetallicContainer>

      {/* Language Selection */}
      <FormControl fullWidth sx={{ mt: 4 }}>
        <InputLabel id="language-select-label" sx={{ color: 'deepskyblue' }}>
          Select Language
        </InputLabel>
        <Select
          labelId="language-select-label"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          sx={{
            bgcolor: '#222',
            color: 'white',
            borderRadius: 2,
            '.MuiOutlinedInput-notchedOutline': {
              borderColor: 'deepskyblue',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#00bfff',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#00bfff',
            },
          }}
        >
          <MenuItem value="javascript">JavaScript</MenuItem>
          <MenuItem value="python">Python</MenuItem>
          <MenuItem value="cpp">C++</MenuItem>
          <MenuItem value="java">Java</MenuItem>
        </Select>
      </FormControl>

      {/* Code Editor */}
      <motion.div
        className="rounded-lg overflow-hidden"
        style={{
          height: '450px',
          background: '#1a1a1a',
          border: '1px solid #333',
          borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.7)',
        }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Editor
          height="100%"
          language={language}
          value={code}
          theme="vs-dark"
          onChange={(value) => setCode(value || '')}
          options={{
            fontSize: 16,
            minimap: { enabled: false },
            fontFamily: 'Fira Code, monospace',
            fontLigatures: true,
            automaticLayout: true,
          }}
        />
      </motion.div>
    </motion.div>
  );
}
