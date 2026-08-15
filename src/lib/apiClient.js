/**
 * The single HTTP call site for the app.
 *
 * Ported from the Flutter app's `services/api_client.dart`. Everything that
 * used to be re-implemented (badly, or not at all) at each of the 67 `fetch`
 * call sites lives here exactly once:
 *
 *   - request timeout                    (Dio connectTimeout)
 *   - retry with backoff on transient    (RetryInterceptor)
 *   - 401 -> sign out, globally          (_onError)
 *   - typed errors with human messages   (ApiException)
 *
 * Pages must not import this directly — go through a repository.
 */

import { signOut } from 'next-auth/react';
import { API } from '@/config/constants';

/** Mirrors ApiExceptionType in api_client.dart. */
export const ApiErrorType = {
  TIMEOUT: 'timeout',
  UNAUTHORIZED: 'unauthorized',
  FORBIDDEN: 'forbidden',
  NOT_FOUND: 'notFound',
  RATE_LIMITED: 'rateLimited',
  SERVER_ERROR: 'serverError',
  BAD_REQUEST: 'badRequest',
  CANCELLED: 'cancelled',
  NETWORK: 'networkError',
  UNKNOWN: 'unknown',
};

const MESSAGES = {
  [ApiErrorType.TIMEOUT]: 'The server took too long to respond. Check your connection and try again.',
  [ApiErrorType.UNAUTHORIZED]: 'Your session expired. Please sign in again.',
  [ApiErrorType.FORBIDDEN]: "You don't have permission to do that.",
  [ApiErrorType.NOT_FOUND]: "We couldn't find that.",
  [ApiErrorType.RATE_LIMITED]: 'Too many requests. Give it a moment and try again.',
  [ApiErrorType.SERVER_ERROR]: 'Something broke on our side. Please try again shortly.',
  [ApiErrorType.BAD_REQUEST]: 'That request was not accepted.',
  [ApiErrorType.CANCELLED]: 'Request cancelled.',
  [ApiErrorType.NETWORK]: 'No connection. Check your network and try again.',
  [ApiErrorType.UNKNOWN]: 'Something unexpected happened.',
};

export class ApiError extends Error {
  constructor({ message, status = null, type = ApiErrorType.UNKNOWN }) {
    super(message || MESSAGES[type]);
    this.name = 'ApiError';
    this.status = status;
    this.type = type;
  }

  /** Prefer the server's own message when it sent one, else the typed default. */
  static async fromResponse(res) {
    const type = typeForStatus(res.status);
    let serverMessage = null;
    try {
      const body = await res.clone().json();
      serverMessage = body?.message || body?.error || null;
    } catch {
      // Non-JSON body — fall through to the typed default.
    }
    return new ApiError({ message: serverMessage || MESSAGES[type], status: res.status, type });
  }

  get isRetryable() {
    return this.type === ApiErrorType.SERVER_ERROR || this.type === ApiErrorType.NETWORK || this.type === ApiErrorType.TIMEOUT;
  }
}

function typeForStatus(status) {
  if (status === 401) return ApiErrorType.UNAUTHORIZED;
  if (status === 403) return ApiErrorType.FORBIDDEN;
  if (status === 404) return ApiErrorType.NOT_FOUND;
  if (status === 429) return ApiErrorType.RATE_LIMITED;
  if (status >= 500) return ApiErrorType.SERVER_ERROR;
  return ApiErrorType.BAD_REQUEST;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * @param {string} path      Same-origin API path, e.g. '/api/events'.
 * @param {object} [options]
 * @param {'GET'|'POST'|'PUT'|'PATCH'|'DELETE'} [options.method]
 * @param {object} [options.body]     Serialised as JSON.
 * @param {AbortSignal} [options.signal]  Caller cancellation (TanStack passes one).
 * @param {number} [options.retries]
 * @param {boolean} [options.signOutOn401]  Off for polling, so a blip can't log you out.
 * @returns {Promise<any>} Parsed JSON, or null for 204.
 */
export async function apiFetch(path, options = {}) {
  const {
    method = 'GET',
    body,
    signal,
    retries = API.MAX_RETRIES,
    signOutOn401 = true,
  } = options;

  for (let attempt = 0; ; attempt++) {
    // A fresh timeout controller per attempt — a retry gets a full budget.
    const timeoutCtrl = new AbortController();
    const timer = setTimeout(() => timeoutCtrl.abort(), API.TIMEOUT_MS);
    const onCallerAbort = () => timeoutCtrl.abort();
    signal?.addEventListener('abort', onCallerAbort, { once: true });

    try {
      const res = await fetch(path, {
        method,
        signal: timeoutCtrl.signal,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (res.status === 401) {
        if (signOutOn401 && typeof window !== 'undefined') {
          signOut({ callbackUrl: '/login' }).catch(() => {});
        }
        throw new ApiError({ status: 401, type: ApiErrorType.UNAUTHORIZED });
      }
      if (!res.ok) throw await ApiError.fromResponse(res);
      if (res.status === 204) return null;

      const text = await res.text();
      return text ? JSON.parse(text) : null;
    } catch (raw) {
      const err = normalise(raw, signal);

      // Caller cancelled (navigated away, query superseded) — never retry.
      if (err.type === ApiErrorType.CANCELLED) throw err;
      if (!err.isRetryable || attempt >= retries) throw err;

      await sleep(API.RETRY_DELAYS_MS[Math.min(attempt, API.RETRY_DELAYS_MS.length - 1)]);
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onCallerAbort);
    }
  }
}

function normalise(raw, callerSignal) {
  if (raw instanceof ApiError) return raw;

  if (raw?.name === 'AbortError') {
    // Distinguish "the caller cancelled" from "we timed out".
    return callerSignal?.aborted
      ? new ApiError({ type: ApiErrorType.CANCELLED })
      : new ApiError({ type: ApiErrorType.TIMEOUT });
  }

  // fetch() rejects with TypeError for DNS/offline/CORS failures.
  if (raw instanceof TypeError) return new ApiError({ type: ApiErrorType.NETWORK });

  return new ApiError({ message: raw?.message, type: ApiErrorType.UNKNOWN });
}

export const api = {
  get: (path, opts) => apiFetch(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => apiFetch(path, { ...opts, method: 'POST', body }),
  put: (path, body, opts) => apiFetch(path, { ...opts, method: 'PUT', body }),
  patch: (path, body, opts) => apiFetch(path, { ...opts, method: 'PATCH', body }),
  del: (path, opts) => apiFetch(path, { ...opts, method: 'DELETE' }),
};
