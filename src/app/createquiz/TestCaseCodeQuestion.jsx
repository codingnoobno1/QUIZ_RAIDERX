"use client";
import React from "react";
import { Box, TextField, Typography, Stack, IconButton, Button } from "@mui/material";
import { Add, Delete } from "@mui/icons-material";

export default function TestCaseCodeQuestion({ question, setQuestion }) {
  const handleTestCaseChange = (idx, field, value) => {
    const newTestCases = [...question.testCases];
    newTestCases[idx][field] = value;
    setQuestion({ ...question, testCases: newTestCases });
  };
  const addTestCase = () => {
    setQuestion({ ...question, testCases: [...question.testCases, { input: "", output: "" }] });
  };
  const removeTestCase = idx => {
    const newTestCases = question.testCases.filter((_, i) => i !== idx);
    setQuestion({ ...question, testCases: newTestCases });
  };
  return (
    <Box>
      <TextField
        label="Code Question (with Test Cases)"
        fullWidth
        multiline
        minRows={3}
        value={question.text}
        onChange={e => setQuestion({ ...question, text: e.target.value })}
        sx={{ mb: 2 }}
      />
      <Typography fontWeight={700} mb={1}>Test Cases</Typography>
      <Stack spacing={2}>
        {question.testCases.map((tc, idx) => (
          <Stack direction="row" spacing={1} alignItems="center" key={idx}>
            <TextField
              label="Input"
              value={tc.input}
              onChange={e => handleTestCaseChange(idx, "input", e.target.value)}
              size="small"
            />
            <TextField
              label="Expected Output"
              value={tc.output}
              onChange={e => handleTestCaseChange(idx, "output", e.target.value)}
              size="small"
            />
            <IconButton onClick={() => removeTestCase(idx)} color="error"><Delete /></IconButton>
          </Stack>
        ))}
      </Stack>
      <Button onClick={addTestCase} startIcon={<Add />} sx={{ mt: 1 }}>Add Test Case</Button>
    </Box>
  );
}
