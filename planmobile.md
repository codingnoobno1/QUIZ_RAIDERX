# Mobile UI Plan — Quiz Raider X Event Dashboard

Goal: a **separate, purpose-built mobile experience** for the attendee dashboard —
not a shrunk desktop layout. Desktop and mobile share data + logic but render
genuinely different UIs.

---

## 1. Strategy: separate UI, shared logic

```
                    ┌─────────────────────────┐
                    │  page.jsx (container)    │
                    │  • all hooks & state     │
                    │  • data fetching         │
                    │  • handlers              │
                    │  • Registration + Pass   │
                    │    dialogs (shared)      │
                    └───────────┬─────────────┘
                                │ useIsMobile()
                ┌───────────────┴───────────────┐
                ▼                                 ▼
     DashboardDesktop.jsx              DashboardMobile.jsx
     (grid, 520px cards,               (stacked full-width cards,
      side-by-side stats)               horizontal stat strip,
                                         sticky header + bottom bar)
```

Business logic (registration, invitations, pass generation) lives **only** in the
container. The two view components are pure presentation — they receive props and
call handlers. This is why we don't duplicate the 200-line team-registration flow.

---

## 2. Breakpoint & detection

- Single breakpoint: **`max-width: 768px` → mobile**.
- Hook: `src/hooks/useIsMobile.js`, SSR-safe (returns `false` on the server, syncs on
  mount via `window.matchMedia`, listens for resize/orientation change). This avoids
  hydration mismatch — the desktop tree renders first, then swaps if needed.

```js
const isMobile = useIsMobile(768);
```

---

## 3. Mobile layout decisions

| Section | Desktop | Mobile |
|---------|---------|--------|
| Header | Avatar + name + email + chip + logout button, spread across a row | Compact sticky bar: avatar + first name, logout as icon button |
| Stats | 4-up responsive `Grid` | Horizontal **scroll strip** of compact stat pills (no wrapping, thumb-swipe) |
| Invitations | 2-up grid of wide cards | Full-width stacked cards, Accept/Reject as equal-width buttons |
| Events | Centered grid of fixed **520px** `PixelEventCard`s | Full-width **compact mobile card** (own component) — image header, title, meta row, single full-width CTA |
| Navigation | none (single scroll) | Sticky **bottom action bar**: Events · Invites (badge) · Logout |
| Dialogs | MUI Dialog `maxWidth=md` | Same dialog, `fullScreen` on mobile for thumb reach |

### Touch & ergonomics
- Minimum touch target **44×44px** for all buttons/icon buttons.
- Primary CTA is full-width and bottom-anchored within each card.
- Bottom bar keeps key actions in the thumb zone.
- No hover-only affordances (hover doesn't exist on touch).

---

## 4. The mobile event card

`PixelEventCard` is `width: 520px` (overflows phones). Mobile gets a dedicated card:
- `width: 100%`, `border-radius: 20px`
- 120px image header with gradient scrim + date chip overlay
- Title (2-line clamp) + 1 meta row (date · venue)
- Status-aware CTA: `Register` → `Registering…` (spinner) → `View Pass`
- Larger tap target, no hover transform

It reuses the same props contract as `PixelEventCard`
(`event, isRegistered, onRegister, isRegistering, onViewPass`) so the container is
agnostic about which card renders.

---

## 5. Implementation phases

1. **Hook** — `useIsMobile` (SSR-safe). ✅
2. **Extract desktop view** — move current layout into `DashboardDesktop.jsx`
   unchanged (regression-safe). ✅
3. **Container** — `page.jsx` keeps logic + dialogs, switches views. ✅
4. **Mobile view** — `DashboardMobile.jsx` with the table above + compact card. ✅
5. **Verify** — `/event/dashboard` renders on desktop and at ≤768px; registration +
   pass dialogs work from both. (manual)

Future (not in this pass):
- Swipe-to-dismiss on the pass modal.
- Pull-to-refresh on the events list.
- Route-level `@media` splitting if more pages need separate mobile UIs — promote
  `useIsMobile` + the container pattern into a shared `ResponsiveSwitch` wrapper.

---

## 6. Why not pure CSS responsive?

Responsive CSS reflows one DOM. We want different *information density and
interaction model* (bottom nav, horizontal stat strip, full-screen dialogs, compact
card) — cleaner to express as two components than as a thicket of breakpoint
overrides on a 770-line tree. The shared-logic container keeps this DRY.
