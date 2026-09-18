'use client';

import { useEffect, useState } from 'react';

/**
 * Counting down to a server deadline on a laptop whose clock may be wrong.
 *
 * Every deadline in a paper or a live round is an absolute instant on the
 * server's clock. A laptop set five minutes fast would otherwise show a paper
 * as already expired, or give a team five phantom minutes it does not have.
 * Each response carries the server's time; the gap to the local clock is the
 * offset, and every countdown adds it.
 *
 * Display only. The server refuses a late answer on its own clock whatever this
 * shows, so a device that lies about the time gains nothing.
 */
export function useServerOffset(serverTime) {
    const [offset, setOffset] = useState(0);
    const stamp = serverTime ? new Date(serverTime).getTime() : null;

    useEffect(() => {
        if (stamp && Number.isFinite(stamp)) setOffset(stamp - Date.now());
    }, [stamp]);

    return offset;
}

/**
 * Milliseconds left until `endsAt`, never negative, ticking on its own.
 * Re-renders four times a second while running — often enough that the last
 * seconds read smoothly, and it stops once the deadline passes.
 */
export function useRemaining(endsAt, offset = 0, running = true) {
    const target = endsAt ? new Date(endsAt).getTime() : null;
    const compute = () => (target ? Math.max(0, target - (Date.now() + offset)) : 0);
    const [left, setLeft] = useState(compute);

    useEffect(() => {
        setLeft(compute());
        if (!running || !target) return undefined;
        const id = setInterval(() => {
            const next = compute();
            setLeft(next);
            if (next <= 0) clearInterval(id);
        }, 250);
        return () => clearInterval(id);
        // compute closes over target and offset, which are the dependencies.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [target, offset, running]);

    return left;
}

/** 29:07, or 0:09 in the last minute. Rounded up, so "0:01" lasts the whole final second. */
export function formatClock(ms) {
    const total = Math.ceil(ms / 1000);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
}

/** A wall-clock time for "submit before 10:25". */
export function formatTimeOfDay(date) {
    if (!date) return '';
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
