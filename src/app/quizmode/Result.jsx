import React from "react";
import { Box, Typography, Divider } from "@mui/material";
import DownloadResultButton from "./DownloadResultButton";
import UserAnswer from "./useranswer";

export default function ResultPage({ userAnswers, score }) {
  // We'll assume you pass the full question objects later — otherwise patch it here

  // Temporary example: preload question text or structure if needed
  const enhancedUserAnswers = userAnswers.map((ua, i) => ({
    ...ua,
    question: ua.question || {}, // fallback
  }));

  return (
    <Box p={4}>
      <Typography variant="h4" mb={2}>🎉 Quiz Complete!</Typography>
      <Typography variant="h6">Total Score: {score.toFixed(2)}</Typography>

      <Divider sx={{ my: 3 }} />
      <Typography variant="h5" gutterBottom>Answer Review</Typography>

      {enhancedUserAnswers.map((ua, i) => (
        <UserAnswer
          key={i}
          index={i}
          question={ua.question}
          userAnswer={ua}
        />
      ))}

      <DownloadResultButton userAnswers={userAnswers} score={score} />
    </Box>
  );
}
