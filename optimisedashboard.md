# Dashboard Redesign Plan — Student Dashboard (`/coding-club/dashboard`)

This is the post-login student dashboard that currently "looks pathetic". This doc
analyses every component in its render tree, the root causes, the chosen stack, and
the file-by-file rewrite.

---

## 1. Component tree (what renders the screen)

```
/coding-club/layout.jsx
  └─ ResponsiveLayout            (switches shell by viewport)
       ├─ DesktopLayout          (MUI; fixed Sidebar + scrollable <main>)
       │    └─ Sidebar           (MUI List, RotatingCube, random accent colour)
       └─ MobileLayout           (CircularNav overlay + <main>)
            └─ page.jsx          ← THE DASHBOARD (redesign target)
                 └─ StatCard     (inline helper)
```

The shell (ResponsiveLayout/DesktopLayout/Sidebar) **works** — the damage is all in
`page.jsx`.

---

## 2. Root-cause analysis

| # | Problem | Cause | Evidence |
|---|---------|-------|----------|
| 1 | Cards overlap the "Recent Activity" heading; dead space on the right | **MUI v7 Grid API break.** Code uses `<Grid item xs={12} sm={6} md={3}>`. MUI 7.3.6 removed `item` + breakpoint props; Grid now needs `size={{ xs:12, md:3 }}`. The old props are ignored → items shrink to content, don't fill the row, and `height:100%` cards overflow a collapsed container. | `page.jsx` lines 96-129; MUI installed = 7.3.6 |
| 2 | Glaring **white** "Recent Activity" box on a black page | App has **no MUI `ThemeProvider`/`CssBaseline`** (root `Providers` = only `SessionProvider`). `<Paper>` defaults to the light theme (white). The other Papers are manually dark; this one wasn't. | `page.jsx` line 134; `app/providers.jsx` |
| 3 | Fake numbers (12 / 5 / 3 / Gold) | Hardcoded mock; real fetch is commented out. Violates the "no hardcoded data" rule. | `page.jsx` lines 29-35 |
| 4 | Empty, low-value screen | Only a header + 4 stats + empty activity. No actions, no real data, huge unused canvas. | screenshot |
| 5 | Not genuinely responsive | Relies on the broken Grid for reflow. | — |

---

## 3. Stack decision — "Radix + MUI + shadcn" in this repo

**Goal:** the shadcn aesthetic (clean cards, soft borders, muted palette, crisp
focus rings) with accessible primitives.

**Constraint:** shadcn === Radix primitives + Tailwind utility classes. **Tailwind is
non-functional here** — v4 is installed but `globals.css` uses v3 `@tailwind`
directives and `content` omits `src/`, so no utilities generate. Enabling Tailwind v4
adds Preflight globally and risks all 45 MUI routes (this already caused one "CSS
corrupted" incident).

**Chosen combo (safe + premium):**
- **Radix primitives** — `Avatar`, `Progress`, `Separator`, `Tooltip`, `ScrollArea`.
  These are the exact primitives shadcn wraps, so the semantics/accessibility are
  identical.
- **MUI** — `Box`/`Typography` for layout only (keeps parity with the rest of the app).
- **Scoped CSS** — a single injected `<style>` block providing the shadcn look
  (tokens, card surfaces, hover, focus rings). Self-contained; cannot leak into other
  routes. Same pattern already shipped on the `/event` auth screens.
- **lucide-react** icons + **framer-motion** entrance animation.

> If we later want real shadcn/Tailwind, that's a separate, dedicated task: fix
> Tailwind v4 (`@import "tailwindcss"`, correct `content`, audit Preflight vs MUII).
> Tracked in `optimise-ui.md`.

---

## 4. Redesign spec

### Layout (CSS grid, not MUI Grid)
```
┌───────────────────────────────────────────────┐
│ Profile hero: avatar · name · enroll · course  │
│              · semester chip · role · session  │
├───────────────────────────────────────────────┤
│ Stat row  (grid auto-fit, minmax(200px,1fr))   │
│ [Events] [Quizzes] [Semester] [Role/Member]    │
├──────────────────────────┬────────────────────┤
│ Quick Actions (tiles)    │ Recent Activity      │
│ Quiz · Projects · Events │ (dark panel, real or │
│ Notes · Code             │  honest empty state) │
└──────────────────────────┴────────────────────┘
```
- Desktop: two-column (`grid-template-columns: 1fr 360px`).
- ≤900px: single column, stats become a horizontal scroll strip.
- All surfaces dark (`#111118` / `rgba(255,255,255,0.04)` borders). **No white.**

### Data — real only, no hardcoding
| Stat | Source | Fallback |
|------|--------|----------|
| Events Registered | `GET /api/events/register?email=${email}` → `data.length` | 0 |
| Quizzes Taken | `GET /api/quiz/results` filtered by `studentId === uuid/email` | 0 |
| Semester | `session.user.semester` | "—" |
| Role / Member | `session.user.role` | "Member" |
- Recent Activity is derived from the same registrations + results; if both empty,
  a styled empty state (icon + copy), never a white box.
- Every fetch is wrapped so a 500 (local DB offline) degrades to 0, never crashes.

### Accessibility / polish
- Radix `Tooltip` on stat icons (what each number means).
- Radix `Progress` for the 15-min session timer (re-uses session expiry).
- Radix `Separator` between sections; focus-visible rings on every interactive tile.
- Touch targets ≥ 44px; quick-action tiles are `<Link>`.

---

## 5. Files to write

| File | Role |
|------|------|
| `src/app/coding-club/dashboard/page.jsx` | Container: data fetching, layout, scoped styles, section composition |
| `src/components/dashboard/StatCard.jsx` | Radix Tooltip + scoped-CSS stat card |
| `src/components/dashboard/QuickActionTile.jsx` | `<Link>` tile with icon + hover |
| `src/components/dashboard/ActivityFeed.jsx` | Radix ScrollArea list + empty state |
| `src/components/dashboard/ProfileHero.jsx` | Radix Avatar + Progress (session) header |

New dependency installs: `@radix-ui/react-avatar`, `@radix-ui/react-progress`,
`@radix-ui/react-separator`, `@radix-ui/react-scroll-area` (added to package.json for
Netlify CI).

---

## 6. Acceptance checklist

- [ ] No MUI `Grid` `item`/`xs` usage in the dashboard (CSS grid instead)
- [ ] Zero white surfaces; consistent dark theme
- [ ] No hardcoded stats; values come from APIs/session with safe fallbacks
- [ ] Quick Actions fill the canvas and link to real routes
- [ ] Renders cleanly at 1280px and 375px
- [ ] `/coding-club/dashboard` returns 200 with no console errors
