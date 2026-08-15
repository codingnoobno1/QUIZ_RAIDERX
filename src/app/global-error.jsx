'use client';

/**
 * Last-resort boundary.
 *
 * This one replaces the root layout, so there is no ThemeProvider and no MUI
 * here — plain elements and inline styles only. It exists so that a throw in
 * the layout itself still renders something a person can act on instead of a
 * blank white document.
 */

import { color, radius } from '@/theme/tokens';

export default function GlobalError({ error, reset }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: color.bg, color: color.text, fontFamily: 'system-ui, sans-serif' }}>
        <main
          role="alert"
          style={{
            minHeight: '100dvh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            padding: 24,
            textAlign: 'center',
          }}
        >
          <p style={{ margin: 0, letterSpacing: 2, fontSize: 12, fontWeight: 800, color: color.red }}>
            SOMETHING BROKE
          </p>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>The page couldn&apos;t load</h1>
          <p style={{ margin: 0, maxWidth: 420, lineHeight: 1.6, color: color.textMuted }}>
            This is on us, not on you. Reloading usually fixes it — if you were in a live event,
            your registration and any submitted answers are safe.
          </p>

          {error?.digest && (
            <code style={{ fontSize: 11, letterSpacing: 1, color: color.textFaint }}>
              REF {error.digest}
            </code>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                minHeight: 44,
                padding: '0 20px',
                border: 'none',
                borderRadius: radius.md,
                background: color.brand,
                color: color.bg,
                font: 'inherit',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
            <a
              href="/"
              style={{
                minHeight: 44,
                padding: '0 20px',
                display: 'inline-flex',
                alignItems: 'center',
                borderRadius: radius.md,
                border: `1px solid ${color.borderStrong}`,
                color: color.text,
                textDecoration: 'none',
                fontWeight: 700,
              }}
            >
              Go home
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
