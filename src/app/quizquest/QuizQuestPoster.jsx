'use client';

/**
 * The Quiz QUEST poster: a countdown, the where and when, and a cube.
 *
 * Everything about the event lives in `EVENT` below, so moving the quiz is one
 * edit rather than a hunt through the markup.
 *
 * Two things worth knowing if you change it:
 *
 *   The countdown target carries an explicit `+05:30`. Written without one, a
 *   laptop set to another timezone would count down to 11:00 of *its* day, and
 *   the number on the projector would disagree with the number in the room.
 *
 *   Nothing time-dependent is rendered until the component has mounted. The
 *   server and the browser render at different instants, so a clock in the
 *   first paint is a hydration mismatch by construction — hence the dashes.
 */

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { color, tint } from '@/theme/tokens';

const EVENT = {
    title: 'Quiz QUEST',
    presenter: 'PIXEL',
    tagline: 'Think fast. Buzz faster.',
    startsAt: '2026-09-23T11:00:00+05:30',
    dateLabel: 'Tuesday, 23 September 2026',
    reportingLabel: '10:00 AM',
    startLabel: '11:00 AM',
    venueRooms: ['519', '510'],
    venueLabel: 'Amity University',
};

/** The five faces that spell the club's name as the cube turns, plus a sixth. */
const CUBE_FACES = ['P', 'I', 'X', 'E', 'L', '◼'];

export default function QuizQuestPoster() {
    const [remaining, setRemaining] = useState(null);

    useEffect(() => {
        const target = new Date(EVENT.startsAt).getTime();
        const tick = () => setRemaining(target - Date.now());

        tick();
        const timer = setInterval(tick, 1000);
        return () => clearInterval(timer);
    }, []);

    const live = remaining !== null && remaining <= 0;
    const parts = splitDuration(remaining);

    return (
        <main className="qq">
            <PosterStyles />

            <header className="qq-head">
                <div className="qq-brand">
                    <Image
                        src="/hwi-amity.png"
                        alt="HWI Amity"
                        width={56}
                        height={56}
                        className="qq-logo"
                        priority
                    />
                    <div>
                        <p className="qq-brand-name">HWI · Amity</p>
                        <p className="qq-brand-sub">presents</p>
                    </div>
                </div>

                <span className={`qq-pill ${live ? 'qq-pill--live' : ''}`}>
                    {live ? 'LIVE NOW' : 'STARTS SOON'}
                </span>
            </header>

            <section className="qq-body">
                <div className="qq-left">
                    <p className="qq-kicker">{EVENT.presenter} presents</p>
                    <h1 className="qq-title">{EVENT.title}</h1>
                    <p className="qq-tagline">{EVENT.tagline}</p>

                    <div className="qq-clock" aria-live="polite">
                        {live ? (
                            <p className="qq-live">The quiz has begun</p>
                        ) : (
                            <>
                                {parts && parts.days > 0 && (
                                    <Unit value={parts.days} label={parts.days === 1 ? 'day' : 'days'} />
                                )}
                                <Unit value={parts?.hours} label="hours" />
                                <Unit value={parts?.minutes} label="minutes" />
                                <Unit value={parts?.seconds} label="seconds" />
                            </>
                        )}
                    </div>

                    <dl className="qq-facts">
                        <Fact label="Date" value={EVENT.dateLabel} />
                        <Fact label="Reporting" value={EVENT.reportingLabel} />
                        <Fact label="Quiz begins" value={EVENT.startLabel} accent />
                        <Fact
                            label="Venue"
                            value={`Rooms ${EVENT.venueRooms.join(' & ')}`}
                            hint={EVENT.venueLabel}
                        />
                    </dl>
                </div>

                <div className="qq-right" aria-hidden="true">
                    <div className="qq-stage">
                        <div className="qq-cube">
                            {CUBE_FACES.map((glyph, i) => (
                                <div key={glyph} className={`qq-face qq-face--${i}`}>
                                    <span>{glyph}</span>
                                </div>
                            ))}
                        </div>
                        <div className="qq-shadow" />
                    </div>
                </div>
            </section>

            <footer className="qq-foot">
                <span>Rooms {EVENT.venueRooms.join(' · ')}</span>
                <span className="qq-dot">•</span>
                <span>Doors {EVENT.reportingLabel}</span>
                <span className="qq-dot">•</span>
                <span>Bring your team</span>
            </footer>
        </main>
    );
}

/** One slot of the countdown. Dashes until the clock is running. */
function Unit({ value, label }) {
    return (
        <div className="qq-unit">
            <span className="qq-num">{value === undefined || value === null ? '--' : pad(value)}</span>
            <span className="qq-unit-label">{label}</span>
        </div>
    );
}

function Fact({ label, value, hint, accent }) {
    return (
        <div className={`qq-fact ${accent ? 'qq-fact--accent' : ''}`}>
            <dt>{label}</dt>
            <dd>
                {value}
                {hint && <span className="qq-hint">{hint}</span>}
            </dd>
        </div>
    );
}

const pad = (n) => String(n).padStart(2, '0');

function splitDuration(ms) {
    if (ms === null || ms <= 0) return null;
    const total = Math.floor(ms / 1000);
    return {
        days: Math.floor(total / 86400),
        hours: Math.floor((total % 86400) / 3600),
        minutes: Math.floor((total % 3600) / 60),
        seconds: total % 60,
    };
}

/**
 * Written as one stylesheet rather than as `sx` props because the cube needs
 * real 3D transforms and six positioned faces, which read far better here than
 * as a nest of style objects. Colours come from the palette tokens, so the
 * poster cannot drift from the rest of the site.
 */
function PosterStyles() {
    return (
        <style>{`
      .qq {
        --brand: ${color.brand};
        --amber: ${color.amber};
        --text: ${color.text};
        --muted: ${color.textMuted};
        --faint: ${color.textFaint};
        --border: ${color.border};
        --glow: ${tint(color.brand, 0.35)};

        position: relative;
        min-height: 100vh;
        min-height: 100dvh;
        display: flex;
        flex-direction: column;
        gap: 24px;
        padding: max(24px, env(safe-area-inset-top, 0px)) clamp(20px, 5vw, 64px)
                 max(24px, env(safe-area-inset-bottom, 0px));
        color: var(--text);
        background:
          radial-gradient(1200px 600px at 75% 0%, ${tint(color.brand, 0.14)} 0%, transparent 60%),
          radial-gradient(900px 500px at 10% 100%, ${tint(color.violet, 0.12)} 0%, transparent 65%),
          ${color.bg};
        overflow: hidden;
      }

      /* The pixel grid the whole poster sits on. */
      .qq::before {
        content: '';
        position: absolute;
        inset: 0;
        background-image:
          linear-gradient(${tint(color.brand, 0.07)} 1px, transparent 1px),
          linear-gradient(90deg, ${tint(color.brand, 0.07)} 1px, transparent 1px);
        background-size: 44px 44px;
        mask-image: radial-gradient(circle at 50% 40%, #000 0%, transparent 78%);
        pointer-events: none;
      }

      .qq > * { position: relative; z-index: 1; }

      .qq-head {
        display: flex; align-items: center; justify-content: space-between;
        gap: 16px; flex-wrap: wrap;
      }
      .qq-brand { display: flex; align-items: center; gap: 12px; }
      .qq-logo {
        border-radius: 12px;
        background: #fff;
        padding: 4px;
        object-fit: contain;
      }
      .qq-brand-name { margin: 0; font-weight: 800; letter-spacing: 0.5px; font-size: 0.95rem; }
      .qq-brand-sub { margin: 0; color: var(--faint); font-size: 0.75rem; letter-spacing: 2px; text-transform: uppercase; }

      .qq-pill {
        padding: 7px 14px; border-radius: 999px;
        border: 1px solid var(--border);
        color: var(--muted);
        font-size: 0.7rem; font-weight: 800; letter-spacing: 2px;
      }
      .qq-pill--live {
        color: ${color.green};
        border-color: ${tint(color.green, 0.5)};
        background: ${tint(color.green, 0.12)};
        animation: qq-pulse 1.6s ease-in-out infinite;
      }

      .qq-body {
        flex: 1;
        display: grid;
        grid-template-columns: minmax(0, 1.25fr) minmax(0, 0.75fr);
        align-items: center;
        gap: clamp(24px, 5vw, 56px);
      }

      .qq-kicker {
        margin: 0 0 8px; color: var(--brand);
        font-size: 0.75rem; font-weight: 800; letter-spacing: 4px; text-transform: uppercase;
      }
      .qq-title {
        margin: 0;
        font-size: clamp(2.8rem, 9vw, 6rem);
        line-height: 0.95;
        font-weight: 900;
        letter-spacing: -2px;
        text-shadow: 0 0 40px var(--glow);
      }
      .qq-tagline { margin: 12px 0 0; color: var(--muted); font-size: clamp(1rem, 2vw, 1.25rem); }

      .qq-clock { display: flex; align-items: flex-end; gap: clamp(10px, 2vw, 18px); margin: clamp(24px, 4vw, 40px) 0; flex-wrap: wrap; }
      .qq-unit {
        min-width: 88px;
        padding: 12px 16px;
        border: 1px solid var(--border);
        border-radius: 16px;
        background: ${tint(color.brand, 0.06)};
        backdrop-filter: blur(6px);
      }
      .qq-num {
        display: block;
        font-size: clamp(2rem, 5vw, 3.2rem);
        font-weight: 900;
        font-variant-numeric: tabular-nums;
        line-height: 1;
        color: var(--text);
      }
      .qq-unit-label {
        display: block; margin-top: 6px;
        color: var(--faint); font-size: 0.7rem; letter-spacing: 2px; text-transform: uppercase;
      }
      .qq-live {
        margin: 0; font-size: clamp(1.6rem, 4vw, 2.4rem); font-weight: 900;
        color: ${color.green};
      }

      .qq-facts {
        margin: 0; display: grid; gap: 14px;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      }
      .qq-fact { border-left: 2px solid var(--border); padding-left: 14px; }
      .qq-fact--accent { border-left-color: var(--amber); }
      .qq-fact dt { color: var(--faint); font-size: 0.68rem; letter-spacing: 2px; text-transform: uppercase; }
      .qq-fact dd { margin: 4px 0 0; font-size: 1.05rem; font-weight: 700; }
      .qq-fact--accent dd { color: var(--amber); }
      .qq-hint { display: block; margin-top: 2px; color: var(--faint); font-size: 0.78rem; font-weight: 500; }

      /* ── The cube ──────────────────────────────────────────────────────── */

      .qq-right { display: flex; justify-content: center; }
      .qq-stage { perspective: 900px; display: grid; place-items: center; }

      .qq-cube {
        --size: clamp(120px, 18vw, 180px);
        position: relative;
        width: var(--size); height: var(--size);
        transform-style: preserve-3d;
        animation: qq-spin 16s linear infinite;
      }

      .qq-face {
        position: absolute; inset: 0;
        display: grid; place-items: center;
        border: 1px solid ${tint(color.brand, 0.55)};
        /* Nearly opaque on purpose. Translucent faces let the letters on the
           far side show through mirrored, and PIXEL stops being readable. */
        background:
          linear-gradient(${tint(color.brand, 0.14)} 1px, transparent 1px) 0 0 / 20px 20px,
          linear-gradient(90deg, ${tint(color.brand, 0.14)} 1px, transparent 1px) 0 0 / 20px 20px,
          linear-gradient(145deg, ${tint(color.brand, 0.16)}, ${tint(color.surface, 0.9)}),
          ${color.bg};
        box-shadow: inset 0 0 36px ${tint(color.brand, 0.22)};
      }
      .qq-face span {
        font-size: calc(var(--size) * 0.42);
        font-weight: 900;
        color: var(--brand);
        text-shadow: 0 0 18px var(--glow);
      }

      .qq-face--0 { transform: translateZ(calc(var(--size) / 2)); }
      .qq-face--1 { transform: rotateY(90deg)  translateZ(calc(var(--size) / 2)); }
      .qq-face--2 { transform: rotateY(180deg) translateZ(calc(var(--size) / 2)); }
      .qq-face--3 { transform: rotateY(-90deg) translateZ(calc(var(--size) / 2)); }
      .qq-face--4 { transform: rotateX(90deg)  translateZ(calc(var(--size) / 2)); }
      .qq-face--5 { transform: rotateX(-90deg) translateZ(calc(var(--size) / 2)); }

      .qq-shadow {
        width: clamp(120px, 18vw, 180px); height: 18px; margin-top: 36px;
        border-radius: 50%;
        background: radial-gradient(ellipse, ${tint(color.brand, 0.3)} 0%, transparent 70%);
        filter: blur(6px);
        animation: qq-breathe 16s ease-in-out infinite;
      }

      .qq-foot {
        display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
        color: var(--faint); font-size: 0.8rem; letter-spacing: 1px;
        border-top: 1px solid var(--border); padding-top: 16px;
      }
      .qq-dot { color: ${tint(color.brand, 0.6)}; }

      @keyframes qq-spin {
        from { transform: rotateX(-18deg) rotateY(0deg); }
        to   { transform: rotateX(-18deg) rotateY(360deg); }
      }
      @keyframes qq-breathe {
        0%, 100% { transform: scaleX(1);   opacity: 0.75; }
        50%      { transform: scaleX(0.8); opacity: 0.45; }
      }
      @keyframes qq-pulse {
        0%, 100% { opacity: 1; }
        50%      { opacity: 0.55; }
      }

      @media (max-width: 820px) {
        .qq-body { grid-template-columns: 1fr; }
        /* The cube leads on a phone: it is the thing that says "this is PIXEL"
           before any of the type is read. */
        .qq-right { order: -1; }
        .qq-unit { min-width: 72px; padding: 10px 12px; }
      }

      /* A poster that spins forever is exactly the kind of motion this setting
         exists to stop. The cube stays, at an angle that still reads as one. */
      @media (prefers-reduced-motion: reduce) {
        .qq-cube { animation: none; transform: rotateX(-18deg) rotateY(-28deg); }
        .qq-shadow, .qq-pill--live { animation: none; }
      }
    `}</style>
    );
}
