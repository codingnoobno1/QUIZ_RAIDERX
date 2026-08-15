'use client';

import * as Avatar from '@radix-ui/react-avatar';
import * as Progress from '@radix-ui/react-progress';
import { signOut } from 'next-auth/react';
import { LogOut, Hash, GraduationCap, Layers, Clock } from 'lucide-react';

function initials(name = '') {
    return name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || 'U';
}

export default function ProfileHero({ user, sessionPct = 100, sessionLabel = '15:00' }) {
    const danger = sessionPct <= 14; // ~< 2 min of 15
    return (
        <div className="dsh-hero">
            <div className="dsh-hero-glow" />
            <div className="dsh-hero-main">
                <Avatar.Root className="dsh-avatar">
                    <Avatar.Image src={user?.image} alt={user?.name} className="dsh-avatar-img" />
                    <Avatar.Fallback className="dsh-avatar-fallback">{initials(user?.name)}</Avatar.Fallback>
                </Avatar.Root>

                <div className="dsh-hero-info">
                    <p className="dsh-hero-eyebrow">Welcome back</p>
                    <h1 className="dsh-hero-name">{user?.name || 'Student'}</h1>
                    <div className="dsh-hero-chips">
                        {user?.enrollmentNumber && <span className="dsh-chip"><Hash size={12} />{user.enrollmentNumber}</span>}
                        {user?.course && <span className="dsh-chip"><GraduationCap size={12} />{user.course}</span>}
                        {user?.semester && <span className="dsh-chip"><Layers size={12} />Sem {user.semester}</span>}
                        {user?.role && <span className="dsh-chip dsh-chip--accent">{user.role}</span>}
                    </div>
                </div>

                <div className="dsh-hero-right">
                    <div className={`dsh-session ${danger ? 'dsh-session--danger' : ''}`}>
                        <Clock size={13} />
                        <span>{sessionLabel}</span>
                    </div>
                    <button className="dsh-logout" onClick={() => signOut({ callbackUrl: '/login' })}>
                        <LogOut size={14} /> Sign out
                    </button>
                </div>
            </div>

            <Progress.Root className="dsh-session-bar" value={sessionPct}>
                <Progress.Indicator
                    className="dsh-session-fill"
                    style={{ width: `${sessionPct}%`, background: danger ? '#ef4444' : 'linear-gradient(90deg,#22d3ee,#a855f7)' }}
                />
            </Progress.Root>
        </div>
    );
}
