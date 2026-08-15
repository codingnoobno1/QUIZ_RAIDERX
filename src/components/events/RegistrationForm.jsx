'use client';

/**
 * Registration — port of `screens/registration/registration_screen.dart`.
 *
 * A real step in the flow rather than a modal, so it gets its own URL, its own
 * back behaviour, and the full screen on a phone (thumb reach).
 */

import { useState } from 'react';
import {
  Box, Button, IconButton, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded';
import { color, radius, tint } from '@/theme/tokens';
import { TEAM } from '@/config/constants';
import { usePotentialTeammates } from '@/hooks/queries/useEventQueries';

const emptyMember = () => ({ name: '', email: '', enrollmentNumber: '', semester: '' });

export default function RegistrationForm({ event, user, onSubmit, isSubmitting, error }) {
  const [type, setType] = useState('solo');
  const [teamName, setTeamName] = useState('');
  const [members, setMembers] = useState([]);
  const [touched, setTouched] = useState(false);
  const [search, setSearch] = useState('');

  // The directory endpoint no longer returns every student on the platform, so
  // this is a search rather than a browse — it needs two characters to run.
  const teammates = usePotentialTeammates(event.id, search, type === 'team');
  const full = members.length >= TEAM.MAX_ADDITIONAL_MEMBERS;

  const problems = validate({ type, teamName, members });
  const canSubmit = problems.length === 0 && !isSubmitting;

  const addMember = (person = null) => {
    if (full) return;
    if (person && members.some((m) => m.email === person.email)) return;
    setMembers((prev) => [...prev, person ? { ...emptyMember(), ...person } : emptyMember()]);
  };

  const patchMember = (i, field, value) =>
    setMembers((prev) => prev.map((m, idx) => (idx === i ? { ...m, [field]: value } : m)));

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched(true);
    if (!canSubmit) return;
    onSubmit({ registrationType: type, teamName: teamName.trim(), members });
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ p: { xs: 2, md: 3 } }}>
      <ToggleButtonGroup
        value={type}
        exclusive
        fullWidth
        onChange={(_, v) => v && setType(v)}
        sx={{
          bgcolor: 'rgba(255,255,255,0.04)',
          p: 0.5,
          borderRadius: `${radius.md}px`,
          mb: 3,
          '& .MuiToggleButton-root': {
            border: 'none',
            minHeight: 44,
            borderRadius: `${radius.sm}px !important`,
            textTransform: 'none',
            fontWeight: 700,
            color: color.textMuted,
            '&.Mui-selected': { bgcolor: color.brand, color: color.bg, '&:hover': { bgcolor: color.brand } },
          },
        }}
      >
        <ToggleButton value="solo">Solo</ToggleButton>
        <ToggleButton value="team">Team</ToggleButton>
      </ToggleButtonGroup>

      {type === 'solo' ? (
        <Panel title="Confirm your details">
          <Detail label="Name" value={user.name} />
          <Detail label="Email" value={user.email} />
          <Detail label="Enrollment" value={user.enrollmentNumber} />
          <Detail label="Semester" value={user.semester} />
        </Panel>
      ) : (
        <Stack spacing={3}>
          <Box>
            <Label>Team name</Label>
            <TextField
              fullWidth
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g. Null Pointers"
              error={touched && !teamName.trim()}
              helperText={touched && !teamName.trim() ? 'A team needs a name' : ' '}
              sx={fieldSx}
            />
          </Box>

          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
              <Label sx={{ mb: 0 }}>
                Members ({members.length + 1}/{TEAM.MAX_SIZE})
              </Label>
              <Button
                size="small"
                startIcon={<AddRoundedIcon />}
                onClick={() => addMember()}
                disabled={full}
                sx={{ minHeight: 44, textTransform: 'none', fontWeight: 700, color: color.brand }}
              >
                Add
              </Button>
            </Stack>

            <Panel dense accent={color.brand}>
              <Typography sx={{ color: color.text, fontWeight: 700, fontSize: '0.9rem' }}>
                {user.name} <span style={{ color: color.textFaint, fontWeight: 400 }}>(you, team lead)</span>
              </Typography>
              <Typography sx={{ color: color.textFaint, fontSize: '0.75rem' }}>{user.email}</Typography>
            </Panel>

            <Stack spacing={1.5} sx={{ mt: 1.5 }}>
              {members.map((member, i) => (
                <Box
                  key={i}
                  sx={{
                    p: 2,
                    borderRadius: `${radius.md}px`,
                    bgcolor: 'rgba(255,255,255,0.02)',
                    border: `1px solid ${color.border}`,
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Typography sx={{ color: color.textFaint, fontSize: '0.65rem', fontWeight: 800, letterSpacing: 1 }}>
                      MEMBER {i + 2}
                    </Typography>
                    <IconButton
                      onClick={() => setMembers((p) => p.filter((_, idx) => idx !== i))}
                      className="pxe-tap"
                      aria-label={`Remove member ${i + 2}`}
                      sx={{ color: color.red }}
                    >
                      <DeleteOutlineRoundedIcon fontSize="small" />
                    </IconButton>
                  </Stack>

                  {/* Stacks on phones, two-up from 600px — no horizontal scroll. */}
                  <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
                    <TextField
                      size="small" placeholder="Name" value={member.name} sx={fieldSx}
                      error={touched && !member.name.trim()}
                      onChange={(e) => patchMember(i, 'name', e.target.value)}
                    />
                    <TextField
                      size="small" placeholder="Email" type="email" value={member.email} sx={fieldSx}
                      error={touched && !member.email.trim()}
                      onChange={(e) => patchMember(i, 'email', e.target.value)}
                    />
                    <TextField
                      size="small" placeholder="Enrollment" value={member.enrollmentNumber} sx={fieldSx}
                      onChange={(e) => patchMember(i, 'enrollmentNumber', e.target.value)}
                    />
                    <TextField
                      size="small" placeholder="Semester" value={member.semester} sx={fieldSx}
                      onChange={(e) => patchMember(i, 'semester', e.target.value)}
                    />
                  </Box>
                </Box>
              ))}
            </Stack>
          </Box>

          {!full && (
            <Box>
              <Label>Find a teammate</Label>
              <TextField
                fullWidth
                size="small"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email or enrollment"
                sx={fieldSx}
              />

              {search.trim().length >= 2 && teammates.isFetching && (
                <Typography sx={{ mt: 1, color: color.textFaint, fontSize: '.75rem' }}>
                  Searching…
                </Typography>
              )}
              {search.trim().length >= 2 && !teammates.isFetching && !teammates.data?.length && (
                <Typography sx={{ mt: 1, color: color.textFaint, fontSize: '.75rem' }}>
                  Nobody matches that, or they are already registered for this event.
                </Typography>
              )}

              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1, mt: 1.5 }}>
                {(teammates.data ?? []).map((p) => (
                  <Button
                    key={p.email}
                    size="small"
                    onClick={() => addMember(p)}
                    startIcon={<PersonAddAlt1RoundedIcon sx={{ fontSize: 15 }} />}
                    sx={{
                      minHeight: 40,
                      textTransform: 'none',
                      borderRadius: `${radius.sm}px`,
                      color: color.violet,
                      bgcolor: tint(color.violet, 0.1),
                      '&:hover': { bgcolor: tint(color.violet, 0.18) },
                    }}
                  >
                    {p.name || p.email}
                  </Button>
                ))}
              </Stack>
            </Box>
          )}
        </Stack>
      )}

      {touched && problems.length > 0 && (
        <Typography sx={{ mt: 2, color: color.amber, fontSize: '0.82rem' }}>{problems[0]}</Typography>
      )}
      {error && (
        <Typography sx={{ mt: 2, color: color.red, fontSize: '0.85rem' }}>{error.message}</Typography>
      )}

      <Button
        type="submit"
        fullWidth
        variant="contained"
        disableElevation
        disabled={isSubmitting}
        sx={{
          mt: 3,
          minHeight: 50,
          borderRadius: `${radius.md}px`,
          textTransform: 'none',
          fontWeight: 800,
          fontSize: '0.95rem',
          bgcolor: color.brand,
          color: color.bg,
          '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.08)', color: color.textFaint },
        }}
      >
        {isSubmitting ? 'Registering…' : `Confirm ${type === 'team' ? 'team' : 'solo'} registration`}
      </Button>
    </Box>
  );
}

function validate({ type, teamName, members }) {
  if (type !== 'team') return [];
  const out = [];
  if (!teamName.trim()) out.push('Give your team a name.');
  if (members.some((m) => !m.name.trim() || !m.email.trim())) {
    out.push('Every member needs at least a name and an email.');
  }
  const emails = members.map((m) => m.email.trim().toLowerCase()).filter(Boolean);
  if (new Set(emails).size !== emails.length) out.push('Two members have the same email.');
  return out;
}

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    bgcolor: 'rgba(255,255,255,0.03)',
    color: color.text,
    borderRadius: `${radius.sm}px`,
    '& fieldset': { borderColor: color.border },
    '&:hover fieldset': { borderColor: tint(color.brand, 0.4) },
    '&.Mui-focused fieldset': { borderColor: color.brand },
  },
  '& .MuiFormHelperText-root': { minHeight: 18, marginLeft: 0 },
};

// Uppercasing via CSS, not String(children) — children can be an array of nodes
// (`Members ({n}/{max})`), and String() on that joins with commas.
const Label = ({ children, sx }) => (
  <Typography
    sx={{
      color: color.brand,
      fontSize: '0.68rem',
      fontWeight: 800,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      mb: 1,
      ...sx,
    }}
  >
    {children}
  </Typography>
);

function Panel({ title, children, dense, accent = color.brand }) {
  return (
    <Box
      sx={{
        p: dense ? 1.75 : 2.5,
        borderRadius: `${radius.md}px`,
        bgcolor: tint(accent, 0.05),
        border: `1px solid ${tint(accent, 0.18)}`,
      }}
    >
      {title && (
        <Typography sx={{ color: color.text, fontWeight: 700, mb: 1.5 }}>{title}</Typography>
      )}
      {children}
    </Box>
  );
}

const Detail = ({ label, value }) => (
  <Stack direction="row" justifyContent="space-between" sx={{ py: 0.5, gap: 2 }}>
    <Typography sx={{ color: color.textFaint, fontSize: '0.82rem' }}>{label}</Typography>
    <Typography sx={{ color: color.text, fontSize: '0.82rem', fontWeight: 600, textAlign: 'right' }}>
      {value || '—'}
    </Typography>
  </Stack>
);
