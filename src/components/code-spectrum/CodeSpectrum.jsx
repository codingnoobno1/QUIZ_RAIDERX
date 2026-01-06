'use client';

import React, { useEffect, useState } from 'react';
import { Box, Container, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import LanguageCard from './LanguageCard';
import { languageThemes } from './languageThemes';
import { loadCode } from './loadCode';
import { SectionTitle } from '../homeui/sections/CommonUI';

const languages = [
    { id: 'kotlin', file: 'kotlin.json' },
    { id: 'c', file: 'c.json' },
    { id: 'flutter', file: 'flutter.json' },
    { id: 'csharp', file: 'cs.json' },
    { id: 'rust', file: 'rust.json' },
    { id: 'go', file: 'go.json' },
    { id: 'cshift', file: 'cshift.json' }
];

const CodeSpectrum = () => {
    const [codeData, setCodeData] = useState({});

    useEffect(() => {
        const fetchAll = async () => {
            const results = {};
            for (const lang of languages) {
                results[lang.id] = await loadCode(lang.file);
            }
            setCodeData(results);
        };
        fetchAll();
    }, []);

    return (
        <Box id="spectrum" sx={{ py: 15, position: 'relative' }}>
            <Container maxWidth="xl">
                <SectionTitle>Code Spectrum</SectionTitle>
                <Typography
                    variant="body1"
                    align="center"
                    sx={{ color: 'rgba(255,255,255,0.5)', mb: 8, maxWidth: '600px', mx: 'auto' }}
                >
                    Exploring the architecture and syntax of the world's most powerful ecosystems.
                </Typography>

                <Box
                    sx={{
                        display: 'flex',
                        gap: 4,
                        overflowX: 'auto',
                        pb: 4,
                        px: 2,
                        maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
                        '&::-webkit-scrollbar': {
                            height: '6px',
                        },
                        '&::-webkit-scrollbar-thumb': {
                            backgroundColor: 'rgba(0, 255, 255, 0.2)',
                            borderRadius: '10px',
                        },
                    }}
                >
                    {languages.map((lang) => (
                        codeData[lang.id] && (
                            <LanguageCard
                                key={lang.id}
                                title={codeData[lang.id].title}
                                subtitle={codeData[lang.id].subtitle}
                                code={codeData[lang.id].code}
                                theme={languageThemes[lang.id] || languageThemes.c}
                            />
                        )
                    ))}
                </Box>
            </Container>
        </Box>
    );
};

export default CodeSpectrum;
