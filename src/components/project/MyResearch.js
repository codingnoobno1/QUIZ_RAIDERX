"use client";

import { Box, Grid, CircularProgress, Typography, Button } from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import { useState, useEffect } from "react";
import ResearchCard from "./ResearchCard";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const neonCyan = "#00FFFF";
const neonPink = "#FF2E88";

export default function MyResearch() {
  const [myResearch, setMyResearch] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const submitterName = localStorage.getItem('studentName') || '';

    if (submitterName) {
      fetch(`/api/research?submitterName=${encodeURIComponent(submitterName)}`)
        .then(res => res.json())
        .then(data => {
          setMyResearch(data.papers || []);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error fetching research:', err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <CircularProgress sx={{ color: neonCyan }} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 4,
        flexWrap: 'wrap',
        gap: 2,
      }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, color: "#fff", letterSpacing: -1 }}>
            MY ARCHIVES
          </Typography>
          <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.4)", fontWeight: 500 }}>
            Review your documented research and academic papers.
          </Typography>
        </Box>
        <Button
          component={Link}
          href="/submit-research"
          variant="contained"
          startIcon={<AddIcon />}
          sx={{
            background: `linear-gradient(135deg, ${neonPink} 0%, ${neonCyan} 100%)`,
            fontWeight: 900,
            px: 3,
            py: 1.5,
            borderRadius: "16px",
            boxShadow: `0 8px 16px ${neonPink}33`,
            "&:hover": { transform: "translateY(-2px)", boxShadow: `0 12px 24px ${neonPink}44` },
            transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
          }}
        >
          NEW DOCUMENT
        </Button>
      </Box>

      <AnimatePresence>
        {myResearch.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Box sx={{
              textAlign: 'center',
              py: 10,
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: "32px",
              border: '1px dashed rgba(0, 255, 255, 0.2)',
            }}>
              <Typography sx={{ color: 'rgba(255, 255, 255, 0.3)', mb: 3, fontSize: '1.1rem', fontWeight: 500 }}>
                No research papers logged in your sector.
              </Typography>
              <Button
                component={Link}
                href="/submit-research"
                variant="outlined"
                startIcon={<AddIcon />}
                sx={{
                  borderColor: neonCyan,
                  color: neonCyan,
                  borderRadius: "12px",
                  "&:hover": {
                    borderColor: neonPink,
                    color: neonPink,
                    bgcolor: `${neonPink}11`,
                  }
                }}
              >
                SUBMIT FIRST PAPER
              </Button>
            </Box>
          </motion.div>
        ) : (
          <Grid container spacing={4}>
            {myResearch.map((item) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={item._id}>
                <ResearchCard data={item} />
              </Grid>
            ))}
          </Grid>
        )}
      </AnimatePresence>
    </Box>
  );
}
