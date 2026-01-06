'use client';

import React from 'react';
import {
  Drawer,
  IconButton,
  Typography,
  Box,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { X } from 'lucide-react';

export default function SettingsDrawer({
  open,
  onClose,
  theme,
  setTheme,
  fontSize,
  setFontSize,
  showMinimap,
  setShowMinimap,
}) {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: 280, p: 3, borderRadius: '12px 0 0 12px' } }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle1" fontWeight={600}>
          ⚙️ Settings
        </Typography>
        <IconButton size="small" onClick={onClose}>
          <X size={18} />
        </IconButton>
      </Box>

      <Divider sx={{ mb: 3 }} />

      <Box display="flex" flexDirection="column" gap={3}>
        <FormControl fullWidth size="small">
          <InputLabel>Theme</InputLabel>
          <Select
            value={theme}
            label="Theme"
            onChange={(e) => setTheme(e.target.value)}
          >
            <MenuItem value="light">Light</MenuItem>
            <MenuItem value="dark">Dark</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth size="small">
          <InputLabel>Font Size</InputLabel>
          <Select
            value={fontSize}
            label="Font Size"
            onChange={(e) => setFontSize(Number(e.target.value))}
          >
            {[12, 14, 16, 18, 20].map((size) => (
              <MenuItem key={size} value={size}>
                {size}px
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth size="small">
          <InputLabel>Minimap</InputLabel>
          <Select
            value={showMinimap ? 'on' : 'off'}
            label="Minimap"
            onChange={(e) => setShowMinimap(e.target.value === 'on')}
          >
            <MenuItem value="on">Show</MenuItem>
            <MenuItem value="off">Hide</MenuItem>
          </Select>
        </FormControl>
      </Box>
    </Drawer>
  );
}
