'use client';

/**
 * KBC container.
 *
 * Polls faster than the rest of the lobby — a live show moves between beats in
 * seconds, and a 30s cadence would leave the room a phase behind the host.
 * Everything else is delegated: this owns the poll and the submit, the phase
 * router owns what appears.
 */

import { Box } from '@mui/material';
import { useLiveAnswer } from '@/hooks/queries/useEventQueries';
import KbcExperience from './KbcExperience';

export default function KbcActivity({ activity, participantId, eventId }) {
  const answer = useLiveAnswer(activity.id, eventId, participantId);
  const quiz = activity.quiz ?? {};

  return (
    <Box sx={{ minHeight: 0 }}>
      <KbcExperience
        quiz={quiz}
        submitting={answer.isPending}
        onSubmit={(vars) => answer.mutate(vars)}
      />
    </Box>
  );
}
