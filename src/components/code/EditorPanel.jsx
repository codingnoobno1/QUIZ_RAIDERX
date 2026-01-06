'use client';

import React from 'react';
import { Box, Typography, Button, MenuItem, FormControl, Select, InputLabel, Chip, Stack } from '@mui/material';
import { PlayArrow, RestartAlt } from '@mui/icons-material';
import Editor from '@monaco-editor/react';

const languageColors = {
  javascript: '#f7df1e',
  python: '#3472a6',
  cpp: '#00599c',
  java: '#ec2025',
};

export default function EditorPanel({
  code,
  setCode,
  language,
  setLanguage,
  fontSize = 14,
  showMinimap = true,
  theme = 'light',
  onSubmit,
}) {
  const handleReset = () => {
    setCode('');
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
          {/* Language Tag */}
          <Chip
            label={language.toUpperCase()}
            size="small"
            sx={{
              bgcolor: languageColors[language] ?? 'grey.300',
              color: 'black',
              fontWeight: 600,
            }}
          />

          {/* Theme */}
          <Chip
            label={theme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}
            size="small"
            variant="outlined"
          />

          {/* Language Dropdown */}
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

      {/* Monaco Editor */}
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
      <Box display="flex" justifyContent="flex-end" gap={2}>
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
          onClick={onSubmit}
        >
          Run Code
        </Button>
      </Box>
    </Box>
  );
}
