/**
 * Route-handler guards — the server-side counterpart to `lib/apiClient.js`.
 *
 * The event routes each re-implemented (or skipped) the same four things:
 * validating an id before handing it to Mongoose, parsing a body that might not
 * be JSON, checking that the caller is allowed to write, and failing without
 * spraying `error.message` at the browser. All four live here once.
 *
 * Every helper returns a `NextResponse` or a small `{ ok }` result — no throwing
 * across the route boundary, so handlers stay linear and readable.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import jwt from 'jsonwebtoken';
import { authOptions } from '@/lib/auth';

const IS_PROD = process.env.NODE_ENV === 'production';

/** Roles allowed to mutate events and drive the live engine. */
const ADMIN_ROLES = new Set(['admin', 'student_admin']);

/** A Mongo ObjectId as it appears in a URL. */
const OBJECT_ID = /^[0-9a-fA-F]{24}$/;

export const isObjectId = (value) => typeof value === 'string' && OBJECT_ID.test(value);

/** Rough shape check — the point is to reject junk, not to police RFC 5322. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isEmail = (value) => typeof value === 'string' && EMAIL.test(value.trim());

// ── Responses ────────────────────────────────────────────────────────────────

export const badRequest = (error, extra = {}) => NextResponse.json({ error, ...extra }, { status: 400 });
export const unauthorized = (error = 'Sign in to continue.') => NextResponse.json({ error }, { status: 401 });
export const forbidden = (error = 'You do not have permission to do that.') => NextResponse.json({ error }, { status: 403 });
export const notFound = (error = 'Not found') => NextResponse.json({ error }, { status: 404 });
export const conflict = (error, extra = {}) => NextResponse.json({ error, ...extra }, { status: 409 });

/**
 * The one 500. Logs the real error server-side; the client gets a sentence it
 * can show a student. Detail is echoed in development only — a stack trace or a
 * Mongo error string is not something a participant should ever read.
 */
export function serverError(error, context = 'request') {
  console.error(`[api:${context}]`, error);
  return NextResponse.json(
    {
      error: 'Something broke on our side. Please try again shortly.',
      ...(IS_PROD ? {} : { detail: error?.message }),
    },
    { status: 500 },
  );
}

// ── Input ────────────────────────────────────────────────────────────────────

/**
 * A malformed body used to throw and surface as a 500. Now it is a 400.
 * @returns {Promise<{ ok: true, data: any } | { ok: false, response: NextResponse }>}
 */
export async function readJson(req) {
  try {
    const data = await req.json();
    if (!data || typeof data !== 'object') {
      return { ok: false, response: badRequest('Expected a JSON object body.') };
    }
    return { ok: true, data };
  } catch {
    return { ok: false, response: badRequest('Request body was not valid JSON.') };
  }
}

/**
 * Guard an id before it reaches Mongoose.
 *
 * Without this, `/api/events/not-an-id` throws a CastError that the catch block
 * reports as a 500 — so a typo in a URL reads as "the server is down".
 * @returns {NextResponse|null} a 400 to return, or null when the id is fine.
 */
export function invalidIdResponse(value, label = 'id') {
  if (isObjectId(value)) return null;
  return badRequest(`Invalid ${label}.`);
}

// ── Authorisation ────────────────────────────────────────────────────────────

/**
 * Admin identity, from either client.
 *
 * The web console authenticates with a NextAuth cookie; the organiser's mobile
 * app carries the Bearer token minted by `/api/flutter/auth/login`. Both are
 * accepted, and both resolve to a named actor so mode changes are attributable
 * (they used to be logged as the literal string 'admin').
 *
 * @returns {Promise<{ ok: true, actor: {id: string, email: string, name: string, via: string} }
 *                 | { ok: false, response: NextResponse }>}
 */
export async function requireAdmin(req) {
  const session = await getServerSession(authOptions).catch(() => null);

  if (session?.user) {
    if (!ADMIN_ROLES.has(session.user.role)) return { ok: false, response: forbidden() };
    return {
      ok: true,
      actor: {
        id: session.user.id ?? session.user.email ?? 'unknown',
        email: session.user.email ?? '',
        name: session.user.name ?? 'Admin',
        via: 'session',
      },
    };
  }

  const bearer = readBearer(req);
  if (bearer) {
    const claims = verifyToken(bearer);
    if (!claims) return { ok: false, response: unauthorized('Your session expired. Sign in again.') };
    if (!ADMIN_ROLES.has(claims.role)) return { ok: false, response: forbidden() };
    return {
      ok: true,
      actor: {
        id: claims.sub ?? claims.id ?? 'unknown',
        email: claims.email ?? '',
        name: claims.name ?? 'Admin',
        via: 'bearer',
      },
    };
  }

  return { ok: false, response: unauthorized() };
}

function readBearer(req) {
  const header = req?.headers?.get?.('authorization') ?? '';
  return header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : null;
}

function verifyToken(token) {
  const secret = process.env.NEXTAUTH_SECRET;
  // The dev fallback in the Flutter login route must never authorise a write in
  // production — an unset secret there would make every token forgeable.
  if (!secret) {
    if (IS_PROD) return null;
    return safeVerify(token, 'fallback-secret-for-dev');
  }
  return safeVerify(token, secret);
}

function safeVerify(token, secret) {
  try {
    return jwt.verify(token, secret);
  } catch {
    return null;
  }
}

// ── Event participant identity ───────────────────────────────────────────────
//
// The event portal used to have no server-verifiable identity at all:
// `/api/login` checked the password correctly, then returned a `sessionId` that
// was a random UUID stored nowhere and set no cookie. Every later request simply
// asserted an email in a query string or a JSON body, and the server believed
// it. That is why anyone could respond to anyone else's team invitation.
//
// These mint and verify a short-lived signed cookie at login, so a request can
// prove which participant it belongs to. It is deliberately narrow — full
// consolidation of the app's parallel auth systems is a separate job.

const EVENT_COOKIE = 'pxe_event_session';

function sessionSecret() {
  const secret = process.env.NEXTAUTH_SECRET;
  if (secret) return secret;
  if (IS_PROD) return null; // never sign with a known fallback in production
  return 'fallback-secret-for-dev';
}

/**
 * Attach a signed participant session to a response.
 * Lifetime matches SESSION.DURATION_MS so the cookie and the client's own
 * 15-minute session expire together.
 */
export function attachEventSession(response, user) {
  const secret = sessionSecret();
  if (!secret) {
    console.error('[api:auth] NEXTAUTH_SECRET is unset — event session not issued');
    return response;
  }

  const token = jwt.sign(
    { email: String(user.email).toLowerCase(), name: user.name, uuid: user.uuid },
    secret,
    { expiresIn: '15m' },
  );

  response.cookies.set(EVENT_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: IS_PROD,
    path: '/',
    maxAge: 15 * 60,
  });

  return response;
}

export function clearEventSession(response) {
  response.cookies.set(EVENT_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
  return response;
}

/**
 * The verified participant behind this request, or a 401.
 *
 * Accepts the event cookie, a NextAuth session, or the Flutter bearer token —
 * one participant identity regardless of which client is calling.
 *
 * @returns {Promise<{ ok: true, email: string, name: string }
 *                 | { ok: false, response: NextResponse }>}
 */
export async function requireEventUser(req) {
  const raw = req?.cookies?.get?.(EVENT_COOKIE)?.value;
  const secret = sessionSecret();

  if (raw && secret) {
    const claims = safeVerify(raw, secret);
    if (claims?.email) {
      return { ok: true, email: String(claims.email).toLowerCase(), name: claims.name ?? '' };
    }
  }

  const session = await getServerSession(authOptions).catch(() => null);
  if (session?.user?.email) {
    return { ok: true, email: session.user.email.toLowerCase(), name: session.user.name ?? '' };
  }

  const bearer = readBearer(req);
  if (bearer && secret) {
    const claims = safeVerify(bearer, secret);
    if (claims?.email) {
      return { ok: true, email: String(claims.email).toLowerCase(), name: claims.name ?? '' };
    }
  }

  return {
    ok: false,
    response: unauthorized('Your event session expired. Sign in again to continue.'),
  };
}
