'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Box, Typography } from '@mui/material';
import EventBusyRoundedIcon from '@mui/icons-material/EventBusyRounded';
import { color } from '@/theme/tokens';
import useEventUser from '@/hooks/useEventUser';
import { useEvent, useRegisterForEvent, useRegistrationFor } from '@/hooks/queries/useEventQueries';
import AsyncBoundary from '@/components/async/AsyncBoundary';
import EmptyState from '@/components/async/EmptyState';
import RegistrationForm from '@/components/events/RegistrationForm';

export default function RegisterPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useEventUser();

  const eventQuery = useEvent(id);
  const { isRegistered } = useRegistrationFor(user?.email, id);
  const register = useRegisterForEvent(user?.email);

  // Already in — send them to the pass instead of letting them double-register.
  if (isRegistered) {
    router.replace(`/event/dashboard/${id}/pass`);
    return null;
  }

  return (
    <AsyncBoundary
      query={eventQuery}
      loadingLabel="Loading event"
      isEmpty={(e) => !e}
      empty={
        <EmptyState
          icon={EventBusyRoundedIcon}
          title="Event not found"
          action={{ label: 'Back to events', onClick: () => router.push('/event/dashboard') }}
        />
      }
    >
      {(event) => (
        <Box sx={{ maxWidth: 640 }}>
          <Box sx={{ px: { xs: 2, md: 3 }, pt: 3 }}>
            <Typography sx={{ color: color.textFaint, fontSize: '0.68rem', fontWeight: 800, letterSpacing: 1.2 }}>
              REGISTERING FOR
            </Typography>
            <Typography sx={{ color: color.text, fontWeight: 800, fontSize: '1.2rem', mt: 0.25 }}>
              {event.title}
            </Typography>
          </Box>

          <RegistrationForm
            event={event}
            user={user}
            isSubmitting={register.isPending}
            error={register.error}
            onSubmit={(values) =>
              register.mutate(
                { event, user, ...values },
                {
                  onSuccess: () => {
                    toast.success(
                      values.registrationType === 'team'
                        ? `Team "${values.teamName}" registered`
                        : 'You are registered',
                    );
                    router.replace(`/event/dashboard/${event.id}/pass`);
                  },
                  // The form renders register.error itself; a toast would double up.
                  onError: () => {},
                },
              )
            }
          />
        </Box>
      )}
    </AsyncBoundary>
  );
}
