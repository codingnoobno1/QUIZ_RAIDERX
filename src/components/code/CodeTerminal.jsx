'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Box, Typography, TextField } from '@mui/material';

const COMMANDS = {
  help: `Available commands:
- gcc main.cpp
- javac Main.java
- node server.js
- npm run dev
- pip install package
- python app.py
- clear`,
  'gcc main.cpp': `main.cpp: compiled successfully ✅`,
  'javac Main.java': `Main.java: compilation successful ✅`,
  'node server.js': `Server running at http://localhost:3000 🚀`,
  'npm run dev': `> next dev\nready - started server on http://localhost:3000`,
  'pip install flask': `Successfully installed flask ✅`,
  'python app.py': `App running at http://127.0.0.1:5000 🔥`,
};

export default function CodeTerminal() {
  const [history, setHistory] = useState([
    'Welcome to CodeArena Terminal (Type `help` for commands)\n',
  ]);
  const [input, setInput] = useState('');
  const scrollRef = useRef(null);

  const handleCommand = (cmd) => {
    if (cmd === 'clear') {
      setHistory([]);
      return;
    }
    const output = COMMANDS[cmd] || `'${cmd}' is not recognized as an internal or external command.`;
    setHistory((prev) => [...prev, `> ${cmd}`, output]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCommand(input.trim());
      setInput('');
    }
  };

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  return (
    <Box
      sx={{
        bgcolor: '#1e1e1e',
        color: '#d4d4d4',
        p: 2,
        borderRadius: 2,
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 14,
        height: '400px',
        overflowY: 'auto',
        boxShadow: 'inset 0 0 10px #00000044',
      }}
    >
      {history.map((line, index) => (
        <Typography key={index} sx={{ whiteSpace: 'pre-wrap' }}>
          {line}
        </Typography>
      ))}
      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
        <Typography sx={{ minWidth: 80, color: '#6a9955' }}>
          PS D:\pixel\QUIZ&gt;
        </Typography>
        <TextField
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          variant="standard"
          fullWidth
          autoFocus
          InputProps={{
            disableUnderline: true,
            sx: {
              color: '#d4d4d4',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 14,
              padding: 0,
            },
          }}
        />
      </Box>
      <div ref={scrollRef} />
    </Box>
  );
}
