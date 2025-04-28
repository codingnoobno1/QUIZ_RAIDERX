"use client";

import { useState } from "react";
import { Card, CardContent, Typography, Chip, Stack, Link, Divider, Dialog, DialogContent, IconButton, Grid } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

export default function ProjectCard({ data }) {
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <>
      {/* Mini View Card */}
      <Card
        onClick={handleOpen}
        sx={{
          bgcolor: "#222",
          border: "1px solid #ff69b4",
          color: "white",
          p: 2,
          cursor: "pointer",
          transition: "0.3s",
          "&:hover": {
            borderColor: "#00bfff",
            transform: "scale(1.05)",
          },
        }}
      >
        <CardContent>
          <Typography variant="h5" sx={{ color: "#ff69b4" }}>
            {data?.title || "No Title"}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            {data?.description?.slice(0, 60) || "No Description"}...
          </Typography>
          <Typography variant="caption" sx={{ mt: 2, display: "block", color: "#00bfff" }}>
            Tap to see details
          </Typography>
        </CardContent>
      </Card>

      {/* Full Screen Dialog */}
      <Dialog open={open} onClose={handleClose} fullScreen>
        <DialogContent sx={{ bgcolor: "#111", color: "white", p: 4 }}>
          <IconButton onClick={handleClose} sx={{ color: "white", position: "absolute", top: 10, right: 10 }}>
            <CloseIcon />
          </IconButton>

          {/* Split Layout */}
          <Grid container spacing={4}>
            
            {/* Left Side */}
            <Grid item xs={12} md={6}>
              <Typography variant="h4" sx={{ color: "#ff69b4", mb: 2 }}>
                {data?.title}
              </Typography>

              <Typography variant="body1" sx={{ mb: 3 }}>
                {data?.description}
              </Typography>

              <Divider sx={{ borderColor: "#444", my: 2 }} />

              <Typography variant="subtitle2" sx={{ color: "#00bfff" }}>
                Stack Used:
              </Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", my: 1 }}>
                {data?.stack?.map((tech, idx) => (
                  <Chip key={idx} label={tech} size="small" color="primary" />
                ))}
              </Stack>

              {data?.usp && (
                <>
                  <Typography variant="subtitle2" sx={{ color: "#00bfff", mt: 3 }}>
                    Unique Selling Point:
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {data.usp}
                  </Typography>
                </>
              )}

              <Typography variant="subtitle2" sx={{ color: "#00bfff", mt: 3 }}>
                Team Lead:
              </Typography>
              <Typography variant="body2">{data?.teamLead}</Typography>

              {data?.groupMembers?.length > 0 && (
                <>
                  <Typography variant="subtitle2" sx={{ color: "#00bfff", mt: 2 }}>
                    Group Members:
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", mt: 1 }}>
                    {data.groupMembers.map((member, idx) => (
                      <Chip key={idx} label={member} size="small" variant="outlined" />
                    ))}
                  </Stack>
                </>
              )}
            </Grid>

            {/* Right Side */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" sx={{ color: "#00bfff" }}>
                Project Type:
              </Typography>
              <Typography variant="body2" sx={{ mb: 3 }}>
                {data?.type}
              </Typography>

              <Divider sx={{ borderColor: "#444", my: 2 }} />
              <Typography variant="subtitle2" sx={{ color: "#00bfff" }}>
                Important Links:
              </Typography>
              <Stack spacing={1} sx={{ mt: 1 }}>
                {data?.github && (
                  <Link href={data.github} target="_blank" underline="hover" color="#ff69b4">
                    GitHub Repository
                  </Link>
                )}
                {data?.gdrive && (
                  <Link href={data.gdrive} target="_blank" underline="hover" color="#00bfff">
                    Google Drive
                  </Link>
                )}
                {data?.deployment && (
                  <Link href={data.deployment} target="_blank" underline="hover" color="#ff69b4">
                    Deployment Link
                  </Link>
                )}
              </Stack>

              {data?.appreciations?.length > 0 && (
                <>
                  <Divider sx={{ borderColor: "#444", my: 3 }} />
                  <Typography variant="subtitle2" sx={{ color: "#00bfff" }}>
                    Appreciations:
                  </Typography>
                  <Stack direction="column" spacing={0.5} sx={{ mt: 1 }}>
                    {data.appreciations.map((title, idx) => (
                      <Typography key={idx} variant="body2">🏆 {title}</Typography>
                    ))}
                  </Stack>
                </>
              )}

              {data?.marketValue && (
                <>
                  <Divider sx={{ borderColor: "#444", my: 3 }} />
                  <Typography variant="subtitle2" sx={{ color: "#00bfff" }}>
                    Market Bidding Value:
                  </Typography>
                  <Typography variant="h6" sx={{ color: "#ff69b4", mt: 1 }}>
                    ₹ {data.marketValue}
                  </Typography>
                </>
              )}
            </Grid>

          </Grid>
        </DialogContent>
      </Dialog>
    </>
  );
}
