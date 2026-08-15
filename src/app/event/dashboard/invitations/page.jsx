'use client';

/**
 * Invitations — team requests waiting on you.
 *
 * Only genuinely pending invitations reach here: the API filters with
 * $elemMatch, so an invite you already answered does not reappear.
 */

import { useRouter } from 'next/navigation';
import { Stack } from '@mui/material';
import MarkEmailReadRoundedIcon from '@mui/icons-material/MarkEmailReadRounded';
import useEventUser from '@/hooks/useEventUser';
import { useInvitations } from '@/hooks/queries/useEventQueries';
import AsyncBoundary from '@/components/async/AsyncBoundary';
import EmptyState from '@/components/async/EmptyState';
import InvitationCard from '@/components/events/InvitationCard';
import PageHeading from '@/components/events/shell/PageHeading';

export default function InvitationsPage() {
  const router = useRouter();
  const { user } = useEventUser();
  const invitationsQuery = useInvitations(user?.email);

  return (
    <>
      <PageHeading title="Invitations" subtitle="Team requests waiting for your answer." />

      <AsyncBoundary
        query={invitationsQuery}
        loadingLabel="Loading invitations"
        empty={
          <EmptyState
            icon={MarkEmailReadRoundedIcon}
            title="No pending invitations"
            message="When someone invites you to their team, it shows up here."
            action={{ label: 'Browse events', onClick: () => router.push('/event/dashboard/events') }}
          />
        }
      >
        {(invitations) => (
          <Stack spacing={1.5}>
            {invitations.map((inv) => (
              <InvitationCard key={inv.id} invitation={inv} email={user?.email} />
            ))}
          </Stack>
        )}
      </AsyncBoundary>
    </>
  );
}
