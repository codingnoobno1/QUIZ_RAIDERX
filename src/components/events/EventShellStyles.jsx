'use client';

/**
 * Shell CSS for the event dashboard.
 *
 * Ships INSIDE the component tree via React 19's <style href precedence> hoist
 * + dedupe — the same pattern QuizCard/profilecard use — because
 * `src/app/globals.css` is not imported by any module in this app, so anything
 * defined there never reaches the browser.
 *
 * Everything here is either an iOS correction or a token that `sx` can't express
 * (env() insets, dvh, hover-capability queries).
 */

export default function EventShellStyles() {
  return (
    <style href="pixel-event-shell" precedence="high">{`
      .pxe-shell {
        /* 0 on every non-notched device; real values on iPhone because the root
           layout sets viewportFit: 'cover'. */
        --safe-top: env(safe-area-inset-top, 0px);
        --safe-bottom: env(safe-area-inset-bottom, 0px);
        --safe-left: env(safe-area-inset-left, 0px);
        --safe-right: env(safe-area-inset-right, 0px);
        --nav-h: 62px;
        --bar-h: 56px;

        padding-left: var(--safe-left);
        padding-right: var(--safe-right);
        -webkit-tap-highlight-color: transparent;
      }
      .pxe-shell * { -webkit-tap-highlight-color: transparent; }

      /* iOS Safari's toolbar collapses on scroll, so 100vh is TALLER than the
         visible viewport. dvh tracks it live; vh is the fallback. */
      .pxe-vh { min-height: 100vh; min-height: 100dvh; }
      .pxe-pane-h { height: calc(100vh - var(--bar-h)); height: calc(100dvh - var(--bar-h)); }

      .pxe-safe-t { padding-top: var(--safe-top); }

      .pxe-scroll {
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        overscroll-behavior-y: contain;
      }
      .pxe-scroll-x {
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        overscroll-behavior-x: contain;
        scrollbar-width: none;
      }
      .pxe-scroll-x::-webkit-scrollbar { display: none; }

      /* Clear the floating nav AND the home indicator. */
      .pxe-pad-nav { padding-bottom: calc(var(--nav-h) + var(--safe-bottom) + 20px); }
      .pxe-nav { bottom: calc(var(--safe-bottom) + 10px); height: var(--nav-h); }

      .pxe-clamp-1, .pxe-clamp-2, .pxe-clamp-3 {
        display: -webkit-box; -webkit-box-orient: vertical; overflow: hidden;
      }
      .pxe-clamp-1 { -webkit-line-clamp: 1; }
      .pxe-clamp-2 { -webkit-line-clamp: 2; }
      .pxe-clamp-3 { -webkit-line-clamp: 3; }

      .pxe-tap { min-height: 44px; touch-action: manipulation; }

      /* iOS zooms the page when a focused field is under 16px, and
         maximumScale:1 would leave the user stuck there. */
      @media (max-width: 1023px) {
        .pxe-shell input,
        .pxe-shell select,
        .pxe-shell textarea,
        .pxe-shell .MuiInputBase-input { font-size: 16px; }
      }

      /* Hover is not a thing on touch, and iOS fires a sticky :hover on first
         tap. Gate lift effects behind a real pointer. */
      @media (hover: hover) and (pointer: fine) {
        .pxe-lift { transition: transform 170ms ease, border-color 170ms ease, background-color 170ms ease; }
        .pxe-lift:hover { transform: translateY(-2px); }
      }

      @media (prefers-reduced-motion: reduce) {
        .pxe-shell *, .pxe-shell *::before, .pxe-shell *::after {
          animation-duration: 0.001ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.001ms !important;
        }
      }
    `}</style>
  );
}
