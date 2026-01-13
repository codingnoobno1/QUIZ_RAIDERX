"use client";

import { useState } from "react";
import {
  Card, CardContent, Typography, Dialog, DialogContent,
  IconButton, Chip, Box, Tabs, Tab, Tooltip, Divider, Link, Avatar
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ArticleIcon from "@mui/icons-material/Article";
import ScienceIcon from "@mui/icons-material/Science";

// Unified card styling - matches ProjectCard exactly
const cardStyle = {
  background: "linear-gradient(135deg, #1e293b 0%, #111827 100%)",
  borderRadius: 4,
  color: "#e5e7eb",
  height: 340,
  cursor: "pointer",
  boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
  border: "1px solid rgba(0, 255, 255, 0.15)",
  transition: "all 0.3s ease",
  "&:hover": {
    transform: "translateY(-8px) scale(1.02)",
    boxShadow: "0 12px 40px rgba(0,255,255,0.15), 0 4px 20px rgba(255,20,147,0.1)",
    borderColor: "rgba(0, 255, 255, 0.4)",
  },
};

const accentColor = "#00FFFF";
const secondaryAccent = "#FF1493";

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

  if (!paper) return null;

  return (
    <>
      <Card sx={cardStyle} onClick={handleOpen}>
        <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Icon Header */}
          <Box sx={{
            textAlign: "center",
            mb: 2,
            p: 2,
            background: 'linear-gradient(135deg, rgba(0,255,255,0.1) 0%, rgba(255,20,147,0.1) 100%)',
            borderRadius: 2,
          }}>
            <ArticleIcon sx={{ fontSize: 48, color: accentColor }} />
          </Box>

          {/* Title */}
          <Typography variant="h6" sx={{
            color: accentColor,
            fontWeight: 700,
            mb: 1,
            fontSize: '1rem',
            lineHeight: 1.3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {paper.title}
          </Typography>

          {/* Abstract Preview */}
          <Typography variant="body2" sx={{
            color: "rgba(255,255,255,0.7)",
            mb: 2,
            flex: 1,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            fontSize: '0.85rem',
          }}>
            {paper.abstract?.slice(0, 100)}...
          </Typography>

          {/* Tags/Chips */}
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 'auto' }}>
            <Chip
              label={paper.publicationType || paper.publisher || paper.conference || "Research"}
              size="small"
              sx={{
                bgcolor: 'rgba(255, 20, 147, 0.2)',
                color: secondaryAccent,
                border: `1px solid ${secondaryAccent}`,
                fontWeight: 600,
                fontSize: '0.7rem',
              }}
            />
            {paper.status && (
              <Chip
                label={paper.status}
                size="small"
                sx={{
                  bgcolor: paper.status === 'approved' ? 'rgba(0,255,0,0.2)' : 'rgba(255,165,0,0.2)',
                  color: paper.status === 'approved' ? '#00FF00' : '#FFA500',
                  fontWeight: 600,
                  fontSize: '0.7rem',
                }}
              />
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
        <DialogContent sx={{
          p: 0,
          background: tab === 0
            ? "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)"
            : "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
          minHeight: "600px"
        }}>
          <IconButton onClick={handleClose} sx={{ position: "absolute", top: 10, right: 10, zIndex: 1 }}>
            <CloseIcon sx={{ color: tab === 0 ? "#fff" : "#000" }} />
          </IconButton>

          <Tabs
            value={tab}
            onChange={(e, newVal) => setTab(newVal)}
            variant="fullWidth"
            sx={{
              bgcolor: tab === 0 ? "rgba(30, 41, 59, 0.9)" : "#f5f5f5",
              borderBottom: 1,
              borderColor: tab === 0 ? "rgba(0,255,255,0.2)" : "#ccc",
              "& .MuiTab-root": {
                color: tab === 0 ? "rgba(255,255,255,0.7)" : "#666",
                fontWeight: 600,
                "&.Mui-selected": {
                  color: tab === 0 ? accentColor : secondaryAccent,
                },
              },
              "& .MuiTabs-indicator": {
                backgroundColor: tab === 0 ? accentColor : secondaryAccent,
              },
            }}
          >
            <Tab label="Abstract" />
            <Tab label="Authors" />
            <Tab label="References" />
            <Tab label="Info" />
          </Tabs>

          {tab === 0 && (
            <Box sx={{ p: 5, textAlign: "center" }}>
              <Typography variant="h4" sx={{
                fontWeight: 700,
                mb: 3,
                background: `linear-gradient(135deg, ${accentColor} 0%, ${secondaryAccent} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                {paper.title}
              </Typography>
              <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.8)", lineHeight: 1.8 }}>
                {paper.abstract}
              </Typography>
            </Box>
          )}

          {tab === 1 && (
            <Box sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ color: accentColor, fontWeight: 700, mb: 2 }}>Authors</Typography>
              {paper.authors?.map((author, i) => (
                <Box key={i} sx={{ display: "flex", alignItems: "center", mt: 1.5 }}>
                  <Avatar sx={{ width: 36, height: 36, mr: 2, bgcolor: secondaryAccent }}>{author[0]}</Avatar>
                  <Typography sx={{ color: tab === 0 ? "#fff" : "#333" }}>{author}</Typography>
                </Box>
              ))}
              {paper.coAuthors?.length > 0 && (
                <>
                  <Divider sx={{ my: 3, borderColor: 'rgba(0,255,255,0.2)' }} />
                  <Typography variant="h6" sx={{ color: secondaryAccent, fontWeight: 700, mb: 2 }}>Co-Authors</Typography>
                  {paper.coAuthors.map((co, i) => (
                    <Box key={i} sx={{ display: "flex", alignItems: "center", mt: 1.5 }}>
                      <Avatar sx={{ width: 36, height: 36, mr: 2, bgcolor: 'rgba(0,255,255,0.3)' }}>{co[0]}</Avatar>
                      <Typography sx={{ color: tab === 0 ? "#fff" : "#333" }}>{co}</Typography>
                    </Box>
                  ))}
                </>
              )}
            </Box>
          )}

          {tab === 2 && (
            <Box sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ color: accentColor, fontWeight: 700, mb: 2 }}>References</Typography>
              {paper.references?.length > 0 ? (
                <Box component="ul" sx={{ pl: 3 }}>
                  {paper.references.map((ref, i) => (
                    <Box component="li" key={i} sx={{ mb: 1 }}>
                      <Typography variant="body2" sx={{ color: tab === 0 ? 'rgba(255,255,255,0.8)' : '#333' }}>{ref}</Typography>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>No references listed.</Typography>
              )}
            </Box>
          )}

          {tab === 3 && (
            <Box sx={{ p: 4 }}>
              <Box sx={{ display: 'grid', gap: 2 }}>
                {paper.conference && (
                  <Box>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Conference</Typography>
                    <Typography sx={{ color: tab === 0 ? '#fff' : '#333', fontWeight: 600 }}>{paper.conference}</Typography>
                  </Box>
                )}
                {paper.journal && (
                  <Box>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Journal</Typography>
                    <Typography sx={{ color: tab === 0 ? '#fff' : '#333', fontWeight: 600 }}>{paper.journal}</Typography>
                  </Box>
                )}
                {paper.publisher && (
                  <Box>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Publisher</Typography>
                    <Typography sx={{ color: tab === 0 ? '#fff' : '#333', fontWeight: 600 }}>{paper.publisher}</Typography>
                  </Box>
                )}
                {paper.doi && (
                  <Box>
                    <Tooltip title="Open DOI Link">
                      <Link href={paper.doi} target="_blank" underline="hover" sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        color: accentColor,
                        fontWeight: 600,
                      }}>
                        <ScienceIcon /> View DOI
                      </Link>
                    </Tooltip>
                  </Box>
                )}
                {paper.patent && (
                  <Box>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Related Patent</Typography>
                    <Typography sx={{ color: secondaryAccent, fontWeight: 600 }}>{paper.patent}</Typography>
                  </Box>
                )}
                {paper.pdfUrl && (
                  <Box>
                    <Link href={paper.pdfUrl} target="_blank" underline="hover" sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      color: secondaryAccent,
                      fontWeight: 600,
                    }}>
                      📄 Download PDF
                    </Link>
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
