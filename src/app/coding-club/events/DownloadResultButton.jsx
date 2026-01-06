import React from "react";
import { Button } from "@mui/material";

export default function DownloadResultButton({ userAnswers, score }) {
  function handleDownload() {
    const blob = new Blob([JSON.stringify({ score, userAnswers }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "quiz-result.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return <Button onClick={handleDownload} variant="outlined" sx={{ mt: 2 }}>Download Result</Button>;
}
