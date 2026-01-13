"use client";

import { useState } from "react";
import {
  Card, CardContent, Typography, Dialog, DialogContent,
  IconButton, Chip, Box, Tabs, Tab, Tooltip, Divider, Link, Avatar
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ArticleIcon from "@mui/icons-material/Article";
import ScienceIcon from "@mui/icons-material/Science";

// Single Research Card Component - accepts a paper object via props
export default function ResearchCard({ data }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState(0);

  const paper = data;

  const handleOpen = () => {
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

  if (!paper) return null;

  return (
    <>
      <Card sx={cardStyle} onClick={handleOpen}>
        <CardContent>
          <Box sx={{ textAlign: "center", mb: 2 }}>
            <ArticleIcon sx={{ fontSize: 40, color: "#ffcb05" }} />
          </Box>
          <Typography variant="h6" sx={{ ...goldenStyle, mb: 1 }}>
            {paper.title}
          </Typography>
          <Typography variant="body2" sx={{ color: "#9ca3af" }}>
            {paper.abstract?.slice(0, 70)}...
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Chip
              label={paper.publisher || paper.conference || paper.publicationType || "Research"}
              size="small"
              color="secondary"
              sx={{ mr: 1, mb: 1 }}
            />
            {paper.status && (
              <Chip
                label={paper.status}
                size="small"
                color={paper.status === 'approved' ? 'success' : paper.status === 'pending' ? 'warning' : 'default'}
                sx={{ mr: 1, mb: 1 }}
              />
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
        <DialogContent sx={{ p: 0, bgcolor: tab === 0 ? "#0f172a" : "#fff", minHeight: "600px" }}>
          <IconButton onClick={handleClose} sx={{ position: "absolute", top: 10, right: 10, zIndex: 1 }}>
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
                {paper.title}
              </Typography>
              <Typography variant="body1" sx={{ color: "#ccc" }}>
                {paper.abstract}
              </Typography>
            </Box>
          )}

          {tab === 1 && (
            <Box sx={{ p: 4 }}>
              <Typography variant="h6" sx={goldenStyle}>Authors</Typography>
              {paper.authors?.map((author, i) => (
                <Box key={i} sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                  <Avatar sx={{ width: 32, height: 32, mr: 1 }}>{author[0]}</Avatar>
                  <Typography>{author}</Typography>
                </Box>
              ))}
              {paper.coAuthors?.length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" sx={goldenStyle}>Co-Authors</Typography>
                  {paper.coAuthors.map((co, i) => (
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
              {paper.references?.length > 0 ? (
                <ul>
                  {paper.references.map((ref, i) => (
                    <li key={i}>
                      <Typography variant="body2" sx={{ mb: 1 }}>{ref}</Typography>
                    </li>
                  ))}
                </ul>
              ) : (
                <Typography sx={{ color: '#9ca3af', mt: 2 }}>No references listed.</Typography>
              )}
            </Box>
          )}

          {tab === 3 && (
            <Box sx={{ p: 4 }}>
              <Typography variant="body1"><strong>Conference:</strong> {paper.conference || 'N/A'}</Typography>
              <Typography variant="body1" sx={{ mt: 1 }}>
                <strong>Journal:</strong> {paper.journal || 'N/A'}
              </Typography>
              <Typography variant="body1" sx={{ mt: 1 }}>
                <strong>Publisher:</strong> {paper.publisher || 'N/A'}
              </Typography>
              {paper.doi && (
                <Typography sx={{ mt: 1 }}>
                  <Tooltip title="DOI Link">
                    <Link href={paper.doi} target="_blank" underline="hover">
                      <ScienceIcon sx={{ mr: 0.5 }} /> DOI
                    </Link>
                  </Tooltip>
                </Typography>
              )}
              {paper.patent && (
                <Typography sx={{ mt: 1 }}>
                  <strong>Related Patent:</strong> {paper.patent}
                </Typography>
              )}
              {paper.pdfUrl && (
                <Typography sx={{ mt: 1 }}>
                  <Link href={paper.pdfUrl} target="_blank" underline="hover">
                    📄 Download PDF
                  </Link>
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
