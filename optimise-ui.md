# UI Optimisation Plan — Quiz Raider X

Scope: the attendee/event experience (`src/app/event/**`) and the shared component
layer it depends on. This document records the concrete problems found in the current
code and the plan to fix them. It is a working doc, not marketing copy.

---

## 1. Current state (audit)

| Area | Finding | Impact |
|------|---------|--------|
| Styling stack | Tailwind v4 is installed but `globals.css` uses v3 directives (`@tailwind base`) and `content` paths omit `src/`. Utility classes never generate. | Any Tailwind-based component renders **unstyled**. The app survives only because it is MUI-based. |
| Component size | `event/dashboard/page.jsx` is a single **770-line** client component mixing data fetching, 6 pieces of modal state, and full layout. | Hard to reason about, re-renders the whole tree on any state change, impossible to reuse on mobile. |
| Event card | `PixelEventCard` is hard-coded to `width: 520px`. | Overflows every phone viewport (≤ 414px). Horizontal scroll / clipped content. |
| Theme tokens | Purple/violet palette (`#7c3aed`, `#a855f7`, `#c084fc`, `#6366f1`) is copy-pasted as hex literals across ~15 files. | No single source of truth; drift is already visible (some cards use cyan `#00FFCC`). |
| Feedback | Mix of inline MUI `<Alert>` and `react-hot-toast`. | Inconsistent UX; alerts shift layout, toasts don't. |
| Accessibility | Custom toggle buttons, no labels on several inputs, focus styles vary. | Keyboard/screen-reader users get an uneven experience. |

---

## 2. Principles we are optimising for

1. **Don't fight the stack.** The deployed app is MUI. Until Tailwind is fixed
   project-wide, new self-contained UI uses **Radix primitives + scoped CSS** (see
   the `event/page.jsx` auth screens) or MUI — never Tailwind utility classes.
2. **Separate logic from presentation.** Containers fetch and hold state; view
   components only render props. This is what makes a separate mobile UI possible
   without duplicating business logic.
3. **One token source.** Centralise the palette so a theme change is one edit.
4. **Feedback via toast, not layout-shifting alerts.**
5. **Accessibility for free** by leaning on Radix primitives (`Label`, `Tabs`,
   `Tooltip`, `Dialog`).

---

## 3. Concrete changes

### 3.1 Split the dashboard (done in this pass)
```
event/dashboard/
  page.jsx            ← container: all hooks, handlers, modal state, data
  DashboardDesktop.jsx ← desktop layout (presentational)
  DashboardMobile.jsx  ← mobile layout (presentational, separate UI)
```
The container renders `<DashboardDesktop/>` or `<DashboardMobile/>` based on
`useIsMobile()`, and owns the shared Registration + Pass dialogs so the complex
team-registration logic exists in exactly one place. See `planmobile.md`.

### 3.2 Fix the event card for small screens
`PixelEventCard` keeps its 520px desktop design. Mobile uses a dedicated compact
card defined in `DashboardMobile.jsx` (full-width, stacked, larger touch targets)
rather than scaling the desktop card down.

### 3.3 Design tokens (follow-up, not yet applied)
Introduce `src/theme/tokens.js`:
```js
export const purple = { 600:'#7c3aed', 500:'#a855f7', 400:'#c084fc', indigo:'#6366f1' };
export const surface = { base:'#0a0a0f', card:'rgba(15,15,25,0.95)' };
```
Then replace hex literals incrementally. Low risk, high consistency payoff.

### 3.4 Feedback consistency
Standardise on `react-hot-toast` (already a dependency). The auth screens were
migrated in the previous pass; the dashboard already uses toast for registration.
Remaining inline `<Alert>` usages should be removed as files are touched.

---

## 4. Performance notes

- The Registration dialog (~200 lines) only matters when open. It can be lazy-loaded
  with `next/dynamic` once extracted — deferred, low priority.
- `PixelEventCard` re-renders for every event on any dashboard state change because
  it's defined inline in the events map. Memoising (`React.memo`) is cheap once the
  container/view split lands.
- Animated background orbs use CSS keyframes (GPU-friendly) — keep as-is.

---

## 5. Out of scope (explicitly)

- Re-enabling Tailwind project-wide. That touches all 45 routes and MUI preflight
  interaction; it needs its own dedicated change, not a drive-by.
- Visual redesign of `PixelEventCard` desktop layout. It works; only mobile needs a
  variant.

---

## 6. Checklist

- [x] Container / Desktop / Mobile split for the event dashboard
- [x] `useIsMobile` hook (SSR-safe)
- [x] Dedicated mobile event card (no 520px overflow)
- [ ] `theme/tokens.js` and incremental hex replacement
- [ ] Lazy-load Registration dialog
- [ ] Remove remaining inline `<Alert>` usages
