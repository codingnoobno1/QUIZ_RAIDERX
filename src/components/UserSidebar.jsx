'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function UserSidebar({
  routes = [],
  title = 'Dashboard',
}) {
  const [expanded, setExpanded] = useState(true);
  const pathname = usePathname();

  return (
    <motion.aside
      initial={false}
      animate={{ width: expanded ? 260 : 72 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      style={{
        position: 'relative',
        height: '100vh',
        background: '#121a2a',
        color: '#cfd8dc',
        borderRight: '1px solid #2f3a52',
        zIndex: 1200,
        paddingTop: 24,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '4px 0 12px rgba(0,0,0,0.3)',
        userSelect: 'none',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ p: 2, mb: 2, textAlign: 'center' }}>
        <Typography
          variant="h6"
          fontWeight="bold"
          sx={{
            letterSpacing: 1,
            opacity: expanded ? 1 : 0,
            transition: 'opacity 0.3s',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </Typography>
      </Box>

      <List sx={{ px: 0, mt: 0 }}>
        {routes.map(({ id, label, icon: Icon, path }) => {
          const isActive = pathname === path;
          return (
            <Tooltip
              key={id}
              title={!expanded ? label : ''}
              placement="right"
              arrow
              enterDelay={500}
              leaveDelay={200}
            >
              <ListItem
                button
                component={Link}
                href={path}
                sx={{
                  px: 2.5,
                  py: 1.2,
                  my: 0.5,
                  mx: 1,
                  borderRadius: 2,
                  backgroundColor: isActive ? '#1976d2' : 'transparent',
                  color: isActive ? '#e3f2fd' : '#90a4ae',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s ease, color 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  '&:hover': {
                    backgroundColor: isActive ? '#1565c0' : '#1c2833',
                    color: '#e3f2fd',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: 'inherit',
                    minWidth: 0,
                    mr: expanded ? 2.5 : 'auto',
                    display: 'flex',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={22} />
                </ListItemIcon>

                {expanded && (
                  <ListItemText
                    primary={
                      <Typography
                        variant="body2"
                        fontWeight={isActive ? 600 : 400}
                        noWrap
                        sx={{ fontSize: '0.95rem' }}
                      >
                        {label}
                      </Typography>
                    }
                  />
                )}
              </ListItem>
            </Tooltip>
          );
        })}
      </List>

      <Divider sx={{ mt: 'auto', mx: 2, borderColor: '#2f3a52' }} />

      <Box sx={{ p: 2, textAlign: 'center', fontSize: 12, color: '#666' }}>
        {expanded ? `© ${new Date().getFullYear()} Pixel Club` : '©'}
      </Box>
    </motion.aside>
  );
}
