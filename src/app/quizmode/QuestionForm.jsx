import React, { useEffect, useState } from "react";
import { Button, Stack, Paper, Typography } from "@mui/material";

export default function QuestionForm({ q, onSubmit }) {
  const [value, setValue] = useState("");

  useEffect(() => {
    const handleKey = (e) => {
      if (q.type === "mcq" && ["1", "2", "3", "4"].includes(e.key)) {
        const idx = parseInt(e.key) - 1;
        if (q.options[idx]) onSubmit(q.options[idx]);
      }
      if ((q.type === "fillup" || q.type === "findoutput") && e.key === "Enter") {
        onSubmit(value);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [value, q, onSubmit]);

  if (q.type === "mcq") {
    return (
      <Stack spacing={2}>
        {q.options.map((opt, i) => (
          <Button key={i} variant="outlined" onClick={() => onSubmit(opt)}>
            {i + 1}. {opt}
          </Button>
        ))}
      </Stack>
    );
  }

  if (q.type === "fillup" || q.type === "findoutput") {
    return (
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(value); }}>
        <Stack spacing={2}>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Your answer..."
            style={{
              fontSize: 18,
              padding: 10,
              width: '100%',
              borderRadius: 4,
              border: '1px solid #ccc',
            }}
          />
          <Button type="submit" variant="contained">Submit</Button>
        </Stack>
      </form>
    );
  }

  if (q.type === "truefalse") {
    return (
      <Stack spacing={2} direction="row">
        <Button variant="outlined" onClick={() => onSubmit(true)}>True</Button>
        <Button variant="outlined" onClick={() => onSubmit(false)}>False</Button>
      </Stack>
    );
  }

  if (q.type === "blockcode") {
    return (
      <Stack spacing={2}>
        {q.blocks.map((b, i) => (
          <Paper key={i} sx={{ p: 2, bgcolor: '#f5f5f5', fontFamily: 'monospace' }}>
            <Typography variant="caption">Block #{b.blockId}</Typography>
            <pre>{b.code || `Code for block ${b.blockId}`}</pre>
          </Paper>
        ))}
        <Button variant="contained" onClick={() => onSubmit('')}>Continue</Button>
      </Stack>
    );
  }

  return <Button variant="contained" onClick={() => onSubmit('')}>Continue</Button>;
}
