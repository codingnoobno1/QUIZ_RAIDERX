"use client";

import { Card, CardContent, Typography } from "@mui/material";

export default function ResearchCard({ data }) {
  return (
    <Card
      sx={{
        bgcolor: "#111",
        border: "1px dashed #00bfff",
        color: "white",
        transition: "0.3s",
        "&:hover": {
          borderColor: "#ff69b4",
          transform: "scale(1.03)",
        },
      }}
    >
      <CardContent>
        <Typography variant="h6" sx={{ color: "#00bfff" }}>
          {data.title}
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          {data.description}
        </Typography>
      </CardContent>
    </Card>
  );
}
