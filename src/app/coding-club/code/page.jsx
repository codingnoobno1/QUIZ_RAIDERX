'use client';

import { useState } from 'react';
import { Box, Button, Typography, Paper } from '@mui/material';
import { styled } from '@mui/system';
import Sidebar from '@/components/Sidebar';
import CodeEditorSection from '@/components/code/CodeEditorSection';

// Metallic texture background style
const MetallicPaper = styled(Paper)(({ theme }) => ({
  background: 'linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%)',
  border: '1px solid #4f4f4f',
  boxShadow: '0 4px 10px rgba(0, 0, 0, 0.8)',
  padding: theme.spacing(4),
  borderRadius: '16px',
}));

export default function Page() {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');

  const handleSubmit = () => {
    console.log('Submitted Code:', code);
    console.log('Selected Language:', language);
    // Further submission logic here (API call etc.)
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'black' }}>
      {/* Sidebar Section */}
      <Sidebar />

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, p: 4 }}>
        {/* Heading */}
        <Typography
          variant="h3"
          gutterBottom
          sx={{
            color: 'deepskyblue',
            fontWeight: 'bold',
            fontFamily: 'monospace',
            textAlign: 'center',
            mb: 4,
          }}
        >
          Code Raider X
        </Typography>

        {/* Editor + Submit Section */}
        <MetallicPaper elevation={8}>
          <CodeEditorSection
            code={code}
            setCode={setCode}
            language={language}
            setLanguage={setLanguage}
          />

          {/* Submit Button */}
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleSubmit}
              sx={{
                bgcolor: 'deepskyblue',
                fontWeight: 'bold',
                borderRadius: '12px',
                px: 5,
                py: 1.5,
                '&:hover': {
                  bgcolor: '#0099cc',
                },
              }}
            >
              Submit Code
            </Button>
          </Box>
        </MetallicPaper>
      </Box>
    </Box>
  );
}
