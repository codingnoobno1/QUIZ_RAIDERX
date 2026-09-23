'use client';

import { useEffect, useState } from 'react';
import { Box, MenuItem, Select, Typography } from '@mui/material';
import { useSession } from 'next-auth/react';
import HostDesk from '@/components/admin/HostDesk';

export default function PreparePage() {
  const { data: session, status } = useSession();
  const [events, setEvents] = useState([]);
  const [eventId, setEventId] = useState('');

  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch('/api/events')
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data.data ?? [];
        setEvents(list);
        setEventId((current) => current || list[0]?._id || '');
      })
      .catch(() => setEvents([]));
  }, [status]);

  if (status === 'loading') return null;
  const role = session?.user?.role;
  if (role !== 'admin' && role !== 'student_admin') {
    return <Typography sx={{ color: '#e5e7eb' }}>Prepare is for event hosts.</Typography>;
  }

  const event = events.find((item) => item._id === eventId) ?? null;

  return (
    <Box sx={{ bgcolor: '#f5f6f8', color: '#111827', borderRadius: 2, p: { xs: 1.5, md: 2.5 }, minHeight: 'calc(100dvh - 48px)' }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Select
          size="small"
          value={eventId}
          displayEmpty
          onChange={(e) => setEventId(e.target.value)}
          sx={{ minWidth: 240, bgcolor: '#fff' }}
        >
          <MenuItem value="">Choose an event</MenuItem>
          {events.map((item) => (
            <MenuItem key={item._id} value={item._id}>{item.title}</MenuItem>
          ))}
        </Select>
      </Box>
      <HostDesk event={event} events={events} onSelectEvent={setEventId} />
    </Box>
  );
}
