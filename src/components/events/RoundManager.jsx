'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { color, radius, tint } from '@/theme/tokens';
import {
  useAdminRounds,
  useCreateEventRound,
  useUpdateEventRound,
} from '@/hooks/queries/useEventQueries';

export default function RoundManager({ eventId }) {
  const query = useAdminRounds(eventId);
  const createRound = useCreateEventRound(eventId);
  const updateRound = useUpdateEventRound(eventId);
  const [selectedRoundId, setSelectedRoundId] = useState('');
  const [selectedTeamIds, setSelectedTeamIds] = useState([]);
  const [title, setTitle] = useState('Round 1');
  const [format, setFormat] = useState('paper');

  const rounds = query.data?.rounds ?? [];
  const teams = query.data?.teams ?? [];
  const selectedRound = useMemo(
    () => rounds.find((round) => round.id === selectedRoundId) ?? rounds[0] ?? null,
    [rounds, selectedRoundId],
  );

  useEffect(() => {
    if (!selectedRound) {
      setSelectedTeamIds([]);
      return;
    }
    setSelectedRoundId(selectedRound.id);
    setSelectedTeamIds(selectedRound.teams.map((team) => team.teamId));
  }, [selectedRound?.id, selectedRound?.updatedAt]);

  if (query.isError) return null;

  const busy = createRound.isPending || updateRound.isPending;
  const toggleTeam = (teamId) => {
    setSelectedTeamIds((current) => (
      current.includes(teamId)
        ? current.filter((id) => id !== teamId)
        : [...current, teamId]
    ));
  };

  const create = () => {
    const nextNumber = rounds.reduce((max, round) => Math.max(max, round.roundNumber), 0) + 1;
    createRound.mutate(
      { title: title.trim(), format, roundNumber: nextNumber },
      { onSuccess: (result) => setSelectedRoundId(result?.data?.round?.id ?? '') },
    );
  };

  return (
    <Box sx={{ px: 2.5, pb: 2.5 }}>
      <Typography sx={{ color: color.text, fontSize: '0.82rem', fontWeight: 750, mb: 0.4 }}>
        Round rosters
      </Typography>
      <Typography sx={{ color: color.textMuted, fontSize: '0.7rem', lineHeight: 1.55, mb: 1.5 }}>
        Record paper-round qualifiers here, then publish the roster. A quiz can use a published or draft roster
        as its eligibility list.
      </Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
        <TextField
          size="small"
          label="New round title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          sx={{ flex: 1 }}
        />
        <TextField
          select
          size="small"
          label="Format"
          value={format}
          onChange={(event) => setFormat(event.target.value)}
          sx={{ minWidth: 130 }}
        >
          <MenuItem value="paper">Paper</MenuItem>
          <MenuItem value="live">Live</MenuItem>
          <MenuItem value="online">Online</MenuItem>
          <MenuItem value="other">Other</MenuItem>
        </TextField>
        <Button variant="outlined" disabled={busy || !title.trim()} onClick={create}>
          Create round
        </Button>
      </Stack>

      {rounds.length > 0 && (
        <Box
          sx={{
            mt: 1.5,
            p: 1.5,
            border: `1px solid ${color.border}`,
            borderRadius: `${radius.md}px`,
            bgcolor: color.surface,
          }}
        >
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
            <TextField
              select
              size="small"
              label="Edit roster"
              value={selectedRound?.id ?? ''}
              onChange={(event) => setSelectedRoundId(event.target.value)}
              sx={{ minWidth: 220, flex: 1 }}
            >
              {rounds.map((round) => (
                <MenuItem key={round.id} value={round.id}>
                  {round.roundNumber}. {round.title} · {round.status} · {round.teamCount} teams
                </MenuItem>
              ))}
            </TextField>
            <Button
              variant="contained"
              disabled={busy || !selectedRound}
              onClick={() => updateRound.mutate({
                roundId: selectedRound.id,
                action: 'set-teams',
                teamIds: selectedTeamIds,
              })}
            >
              Save roster
            </Button>
            <Button
              variant="outlined"
              disabled={busy || !selectedRound || !selectedTeamIds.length}
              onClick={() => updateRound.mutate({
                roundId: selectedRound.id,
                action: selectedRound.status === 'published' ? 'unpublish' : 'publish',
              })}
            >
              {selectedRound?.status === 'published' ? 'Unpublish' : 'Publish'}
            </Button>
          </Stack>

          <Stack
            direction="row"
            useFlexGap
            flexWrap="wrap"
            sx={{ mt: 1.25, maxHeight: 230, overflowY: 'auto' }}
          >
            {teams.map((team) => (
              <FormControlLabel
                key={team.teamId}
                sx={{
                  width: { xs: '100%', sm: 'calc(50% - 8px)' },
                  m: 0,
                  px: 0.5,
                  borderRadius: `${radius.sm}px`,
                  bgcolor: selectedTeamIds.includes(team.teamId) ? tint(color.green, 0.06) : 'transparent',
                }}
                control={(
                  <Checkbox
                    size="small"
                    checked={selectedTeamIds.includes(team.teamId)}
                    onChange={() => toggleTeam(team.teamId)}
                  />
                )}
                label={(
                  <Box>
                    <Typography sx={{ color: color.text, fontSize: '0.76rem' }}>{team.teamName}</Typography>
                    <Typography sx={{ color: color.textFaint, fontSize: '0.62rem' }}>
                      {team.acceptedCount}/{team.memberCount} accepted
                    </Typography>
                  </Box>
                )}
              />
            ))}
            {!teams.length && (
              <Typography sx={{ color: color.textMuted, fontSize: '0.72rem' }}>
                No registered teams yet.
              </Typography>
            )}
          </Stack>
        </Box>
      )}

      {(createRound.isError || updateRound.isError) && (
        <Typography sx={{ mt: 1, color: color.red, fontSize: '0.72rem' }}>
          {(createRound.error || updateRound.error)?.message}
        </Typography>
      )}
    </Box>
  );
}
