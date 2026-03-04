"use client";

import { useState } from "react";
import {
  Card, CardContent, Typography, Dialog, DialogContent,
  IconButton, Chip, Box, Tabs, Tab, Tooltip, Divider, Link, Avatar
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ArticleIcon from "@mui/icons-material/Article";
import ScienceIcon from "@mui/icons-material/Science";
import { motion, AnimatePresence } from "framer-motion";

const neonCyan = "#00FFFF";
const neonPink = "#FF2E88";
const slate900 = "#020617";
const slate800 = "#1e293b";

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
      <motion.div
        whileHover={{ y: -10, scale: 1.02 }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, cubicBezier: [0.175, 0.885, 0.32, 1.275] }}
      >
        <Card
          onClick={handleOpen}
          sx={{
            background: "rgba(30, 41, 59, 0.4)",
            backdropFilter: "blur(20px)",
            borderRadius: "24px",
            color: "#fff",
            height: 360,
            cursor: "pointer",
            position: "relative",
            overflow: "hidden",
            border: "1px solid rgba(255, 255, 255, 0.05)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
            "&:hover": {
              border: `1px solid ${neonCyan}33`,
              boxShadow: `0 15px 45px ${neonCyan}11`,
              "& .glow-overlay": { opacity: 1 }
            }
          }}
        >
          {/* Hover Glow Effect */}
          <Box
            className="glow-overlay"
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `radial-gradient(circle at 50% 0%, ${neonCyan}11 0%, transparent 70%)`,
              opacity: 0,
              transition: "opacity 0.4s ease",
              pointerEvents: "none",
            }}
          />

          <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 3, position: "relative", zIndex: 1 }}>
            {/* Type Chip */}
            <Box sx={{ mb: 2 }}>
              <Chip
                label={(paper.publicationType || paper.publisher || "RESEARCH").toUpperCase()}
                size="small"
                sx={{
                  background: `${neonPink}11`,
                  color: neonPink,
                  border: `1px solid ${neonPink}44`,
                  fontWeight: 800,
                  fontSize: "0.65rem",
                  letterSpacing: 1
                }}
              />
            </Box>

            {/* Icon/Visual Element */}
            <Box sx={{
              mb: 2,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: 80,
              borderRadius: "16px",
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid rgba(255, 255, 255, 0.05)"
            }}>
              <ArticleIcon sx={{ fontSize: 40, color: neonCyan }} />
            </Box>

            <Typography variant="h6" sx={{
              fontWeight: 900,
              lineHeight: 1.2,
              mb: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              letterSpacing: -0.5
            }}>
              {paper.title}
            </Typography>

            <Typography variant="body2" sx={{
              color: "rgba(255, 255, 255, 0.5)",
              mb: 2,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              fontSize: "0.85rem",
              lineHeight: 1.6
            }}>
              {paper.abstract}
            </Typography>

            {/* Footer Info */}
            <Box sx={{ mt: 'auto', pt: 2, borderTop: "1px solid rgba(255, 255, 255, 0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: "rgba(255, 255, 255, 0.4)" }}>
                {paper.authors?.[0] || paper.submitterName || "CONTRIBUTOR"}
              </Typography>
              {paper.status && (
                <Box sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  bgcolor: paper.status === 'approved' ? neonCyan : "#facc15",
                  boxShadow: `0 0 10px ${paper.status === 'approved' ? neonCyan : "#facc15"}`
                }} />
              )}
            </Box>
          </CardContent>
        </Card>
      </motion.div>

      {/* Premium Detail Dialog */}
      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            bgcolor: slate900,
            color: "#fff",
            borderRadius: "32px",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 50px 100px -20px rgba(0, 0, 0, 0.7)",
            backgroundImage: "none",
            overflow: "hidden"
          }
        }}
      >
        <DialogContent sx={{ p: 0, minHeight: "600px", display: "flex", flexDirection: "column" }}>
          {/* Header Image Area */}
          <Box sx={{
            height: 200,
            background: `linear-gradient(45deg, ${slate900} 30%, ${neonCyan}22 100%)`,
            position: "relative",
            display: "flex",
            alignItems: "center",
            px: 4
          }}>
            <IconButton onClick={handleClose} sx={{ position: "absolute", top: 20, right: 20, color: "rgba(255,255,255,0.4)", "&:hover": { color: neonPink } }}>
              <CloseIcon />
            </IconButton>
            <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
              <Avatar sx={{ width: 80, height: 80, bgcolor: "rgba(255, 255, 255, 0.05)", border: `2px solid ${neonCyan}44` }}>
                <ScienceIcon sx={{ fontSize: 40, color: neonCyan }} />
              </Avatar>
              <Box>
                <Chip
                  label={(paper.publicationType || "RESEARCH").toUpperCase()}
                  size="small"
                  sx={{ background: neonCyan, color: "#000", fontWeight: 900, mb: 1 }}
                />
                <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: -1 }}>{paper.title.toUpperCase()}</Typography>
              </Box>
            </Box>
          </Box>

          {/* Navigation Tabs */}
          <Tabs
            value={tab}
            onChange={(e, newVal) => setTab(newVal)}
            variant="fullWidth"
            sx={{
              borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
              "& .MuiTab-root": {
                color: "rgba(255, 255, 255, 0.4)",
                fontWeight: 800,
                py: 3,
                "&.Mui-selected": { color: neonCyan },
              },
              "& .MuiTabs-indicator": { backgroundColor: neonCyan, height: 3 },
            }}
          >
            <Tab label="ABSTRACT" />
            <Tab label="COLLABORATORS" />
            <Tab label="CITATIONS" />
            <Tab label="DATA" />
          </Tabs>

          {/* Content Area */}
          <Box sx={{ p: 5, flexGrow: 1, overflowY: "auto" }}>
            <AnimatePresence mode="wait">
              {tab === 0 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <Typography variant="h6" sx={{ color: neonCyan, fontWeight: 900, mb: 3 }}>EXECUTIVE SUMMARY</Typography>
                  <Typography sx={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.8, fontSize: "1.1rem" }}>
                    {paper.abstract}
                  </Typography>
                </motion.div>
              )}

              {tab === 1 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                  <Typography variant="h6" sx={{ color: neonCyan, fontWeight: 900, mb: 3 }}>PRIMARY CONTRIBUTORS</Typography>
                  <Grid container spacing={2}>
                    {paper.authors?.map((author, i) => (
                      <Grid item xs={12} sm={6} key={i}>
                        <Box sx={{ display: "flex", alignItems: "center", p: 2, bgcolor: "rgba(255,255,255,0.02)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.05)" }}>
                          <Avatar sx={{ mr: 2, bgcolor: neonPink }}>{author[0]}</Avatar>
                          <Typography sx={{ fontWeight: 700 }}>{author}</Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </motion.div>
              )}

              {tab === 2 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                  <Typography variant="h6" sx={{ color: neonCyan, fontWeight: 900, mb: 3 }}>REFERENCES & CITATIONS</Typography>
                  {paper.references?.length > 0 ? (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      {paper.references.map((ref, i) => (
                        <Box key={i} sx={{ pl: 3, borderLeft: `2px solid ${neonCyan}22`, py: 1 }}>
                          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)" }}>{ref}</Typography>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Typography sx={{ color: "rgba(255,255,255,0.3)" }}>No citations documented for this paper.</Typography>
                  )}
                </motion.div>
              )}

              {tab === 3 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                  <Typography variant="h6" sx={{ color: neonCyan, fontWeight: 900, mb: 3 }}>TECHNICAL SPECIFICATIONS</Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 3 }}>
                    {[
                      { label: "CONFERENCE", value: paper.conference },
                      { label: "JOURNAL", value: paper.journal },
                      { label: "PUBLISHER", value: paper.publisher },
                      { label: "PATENT ID", value: paper.patent, color: neonPink }
                    ].filter(item => item.value).map((item, i) => (
                      <Box key={i} sx={{ p: 2, bgcolor: "rgba(255,255,255,0.02)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
                        <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.4)", fontWeight: 800 }}>{item.label}</Typography>
                        <Typography sx={{ fontWeight: 700, color: item.color || "#fff" }}>{item.value}</Typography>
                      </Box>
                    ))}
                  </Box>
                  <Box sx={{ mt: 4, display: "flex", gap: 2 }}>
                    {paper.doi && (
                      <Button
                        component={Link}
                        href={paper.doi}
                        target="_blank"
                        variant="outlined"
                        startIcon={<ScienceIcon />}
                        sx={{ borderColor: neonCyan, color: neonCyan, borderRadius: "12px" }}
                      >
                        VIEW DOI
                      </Button>
                    )}
                    {paper.pdfUrl && (
                      <Button
                        component={Link}
                        href={paper.pdfUrl}
                        target="_blank"
                        variant="contained"
                        sx={{ bgcolor: neonPink, color: "#fff", borderRadius: "12px", "&:hover": { bgcolor: neonPink, opacity: 0.9 } }}
                      >
                        DOWNLOAD PDF
                      </Button>
                    )}
                  </Box>
                </motion.div>
              )}
            </AnimatePresence>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}
