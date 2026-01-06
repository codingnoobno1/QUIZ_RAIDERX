'use client';

import React, { useState } from 'react';
import { 
  Box, Paper, Typography, Stack, TextField, Button, CircularProgress, Avatar, Divider 
} from '@mui/material';
import { motion } from 'framer-motion';

export default function GeminiAPI({ user, processes, addQuestions = () => {}, setSnackbar = () => {} }) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);

  if (!user || !processes) {
    return <Typography>Loading AI Assistant...</Typography>;
  }

  // Ask Gemini (AI)
  const askGemini = async () => {
    if (!prompt.trim()) {
      setSnackbar({ open: true, message: 'Please enter a prompt!', severity: 'warning' });
      return;
    }

    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch('/api/genai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestType: 'response', // always required
          prompt: prompt.trim(),
        })
      });

      const data = await res.json();

      if (res.ok && data.result) {
        setResponse([{ message: data.result, severity: 'info' }]);
        setSnackbar({ open: true, message: '✅ Gemini response received!', severity: 'success' });
      } else if (data.error) {
        setResponse([{ message: data.error, severity: 'error' }]);
        setSnackbar({ open: true, message: data.error, severity: 'error' });
      }

    } catch (err) {
      console.error(err);
      setResponse([{ message: 'Failed to fetch AI insights. Try again.', severity: 'error' }]);
      setSnackbar({ open: true, message: 'Gemini API failed', severity: 'error' });
    } finally {
      setLoading(false);
      setPrompt('');
    }
  };

  // Optional: generate quiz questions
  const generateQuiz = async (topic) => {
    if (!topic || !topic.trim()) {
      setSnackbar({ open: true, message: 'Topic is required for quiz generation!', severity: 'warning' });
      return;
    }

    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch('/api/genai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestType: 'quiz',
          topic: topic.trim(),
        })
      });

      const data = await res.json();

      if (res.ok && data.questions?.length) {
        addQuestions(data.questions);
        setResponse([{ message: `✅ Generated ${data.questions.length} quiz questions`, severity: 'info' }]);
        setSnackbar({ open: true, message: 'Quiz questions generated successfully!', severity: 'success' });
      } else if (data.error) {
        setResponse([{ message: data.error, severity: 'error' }]);
        setSnackbar({ open: true, message: data.error, severity: 'error' });
      }
    } catch (err) {
      console.error(err);
      setResponse([{ message: 'Failed to generate quiz questions.', severity: 'error' }]);
      setSnackbar({ open: true, message: 'Quiz generation failed', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ position: 'sticky', top: 16, maxHeight: '80vh', overflowY: 'auto' }}>
      <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3, bgcolor: '#f4f6fa' }}>
        {/* Header */}
        <Stack direction="row" spacing={2} alignItems="center" mb={1}>
          <Avatar src="/images/gemini-logo.jpg" alt="Gemini AI" sx={{ width: 40, height: 40 }} />
          <Typography variant="h6" fontWeight={700}>Gemini AI Panel</Typography>
        </Stack>

        <Typography variant="body2" color="text.secondary" gutterBottom>
          AI-powered suggestions and insights for your workflow.
        </Typography>

        <Divider sx={{ my: 2 }} />

        {/* Role Info */}
        <Stack direction="row" spacing={1} mb={1}>
          <Typography variant="caption" color="text.secondary">Role:</Typography>
          <Typography variant="caption" fontWeight={600}>{user.role}</Typography>
        </Stack>

        {/* Process Tags */}
        <Stack direction="row" spacing={1} flexWrap="wrap" mb={2}>
          {processes.map(p => (
            <Typography
              key={p.id}
              variant="caption"
              sx={{ bgcolor: '#e0e7ff', px: 1.5, py: 0.5, borderRadius: 1 }}
            >
              {p.name || p.id}
            </Typography>
          ))}
        </Stack>

        {/* Prompt Input */}
        <TextField
          fullWidth
          multiline
          minRows={2}
          maxRows={5}
          placeholder="Ask Gemini AI..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          sx={{ mb: 2 }}
        />

        {/* Action Buttons */}
        <Stack direction="row" spacing={2} mb={2}>
          <Button
            onClick={askGemini}
            variant="contained"
            disabled={loading || !prompt.trim()}
            sx={{ flex: 1 }}
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : 'Ask Gemini'}
          </Button>

          <Button
            onClick={() => generateQuiz(prompt)}
            variant="outlined"
            disabled={loading || !prompt.trim()}
            sx={{ flex: 1 }}
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : 'Generate Quiz'}
          </Button>
        </Stack>

        {/* Response Preview */}
        {response?.length > 0 && (
          <Stack spacing={2}>
            {response.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.15, duration: 0.4 }}
              >
                <Paper
                  elevation={2}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1.5,
                    bgcolor:
                      item.severity === 'warning'
                        ? 'linear-gradient(135deg, #fff3e0, #ffe0b2)'
                        : item.severity === 'error'
                        ? 'linear-gradient(135deg, #ffebee, #ffcdd2)'
                        : 'linear-gradient(135deg, #e3f2fd, #bbdefb)',
                    borderLeft: `5px solid ${
                      item.severity === 'warning'
                        ? '#f57c00'
                        : item.severity === 'error'
                        ? '#d32f2f'
                        : '#1976d2'
                    }`,
                    transition: 'all 0.3s ease',
                    '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 }
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor:
                        item.severity === 'warning'
                          ? '#f57c00'
                          : item.severity === 'error'
                          ? '#d32f2f'
                          : '#1976d2',
                      width: 32,
                      height: 32,
                      fontSize: 18
                    }}
                  >
                    {item.severity === 'warning' ? '⚠️' : item.severity === 'error' ? '❌' : '💡'}
                  </Avatar>
                  <Typography variant="body2" sx={{ color: '#333' }}>
                    {item.message}
                  </Typography>
                </Paper>
              </motion.div>
            ))}
          </Stack>
        )}
      </Paper>
    </Box>
  );
}
