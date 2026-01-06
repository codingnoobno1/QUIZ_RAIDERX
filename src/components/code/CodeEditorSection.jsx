'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  MenuItem,
  FormControl,
  Select,
  InputLabel,
  Chip,
  Stack,
  CircularProgress,
  Alert,
} from '@mui/material';
import { PlayArrow, RestartAlt } from '@mui/icons-material';
import Editor from '@monaco-editor/react';

const languageColors = {
  javascript: '#f7df1e',
  python: '#3472a6',
  cpp: '#00599c',
  java: '#ec2025',
};

export default function EditorPanel({
  fontSize = 14,
  showMinimap = true,
  theme = 'light',
}) {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleReset = () => {
    setCode('');
    setOutput('');
    setError('');
  };

  const handleSubmit = async () => {
    setLoading(true);
    setOutput('');
    setError('');

    try {
      const res = await fetch('http://localhost:8000/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, language }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || 'Something went wrong');
      }

      const data = await res.json();
      setOutput(data.output || '✅ No output received.');
    } catch (err) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
        flexWrap="wrap"
        gap={2}
      >
        <Typography variant="subtitle1" fontWeight={600}>
          🧠 Write Your Code
        </Typography>

        <Stack direction="row" spacing={2} alignItems="center">
          <Chip
            label={language.toUpperCase()}
            size="small"
            sx={{
              bgcolor: languageColors[language] ?? 'grey.300',
              color: 'black',
              fontWeight: 600,
            }}
          />
          <Chip
            label={theme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}
            size="small"
            variant="outlined"
          />
          <FormControl size="small">
            <InputLabel>Language</InputLabel>
            <Select
              value={language}
              label="Language"
              onChange={(e) => setLanguage(e.target.value)}
              sx={{ minWidth: 120 }}
            >
              <MenuItem value="javascript">JavaScript</MenuItem>
              <MenuItem value="python">Python</MenuItem>
              <MenuItem value="cpp">C++</MenuItem>
              <MenuItem value="java">Java</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Box>

      {/* Editor */}
      <Box
        sx={{
          border: '1px solid #e0e0e0',
          borderRadius: 2,
          overflow: 'hidden',
          mb: 2,
        }}
      >
        <Editor
          height="450px"
          language={language}
          value={code}
          onChange={(value) => setCode(value)}
          theme={theme === 'dark' ? 'vs-dark' : 'vs-light'}
          options={{
            fontSize,
            minimap: { enabled: showMinimap },
            automaticLayout: true,
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            lineNumbers: 'on',
            roundedSelection: false,
            renderLineHighlight: 'line',
          }}
        />
      </Box>

      {/* Action Buttons */}
      <Box display="flex" justifyContent="flex-end" gap={2} mb={2}>
        <Button
          variant="outlined"
          color="secondary"
          startIcon={<RestartAlt />}
          onClick={handleReset}
        >
          Reset
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<PlayArrow />}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? <CircularProgress size={20} color="inherit" /> : 'Run Code'}
        </Button>
      </Box>

      {/* Output/Error Section */}
      {output && (
        <Alert severity="success" sx={{ whiteSpace: 'pre-wrap' }}>
          {output}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ whiteSpace: 'pre-wrap' }}>
          ❌ {error}
        </Alert>
      )}
    </Box>
  );
}
