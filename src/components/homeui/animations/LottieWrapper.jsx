'use client';

import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import Lottie from 'lottie-react';

const LottieWrapper = ({ animationData, width = '100%', height = 'auto', loop = true }) => {
    const [data, setData] = useState(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!animationData) return;

        // Handle HTTP URLs (external Lottie files)
        if (typeof animationData === 'string' && animationData.startsWith('http')) {
            console.log('Fetching Lottie animation from:', animationData);
            fetch(animationData)
                .then(res => {
                    if (!res.ok) {
                        throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
                    }
                    return res.json();
                })
                .then(setData)
                .catch(err => {
                    console.error('Lottie load error:', err.message);
                    console.error('Animation URL:', animationData);
                    console.error('Tip: Consider downloading the animation and placing it in /public/animations/');
                    setError(true);
                });
        }
        // Handle local file paths (e.g., '/animations/research.json')
        else if (typeof animationData === 'string' && animationData.startsWith('/')) {
            console.log('Fetching Lottie animation from local path:', animationData);
            fetch(animationData)
                .then(res => {
                    if (!res.ok) {
                        throw new Error(`Failed to fetch local file: ${res.status} ${res.statusText}`);
                    }
                    return res.json();
                })
                .then(setData)
                .catch(err => {
                    console.error('Lottie local file error:', err.message);
                    console.error('Local path:', animationData);
                    setError(true);
                });
        }
        // Handle animation data objects passed directly
        else {
            setData(animationData);
        }
    }, [animationData]);

    if (error) return (
        <Box sx={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)' }}>Droid Offline</Typography>
        </Box>
    );

    if (!data) return (
        <Box sx={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Box sx={{
                width: 40, height: 40,
                border: '2px solid rgba(0, 255, 255, 0.1)',
                borderTopColor: '#00FFFF',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
            }} />
            <style jsx>{`
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}</style>
        </Box>
    );

    return (
        <div style={{ width, height, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Lottie
                animationData={data}
                loop={loop}
                style={{ width: '100%', height: '100%' }}
            />
        </div>
    );
};

export default LottieWrapper;
