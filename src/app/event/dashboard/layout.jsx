'use client';

/**
 * The event dashboard shell.
 *
 *   < 1024px  single pane. The list IS the index screen; opening an event pushes
 *             a full-screen route over it. A floating bottom nav sits above the
 *             iOS home indicator. This is the mobile app's navigation model.
 *
 *   >= 1024px two panes. The list is a permanent sidebar and the child route
 *             renders beside it, so selecting an event never hides the list.
 *
 * Both breakpoints render the same components against the same query cache —
 * TanStack dedupes, so the shared list costs one request, not two.
 */

import { usePathname, useRouter } from 'next/navigation';
import { Box, IconButton, Stack, Typography } from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import EventRoundedIcon from '@mui/icons-material/EventRounded';
import ConfirmationNumberRoundedIcon from '@mui/icons-material/ConfirmationNumberRounded';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import { color, radius, tint } from '@/theme/tokens';
import { BREAKPOINT } from '@/config/constants';
import useEventUser from '@/hooks/useEventUser';
import Loading from '@/components/async/Loading';
import EventListPane from '@/components/events/EventListPane';
import EventShellStyles from '@/components/events/EventShellStyles';

const DESKTOP = `@media (min-width:${BREAKPOINT.DESKTOP_MIN}px)`;
const MOBILE = `@media (max-width:${BREAKPOINT.DESKTOP_MIN - 1}px)`;

export default function EventDashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, isAuthenticated, signOut } = useEventUser();

  const isIndex = pathname === '/event/dashboard';
  const selectedId = pathname.match(/^\/event\/dashboard\/([^/]+)/)?.[1] ?? null;

  if (isLoading || !isAuthenticated) {
    return (
      <>
        <EventShellStyles />
        <Loading label="Loading your events" fullScreen />
      </>
    );
  }

  return (
    <>
      <EventShellStyles />
      <Box
        className="pxe-shell pxe-vh"
        sx={{
          bgcolor: color.bg,
          display: 'grid',
          gridTemplateRows: 'auto 1fr',
          [DESKTOP]: { gridTemplateColumns: 'minmax(300px, 360px) 1fr' },
        }}
      >
        {/* ── Top bar ───────────────────────────────────────────────────── */}
        <Box
          className="pxe-safe-t"
          sx={{
            gridColumn: '1 / -1',
            position: 'sticky',
            top: 0,
            zIndex: 20,
            bgcolor: 'rgba(10,10,15,0.88)',
            backdropFilter: 'blur(14px)',
            borderBottom: `1px solid ${color.border}`,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ px: 1.5, height: 56 }}>
            {!isIndex && (
              <IconButton
                onClick={() => router.push('/event/dashboard')}
                aria-label="Back to events"
                sx={{ color: color.text, [DESKTOP]: { display: 'none' } }}
              >
                <ArrowBackRoundedIcon />
              </IconButton>
            )}

            <Box sx={{ minWidth: 0, flex: 1, pl: isIndex ? 1 : 0 }}>
              <Typography sx={{ color: color.text, fontWeight: 800, letterSpacing: 1.5, fontSize: '0.82rem' }}>
                PIXEL EVENTS
              </Typography>
              <Typography className="pxe-clamp-1" sx={{ color: color.textFaint, fontSize: '0.68rem' }}>
                {user.name}
              </Typography>
            </Box>

            <IconButton onClick={signOut} aria-label="Sign out" sx={{ color: color.textMuted }}>
              <LogoutRoundedIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Box>

        {/* ── Sidebar list (desktop only) ───────────────────────────────── */}
        <Box
          component="aside"
          className="pxe-pane-h"
          sx={{
            display: 'none',
            [DESKTOP]: {
              display: 'block',
              borderRight: `1px solid ${color.border}`,
              bgcolor: 'rgba(255,255,255,0.012)',
              position: 'sticky',
              top: 56,
            },
          }}
        >
          <EventListPane
            user={user}
            selectedId={selectedId}
            onSelect={(event) => router.push(`/event/dashboard/${event.id}`)}
          />
        </Box>

        {/* ── Content pane ──────────────────────────────────────────────── */}
        <Box
          component="main"
          className="pxe-scroll"
          sx={{
            minWidth: 0,
            minHeight: 0,
            [MOBILE]: { paddingBottom: 'calc(var(--nav-h) + var(--safe-bottom) + 20px)' },
            [DESKTOP]: { height: 'calc(100dvh - 56px)' },
          }}
        >
          {children}
        </Box>

        {/* ── Floating bottom nav (mobile only) ─────────────────────────── */}
        <Box
          component="nav"
          aria-label="Event sections"
          className="pxe-nav"
          sx={{
            position: 'fixed',
            left: 14,
            right: 14,
            zIndex: 30,
            borderRadius: `${radius.xl}px`,
            bgcolor: 'rgba(18,18,26,0.9)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${color.borderStrong}`,
            boxShadow: '0 10px 30px rgba(0,0,0,0.45)',
            [DESKTOP]: { display: 'none' },
          }}
        >
          <Stack direction="row" sx={{ height: '100%' }}>
            <NavItem
              icon={EventRoundedIcon}
              label="Events"
              active={isIndex}
              onClick={() => router.push('/event/dashboard')}
            />
            <NavItem
              icon={ConfirmationNumberRoundedIcon}
              label="Pass"
              active={pathname.endsWith('/pass')}
              disabled={!selectedId}
              onClick={() => selectedId && router.push(`/event/dashboard/${selectedId}/pass`)}
            />
            <NavItem
              icon={BoltRoundedIcon}
              label="Live"
              active={pathname.endsWith('/lobby')}
              disabled={!selectedId}
              onClick={() => selectedId && router.push(`/event/dashboard/${selectedId}/lobby`)}
            />
          </Stack>
        </Box>
      </Box>
    </>
  );
}

function NavItem({ icon: Icon, label, active, disabled, onClick }) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-current={active ? 'page' : undefined}
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0.3,
        border: 'none',
        bgcolor: 'transparent',
        font: 'inherit',
        cursor: disabled ? 'default' : 'pointer',
        touchAction: 'manipulation',
        opacity: disabled ? 0.3 : 1,
        color: active ? color.brand : color.textMuted,
        position: 'relative',
        '&:focus-visible': { outline: `2px solid ${color.brand}`, outlineOffset: -4, borderRadius: 14 },
        '&::before': active
          ? {
              content: '""',
              position: 'absolute',
              top: 6,
              width: 22,
              height: 2.5,
              borderRadius: 2,
              bgcolor: color.brand,
              boxShadow: `0 0 10px ${tint(color.brand, 0.7)}`,
            }
          : undefined,
      }}
    >
      <Icon sx={{ fontSize: 20 }} />
      <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: 0.3 }}>{label}</Typography>
    </Box>
  );
}
