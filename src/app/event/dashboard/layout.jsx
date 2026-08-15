'use client';

/**
 * The event shell — top bar, left navigation, content, right rail.
 *
 * Sections exist only where real data backs them. There is no Clubs nav
 * because there is no club model, and no feed composer, likes or comments
 * because nothing stores them. Everything rendered here comes from the events,
 * registrations and invitations the API actually returns.
 *
 *   < 900px   content only; navigation collapses to a bottom bar and the rail
 *             moves inline where each page decides it belongs
 *   >= 900px  nav + content
 *   >= 1200px nav + content + rail
 */

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Box, InputBase, Stack, Typography } from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import ExploreRoundedIcon from '@mui/icons-material/ExploreRounded';
import EventRoundedIcon from '@mui/icons-material/EventRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import MailRoundedIcon from '@mui/icons-material/MailRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import { color, radius, tint } from '@/theme/tokens';
import useEventUser from '@/hooks/useEventUser';
import Loading from '@/components/async/Loading';
import EventShellStyles from '@/components/events/EventShellStyles';
import RightRail from '@/components/events/shell/RightRail';
import { useInvitations } from '@/hooks/queries/useEventQueries';

const NAV = [
  { key: 'home', label: 'Home', href: '/event/dashboard', icon: HomeRoundedIcon },
  { key: 'explore', label: 'Explore', href: '/event/dashboard/explore', icon: ExploreRoundedIcon },
  { key: 'events', label: 'Events', href: '/event/dashboard/events', icon: EventRoundedIcon },
  { key: 'teams', label: 'Teams', href: '/event/dashboard/teams', icon: GroupsRoundedIcon },
  { key: 'invites', label: 'Invitations', href: '/event/dashboard/invitations', icon: MailRoundedIcon },
];

const NAV_W = 220;
const RAIL_W = 300;
const WIDE = '@media (min-width:1200px)';
const MID = '@media (min-width:900px)';
const NARROW = '@media (max-width:899px)';

export default function EventDashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, isAuthenticated, signOut } = useEventUser();

  const { data: invitations = [] } = useInvitations(user?.email);
  const [q, setQ] = useState('');

  // A decorative search bar is a lie. This routes to Explore with the term,
  // which is where the real filtering already lives.
  const search = (e) => {
    e.preventDefault();
    const term = q.trim();
    if (term) router.push(`/event/dashboard/explore?q=${encodeURIComponent(term)}`);
  };

  // The detail route carries its own sticky action panel, so the rail would be
  // a second competing column of actions.
  const isDetail = /^\/event\/dashboard\/[^/]+$/.test(pathname) && !NAV.some((n) => n.href === pathname);

  if (isLoading) return <Loading label="Loading your events" />;
  if (!isAuthenticated) return null; // useEventUser is already redirecting

  const initials = (user.name ?? '?')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <Box sx={{ bgcolor: color.bg, minHeight: '100dvh' }}>
      <EventShellStyles />

      {/* ── top bar ─────────────────────────────────────────────────────── */}
      <Box
        component="header"
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          height: 64,
          display: 'flex',
          alignItems: 'center',
          borderBottom: `1px solid ${color.border}`,
          bgcolor: 'rgba(9,10,14,0.94)',
          backdropFilter: 'blur(14px)',
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ width: '100%', maxWidth: 1450, mx: 'auto', px: { xs: 2, md: 3 } }}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={1.25}
            sx={{ cursor: 'pointer' }}
            onClick={() => router.push('/event/dashboard')}
          >
            <Box
              sx={{
                width: 32,
                height: 32,
                display: 'grid',
                placeItems: 'center',
                borderRadius: `${radius.sm}px`,
                bgcolor: color.brand,
                color: '#071014',
                fontWeight: 900,
                fontSize: '0.7rem',
              }}
            >
              PX
            </Box>
            <Typography sx={{ color: color.text, fontWeight: 800, letterSpacing: '-0.4px' }}>
              PIXEL{' '}
              <Box component="span" sx={{ color: color.textMuted, fontWeight: 600 }}>
                Events
              </Box>
            </Typography>
          </Stack>

          {/* The prototype anchors the whole bar on this. Without it the top
              bar is a logo and an avatar with a hole between them. */}
          <Box
            component="form"
            onSubmit={search}
            sx={{
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              gap: 1.25,
              flex: 1,
              maxWidth: 520,
              mx: 3,
              px: 1.75,
              py: 1.1,
              borderRadius: `${radius.md}px`,
              border: `1px solid ${color.border}`,
              bgcolor: color.surface,
              transition: 'border-color 160ms ease',
              '&:focus-within': { borderColor: tint(color.brand, 0.55) },
            }}
          >
            <SearchRoundedIcon sx={{ fontSize: 18, color: color.textFaint }} />
            <InputBase
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search events, teams and venues…"
              sx={{
                flex: 1,
                color: color.text,
                fontSize: '0.84rem',
                '& input::placeholder': { color: color.textFaint, opacity: 1 },
              }}
            />
          </Box>

          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Typography sx={{ color: color.textMuted, fontSize: '0.82rem', display: { xs: 'none', sm: 'block' } }}>
              {user.name}
            </Typography>
            <Box
              sx={{
                width: 34,
                height: 34,
                display: 'grid',
                placeItems: 'center',
                borderRadius: '50%',
                bgcolor: '#243039',
                color: color.brand,
                fontWeight: 800,
                fontSize: '0.68rem',
              }}
            >
              {initials}
            </Box>
            <Box
              component="button"
              type="button"
              onClick={signOut}
              aria-label="Sign out"
              className="pxe-tap"
              sx={{
                border: 'none',
                bgcolor: 'transparent',
                cursor: 'pointer',
                color: color.textFaint,
                display: 'grid',
                placeItems: 'center',
                p: 0.5,
                '&:hover': { color: color.text },
              }}
            >
              <LogoutRoundedIcon sx={{ fontSize: 19 }} />
            </Box>
          </Stack>
        </Stack>
      </Box>

      {/* ── body ────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          maxWidth: 1450,
          mx: 'auto',
          display: 'grid',
          gap: 3,
          px: { xs: 1.5, md: 3 },
          pt: 3,
          pb: { xs: 11, md: 8 },
          gridTemplateColumns: '1fr',
          [MID]: { gridTemplateColumns: `${NAV_W}px minmax(0,1fr)` },
          ...(!isDetail && {
            [WIDE]: { gridTemplateColumns: `${NAV_W}px minmax(0,1fr) ${RAIL_W}px` },
          }),
        }}
      >
        {/* left nav — desktop */}
        <Box
          component="nav"
          sx={{
            display: 'none',
            [MID]: { display: 'block', position: 'sticky', top: 88, height: 'max-content' },
          }}
        >
          <SectionLabel>MENU</SectionLabel>
          {NAV.map((item) => (
            <NavButton
              key={item.key}
              item={item}
              active={isActive(pathname, item.href)}
              badge={item.key === 'invites' ? invitations.length : 0}
              onClick={() => router.push(item.href)}
            />
          ))}
        </Box>

        <Box sx={{ minWidth: 0 }}>{children}</Box>

        {!isDetail && (
          <Box sx={{ display: 'none', [WIDE]: { display: 'block', position: 'sticky', top: 88, height: 'max-content' } }}>
            <RightRail user={user} />
          </Box>
        )}
      </Box>

      {/* ── bottom nav — mobile ─────────────────────────────────────────── */}
      <Box
        component="nav"
        className="pxe-nav"
        sx={{
          [NARROW]: {
            display: 'flex',
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 20,
            px: 0.5,
            pt: 0.5,
            pb: 'calc(6px + env(safe-area-inset-bottom))',
            bgcolor: '#0B0D11',
            borderTop: `1px solid ${color.border}`,
          },
          [MID]: { display: 'none' },
        }}
      >
        {NAV.map((item) => (
          <BottomNavItem
            key={item.key}
            item={item}
            active={isActive(pathname, item.href)}
            badge={item.key === 'invites' ? invitations.length : 0}
            onClick={() => router.push(item.href)}
          />
        ))}
      </Box>
    </Box>
  );
}

/** Home must match exactly; the rest match their subtree. */
function isActive(pathname, href) {
  if (href === '/event/dashboard') return pathname === href;
  return pathname.startsWith(href);
}

const SectionLabel = ({ children }) => (
  <Typography sx={{ px: 1.5, mb: 1, color: color.textFaint, fontSize: '0.62rem', fontWeight: 800, letterSpacing: 1.1 }}>
    {children}
  </Typography>
);

function NavButton({ item, active, badge, onClick }) {
  const Icon = item.icon;
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      sx={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
        border: 0,
        font: 'inherit',
        cursor: 'pointer',
        textAlign: 'left',
        px: 1.5,
        py: 1.25,
        my: 0.25,
        borderRadius: `${radius.md}px`,
        fontWeight: 650,
        fontSize: '0.88rem',
        color: active ? color.text : color.textMuted,
        bgcolor: active ? tint(color.brand, 0.1) : 'transparent',
        '&:hover': { bgcolor: active ? tint(color.brand, 0.14) : color.surface, color: color.text },
      }}
    >
      {/* The prototype marks state with a filled/hollow dot rather than a
          coloured icon — quieter, and it keeps every row on the same baseline. */}
      <Box
        component="span"
        sx={{
          width: 7,
          height: 7,
          flexShrink: 0,
          borderRadius: '50%',
          bgcolor: active ? color.brand : 'transparent',
          border: `1px solid ${active ? color.brand : color.textFaint}`,
          transition: 'background-color 160ms ease',
        }}
      />
      <Icon sx={{ fontSize: 17, color: active ? color.text : color.textFaint }} />
      <Box component="span" sx={{ flex: 1 }}>
        {item.label}
      </Box>
      {badge > 0 && <Badge count={badge} />}
    </Box>
  );
}

function BottomNavItem({ item, active, badge, onClick }) {
  const Icon = item.icon;
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      className="pxe-tap"
      sx={{
        flex: 1,
        border: 0,
        bgcolor: 'transparent',
        font: 'inherit',
        cursor: 'pointer',
        minHeight: 48,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0.25,
        color: active ? color.brand : color.textFaint,
        position: 'relative',
      }}
    >
      <Icon sx={{ fontSize: 19 }} />
      <Box component="span" sx={{ fontSize: '0.6rem', fontWeight: 600 }}>
        {item.label}
      </Box>
      {badge > 0 && (
        <Box sx={{ position: 'absolute', top: 4, right: '50%', mr: '-16px' }}>
          <Badge count={badge} />
        </Box>
      )}
    </Box>
  );
}

const Badge = ({ count }) => (
  <Box
    sx={{
      minWidth: 18,
      height: 18,
      px: 0.6,
      display: 'grid',
      placeItems: 'center',
      borderRadius: 999,
      bgcolor: tint(color.violet, 0.18),
      color: color.violet,
      fontSize: '0.62rem',
      fontWeight: 800,
    }}
  >
    {count}
  </Box>
);
