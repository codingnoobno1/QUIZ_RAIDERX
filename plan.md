# Quiz Raider X — Full Redesign & Optimisation Plan

**Status:** proposal · **Owner:** TBD · **Last updated:** 2026-05-28
**Prereqs already done:** MUI v7 Grid codemod (57 files), Tailwind v4 wired (theme +
utilities, no Preflight), Radix added for `/event` auth + student dashboard.

> This is the master plan. It is deliberately exhaustive: architecture, design system,
> route consolidation, page-by-page redesign, the full component library, every new API
> route, data-model and state changes, performance, a11y, security, cleanup, and a
> phased roadmap with a file-by-file matrix. Companion docs: `optimise-ui.md`,
> `optimisedashboard.md`, `planmobile.md`.

---

## 0. Table of contents
1. Executive summary
2. Current-state assessment (inventory + problems)
3. Goals, principles, non-goals
4. Target architecture (3 portals, one shell)
5. Design system (tokens, theme, MUI + Radix + Tailwind strategy)
6. Information architecture & route consolidation
7. Page-by-page redesign (every page)
8. Shared component library
9. API routes — existing (38) + new (proposed)
10. Data model
11. State management
12. Performance
13. Accessibility
14. Responsive / mobile
15. Security
16. Cleanup & deletions
17. Phased roadmap
18. File-by-file change matrix
19. Acceptance criteria & metrics
20. Complete feature inventory
21. Workflow analysis — fragmented → one seamless system
22. Card & grid system — design + optimisation

---

## 1. Executive summary

Quiz Raider X is a Next.js 15 app with **three personas** (Student, Event Attendee,
Admin/Master), **38 API routes**, **19 Mongoose models**, and ~38 pages. It is feature-
rich but **fragmented**: duplicate dashboards, duplicate quiz-creation flows, mixed
styling (MUI + ad-hoc Radix + now-working Tailwind), hardcoded dashboard data, white
surfaces on a dark theme, and several dead/placeholder routes.

This plan unifies the app around **one design system** and **three clean portal
shells**, removes duplication, replaces every hardcoded value with **real API data**
(adding the missing routes), and raises the UX bar (loading/empty/error states,
a11y, responsive, performance). Work is sequenced into **6 phases** so each lands
shippable value without a big-bang rewrite.

---

## 2. Current-state assessment

### 2.1 Route inventory (38 pages)
| Persona | Routes |
|---------|--------|
| Public | `/` (portfolio), `/our-team`, `/login`, `/event` (attendee auth) |
| Student | `/coding-club/{dashboard,quiz,projects,events,notes,notes/upload,profile,code,solutions,faculty,faculty/[facultyname]}` |
| Student (dupes) | `/[user]`, `/dashboard/[user]`, `/profile`, `/projects`, `/quizzes`, `/quizmode`, `/quizmode/[id]`, `/quiz-results`, `/createquiz`, `/quiztools/createquiz` |
| Attendee | `/event`, `/event/dashboard`, `/events` |
| Admin/Master | `/stud_admin`, `/admin_dashboard`, `/master`, `/master/dashboard` |
| Research | `/research-papers`, `/request-research`, `/submit-research`, `/submit-project` |
| Dead | `/test`, `/test/[hello]`, `/quizmode/%5Bid%5D` (URL-encoded dup) |

### 2.2 Models (19)
`User, base_user, faculty, facultycard, Event, EventRegistration, EventActivity,
EventVote, HuntProgress, Quiz, Question, Result, QuizSubmission, Section, Subject,
Research, ResearchRequest, PortfolioProject, project`.

### 2.3 Stores (5) — overlapping
`useUserStore, useEventUserStore, session_store, logintoken_store,
dashboard_welcomestore`. Three of these manage variants of "current user/session".

### 2.4 Problems (ranked)
| Sev | Problem | Where |
|-----|---------|-------|
| P0 | Hardcoded dashboard stats (`12/5/3/Gold`) | `coding-club/dashboard` (fixed in pass) |
| P0 | No MUI `ThemeProvider`/`CssBaseline` → white `<Paper>` on dark, no global theme | `app/providers.jsx` |
| P0 | Duplicate/competing dashboards & quiz-create flows | see 2.1 |
| P1 | 3 overlapping user stores; localStorage session (event) vs JWT (student) | `src/store/*` |
| P1 | Placeholder pages with no data (Notes, Solutions, Profile) | `coding-club/*` |
| P1 | Login API runs `connectDB()` before validation → 500 on bad input | `api/login` |
| P1 | Mixed styling languages, no token source | app-wide |
| P2 | Dead routes (`/test*`, encoded quizmode dup) | see 2.1 |
| P2 | `NEXTAUTH_SECRET` weak/default risk | env |
| P2 | 43→57 files used dead Grid API (fixed in pass) | app-wide |

---

## 3. Goals, principles, non-goals

### Goals
- One coherent **design system** across all three portals.
- **Zero hardcoded domain data** — everything from APIs/session.
- **Organised dashboards** per persona with real stats, activity, quick actions.
- **More API coverage** for the features that already have models but no endpoints.
- Measurably better UX: every async view has loading/empty/error; a11y AA; responsive.

### Principles
1. **MUI is the base component library**; Radix supplies primitives MUI lacks or that
   need better a11y (Tabs, Tooltip, ScrollArea, Avatar, Progress, Dialog); Tailwind
   utilities for spacing/layout polish. No Tailwind **Preflight** (protects MUI).
2. **Container/Presentation split** for every non-trivial page (logic vs view), which
   also enables per-device views (see `planmobile.md`).
3. **One token source** drives MUI theme + CSS variables.
4. **Delete before adding** — collapse duplicate routes first.
5. Ship in vertical slices; never leave a half-migrated page.

### Non-goals (this plan)
- Replacing MUI with shadcn wholesale (cost > benefit; we get the shadcn aesthetic via
  Radix + tokens). 
- Backend/runtime migration off MongoDB/NextAuth.
- Native mobile app (Flutter APIs already exist and stay).

---

## 4. Target architecture — three portals, one shell

```
app/
  (marketing)/         → /, /our-team           public, portfolio shell
  (auth)/              → /login, /event          centered auth shell
  (student)/           → /app/...                StudentShell (sidebar+topbar)
  (attendee)/          → /event/dashboard ...    AttendeeShell (purple)
  (admin)/             → /admin/...              AdminShell (master/stud_admin)
```
- Use **Next.js route groups** `(group)` to attach the right shell layout without
  affecting URLs.
- One `<AppThemeProvider>` (MUI dark theme + CssBaseline + Radix Tooltip.Provider +
  Toaster) wraps everything in `app/layout.jsx`.
- Each portal gets ONE canonical dashboard; the duplicates are redirected.

---

## 5. Design system

### 5.1 Tokens — `src/theme/tokens.js` (new)
```js
export const color = {
  bg:      '#0a0a0f',  surface: '#111118',  surface2: '#16161f',
  border:  'rgba(255,255,255,0.08)',
  text:    '#e7e7ea',  muted: 'rgba(255,255,255,0.5)',
  brand:   '#22d3ee',  // cyan (PIXEL)
  violet:  '#a855f7',  indigo: '#6366f1',  amber: '#f59e0b',
  green:   '#22c55e',  red: '#ef4444',
};
export const radius = { sm:8, md:12, lg:16, xl:20, pill:999 };
export const motion = { fast:.18, base:.25, slow:.4 };
```

### 5.2 MUI theme — `src/theme/index.js` (new)
- `createTheme({ palette:{ mode:'dark', ... from tokens }, shape:{ borderRadius:12 },
  components:{ MuiPaper/MuiButton/MuiTextField default dark overrides } })`.
- Wrap app in `<ThemeProvider>` + `<CssBaseline enableColorScheme/>`.
- **This single change kills the white-`<Paper>` class of bugs everywhere.**

### 5.3 CSS variables — extend `globals.css`
Mirror tokens as `:root { --bg; --surface; --brand; ... }` so Radix/Tailwind/scoped
CSS and MUI all reference one palette.

### 5.4 Component styling rules
- Layout & spacing → Tailwind utilities (now working) or MUI `sx`.
- Interactive primitives → Radix (Tabs/Tooltip/Dialog/ScrollArea/Avatar/Progress).
- Rich widgets → MUI (DataGrid-like tables, date pickers, selects).
- Brand surfaces (cards, hero) → tokenised scoped CSS classes (`.dsh-*`, `.evt-*`).

---

## 6. Information architecture & route consolidation

| Keep (canonical) | Merge / redirect from | Action |
|------------------|----------------------|--------|
| `/coding-club/dashboard` | `/[user]`, `/dashboard/[user]` | redirect dupes → canonical |
| `/coding-club/profile` | `/profile` | redirect |
| `/coding-club/projects` | `/projects` | redirect |
| `/coding-club/quiz` + `/quizmode/[id]` | `/quizzes` | consolidate listing→player |
| `/coding-club/quiztools/createquiz` | `/createquiz`, `/quiztools/createquiz` | one creator (faculty/admin only) |
| `/admin` (new group) | `/stud_admin`, `/admin_dashboard`, `/master`, `/master/dashboard` | unify under AdminShell |
| — | `/test`, `/test/[hello]`, `/quizmode/%5Bid%5D` | **delete** |

Student left-nav (final): Dashboard · Quizzes · Projects · Research · Events · Notes ·
Code · Profile. (Drop "Coding Solutions" unless backed by data; see §9 new routes.)

---

## 7. Page-by-page redesign

> Pattern for every page: `page.jsx` = container (data + state); `view/*` =
> presentational; shared modals lifted to container; loading/empty/error always.

### 7.1 Public
- **`/` Portfolio** — keep `PixelPortfolio`; audit `homeui/*` for the old Grid (done
  via codemod) and lazy-load heavy R3F sections; add real data to Projects/Research
  sections from `/api/portfolio-projects` + `/api/research`.
- **`/our-team`** — drive from `/api/team` (new) instead of static arrays.
- **`/login`, `/event`** — already Radix-ised for `/event`; bring `/login` to parity.

### 7.2 Student portal (`/coding-club/*`)
| Page | Redesign |
|------|----------|
| `dashboard` | DONE this pass: ProfileHero + StatCard + QuickActions + ActivityFeed (real data via new `/api/user/stats` + `/api/user/activity`). |
| `quiz` / `quizzes` | Faculty→batch→subject→quiz selection (Radix), then `/quizmode/[id]` player; statuses from `/api/fetchquizzes`. |
| `quizmode/[id]` | Full-screen player; timer (Radix Progress); autosave attempts to `/api/quiz/attempt/*`; results to `/quiz-results`. |
| `projects` | Tabs (All / Mine / Course / Internship / Research) via Radix Tabs; data from `/api/projects?email=`. |
| `research-papers`/`request-research`/`submit-research` | one Research hub; data from `/api/research*`. |
| `events` | reuse attendee event cards (responsive `PixelEventCard` + mobile card). |
| `notes` + `notes/upload` | real Notes: list from `/api/notes`, upload (admin) to `/api/notes` (POST). Public static notes allowed (per user). |
| `code` | Monaco editor + run via `/api/code/run` (new, sandboxed). |
| `profile` | view/edit via `/api/user/profile` (GET/PUT). |
| `faculty/[facultyname]` | faculty page from `/api/quizcardfetch` + faculty model. |

### 7.3 Attendee portal (`/event/*`)
- `event/dashboard` DONE this pass: container + DashboardDesktop + DashboardMobile +
  shared Registration/Pass dialogs. Follow-ups: lazy-load registration dialog; pull-to-
  refresh on mobile; swipe-to-dismiss pass.

### 7.4 Admin/Master (`/admin/*` new group)
- Unify `stud_admin` + `admin_dashboard` + `master` into one AdminShell with role-gated
  sections: Events (CRUD, live mode), Quizzes (create/report), Users, Research approvals,
  Notes management. Tables via MUI; actions via Radix Dialog.

---

## 8. Shared component library (`src/components/`)

Build / keep these as the reusable spine:
- `dashboard/` ✅ `StatCard`, `QuickActionTile`, `ActivityFeed`, `ProfileHero` (built).
- `ui/` (new shadcn-style on Radix): `Card`, `Button`, `Tabs`, `Dialog`, `Tooltip`,
  `Badge`, `Avatar`, `Progress`, `ScrollArea`, `Skeleton`, `EmptyState`, `Toast`.
- `shell/` (new): `StudentShell`, `AttendeeShell`, `AdminShell`, `Topbar`, `SideNav`,
  `MobileNav` (bottom bar), `ResponsiveSwitch` (wraps `useIsMobile`).
- `events/`: responsive `PixelEventCard` (fix 520px fixed width → fluid), `EventPass`,
  `RegistrationDialog` (extracted from event dashboard).
- `forms/`: `Field` (Radix Label + input), `PasswordField`, `FormError`.

Deletions: collapse `cards`, `code-spectrum`, `solutions`, `models` dirs after audit.

---

## 9. API routes — existing (38) + new

### 9.1 Existing (keep)
auth (`auth/[...nextauth]`, `auth/master/[...nextauth]`, `login`, `register`),
events (`events`, `events/[id]`, `events/access`, `events/invitations`,
`events/potential-participants`, `events/register`), quiz (`quiz/[id]`,
`quiz/attempt/start`, `quiz/attempt/submit`, `quiz/results`, `quizcardfetch`,
`quizfetch`, `quizfetch/[quizId]`, `fetchquizzes`), flutter (`flutter/*` ×7),
admin (`admin/quizzes`, `admin/event/[id]`, `admin-notes`), research (`research`,
`research/approval`, `research-requests`), misc (`genai`, `session`,
`welcomedashboard`, `portfolio-projects`, `submit_internship_project`,
`submit_minor_project`, `check_submission_status.js`).

### 9.2 New routes to add (fills the hardcoded/placeholder gaps)
| Method · Route | Purpose | Notes |
|---|---|---|
| `GET /api/user/stats` | real dashboard counters (quizzes, projects, events, rank) | aggregates Result + project + EventRegistration |
| `GET /api/user/activity` | unified recent-activity feed | merge quiz/result/event/research events |
| `GET·PUT /api/user/profile` | profile view/edit | backs `/coding-club/profile` |
| `GET·POST /api/notes` | notes list + upload | backs Notes page; static public allowed |
| `GET /api/projects?email=` | a user's projects across types | backs Projects tabs |
| `GET /api/research?email=` | a user's research items | Research hub |
| `GET /api/quiz/leaderboard` | rank/leaderboard | powers "Rank" stat |
| `POST /api/code/run` | sandboxed code execution | backs `/code` (judge0/skulpt server) |
| `GET /api/team` | team/members for `/our-team` | removes static array |
| `GET /api/events/mine?email=` | attendee's registrations (thin) | dashboard count w/o overfetch |
| `DELETE /api/events/register` | cancel registration | currently no cancel |
| `GET /api/health` | DB/up status | ops/monitoring |

### 9.3 API hardening (existing)
- `login`: validate body **before** `connectDB()` (stops 500-on-empty).
- Standardise envelope `{ ok, data, error }` and status codes across routes.
- Rename `check_submission_status.js` folder → `check-submission-status` (route typo).
- Add input validation (zod) at the boundary; never trust client payloads.

---

## 10. Data model
- Add indexes: `Result{studentId}`, `EventRegistration{email,eventId}`,
  `project{submittedBy.enrollment,type}`, `Quiz{batch,semester,subject,facultyId}`.
- Consolidate `User` vs `base_user` vs `faculty` — pick `User` as canonical; faculty as
  role/extension. Document the discriminator.
- Add `Activity` (optional) or derive feed at query time (start derived; add collection
  only if perf needs it).

---

## 11. State management
- Collapse 5 stores → 2: `useAuthStore` (current user/session, both student JWT &
  attendee localStorage behind one API) and `useUiStore` (sidebar, theme, toasts).
- Remove `logintoken_store`, `dashboard_welcomestore`, `session_store` after migration.
- Server data via fetch + lightweight cache (or add `@tanstack/react-query` for
  caching/retries/loading — recommended; one dependency, large UX win).

---

## 12. Performance
- Lazy-load heavy/rare UI: registration dialog, EventPass, Monaco, R3F portfolio
  sections (`next/dynamic`, `ssr:false`).
- `React.memo` list cards (`PixelEventCard`, `StatCard`).
- Image: use `next/image` for event/portfolio images; set sizes.
- Bundle: drop unused deps (`mongo-express`, `cors`, `csv-parser`, `odbc` if unused on
  client); audit `@chakra-ui` (is it used? remove if not — currently both Chakra and MUI
  are installed).
- Route-level code splitting falls out of the route groups.

---

## 13. Accessibility (target WCAG 2.1 AA)
- Radix primitives give focus management/ARIA for Tabs/Dialog/Tooltip.
- All inputs get `<Label>` (Radix) + visible focus ring; min 44px targets.
- Color contrast ≥ 4.5:1 (tokens chosen for dark-AA).
- Keyboard: traps in dialogs, escape to close, skip-to-content link in shells.
- `prefers-reduced-motion` disables framer entrance animations.

---

## 14. Responsive / mobile
- `ResponsiveSwitch` + `useIsMobile(768)` (built) for pages that warrant a separate UI
  (event dashboard done; student dashboard responsive via CSS grid).
- Mobile shells use bottom nav; dialogs go `fullScreen`; cards go fluid width (fix the
  `PixelEventCard` 520px). Details in `planmobile.md`.

---

## 15. Security
- Replace default `NEXTAUTH_SECRET`; document required env in `.env.example`.
- Validation-before-DB on all POST routes; rate-limit `login`/`register`/`genai`.
- Authorize admin routes by `role` (already in JWT) via middleware, not client checks.
- Don't ship quiz answer keys to the client in quiz payloads (grade server-side).
- Move secrets out of any committed `.env`; rotate the exposed Mongo/Supabase keys.

---

## 16. Cleanup & deletions
- Delete: `/test`, `/test/[hello]`, `/quizmode/%5Bid%5D`, stray `.rar` files,
  `src/components/models` (dupes), unused stores, unused deps (Chakra?).
- De-dupe routes per §6. Each deletion behind a redirect for one release, then remove.

---

## 17. Phased roadmap

| Phase | Theme | Deliverables | Exit criteria |
|------|-------|--------------|---------------|
| **0 (done)** | Stabilise | Grid codemod, Tailwind v4 works, Radix on `/event`, student dashboard rebuilt | build compiles; dashboard not "pathetic" |
| **1** | Foundation | `theme/` + ThemeProvider + CssBaseline; tokens; `ui/` primitives; kill white surfaces | no white-on-dark anywhere; one theme |
| **2** | Data truth | new routes §9.2 (stats, activity, profile, projects, notes); wire dashboards to real data | zero hardcoded domain data |
| **3** | IA cleanup | route groups + shells; redirect/del duplicates; delete dead routes | one canonical dashboard per persona |
| **4** | Feature depth | Quizzes player, Projects hub, Research hub, Notes, Code-run, Profile edit | each page functional w/ states |
| **5** | Admin | unified AdminShell; events/quizzes/users/research mgmt; role middleware | admin can run the whole loop |
| **6** | Polish | a11y pass, perf (lazy/memo/image), mobile separate-UIs, security hardening | Lighthouse ≥ 90; AA; no P0/P1 |

---

## 18. File-by-file change matrix (high-level)

| Area | Create | Modify | Delete |
|------|--------|--------|--------|
| Theme | `theme/tokens.js`, `theme/index.js` | `app/layout.jsx`, `app/providers.jsx`, `globals.css` | — |
| UI lib | `components/ui/*`, `components/shell/*`, `components/forms/*` | `Sidebar.jsx`→`shell/SideNav` | `components/models/*` |
| Student | `(student)` group layout | all `coding-club/*` pages | `/[user]`, `/dashboard/[user]`, `/profile`, `/projects` |
| Attendee | — | `event/dashboard/*` (follow-ups) | — |
| Admin | `(admin)` group + shell | `stud_admin`, `admin_dashboard`, `master*` | merge dupes |
| Quiz | — | `quizmode/[id]`, `quizzes`, creator | `/createquiz` or `/quiztools/createquiz` (keep one), `/quizmode/%5Bid%5D` |
| API | routes in §9.2 | `login`, rename `check_submission_status.js` | — |
| State | `useAuthStore`, `useUiStore` | consumers | 3 old stores |
| Cleanup | — | — | `/test*`, `.rar`, unused deps |

---

## 19. Acceptance criteria & metrics
- **Correctness:** no hardcoded domain data; every list view has loading/empty/error;
  one dashboard per persona; no dead routes.
- **Design:** single dark theme; zero white surfaces; consistent tokens; Radix a11y.
- **Perf:** Lighthouse Perf ≥ 90 desktop / ≥ 80 mobile; JS on dashboard < 250KB gzip;
  no layout shift (CLS < 0.1).
- **A11y:** axe: 0 critical; full keyboard path on auth + dashboards.
- **Build:** `next build` green on CI (Linux/Netlify); no MUI Grid `item` usages left.
- **Security:** non-default `NEXTAUTH_SECRET`; validation-before-DB; admin role-gated.

---

## 20. Complete feature inventory

Every capability currently in the codebase (built, partial, or model-only), grouped by
domain. Status: ✅ working · 🟡 partial/placeholder · 🔻 model exists, no UI · ⚪ planned.

### 20.1 Identity & access
| Feature | Entry | Status |
|---|---|---|
| Student auth (NextAuth JWT, `User`) | `/login`, `/` | ✅ |
| Attendee auth (localStorage `eventUser`) | `/event` | ✅ |
| Master/admin auth | `auth/master/[...nextauth]` | 🟡 |
| Role flag in session (`user.role`) | JWT | ✅ |
| Flutter auth (mobile) | `flutter/auth/login` | ✅ |

### 20.2 Portfolio (public)
Hero, Projects, Research, Stats, Team, LiveTerminalFeed, GMeets, splash loader
(`homeui/*`) ✅ · `/our-team` 🟡 (static) · portfolio projects API `portfolio-projects` ✅.

### 20.3 Quiz domain
| Feature | API / page | Status |
|---|---|---|
| Faculty discovery → batch/sem/subject pick | `quizcardfetch`, `coding-club/quiz` | ✅ |
| Quiz listing by selection | `fetchquizzes`, `quizfetch[/quizId]` | ✅ |
| Quiz player — 14 question types (mcq, fillup, truefalse, matchup, ordering, diagram, assertion-reason, comprehension, simplecode, blockcode, testcasecode, findoutput, short/long) | `quizmode/[id]` | 🟡 |
| Attempt lifecycle | `quiz/attempt/start`, `quiz/attempt/submit` | ✅ |
| Results | `quiz/results`, `/quiz-results` | ✅ |
| Quiz creation (manual / JSON / GenAI) | `/createquiz`, `/quiztools/createquiz`, `genai` | 🟡 (dup) |
| Admin quiz mgmt/report | `admin/quizzes` | 🟡 |
| Rank / leaderboard | — | ⚪ |
| Flutter quiz submit | `flutter/events/quiz/submit` | ✅ |

### 20.4 Event domain
| Feature | API / page | Status |
|---|---|---|
| Event discovery | `events`, `events/[id]`, `/events` | ✅ |
| Registration (solo/team) | `events/register` | ✅ |
| Find teammates / invitations | `events/potential-participants`, `events/invitations` | ✅ |
| Access control | `events/access` | 🟡 |
| QR Event Pass | `EventPass`, `flutter/pass` | ✅ |
| Entry/exit scan | `flutter/events/scan` | ✅ |
| Live vote | `flutter/events/vote`, `EventVote` | ✅ |
| Scavenger hunt | `HuntProgress`, `flutter/events/scan` | 🔻 |
| Live timeline | `flutter/events/timeline`, `EventActivity` | ✅ |
| Dynamic event modes | `flutter/eventmode/[type]`, `admin/event/[id]` | ✅ |
| Event CRUD + live mode mgr | `admin_dashboard`, `master*` | 🟡 |

### 20.5 Projects domain
Submit internship/minor/major (`submit_internship_project`, `submit_minor_project`,
`/submit-project`) ✅ · status check/resubmit (`check_submission_status.js`) ✅ ·
review accept/reject (admin) 🟡 · listing `/projects`,`/coding-club/projects` 🟡.

### 20.6 Research domain
Papers `/research-papers` 🟡 · request `/request-research` + `research-requests` 🟡 ·
submit `/submit-research` 🟡 · approval `research/approval` 🟡 · model `Research`,
`ResearchRequest` ✅.

### 20.7 Notes · 20.8 Code · 20.9 Cross-cutting
Notes list/upload `coding-club/notes(/upload)`, `admin-notes` 🟡 · Monaco editor
`coding-club/code` 🟡 · code-run ⚪ · solutions `coding-club/solutions` 🔻 · GenAI ✅ ·
dashboards (student ✅ rebuilt / attendee ✅ rebuilt / admin 🟡) · activity feed 🟡
(UI built, API ⚪) · profile `coding-club/profile`,`/profile` 🟡 · toast notifications ✅
· 15-min session timer ✅.

### 20.10 Mobile (Flutter) surface
`flutter/auth/login`, `flutter/eventmode/[type]`, `flutter/events/{quiz/submit, scan,
status, timeline, vote}`, `flutter/pass` — all ✅; must stay contract-stable.

---

## 21. Workflow analysis — fragmented → one seamless system

### 21.1 The seams today (why it feels like 3 apps)
- **3 identities**: student (JWT/Mongo), attendee (localStorage), master (separate) →
  a person logs in up to 3 times and data never crosses.
- **3 dashboards, no shared nav** → no single "home".
- **Features are islands**: finishing a quiz doesn't move a rank that shows on the
  dashboard; registering for an event doesn't appear in any feed; an approved project
  never reaches the public portfolio.
- **Two shapes** for the same data (web vs Flutter) drift apart.
- **No notifications** to stitch actions together.

### 21.2 Three pillars that make it one product
1. **One identity, many capabilities.** Single `User` with `roles[]`/`capabilities`.
   Log in once; the app reveals Student / Attendee / Admin surfaces by capability. The
   attendee localStorage flow folds into the same session (guest → upgrade), so an event
   attendee who is also a student sees both worlds in one place.
2. **One activity + notification spine.** Every domain writes to a single feed
   (`/api/user/activity`) and notification stream. This is the connective tissue that
   turns separate features into a continuous experience.
3. **One adaptive shell.** A single shell renders nav + dashboard widgets *by
   capability* (route groups share it). No persona-specific apps or duplicate URLs.

### 21.3 Entity state machines (the workflow backbone)
Each core entity gets one explicit lifecycle, so web, admin, and Flutter all derive UI
state the same way:

```
Quiz     draft → published → available → in_progress → submitted → graded → ranked
Event    draft → published → reg_open → registered → checked_in → live → completed → certified
Project  submitted → under_review → {accepted | rejected | resubmit} → showcased
Research requested → submitted → under_review → approved → published
```
A change in any state emits one activity event + (optional) notification (pillar 2).

### 21.4 End-to-end journeys (the seamless flows)

**A · Student "learn" loop**
```
login(once) ─▶ Dashboard(real stats) ─▶ Quizzes ─▶ pick faculty/batch/subject
   ─▶ Quiz player(autosave attempt) ─▶ Submit ─▶ Result+Rank
   ─▶ rank & "completed X" flow into ▶ Dashboard stats + Activity feed
```

**B · Event "participate" loop** (web + Flutter share state)
```
Admin creates Event ─▶ appears on every eligible Dashboard
 ─▶ Register(solo/team, invite) ─▶ QR Pass issued
 ─▶ on-site Scan(check_in) ─▶ Live activities(vote / hunt / timeline)
 ─▶ Completed ─▶ Certificate ─▶ all steps land in one Activity feed
```

**C · Create→Review→Showcase loop** (projects & research)
```
Student submits Project/Research ─▶ Admin/mentor review queue
 ─▶ accept ─▶ status on student Dashboard + Activity
 ─▶ auto-surface on public Portfolio (/, /our-team)
```

**D · The one feed (cross-cutting)**
```
Quiz graded ┐
Event step  ├─▶  /api/user/activity  ─▶  Dashboard "Recent Activity" + 🔔 Notifications
Project ✓   ┘                                   (deep-links back to each entity)
```

### 21.5 Feature interconnection map
```
            ┌─────────────┐      rank      ┌────────────┐
   Quiz ───▶│  Result     │───────────────▶│  Dashboard │◀── Profile
            └─────────────┘                │  (stats +  │
   Event ──▶ Registration ─▶ Pass ─▶ Scan ─▶  activity) │◀── Notifications
            └─▶ Vote/Hunt/Timeline ────────▶│            │
   Project ─▶ Review ─▶ Accepted ──────────▶ Portfolio ◀─┘
   Research ▶ Approval ─▶ Published ───────▶ Portfolio
```
Every arrow is a real data dependency we wire via the new APIs in §9.2 — the same
endpoints power web, admin, and Flutter.

### 21.6 What "1 seamless" concretely ships
- **SSO across personas** — one login; capability-gated surfaces (pillar 1).
- **Composable dashboard** — one page that mounts widgets by capability (student stats,
  attendee events, admin queues) instead of 3 dashboards.
- **Activity feed + notification center** — `/api/user/activity` + a bell; every entity
  state change appears and deep-links to its canonical URL.
- **Shared entity state machines** (§21.3) powering web + admin + Flutter identically.
- **Canonical URLs** — one route per entity (`/quizzes/[id]`, `/events/[id]`,
  `/projects/[id]`); activity/notifications link straight to them.
- **Consistent envelopes** — `{ ok, data, error }` so every client renders states the
  same way.

### 21.7 Workflow acceptance criteria
- A user with multiple roles logs in **once** and reaches every entitled surface.
- Completing any core action (quiz/event/project/research step) appears in the activity
  feed **and** updates the relevant dashboard stat within the same session.
- Every activity/notification item deep-links to a single canonical entity page.
- Web and Flutter read the **same** entity state machine (no shape drift).

---

## 22. Card & grid system — design + optimisation

The single biggest visual lever in this app is cards-in-grids (dashboards, events,
quizzes, projects, faculty, research, notes). Today they are inconsistent and a few are
actively broken. This section is the spec to make them uniform, fluid, and fast.

### 22.1 Card inventory & problems
| Card | Where | Problem |
|---|---|---|
| `PixelEventCard` | events, dashboards | **fixed `width:520px`** → overflows phones; doesn't flex; heavy MUI |
| `StatCard`, `QuickActionTile` | student dashboard | ✅ new/tokenised — use as the reference |
| `Paper`-based cards | most pages | default **white** (no theme), inconsistent radius/border |
| faculty `profilecard`, project, quiz cards | coding-club/* | bespoke, no shared tokens, varied hover |
| event mobile card | `DashboardMobile` | ✅ fluid — promote to shared |

Root issues: no shared Card primitive, fixed widths, MUI Paper white surface, no
skeleton parity (causes CLS), hover effects that thrash on long lists.

### 22.2 One Card primitive — `components/ui/Card.jsx` (new)
A tokenised surface (div + scoped CSS, **not** MUI `Paper`, so no white-surface bug),
with slots and variants:
```jsx
<Card variant="interactive" accent={color} media={<img/>} >
  <Card.Header title="…" badge="…" />
  <Card.Body>…</Card.Body>
  <Card.Footer>…</Card.Footer>
</Card>
```
- `variant`: `surface | elevated | outline | gradient | interactive`
- `accent`: drives hover border/glow via `--accent` (used by StatCard/QuickActionTile)
- `media`: optional header with enforced `aspect-ratio` (no layout shift)
- radius/padding/gap pulled from `theme/tokens.js`; one hover/focus model for all cards

All existing cards (`PixelEventCard`, faculty, project, quiz) refactor onto this.

### 22.3 Grid strategy — decision matrix
| Use | When | Why |
|-----|------|-----|
| **CSS Grid `auto-fit/minmax`** (default for card galleries) | events, quizzes, projects, faculty, quick-actions | fluid, breakpoint-free, fewest DOM nodes, intrinsic equal-height |
| **MUI `Grid size={{}}`** | form-like/aligned layouts needing MUI spacing | keeps MUI rhythm where a form already uses MUI |
| **Flexbox** | 1-D rows/strips | stat strip, chip rows, toolbars |
| **Container queries** | cards inside narrow panels (activity sidebar) | adapt to container, not viewport |

Canonical gallery grid (replaces MUI `Grid container` card walls):
```css
.grid-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
  gap: var(--gap, 16px);
  align-items: stretch;            /* equal-height rows */
}
.grid-cards > * { height: 100%; }  /* cards fill their track */
```
`min(100%, 280px)` is the key: cards never overflow a 320px phone, yet form multi-column
walls on desktop — **without a single breakpoint**.

### 22.4 Fluid, responsive cards (rules)
- **No fixed widths.** `PixelEventCard`: `width:100%; max-width:560px; margin-inline:auto`.
- **Media:** `aspect-ratio: 16/9` (or 3/2) + `object-fit: cover` → zero CLS.
- **Text:** `-webkit-line-clamp` for titles (2) and descriptions (2–3).
- **CTA:** full-width on mobile; ≥44px touch target; never hover-only affordances.
- **Density:** compact card variant for mobile lists (the promoted mobile event card).

### 22.5 Performance optimisations
1. **Virtualise long lists (>50 items)** — events catalogue, quiz bank, results,
   leaderboard. Use `react-virtuoso` (grid mode) or `@tanstack/react-virtual`. One dep,
   keeps the DOM tiny.
2. **`content-visibility: auto`** + `contain-intrinsic-size: <h>` on off-screen card
   rows — browser skips rendering until scrolled into view. **Zero-dependency** win for
   medium lists where virtualisation is overkill.
3. **`React.memo`** every card; pass **stable keys** (entity `_id`, never array index);
   wrap handlers in `useCallback` so memo actually holds.
4. **Images:** `next/image` with explicit `sizes`, `loading="lazy"`, blur placeholder.
5. **GPU-friendly hover:** animate `transform`/`opacity` only. On large grids avoid
   animating `box-shadow` spread (expensive repaint); use a pre-rendered shadow toggled
   by opacity, or limit hover effects to pointer-fine devices via
   `@media (hover:hover) and (pointer:fine)`.
6. **CSS containment:** `contain: layout paint` on cards to isolate reflow.
7. **Defer offscreen sections** (`next/dynamic`) — registration dialog, EventPass,
   Monaco — so card grids aren't blocked by heavy siblings.

### 22.6 Loading / empty / error parity (anti-CLS)
Every grid ships three states with **the same geometry** as the loaded grid:
- **Skeleton:** same `.grid-cards` with N placeholder cards (N = typical page size),
  shimmer via the existing `.dsh-skel` keyframe — identical `minmax` so nothing shifts.
- **Empty:** centered icon + copy + primary CTA (e.g. "Browse events").
- **Error:** message + Retry button (refetch).

### 22.7 Per-surface card spec (target)
| Surface | Grid | Media | Body | CTA |
|---|---|---|---|---|
| Dashboard stat | auto-fit minmax(200px) | icon tile | value + label | — (tooltip) |
| Quick action | auto-fit minmax(220px) | icon tile | label + desc | whole card link |
| Event (desktop) | auto-fit minmax(320px) | 16/9 image | title(2-clamp) · date · venue | Register / View Pass |
| Event (mobile) | 1-col stack | 120px image | title · 1 meta row | full-width CTA |
| Quiz | auto-fit minmax(260px) | accent strip | title · batch/sem · status chip | Start / Resume |
| Faculty | auto-fit minmax(240px) | avatar | name · dept · subjects | Open |
| Project / Research | auto-fit minmax(300px) | status ribbon | title · abstract(3-clamp) | View / Review |
| Notes | auto-fit minmax(240px) | type icon | title · uploader · date | Download |

### 22.8 Accessibility for card grids
- Whole-card-clickable → render the card as a single `<a>`/`<button>`; never nest
  interactives inside a clickable card (move secondary actions out or use a menu).
- Lists use list semantics (`<ul>/<li>`), not ARIA grid roles, unless 2-D keyboard nav
  is truly needed.
- `focus-visible` ring on every card; logical tab order follows DOM order.
- `@media (prefers-reduced-motion)` disables hover lift + entrance animation.

### 22.9 Migration steps (card/grid)
1. Build `components/ui/Card.jsx` + `.grid-cards` utility (tokens).
2. Refactor `PixelEventCard` → fluid + `Card` (fixes the 520px overflow).
3. Replace MUI `Grid container` card walls with `.grid-cards` on events, quizzes,
   projects, faculty, notes pages.
4. Add skeleton/empty/error to each grid (§22.6).
5. Virtualise the 4 long lists (§22.5.1); add `content-visibility` to the rest.
6. Memoise cards + stabilise keys/handlers.

### 22.10 Card/grid acceptance criteria
- No fixed-width cards; nothing overflows at 320px.
- Every gallery uses `auto-fit/minmax` (or virtualised) — no MUI `Grid` card walls left.
- CLS < 0.1 on all grid pages (skeleton geometry matches).
- Long lists (>50) render < 16ms/frame while scrolling (virtualised).
- All cards share one hover/focus model and the token palette.

---

### Immediate next actions (if approved)
1. Phase 1: add `theme/` + ThemeProvider + CssBaseline (kills white surfaces globally)
   and ship `components/ui/Card.jsx` + `.grid-cards` (§22.2–22.3) as the card spine.
2. Phase 2: ship `/api/user/stats` + `/api/user/activity`, wire the student dashboard
   (already built to consume them) to real data — lights up the activity spine (§21.2).
3. Quick win: refactor `PixelEventCard` to fluid width (§22.4) — removes the only
   card that breaks mobile today.
4. Phase 3: add redirects for duplicate routes and delete the dead ones (§16).
5. Phase 1.5: introduce capability-based identity (§21.2 pillar 1) so SSO unblocks the
   composable dashboard.
