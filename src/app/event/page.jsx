'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as Tabs from '@radix-ui/react-tabs';
import * as Tooltip from '@radix-ui/react-tooltip';
import { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { CalendarDays, LogIn, UserPlus } from 'lucide-react';
import EventLogin from './EventLogin';
import EventRegister from './EventRegister';
import useEventUserStore from '@/store/useEventUserStore';

export default function EventAuthPage() {
  const [tab, setTab] = useState('login');
  const router = useRouter();
  const hydrateUser = useEventUserStore((s) => s.hydrateUser);
  const user = useEventUserStore((s) => s.user);

  useEffect(() => {
    hydrateUser();
  }, []);

  useEffect(() => {
    if (user) router.replace('/event/dashboard');
  }, [user, router]);

  return (
    <Tooltip.Provider delayDuration={250}>
      <EventAuthStyles />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'rgba(20,16,35,0.95)',
            color: '#e9d5ff',
            border: '1px solid rgba(168,85,247,0.3)',
            backdropFilter: 'blur(10px)',
          },
        }}
      />

      <div className="evt-root">
        {/* Animated background orbs */}
        <div className="evt-orb evt-orb--a" />
        <div className="evt-orb evt-orb--b" />
        <div className="evt-grid-overlay" />

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="evt-header"
        >
          <div className="evt-title-row">
            <CalendarDays size={36} color="#a855f7" />
            <h1 className="evt-title">Event Portal</h1>
          </div>
          <p className="evt-subtitle">Quiz Raider X — Event Management</p>
          <span className="evt-badge">PIXEL</span>
        </motion.div>

        {/* Auth card with Radix Tabs */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="evt-card"
        >
          <Tabs.Root value={tab} onValueChange={setTab}>
            <Tabs.List className="evt-tablist" aria-label="Event authentication">
              <Tabs.Trigger value="login" className="evt-tab">
                <LogIn size={16} />
                Login
              </Tabs.Trigger>
              <Tabs.Trigger value="register" className="evt-tab">
                <UserPlus size={16} />
                Register
              </Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="login" className="evt-tabcontent">
              <EventLogin />
            </Tabs.Content>
            <Tabs.Content value="register" className="evt-tabcontent">
              <EventRegister onRegisterSuccess={() => setTab('login')} />
            </Tabs.Content>
          </Tabs.Root>
        </motion.div>

        <p className="evt-footer">
          {tab === 'login' ? "Don't have an account? " : 'Already registered? '}
          <button
            type="button"
            className="evt-link"
            onClick={() => setTab(tab === 'login' ? 'register' : 'login')}
          >
            {tab === 'login' ? 'Register here' : 'Login here'}
          </button>
        </p>
      </div>
    </Tooltip.Provider>
  );
}

/* Self-contained scoped styles — no Tailwind/MUI dependency */
function EventAuthStyles() {
  return (
    <style>{`
      .evt-root {
        min-height: 100vh;
        background: radial-gradient(ellipse at top, #1a0533 0%, #0a0a0f 50%, #000 100%);
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        padding: 24px; position: relative; overflow: hidden;
      }
      .evt-orb {
        position: absolute; border-radius: 50%; filter: blur(60px); pointer-events: none;
      }
      .evt-orb--a {
        width: 400px; height: 400px; top: -10%; left: -5%;
        background: radial-gradient(circle, rgba(124,58,237,0.18), transparent 70%);
        animation: evtPulse 6s ease-in-out infinite;
      }
      .evt-orb--b {
        width: 350px; height: 350px; bottom: -8%; right: -3%;
        background: radial-gradient(circle, rgba(99,102,241,0.14), transparent 70%);
        animation: evtPulse 8s ease-in-out infinite reverse;
      }
      .evt-grid-overlay {
        position: absolute; inset: 0; pointer-events: none; opacity: 0.4;
        background-image: linear-gradient(rgba(168,85,247,0.04) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(168,85,247,0.04) 1px, transparent 1px);
        background-size: 40px 40px;
        mask-image: radial-gradient(ellipse at center, black 30%, transparent 75%);
      }
      @keyframes evtPulse {
        0%, 100% { opacity: 0.5; transform: scale(1); }
        50% { opacity: 0.85; transform: scale(1.15); }
      }
      .evt-header { text-align: center; margin-bottom: 28px; position: relative; z-index: 1; }
      .evt-title-row { display: inline-flex; align-items: center; gap: 12px; }
      .evt-title {
        font-size: 2.4rem; font-weight: 800; margin: 0; letter-spacing: -0.02em;
        background: linear-gradient(135deg, #c084fc, #818cf8, #a855f7);
        -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
      }
      .evt-subtitle { color: rgba(255,255,255,0.5); margin: 6px 0 0; font-size: 0.95rem; }
      .evt-badge {
        display: inline-block; margin-top: 12px; padding: 3px 12px; font-size: 0.72rem;
        font-weight: 600; letter-spacing: 0.12em; color: #c084fc;
        background: rgba(168,85,247,0.15); border: 1px solid rgba(168,85,247,0.3); border-radius: 999px;
      }
      .evt-card {
        position: relative; z-index: 1; width: 100%; max-width: 440px;
        background: linear-gradient(145deg, rgba(124,58,237,0.12) 0%, rgba(99,102,241,0.08) 50%, rgba(15,15,25,0.95) 100%);
        backdrop-filter: blur(20px) saturate(160%); -webkit-backdrop-filter: blur(20px) saturate(160%);
        box-shadow: 0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05);
        border-radius: 20px; padding: 28px; border: 1px solid rgba(168,85,247,0.15);
      }
      .evt-tablist {
        display: flex; gap: 6px; padding: 5px; margin-bottom: 22px;
        background: rgba(0,0,0,0.25); border-radius: 14px; border: 1px solid rgba(168,85,247,0.1);
      }
      .evt-tab {
        flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 8px;
        padding: 10px; font-size: 0.92rem; font-weight: 600; cursor: pointer;
        background: transparent; border: none; border-radius: 10px;
        color: rgba(255,255,255,0.55); transition: all 0.25s ease;
      }
      .evt-tab:hover { color: rgba(255,255,255,0.85); }
      .evt-tab[data-state="active"] {
        color: #fff; background: linear-gradient(135deg, #7c3aed, #a855f7);
        box-shadow: 0 4px 18px rgba(124,58,237,0.45);
      }
      .evt-tabcontent { outline: none; }
      .evt-field { margin-bottom: 14px; }
      .evt-label {
        display: block; font-size: 0.78rem; font-weight: 600; letter-spacing: 0.02em;
        color: rgba(255,255,255,0.6); margin-bottom: 6px;
      }
      .evt-input-wrap { position: relative; display: flex; align-items: center; }
      .evt-input-icon { position: absolute; left: 12px; color: rgba(255,255,255,0.4); pointer-events: none; display: flex; }
      .evt-input {
        width: 100%; box-sizing: border-box; padding: 11px 12px 11px 38px;
        font-size: 0.95rem; color: #fff; background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.15); border-radius: 11px; outline: none;
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
      }
      .evt-input::placeholder { color: rgba(255,255,255,0.3); }
      .evt-input:hover { border-color: rgba(168,85,247,0.4); }
      .evt-input:focus { border-color: #a855f7; box-shadow: 0 0 0 3px rgba(168,85,247,0.15); }
      .evt-input--pad-right { padding-right: 42px; }
      .evt-eye {
        position: absolute; right: 10px; background: transparent; border: none; cursor: pointer;
        color: rgba(255,255,255,0.45); display: flex; padding: 4px; border-radius: 6px;
      }
      .evt-eye:hover { color: #a855f7; }
      .evt-row { display: flex; gap: 10px; }
      .evt-row > * { flex: 1; min-width: 0; }
      .evt-btn {
        width: 100%; margin-top: 18px; padding: 13px; font-size: 1rem; font-weight: 700; color: #fff;
        background: linear-gradient(135deg, #7c3aed, #a855f7); border: none; border-radius: 12px;
        cursor: pointer; box-shadow: 0 4px 20px rgba(124,58,237,0.4); transition: all 0.25s ease;
        display: inline-flex; align-items: center; justify-content: center; gap: 8px;
      }
      .evt-btn:hover:not(:disabled) {
        background: linear-gradient(135deg, #6d28d9, #9333ea);
        box-shadow: 0 6px 30px rgba(124,58,237,0.6); transform: translateY(-1px);
      }
      .evt-btn:disabled { opacity: 0.6; cursor: not-allowed; }
      .evt-form-title {
        text-align: center; font-size: 1.4rem; font-weight: 700; margin: 0 0 18px;
        background: linear-gradient(135deg, #a855f7, #6366f1);
        -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
      }
      .evt-footer { margin-top: 22px; color: rgba(255,255,255,0.35); font-size: 0.9rem; position: relative; z-index: 1; }
      .evt-link { background: none; border: none; color: #a855f7; cursor: pointer; font-weight: 600; font-size: 0.9rem; padding: 0; }
      .evt-link:hover { text-decoration: underline; }
      .evt-spin { width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.4); border-top-color: #fff; border-radius: 50%; animation: evtSpin 0.7s linear infinite; }
      @keyframes evtSpin { to { transform: rotate(360deg); } }
    `}</style>
  );
}
