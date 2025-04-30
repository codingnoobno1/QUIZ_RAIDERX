"use client";

import { useState } from "react";
import {
  Card, CardContent, Typography, Grid, Dialog, DialogContent,
  IconButton, Chip, Box, Tabs, Tab, Tooltip, Divider, Link, Avatar
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DescriptionIcon from "@mui/icons-material/Description";
import ArticleIcon from "@mui/icons-material/Article";
import ScienceIcon from "@mui/icons-material/Science";
import researchData from "./researchData.json";

export default function ResearchPaperCard() {
  const [open, setOpen] = useState(false);
  const [currentPaper, setCurrentPaper] = useState(null);
  const [tab, setTab] = useState(0);

  const handleOpen = (paper) => {
    setCurrentPaper(paper);
    setTab(0);
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const goldenStyle = {
    color: "#ffcb05",
    fontWeight: 600,
    fontFamily: "serif",
  };

  const cardStyle = {
    background: "#111827",
    borderRadius: 4,
    color: "#e5e7eb",
    height: 300,
    cursor: "pointer",
    boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
    border: "1px solid #1f2937",
    transition: "transform 0.3s",
    "&:hover": {
      transform: "scale(1.03)",
      boxShadow: "0 6px 30px rgba(255,203,5,0.2)",
    },
  };

  return (
    <>
      <Grid container spacing={3} sx={{ px: 2, py: 4 }}>
        {researchData.map((paper, idx) => (
          <Grid item xs={12} sm={6} md={4} key={idx}>
            <Card sx={cardStyle} onClick={() => handleOpen(paper)}>
              <CardContent>
                <Box sx={{ textAlign: "center", mb: 2 }}>
                  <ArticleIcon sx={{ fontSize: 40, color: "#ffcb05" }} />
                </Box>
                <Typography variant="h6" sx={{ ...goldenStyle, mb: 1 }}>
                  {paper.title}
                </Typography>
                <Typography variant="body2" sx={{ color: "#9ca3af" }}>
                  {paper.abstract.slice(0, 70)}...
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Chip
                    label={paper.conference}
                    size="small"
                    color="secondary"
                    sx={{ mr: 1, mb: 1 }}
                  />
                  <Chip
                    label="Research"
                    size="small"
                    variant="outlined"
                    sx={{ color: "#ffcb05", borderColor: "#ffcb05" }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
        <DialogContent sx={{ p: 0, bgcolor: tab === 0 ? "#0f172a" : "#fff", minHeight: "600px" }}>
          <IconButton onClick={handleClose} sx={{ position: "absolute", top: 10, right: 10 }}>
            <CloseIcon sx={{ color: tab === 0 ? "#fff" : "#000" }} />
          </IconButton>

          <Tabs
            value={tab}
            onChange={(e, newVal) => setTab(newVal)}
            variant="fullWidth"
            sx={{
              bgcolor: tab === 0 ? "#1e293b" : "#f5f5f5",
              borderBottom: 1,
              borderColor: "#ccc",
              color: tab === 0 ? "#fff" : "#000",
            }}
          >
            <Tab label="Abstract" />
            <Tab label="Authors" />
            <Tab label="References" />
            <Tab label="Info" />
          </Tabs>

          {tab === 0 && (
            <Box sx={{ p: 5, textAlign: "center", color: "#ffcb05" }}>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
                {currentPaper?.title}
              </Typography>
              <Typography variant="body1" sx={{ color: "#ccc" }}>
                {currentPaper?.abstract}
              </Typography>
            </Box>
          )}

          {tab === 1 && (
            <Box sx={{ p: 4 }}>
              <Typography variant="h6" sx={goldenStyle}>Authors</Typography>
              {currentPaper?.authors?.map((author, i) => (
                <Box key={i} sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                  <Avatar sx={{ width: 32, height: 32, mr: 1 }}>{author[0]}</Avatar>
                  <Typography>{author}</Typography>
                </Box>
              ))}
              {currentPaper?.coAuthors?.length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" sx={goldenStyle}>Co-Authors</Typography>
                  {currentPaper.coAuthors.map((co, i) => (
                    <Box key={i} sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                      <Avatar sx={{ width: 32, height: 32, mr: 1 }}>{co[0]}</Avatar>
                      <Typography>{co}</Typography>
                    </Box>
                  ))}
                </>
              )}
            </Box>
          )}

          {tab === 2 && (
            <Box sx={{ p: 4 }}>
              <Typography variant="h6" sx={goldenStyle}>References</Typography>
              <ul>
                {currentPaper?.references?.map((ref, i) => (
                  <li key={i}>
                    <Typography variant="body2" sx={{ mb: 1 }}>{ref}</Typography>
                  </li>
                ))}
              </ul>
            </Box>
          )}

          {tab === 3 && (
            <Box sx={{ p: 4 }}>
              <Typography variant="body1"><strong>Conference:</strong> {currentPaper?.conference}</Typography>
              <Typography variant="body1" sx={{ mt: 1 }}>
                <strong>Journal:</strong> {currentPaper?.journal}
              </Typography>
              {currentPaper?.doi && (
                <Typography sx={{ mt: 1 }}>
                  <Tooltip title="DOI Link">
                    <Link href={currentPaper.doi} target="_blank" underline="hover">
                      <ScienceIcon sx={{ mr: 0.5 }} /> DOI
                    </Link>
                  </Tooltip>
                </Typography>
              )}
              {currentPaper?.patent && (
                <Typography sx={{ mt: 1 }}>
                  <strong>Related Patent:</strong> {currentPaper.patent}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
