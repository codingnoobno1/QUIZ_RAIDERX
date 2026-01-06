'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import { EvervaultCard } from './EvervaultCard';
import CodeRenderer from './CodeRenderer';

export default function LanguageCard({ title, subtitle, code, theme }) {
    return (
        <Box sx={{ width: { xs: '320px', md: '420px' }, height: '520px', flexShrink: 0 }}>
            <EvervaultCard theme={theme}>
                <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', h: '100%', height: '100%' }}>
                    <Typography
                        variant="h5"
                        sx={{
                            fontWeight: 'bold',
                            color: theme.title,
                            mb: 1,
                            fontFamily: "'Space Grotesk', sans-serif"
                        }}
                    >
                        {title}
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{
                            color: 'rgba(255,255,255,0.6)',
                            mb: 3,
                            fontWeight: 500
                        }}
                    >
                        {subtitle}
                    </Typography>

                    <Box sx={{ flex: 1, overflow: 'hidden', borderRadius: '12px' }}>
                        <CodeRenderer code={code} theme={theme} />
                    </Box>
                </Box>
            </EvervaultCard>
        </Box>
    );
}
