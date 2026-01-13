import { Suspense } from "react";
import ProjectsClient from "./ProjectsClient";

// Pure HTML/CSS loading fallback - NO MUI imports in server component!
function ProjectsLoading() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '50vh',
      backgroundColor: 'transparent'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '4px solid rgba(0, 255, 255, 0.3)',
        borderTop: '4px solid #00FFFF',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={<ProjectsLoading />}>
      <ProjectsClient />
    </Suspense>
  );
}
