'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Box, CircularProgress } from '@mui/material';

export default function StudentAdminLayout({ children }) {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === 'loading') return;

        // Check if user is authenticated and has 'admin' role
        if (!session || (session.user.role !== 'admin' && session.user.role !== 'student_admin')) {
            router.replace('/'); // Redirect unauthorized users to home
        }
    }, [session, status, router]);

    if (status === 'loading') {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: '#000' }}>
                <CircularProgress sx={{ color: '#00FFFF' }} />
            </Box>
        );
    }

    // Only render children if authorized
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'student_admin')) {
        return null;
    }

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#050505', color: '#fff' }}>
            {children}
        </Box>
    );
}
