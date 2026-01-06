"use client";
import React from "react";
import { Box, TextField } from "@mui/material";

export default function FindOutputQuestion({ question, setQuestion }) {
  return (
    <Box>
      <TextField
        label="Code (Find Output)"
        fullWidth
        multiline
        minRows={3}
        value={question.text}
        onChange={e => setQuestion({ ...question, text: e.target.value })}
        sx={{ mb: 2 }}
      />
      <TextField
        label="Expected Output"
        fullWidth
        value={question.answer}
        onChange={e => setQuestion({ ...question, answer: e.target.value })}
        sx={{ mb: 2 }}
      />
    </Box>
  );
}
