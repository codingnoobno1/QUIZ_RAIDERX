'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { motion } from 'framer-motion';
import {
    CalendarCheck, FileQuestion, FolderGit2, FlaskConical,
    Trophy, ShieldCheck, BookOpen, CalendarDays, StickyNote, Code2,
} from 'lucide-react';
import ProfileHero from '@/components/dashboard/ProfileHero';
import StatCard from '@/components/dashboard/StatCard';
import QuickActionTile from '@/components/dashboard/QuickActionTile';
import ActivityFeed from '@/components/dashboard/ActivityFeed';

const SESSION_MAX = 15 * 60; // seconds

const QUICK_ACTIONS = [
    { label: 'Take a Quiz',    desc: 'Browse faculty quizzes',    href: '/coding-club/quiz',    icon: BookOpen,    color: '#22d3ee' },
    { label: 'Your Projects',  desc: 'Submit & track projects',   href: '/coding-club/projects', icon: FolderGit2,  color: '#a855f7' },
    { label: 'Events',         desc: 'Upcoming club events',      href: '/coding-club/events',   icon: CalendarDays, color: '#f59e0b' },
    { label: 'Notes',          desc: 'Study materials',           href: '/coding-club/notes',    icon: StickyNote,  color: '#c084fc' },
    { label: 'Code Editor',    desc: 'Write & run code',          href: '/coding-club/code',     icon: Code2,       color: '#34d399' },
];

// Stagger children on initial mount
const FADE_UP = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } };
const container = (delay = 0) => ({
    initial: 'hidden', animate: 'show',
    variants: FADE_UP,
    transition: { duration: 0.35, delay },
});

export default function DashboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [timeLeft, setTimeLeft] = useState(SESSION_MAX);

    // Stats state
    const [stats, setStats] = useState({
        events: 0, quizzes: 0, projects: 0, research: 0, rank: null,
    });
    const [loadingStats, setLoadingStats] = useState(true);

    // Activity feed state
    const [activity, setActivity] = useState([]);
    const [loadingActivity, setLoadingActivity] = useState(true);

    // ── Session countdown ────────────────────────────────────────────────────
    useEffect(() => {
        if (status !== 'authenticated' || !session?.expires) return;
        const expiry = new Date(session.expires).getTime();
        const tick = () => setTimeLeft(Math.max(0, Math.floor((expiry - Date.now()) / 1000)));
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [status, session?.expires]);

    // ── Auth guard ───────────────────────────────────────────────────────────
    useEffect(() => {
        if (status === 'unauthenticated') router.replace('/login');
    }, [status, router]);

    // ── Data fetch (dedicated endpoints) ────────────────────────────────────
    const fetchDashboard = useCallback(async (user) => {
        const qs = new URLSearchParams({
            email: user.email || '',
            enrollment: user.enrollmentNumber || '',
            uuid: user.uuid || '',
            name: user.name || '',
        }).toString();

        // Fetch stats and activity in parallel
        const [statsRes, actRes] = await Promise.allSettled([
            fetch(`/api/user/stats?${qs}`),
            fetch(`/api/user/activity?${qs}`),
        ]);

        // Stats
        if (statsRes.status === 'fulfilled' && statsRes.value.ok) {
            try {
                const json = await statsRes.value.json();
                if (json.ok) setStats(json.data);
            } catch { /* ignore parse errors */ }
        }
        setLoadingStats(false);

        // Activity
        if (actRes.status === 'fulfilled' && actRes.value.ok) {
            try {
                const json = await actRes.value.json();
                if (json.ok) setActivity(json.data || []);
            } catch { /* ignore */ }
        }
        setLoadingActivity(false);
    }, []);

    useEffect(() => {
        const user = session?.user;
        if (user?.email) fetchDashboard(user);
    }, [session?.user, fetchDashboard]);

    // ── Loading screen ───────────────────────────────────────────────────────
    if (status === 'loading') {
        return (
            <div className="dsh-loading">
                <div className="dsh-spinner" />
                <DashboardStyles />
            </div>
        );
    }

    const user = session?.user || {};
    const sessionPct  = Math.round((timeLeft / SESSION_MAX) * 100);
    const sessionLabel = `${String(Math.floor(timeLeft / 60)).padStart(2, '0')}:${String(timeLeft % 60).padStart(2, '0')}`;

    const STAT_CARDS = [
        {
            icon: CalendarCheck,
            label: 'Events Registered',
            value: stats.events,
            color: '#22d3ee',
            hint: 'Events you have signed up for',
            loading: loadingStats,
        },
        {
            icon: FileQuestion,
            label: 'Quizzes Taken',
            value: stats.quizzes,
            color: '#a855f7',
            hint: 'Completed quiz attempts',
            loading: loadingStats,
        },
        {
            icon: FolderGit2,
            label: 'Projects',
            value: stats.projects,
            color: '#34d399',
            hint: 'Projects you have submitted',
            loading: loadingStats,
        },
        {
            icon: FlaskConical,
            label: 'Research',
            value: stats.research,
            color: '#f59e0b',
            hint: 'Research papers you have submitted',
            loading: loadingStats,
        },
        {
            icon: Trophy,
            label: 'Quiz Rank',
            value: stats.rank != null ? `#${stats.rank}` : '—',
            color: '#f59e0b',
            hint: 'Your leaderboard rank based on total quiz score',
            loading: loadingStats,
        },
        {
            icon: ShieldCheck,
            label: 'Role',
            value: user.role || 'Member',
            color: '#6366f1',
            hint: 'Your access level in the club',
            loading: false,
        },
    ];

    return (
        <Tooltip.Provider delayDuration={250}>
            <DashboardStyles />
            <div className="dsh-root">

                {/* Profile hero */}
                <motion.div {...container(0)}>
                    <ProfileHero
                        user={user}
                        sessionPct={sessionPct}
                        sessionLabel={sessionLabel}
                    />
                </motion.div>

                {/* Stats strip */}
                <motion.div className="dsh-stats" {...container(0.06)}>
                    {STAT_CARDS.map((s) => <StatCard key={s.label} {...s} />)}
                </motion.div>

                {/* Main two-column layout */}
                <div className="dsh-main">
                    <motion.section {...container(0.10)}>
                        <h2 className="dsh-section-title">Quick Actions</h2>
                        <div className="dsh-tiles">
                            {QUICK_ACTIONS.map((a) => (
                                <QuickActionTile key={a.href} {...a} />
                            ))}
                        </div>
                    </motion.section>

                    <motion.section {...container(0.14)} style={{ minWidth: 0 }}>
                        <ActivityFeed items={activity} loading={loadingActivity} />
                    </motion.section>
                </div>

            </div>
        </Tooltip.Provider>
    );
}

/* ─────────────────────────────────────────────────────────────────────────── *
 *  Scoped styles — no Tailwind / MUI dependency                               *
 * ─────────────────────────────────────────────────────────────────────────── */
function DashboardStyles() {
    return (
        <style>{`
      /* Root */
      .dsh-root { max-width: 1280px; margin: 0 auto; padding: 8px 16px 56px; color: #e7e7ea; }
      .dsh-loading { min-height: 70vh; display: flex; align-items: center; justify-content: center; }
      .dsh-spinner { width: 34px; height: 34px; border: 3px solid rgba(168,85,247,0.25); border-top-color: #a855f7; border-radius: 50%; animation: dshspin .7s linear infinite; }
      @keyframes dshspin { to { transform: rotate(360deg); } }

      /* Skeleton shimmer */
      .dsh-skel { display: inline-block; border-radius: 6px;
        background: linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,255,255,0.12), rgba(255,255,255,0.06));
        background-size: 200% 100%; animation: dshsk 1.2s ease-in-out infinite; }
      @keyframes dshsk { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

      /* ── Profile Hero ───────────────────────────────────────────────────── */
      .dsh-hero { position: relative; overflow: hidden; border-radius: 20px; padding: 24px 28px; margin-bottom: 20px;
        background: linear-gradient(135deg, rgba(34,211,238,.10), rgba(168,85,247,.10) 55%, rgba(17,17,24,.95));
        border: 1px solid rgba(255,255,255,.08); }
      .dsh-hero-glow { position: absolute; top: -60%; right: -10%; width: 380px; height: 380px; border-radius: 50%;
        background: radial-gradient(circle, rgba(168,85,247,.22), transparent 70%); filter: blur(50px); pointer-events: none; }
      .dsh-hero-main { position: relative; z-index: 1; display: flex; align-items: center; gap: 18px; flex-wrap: wrap; }
      .dsh-avatar { width: 64px; height: 64px; border-radius: 50%; overflow: hidden; display: inline-flex; flex-shrink: 0;
        box-shadow: 0 0 0 2px rgba(34,211,238,.35); }
      .dsh-avatar-img { width: 100%; height: 100%; object-fit: cover; }
      .dsh-avatar-fallback { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
        font-weight: 800; font-size: 1.3rem; color: #fff; background: linear-gradient(135deg, #22d3ee, #a855f7); }
      .dsh-hero-info { flex: 1; min-width: 200px; }
      .dsh-hero-eyebrow { margin: 0; font-size: .72rem; letter-spacing: .16em; text-transform: uppercase; color: rgba(255,255,255,.45); }
      .dsh-hero-name { margin: 2px 0 8px; font-size: 1.7rem; font-weight: 800; color: #fff; line-height: 1.1; }
      .dsh-hero-chips { display: flex; gap: 8px; flex-wrap: wrap; }
      .dsh-chip { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; font-size: .76rem; font-weight: 600;
        border-radius: 999px; color: rgba(255,255,255,.75); background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.1); }
      .dsh-chip--accent { color: #c084fc; background: rgba(168,85,247,.12); border-color: rgba(168,85,247,.3); text-transform: capitalize; }
      .dsh-hero-right { display: flex; flex-direction: column; align-items: flex-end; gap: 10px; }
      .dsh-session { display: inline-flex; align-items: center; gap: 6px; font-size: .85rem; font-weight: 700;
        color: #22d3ee; padding: 5px 11px; border-radius: 10px; background: rgba(34,211,238,.1); border: 1px solid rgba(34,211,238,.25); }
      .dsh-session--danger { color: #f87171; background: rgba(239,68,68,.1); border-color: rgba(239,68,68,.3); }
      .dsh-logout { display: inline-flex; align-items: center; gap: 6px; padding: 7px 13px; font-size: .82rem; font-weight: 600;
        color: rgba(255,255,255,.7); background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.12);
        border-radius: 10px; cursor: pointer; transition: all .2s; }
      .dsh-logout:hover { color: #fff; border-color: rgba(239,68,68,.4); background: rgba(239,68,68,.08); }
      .dsh-session-bar { position: relative; z-index: 1; margin-top: 18px; height: 4px; width: 100%;
        background: rgba(255,255,255,.08); border-radius: 999px; overflow: hidden; }
      .dsh-session-fill { height: 100%; border-radius: 999px; transition: width .5s ease; }

      /* ── Stats grid ─────────────────────────────────────────────────────── */
      .dsh-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 14px; margin-bottom: 22px; }
      .dsh-stat { display: flex; align-items: center; gap: 14px; padding: 18px; border-radius: 16px;
        background: #111118; border: 1px solid rgba(255,255,255,.07); cursor: default; outline: none;
        transition: transform .2s, border-color .2s, box-shadow .2s; }
      .dsh-stat:hover, .dsh-stat:focus-visible { transform: translateY(-3px);
        border-color: color-mix(in srgb, var(--accent) 45%, transparent);
        box-shadow: 0 10px 30px color-mix(in srgb, var(--accent) 15%, transparent); }
      .dsh-stat-icon { width: 42px; height: 42px; border-radius: 12px; display: flex; align-items: center;
        justify-content: center; border: 1px solid; flex-shrink: 0; }
      .dsh-stat-meta { display: flex; flex-direction: column; }
      .dsh-stat-value { font-size: 1.55rem; font-weight: 800; color: #fff; line-height: 1; }
      .dsh-stat-label { font-size: .78rem; color: rgba(255,255,255,.5); margin-top: 4px; }

      /* ── Main two-col ───────────────────────────────────────────────────── */
      .dsh-main { display: grid; grid-template-columns: 1fr 360px; gap: 18px; align-items: start; }
      .dsh-section-title { font-size: .8rem; font-weight: 700; text-transform: uppercase; letter-spacing: .08em;
        color: rgba(255,255,255,.5); margin: 0 0 12px; }

      /* ── Quick-action tiles ─────────────────────────────────────────────── */
      .dsh-tiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 12px; }
      .dsh-tile { display: flex; align-items: center; gap: 13px; padding: 15px; border-radius: 14px;
        background: #111118; border: 1px solid rgba(255,255,255,.07); text-decoration: none;
        transition: transform .18s, border-color .18s, background .18s; }
      .dsh-tile:hover { transform: translateY(-2px); background: #16161f;
        border-color: color-mix(in srgb, var(--accent) 40%, transparent); }
      .dsh-tile-icon { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center;
        justify-content: center; border: 1px solid; flex-shrink: 0; }
      .dsh-tile-body { display: flex; flex-direction: column; flex: 1; min-width: 0; }
      .dsh-tile-label { font-size: .92rem; font-weight: 700; color: #fff; }
      .dsh-tile-desc { font-size: .76rem; color: rgba(255,255,255,.45); }
      .dsh-tile-chev { color: rgba(255,255,255,.25); flex-shrink: 0; transition: color .18s, transform .18s; }
      .dsh-tile:hover .dsh-tile-chev { color: var(--accent); transform: translateX(2px); }

      /* ── Activity card ──────────────────────────────────────────────────── */
      .dsh-card { background: #111118; border: 1px solid rgba(255,255,255,.07); border-radius: 16px; overflow: hidden; }
      .dsh-card-head { display: flex; align-items: center; gap: 8px; padding: 14px 16px;
        font-size: .82rem; font-weight: 700; color: rgba(255,255,255,.7); border-bottom: 1px solid rgba(255,255,255,.06); }
      .dsh-scroll { height: 340px; }
      .dsh-scroll-vp { width: 100%; height: 100%; }
      .dsh-scrollbar { width: 5px; padding: 2px; }
      .dsh-thumb { background: rgba(255,255,255,.15); border-radius: 999px; }
      .dsh-act-list { display: flex; flex-direction: column; }
      .dsh-act-item { display: flex; align-items: flex-start; gap: 12px; padding: 12px 16px;
        border-bottom: 1px solid rgba(255,255,255,.04); transition: background .15s; }
      .dsh-act-item:hover { background: rgba(255,255,255,.025); }
      .dsh-act-icon { width: 30px; height: 30px; min-width: 30px; border-radius: 8px; display: flex;
        align-items: center; justify-content: center; background: rgba(255,255,255,.05); }
      .dsh-act-text { display: flex; flex-direction: column; min-width: 0; }
      .dsh-act-title { font-size: .86rem; color: #fff; font-weight: 600; }
      .dsh-act-meta { font-size: .74rem; color: rgba(255,255,255,.45); margin-top: 2px; }
      .dsh-empty { display: flex; flex-direction: column; align-items: center; justify-content: center;
        height: 100%; min-height: 280px; text-align: center; color: rgba(255,255,255,.3); padding: 20px; gap: 4px; }
      .dsh-empty p { margin: 8px 0 0; font-size: .9rem; color: rgba(255,255,255,.55); font-weight: 600; }
      .dsh-empty span { font-size: .78rem; }

      /* ── Tooltip ────────────────────────────────────────────────────────── */
      .dsh-tooltip { background: #1e1a2e; color: #e9d5ff; font-size: .76rem; padding: 6px 10px;
        border-radius: 8px; box-shadow: 0 6px 20px rgba(0,0,0,.4); z-index: 9999; }
      .dsh-tooltip-arrow { fill: #1e1a2e; }

      /* ── Responsive ─────────────────────────────────────────────────────── */
      @media (max-width: 900px) {
        .dsh-root { padding: 6px 12px 56px; }
        .dsh-main { grid-template-columns: 1fr; }
        .dsh-stats {
          grid-auto-flow: column;
          grid-auto-columns: minmax(160px, 1fr);
          grid-template-columns: none;
          overflow-x: auto;
          padding-bottom: 6px;
          scroll-snap-type: x mandatory;
        }
        .dsh-stat { scroll-snap-align: start; }
        .dsh-hero-right { flex-direction: row; align-items: center; width: 100%;
          justify-content: space-between; margin-top: 4px; }
      }
      @media (max-width: 480px) {
        .dsh-hero { padding: 18px 16px; border-radius: 16px; }
        .dsh-hero-name { font-size: 1.35rem; }
        .dsh-tiles { grid-template-columns: 1fr 1fr; }
      }
    `}</style>
    );
}
