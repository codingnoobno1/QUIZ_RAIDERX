import { Suspense } from "react";
import { Box, CircularProgress } from "@mui/material";
import ProjectsClient from "./ProjectsClient";

// Loading fallback component
function ProjectsLoading() {
  return (
    <Box sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '50vh',
      bgcolor: 'transparent'
    }}>
      <CircularProgress sx={{ color: '#00FFFF' }} />
    </Box>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={<ProjectsLoading />}>
      <ProjectsClient />
    </Suspense>
  );
}
