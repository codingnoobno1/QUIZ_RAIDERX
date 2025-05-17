"use client";

import { Grid } from "@mui/material";
import { motion } from "framer-motion";
import ProjectCard from "@/components/project/ProjectCard";
import ResearchCard from "@/components/project/ResearchCard";

export default function ProjectLayout({ data }) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: {
          transition: {
            staggerChildren: 0.1,
          },
        }}
      }
    >
      <Grid container spacing={4} justifyContent="center">
        {data.map((item) => (
          <Grid
            item
            xs={12}
            sm={6}
            md={4}
            lg={3}
            key={item.id}
            display="flex"
          >
            <motion.div
              style={{ width: "100%" }}
              variants={{
                hidden: { opacity: 0, y: 30 },
                show: { opacity: 1, y: 0 },
              }}
              whileHover={{ scale: 1.05 }}
            >
              {item.type === "project" ? (
                <ProjectCard data={item} />
              ) : (
                <ResearchCard data={item} />
              )}
            </motion.div>
          </Grid>
        ))}
      </Grid>
    </motion.div>
  );
}
