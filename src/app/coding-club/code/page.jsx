'use client';

import { useState } from 'react';
import {
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Container,
} from '@mui/material';
import { LayoutDashboard, Terminal, SlidersHorizontal } from 'lucide-react';

import QuestionCard from '@/components/code/QuestionCard';
import EditorPanel from '@/components/code/EditorPanel';
import OutputPanel from '@/components/code/OutputPanel';
import SettingsDrawer from '@/components/code/SettingsDrawer';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('input');
  const [theme, setTheme] = useState('light');
  const [fontSize, setFontSize] = useState(14);
  const [showMinimap, setShowMinimap] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');

  const handleSubmit = () => {
    console.log('Code submitted:', code);
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#fff' }}>
      

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ py: 4, flexGrow: 1, overflowY: 'auto' }}>
        <Box mb={3}>
          <QuestionCard remainingTime={1800} />
        </Box>

        {activeTab === 'input' && (
          <EditorPanel
            code={code}
            setCode={setCode}
            language={language}
            setLanguage={setLanguage}
            fontSize={fontSize}
            showMinimap={showMinimap}
            theme={theme}
            onSubmit={handleSubmit}
          />
        )}

        {activeTab === 'output' && <OutputPanel />}
      </Container>

      {/* Drawer Outside DOM Tree */}
      <SettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        theme={theme}
        setTheme={setTheme}
        fontSize={fontSize}
        setFontSize={setFontSize}
        showMinimap={showMinimap}
        setShowMinimap={setShowMinimap}
      />
    </Box>
  );
}
