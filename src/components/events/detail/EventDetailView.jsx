'use client';

/**
 * Event detail — content-first information architecture.
 *
 * What changed and why:
 *
 *   - the poster no longer *is* the page. It sits beside the title block at a
 *     fixed height, because the event is the product and the poster is art
 *   - date / time / venue were three large bordered cards; they are now one
 *     compact metadata row, since that is about as much space as four short
 *     facts deserve
 *   - a lifecycle strip replaces the single ENDED / REGISTERED badge, so the
 *     participant can see where the event is and what comes next
 *   - sections are addressable (Overview, Schedule, Activities, Rules) rather
 *     than one undifferentiated column
 *   - the action panel is sticky and contextual — see ActionPanel
 *
 * Sections render only when their data exists, so an event with nothing filled
 * in reads as deliberate rather than broken.
 */

import { useMemo, useState } from 'react';
import { Box, Chip, Stack, Typography } from '@mui/material';
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import QuizRoundedIcon from '@mui/icons-material/QuizRounded';
import HowToVoteRoundedIcon from '@mui/icons-material/HowToVoteRounded';
import ExploreRoundedIcon from '@mui/icons-material/ExploreRounded';
import LiveTvRoundedIcon from '@mui/icons-material/LiveTvRounded';
import { color, radius, tint } from '@/theme/tokens';
import ActionPanel, { nextActionFor } from './ActionPanel';

const SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'activities', label: 'Activities' },
  { id: 'rules', label: 'Rules' },
];

const MODE_META = {
  quiz: {
    icon: QuizRoundedIcon,
    title: 'Quiz',
    blurb: 'Answer questions against the clock.',
  },
  voting: {
    icon: HowToVoteRoundedIcon,
    title: 'Audience voting',
    blurb: 'Vote during selected live rounds.',
  },
  'treasure-hunt': {
    icon: ExploreRoundedIcon,
    title: 'Treasure hunt',
    blurb: 'Find and scan checkpoints around the venue.',
  },
  custom: { icon: LiveTvRoundedIcon, title: 'Live activity', blurb: 'Run by the organisers on the day.' },
};

export default function EventDetailView({ event, registration, onNavigate }) {
  const [active, setActive] = useState('overview');

  const visible = useMemo(
    () =>
      SECTIONS.filter((s) => {
        if (s.id === 'overview') return true;
        if (s.id === 'schedule') return event.schedule.length > 0;
        if (s.id === 'activities') return event.modes.length > 0;
        if (s.id === 'rules') return event.rules.length > 0 || event.eligibility.length > 0;
        return false;
      }),
    [event],
  );

  const go = (id) => {
    setActive(id);
    document.getElementById(`sec-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <Box sx={{ pb: { xs: 11, lg: 4 } }}>
      <Hero event={event} />

      {/* Two columns from 1024px; the action panel stacks under the content
          below that, and collapses to a bottom bar on phones. */}
      <Box
        sx={{
          display: 'grid',
          gap: { xs: 3, lg: 4 },
          px: { xs: 2, md: 3 },
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0,1fr) 340px' },
          alignItems: 'start',
          maxWidth: 1400,
          mx: 'auto',
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Lifecycle event={event} registration={registration} />
          <SectionNav sections={visible} active={active} onSelect={go} />

          <Section id="overview" title="About this event">
            <Typography sx={{ color: color.textMuted, lineHeight: 1.75, fontSize: '0.95rem', whiteSpace: 'pre-line' }}>
              {event.description || 'The organisers have not added a description yet.'}
            </Typography>
            {event.organizer && <Organizer organizer={event.organizer} />}
          </Section>

          {event.schedule.length > 0 && (
            <Section id="schedule" title="Schedule">
              <Stack spacing={0}>
                {event.schedule.map((s, i) => (
                  <Stack
                    key={`${s.time}-${i}`}
                    direction="row"
                    spacing={2.5}
                    sx={{
                      py: 1.5,
                      borderBottom: i < event.schedule.length - 1 ? `1px solid ${color.border}` : 'none',
                    }}
                  >
                    <Typography
                      sx={{
                        color: color.text,
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        minWidth: 82,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {s.time || '—'}
                    </Typography>
                    <Typography sx={{ color: color.textMuted, fontSize: '0.9rem' }}>{s.label}</Typography>
                  </Stack>
                ))}
              </Stack>
            </Section>
          )}

          {event.modes.length > 0 && (
            <Section id="activities" title="Activities">
              <Typography sx={{ color: color.textFaint, fontSize: '0.85rem', mb: 2 }}>
                What runs during the event. Each one opens in the live lobby when the organisers start it.
              </Typography>
              <Stack spacing={1.5}>
                {event.modes.map((mode, i) => (
                  <ActivityCard key={`${mode.type}-${i}`} mode={mode} />
                ))}
              </Stack>
            </Section>
          )}

          {(event.rules.length > 0 || event.eligibility.length > 0) && (
            <Section id="rules" title="Rules and eligibility">
              {event.eligibility.length > 0 && (
                <Box sx={{ mb: event.rules.length ? 3 : 0 }}>
                  <Subheading>Who can take part</Subheading>
                  <Stack spacing={1}>
                    {event.eligibility.map((e) => (
                      <Typography key={e} sx={{ color: color.textMuted, fontSize: '0.9rem' }}>
                        · {e}
                      </Typography>
                    ))}
                  </Stack>
                </Box>
              )}

              {event.rules.length > 0 && (
                <>
                  <Subheading>Rules</Subheading>
                  <Stack spacing={1.5}>
                    {event.rules.map((r, i) => (
                      <Stack key={r} direction="row" spacing={2}>
                        <Typography
                          sx={{ color: color.textFaint, fontSize: '0.78rem', fontWeight: 700, minWidth: 20, pt: '2px' }}
                        >
                          {String(i + 1).padStart(2, '0')}
                        </Typography>
                        <Typography sx={{ color: color.textMuted, fontSize: '0.9rem', lineHeight: 1.65 }}>
                          {r}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </>
              )}
            </Section>
          )}

          {event.prizes.length > 0 && (
            <Section id="prizes" title="Prizes">
              <Stack spacing={1}>
                {event.prizes.map((p) => (
                  <Stack
                    key={p.place}
                    direction="row"
                    justifyContent="space-between"
                    sx={{ py: 1.25, borderBottom: `1px solid ${color.border}` }}
                  >
                    <Typography sx={{ color: color.text, fontSize: '0.9rem', fontWeight: 600 }}>{p.place}</Typography>
                    <Typography sx={{ color: color.textMuted, fontSize: '0.9rem' }}>{p.reward}</Typography>
                  </Stack>
                ))}
              </Stack>
            </Section>
          )}
        </Box>

        {/* Sticky on desktop; in normal flow underneath on tablet. */}
        <Box sx={{ position: { lg: 'sticky' }, top: { lg: 24 }, display: { xs: 'none', lg: 'block' } }}>
          <ActionPanel event={event} registration={registration} onNavigate={onNavigate} />
        </Box>

        <Box sx={{ display: { xs: 'none', md: 'block', lg: 'none' } }}>
          <ActionPanel event={event} registration={registration} onNavigate={onNavigate} />
        </Box>
      </Box>

      <MobileActionBar event={event} registration={registration} onNavigate={onNavigate} />
    </Box>
  );
}

/* ── hero ───────────────────────────────────────────────────────────────── */

function Hero({ event }) {
  return (
    <Box sx={{ px: { xs: 2, md: 3 }, pt: { xs: 2, md: 3 }, pb: 3, maxWidth: 1400, mx: 'auto' }}>
      <Box
        sx={{
          display: 'grid',
          gap: { xs: 2, sm: 3 },
          gridTemplateColumns: { xs: '1fr', sm: event.imageUrl ? '200px 1fr' : '1fr' },
          alignItems: 'center',
          p: { xs: 2, sm: 2.5 },
          borderRadius: `${radius.lg}px`,
          border: `1px solid ${color.border}`,
          bgcolor: color.surface,
        }}
      >
        {event.imageUrl && (
          // Fixed frame with object-fit: a portrait poster is contained beside
          // the text rather than stretched across the full width.
          <Box
            component="img"
            src={event.imageUrl}
            alt=""
            sx={{
              width: '100%',
              height: { xs: 180, sm: 200 },
              objectFit: 'cover',
              borderRadius: `${radius.md}px`,
              bgcolor: color.surface2,
              display: 'block',
            }}
          />
        )}

        <Box sx={{ minWidth: 0 }}>
          <StageBadge event={event} />

          <Typography
            sx={{
              color: color.text,
              fontWeight: 700,
              fontSize: { xs: '1.5rem', md: '1.9rem' },
              lineHeight: 1.2,
              mt: 1,
            }}
          >
            {event.title}
          </Typography>

          {event.organizer?.name && (
            <Typography sx={{ color: color.textMuted, fontSize: '0.9rem', mt: 0.5 }}>
              {event.organizer.name}
              {event.organizer.subtitle ? ` · ${event.organizer.subtitle}` : ''}
            </Typography>
          )}

          {event.tags.length > 0 && (
            <Typography sx={{ color: color.textFaint, fontSize: '0.82rem', mt: 0.75 }}>
              {event.tags.join(' · ')}
            </Typography>
          )}

          <MetaRow event={event} />
        </Box>
      </Box>
    </Box>
  );
}

/** Small icon + fact. Four short facts do not need three bordered cards. */
function MetaRow({ event }) {
  const items = [
    { icon: CalendarTodayRoundedIcon, value: formatDate(event.date) },
    { icon: ScheduleRoundedIcon, value: event.time },
    { icon: PlaceOutlinedIcon, value: event.location },
    event.participantCount > 0
      ? { icon: PeopleAltOutlinedIcon, value: `${event.participantCount} registered` }
      : null,
  ].filter(Boolean);

  return (
    <Stack direction="row" sx={{ mt: 2, flexWrap: 'wrap', gap: { xs: 1.5, sm: 3 } }}>
      {items.map(({ icon: Icon, value }) => (
        <Stack key={value} direction="row" spacing={0.75} alignItems="center">
          <Icon sx={{ fontSize: 15, color: color.textFaint }} />
          <Typography sx={{ color: color.textMuted, fontSize: '0.85rem' }}>{value}</Typography>
        </Stack>
      ))}
    </Stack>
  );
}

/** Live is the only state that gets a bright colour. */
function StageBadge({ event }) {
  const map = {
    live: { text: 'Live now', tone: color.green, pulse: true },
    today: { text: 'Today', tone: color.brand },
    open: { text: 'Registration open', tone: color.textMuted },
    closed: { text: 'Registration closed', tone: color.textFaint },
    ended: { text: 'Completed', tone: color.textFaint },
  };
  const s = map[event.stage] ?? map.open;

  return (
    <Chip
      size="small"
      label={s.text}
      sx={{
        height: 22,
        fontSize: '0.7rem',
        fontWeight: 600,
        color: s.tone,
        bgcolor: tint(s.tone, 0.1),
        border: `1px solid ${tint(s.tone, 0.24)}`,
        ...(s.pulse && {
          animation: 'stagePulse 2s ease-in-out infinite',
          '@keyframes stagePulse': { '50%': { opacity: 0.6 } },
          '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
        }),
      }}
    />
  );
}

/* ── lifecycle ──────────────────────────────────────────────────────────── */

/**
 * Registration → Check-in → Event → Results.
 *
 * Each step is done / current / upcoming, derived from the event stage and this
 * participant's own registration — so it reads differently for someone who has
 * not signed up than for someone already checked in.
 */
function Lifecycle({ event, registration }) {
  const steps = [
    { key: 'registration', label: 'Registration', done: Boolean(registration) },
    { key: 'checkin', label: 'Check-in', done: Boolean(registration?.hasEntered) },
    { key: 'event', label: 'Event', done: event.isPast, current: event.isLive },
    { key: 'results', label: 'Results', done: false },
  ];

  const currentIndex = steps.findIndex((s) => s.current) >= 0
    ? steps.findIndex((s) => s.current)
    : steps.findIndex((s) => !s.done);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        py: 2,
        mb: 1,
        overflowX: 'auto',
      }}
      className="pxe-scroll"
    >
      {steps.map((s, i) => {
        const state = s.done ? 'done' : i === currentIndex ? 'current' : 'todo';
        const tone =
          state === 'done' ? color.green : state === 'current' ? color.brand : color.textFaint;

        return (
          <Stack key={s.key} direction="row" alignItems="center" spacing={1} sx={{ flexShrink: 0 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: state === 'todo' ? 'transparent' : tone,
                border: `1.5px solid ${tone}`,
              }}
            />
            <Typography
              sx={{
                color: state === 'todo' ? color.textFaint : color.text,
                fontSize: '0.82rem',
                fontWeight: state === 'current' ? 600 : 400,
                whiteSpace: 'nowrap',
              }}
            >
              {s.label}
            </Typography>
            {i < steps.length - 1 && (
              <Box sx={{ width: { xs: 20, sm: 36 }, height: 1, bgcolor: color.border, mx: 0.5 }} />
            )}
          </Stack>
        );
      })}
    </Box>
  );
}

/* ── section plumbing ───────────────────────────────────────────────────── */

function SectionNav({ sections, active, onSelect }) {
  if (sections.length < 2) return null;

  return (
    <Box
      className="pxe-scroll"
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 2,
        display: 'flex',
        gap: 0.5,
        overflowX: 'auto',
        borderBottom: `1px solid ${color.border}`,
        bgcolor: color.bg,
      }}
    >
      {sections.map((s) => (
        <Box
          key={s.id}
          component="button"
          type="button"
          onClick={() => onSelect(s.id)}
          sx={{
            flexShrink: 0,
            border: 'none',
            bgcolor: 'transparent',
            font: 'inherit',
            cursor: 'pointer',
            px: 1.5,
            py: 1.25,
            fontSize: '0.86rem',
            fontWeight: active === s.id ? 600 : 400,
            color: active === s.id ? color.text : color.textMuted,
            borderBottom: `2px solid ${active === s.id ? color.brand : 'transparent'}`,
            '&:hover': { color: color.text },
          }}
        >
          {s.label}
        </Box>
      ))}
    </Box>
  );
}

function Section({ id, title, children }) {
  return (
    <Box id={`sec-${id}`} sx={{ pt: 3.5, scrollMarginTop: 56 }}>
      <Typography sx={{ color: color.text, fontWeight: 600, fontSize: '1.05rem', mb: 1.5 }}>
        {title}
      </Typography>
      {children}
    </Box>
  );
}

const Subheading = ({ children }) => (
  <Typography sx={{ color: color.textFaint, fontSize: '0.72rem', fontWeight: 600, mb: 1.25 }}>
    {String(children).toUpperCase()}
  </Typography>
);

function Organizer({ organizer }) {
  return (
    <Stack
      direction="row"
      spacing={2}
      alignItems="center"
      sx={{
        mt: 3,
        p: 2,
        borderRadius: `${radius.md}px`,
        border: `1px solid ${color.border}`,
        bgcolor: color.surface,
      }}
    >
      <Box
        sx={{
          width: 44,
          height: 44,
          flexShrink: 0,
          borderRadius: `${radius.sm}px`,
          bgcolor: tint(color.brand, 0.12),
          display: 'grid',
          placeItems: 'center',
          overflow: 'hidden',
        }}
      >
        {organizer.logoUrl ? (
          <Box component="img" src={organizer.logoUrl} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <Typography sx={{ color: color.brand, fontWeight: 700 }}>
            {organizer.name.slice(0, 1).toUpperCase()}
          </Typography>
        )}
      </Box>

      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ color: color.textFaint, fontSize: '0.7rem', fontWeight: 600 }}>
          ORGANISED BY
        </Typography>
        <Typography sx={{ color: color.text, fontWeight: 600, fontSize: '0.92rem' }}>
          {organizer.name}
        </Typography>
        {organizer.subtitle && (
          <Typography sx={{ color: color.textMuted, fontSize: '0.82rem' }}>{organizer.subtitle}</Typography>
        )}
      </Box>
    </Stack>
  );
}

/**
 * Activity detail comes from the mode's own config, which the live engine
 * already stores — so this describes what will actually run, not placeholder
 * copy. Anything the organiser left unset is simply omitted.
 */
function ActivityCard({ mode }) {
  const meta = MODE_META[mode.type] ?? MODE_META.custom;
  const Icon = meta.icon;
  const cfg = mode.config ?? {};

  const facts = [
    cfg.questionCount || cfg.totalQuestions ? ['Questions', cfg.questionCount ?? cfg.totalQuestions] : null,
    cfg.durationMinutes ? ['Duration', `${cfg.durationMinutes} min`] : null,
    cfg.timePerQuestion ? ['Per question', `${cfg.timePerQuestion}s`] : null,
    cfg.quizType ? ['Format', String(cfg.quizType).replace(/_/g, ' ')] : null,
    cfg.totalCheckpoints ? ['Checkpoints', cfg.totalCheckpoints] : null,
  ].filter(Boolean);

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: `${radius.md}px`,
        border: `1px solid ${color.border}`,
        bgcolor: color.surface,
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Icon sx={{ fontSize: 20, color: color.textMuted }} />
        <Typography sx={{ color: color.text, fontWeight: 600, fontSize: '0.95rem' }}>
          {meta.title}
        </Typography>
      </Stack>

      <Typography sx={{ color: color.textMuted, fontSize: '0.86rem', mt: 0.75, lineHeight: 1.6 }}>
        {meta.blurb}
      </Typography>

      {facts.length > 0 && (
        <Stack direction="row" sx={{ mt: 1.5, flexWrap: 'wrap', gap: 2.5 }}>
          {facts.map(([k, v]) => (
            <Box key={k}>
              <Typography sx={{ color: color.textFaint, fontSize: '0.68rem' }}>{k}</Typography>
              <Typography sx={{ color: color.text, fontSize: '0.84rem', fontWeight: 600 }}>{v}</Typography>
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
}

/* ── mobile ─────────────────────────────────────────────────────────────── */

function MobileActionBar({ event, registration, onNavigate }) {
  const action = nextActionFor({ event, registration });

  return (
    <Box
      sx={{
        display: { xs: 'flex', md: 'none' },
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10,
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        px: 2,
        py: 1.5,
        pb: 'calc(12px + env(safe-area-inset-bottom))',
        bgcolor: color.surface,
        borderTop: `1px solid ${color.border}`,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ color: action.tone, fontSize: '0.8rem', fontWeight: 600 }}>
          {action.label}
        </Typography>
        <Typography className="pxe-clamp-1" sx={{ color: color.textFaint, fontSize: '0.72rem' }}>
          {event.time} · {event.location}
        </Typography>
      </Box>

      {action.cta && (
        <Box
          component="button"
          type="button"
          onClick={() => onNavigate(action.cta.href)}
          className="pxe-tap"
          sx={{
            flexShrink: 0,
            border: 'none',
            font: 'inherit',
            minHeight: 44,
            px: 2.5,
            borderRadius: `${radius.md}px`,
            bgcolor: action.tone,
            color: color.bg,
            fontWeight: 700,
            fontSize: '0.88rem',
          }}
        >
          {action.cta.text}
        </Box>
      )}
    </Box>
  );
}

function formatDate(d) {
  if (!d) return 'Date TBA';
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}
