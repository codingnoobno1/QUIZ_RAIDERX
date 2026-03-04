'use client';

import React, { useState } from 'react';
import {
    Box,
    Container,
    Typography,
    Tabs,
    Tab,
    Paper,
    Breadcrumbs,
    Link
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LiveTvIcon from '@mui/icons-material/LiveTv';
import EventIcon from '@mui/icons-material/Event';
import SettingsIcon from '@mui/icons-material/Settings';
import LiveEventManager from '@/components/admin/LiveEventManager';

function TabPanel(props) {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`admin-tabpanel-${index}`}
            aria-labelledby={`admin-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

export default function AdminPage() {
    const [tabValue, setTabValue] = useState(0);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ mb: 4 }}>
                <Breadcrumbs aria-label="breadcrumb">
                    <Link underline="hover" color="inherit" href="/admin_dashboard">
                        Dashboard
                    </Link>
                    <Typography color="text.primary">Admin Control</Typography>
                </Breadcrumbs>
                <Typography variant="h4" component="h1" gutterBottom sx={{ mt: 2, fontWeight: 'bold' }}>
                    Administrative Infrastructure
                </Typography>
            </Box>

            <Paper elevation={0} variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'rgba(0,0,0,0.02)' }}>
                    <Tabs
                        value={tabValue}
                        onChange={handleTabChange}
                        aria-label="admin tabs"
                        variant="scrollable"
                        scrollButtons="auto"
                    >
                        <Tab icon={<LiveTvIcon />} iconPosition="start" label="Live Event" />
                        <Tab icon={<EventIcon />} iconPosition="start" label="Event Setup" />
                        <Tab icon={<DashboardIcon />} iconPosition="start" label="Analytics" />
                        <Tab icon={<SettingsIcon />} iconPosition="start" label="Settings" />
                    </Tabs>
                </Box>

                <TabPanel value={tabValue} index={0}>
                    <LiveEventManager />
                </TabPanel>

                <TabPanel value={tabValue} index={1}>
                    <Typography variant="h6" color="text.secondary">
                        Event Setup and Configuration tools coming soon.
                    </Typography>
                </TabPanel>

                <TabPanel value={tabValue} index={2}>
                    <Typography variant="h6" color="text.secondary">
                        Live Analytics and Participation Tracking.
                    </Typography>
                </TabPanel>

                <TabPanel value={tabValue} index={3}>
                    <Typography variant="h6" color="text.secondary">
                        System configuration and API keys.
                    </Typography>
                </TabPanel>
            </Paper>
        </Container>
    );
}
