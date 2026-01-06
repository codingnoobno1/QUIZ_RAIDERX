import React from "react";
import { Box, Typography, Paper, Stack } from "@mui/material";

export default function UserAnswer({ question, index, userAnswer }) {
  const { answer: correctAnswer, text, type, options } = question;

  return (
    <Paper elevation={3} sx={{ p: 2, mb: 2, borderLeft: userAnswer.correct ? '5px solid green' : '5px solid red' }}>
      <Typography variant="subtitle1" gutterBottom>
        Q{index + 1}: {text}
      </Typography>

      {type === "mcq" && (
        <Stack spacing={0.5} mb={1}>
          {options.map((opt, i) => (
            <Typography
              key={i}
              sx={{
                pl: 2,
                color:
                  opt === correctAnswer
                    ? "green"
                    : opt === userAnswer.answer && !userAnswer.correct
                    ? "red"
                    : "inherit",
              }}
            >
              • {opt}
            </Typography>
          ))}
        </Stack>
      )}

      <Typography>
        <strong>Your Answer:</strong>{" "}
        <span style={{ color: userAnswer.correct ? "green" : "red" }}>
          {String(userAnswer.answer)}
        </span>
      </Typography>
      <Typography>
        <strong>Correct Answer:</strong> {String(correctAnswer)}
      </Typography>
      <Typography>
        <strong>Points:</strong> +{userAnswer.points}
      </Typography>
      <Typography>
        <strong>Time Taken:</strong> {userAnswer.timeTaken}s
      </Typography>
    </Paper>
  );
}
