'use client';

import { useEffect, useState } from 'react';
import { Typography } from '@mui/material';
import { useSession } from 'next-auth/react';
import RockTheShow from '@/components/admin/RockTheShow';

export default function RockPage() {
  const { data: session, status } = useSession();
  const [activityId, setActivityId] = useState('');

  useEffect(() => {
    setActivityId(new URLSearchParams(window.location.search).get('activityId') || '');
  }, []);

  if (status === 'loading') return null;
  const role = session?.user?.role;
  if (role !== 'admin' && role !== 'student_admin') {
    return <Typography sx={{ color: '#e5e7eb' }}>Rock the Show is for event hosts.</Typography>;
  }

  return <RockTheShow activityId={activityId} />;
}
