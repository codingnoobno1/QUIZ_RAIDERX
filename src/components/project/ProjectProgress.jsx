import { useState, useEffect } from "react";
import { Box, Typography, LinearProgress } from "@mui/material";

export default function ProjectProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      if (progress < 100) {
        setProgress((prev) => prev + 10);
      }
    }, 1000); // Update every second (mocking real progress)

    return () => clearInterval(interval);
  }, [progress]);

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6">Project Progress</Typography>
      <LinearProgress variant="determinate" value={progress} sx={{ mt: 1 }} />
      <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
        {progress}% Verified by Admin
      </Typography>
    </Box>
  );
}
