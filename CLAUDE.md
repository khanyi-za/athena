# Athena — Claude project notes

Read this on session start. It's the durable context for working in this repo.

---

## What this app is

**Athena** is YIIVA's web app for **merchants and admins** — one of three
surfaces in the platform:

| Surface | Repo | Tech |
|---|---|---|
| Buyer mobile app | `../maya` | Expo / React Native |
| **Merchant dashboard + Admin panel** | **this repo** | Next.js web |
| Backend API | `../nuwa` | NestJS + Prisma + Postgres |

Merchants onboard their store, manage products/collections/team, and (the
target state) run their whole business here — orders, customer messages,
analytics. Admins review stores, approve go-live, and manage platform
categories.

## The product direction (important)

**Once a merchant's store reaches `ACTIVE` status, their dashboard becomes the
`dashboard-legacy/` UI — wired to real data.** The legacy dashboard
(overview, products, orders, messages, analytics) is the *target interface*,
currently running on mock data as a design prototype. The real `/dashboard`
today is store-lifecycle phase screens + the management sub-routes; the
in-flight work is aligning the ACTIVE-store experience to the legacy UI,
screen by screen, replacing its mocks with backend data:

- **Products / collections / team / settings** — backend-wired already (under
  `/dashboard/*`); needs the legacy look applied.
- **Orders** — nuwa's merchant-orders API exists (`/stores/:storeId/orders`);
  legacy orders page is mock-only. Wiring is open work.
- **Messages** — nuwa's merchant chat surface exists
  (`/stores/:storeId/conversations` REST + socket.io `/chat` namespace, built
  with the buyer chat); `dashboard-legacy/messages` is a `setTimeout` mock.
  Wiring is open work (this also makes the buyer app's chat two-sided).
- **Analytics** — powered by **Phalo** (the Python analytics engine, designed
  but not yet built). `dashboard-legacy/analytics/page.tsx` is the
  requirements source for merchant metrics. The feasibility mapping of its
  mock vocabulary → real data lives in
  `../nuwa/docs/phalo-engine/phalo-foundation.md` §5b (what's servable v1,
  what to drop — e.g. likes/traffic-sources/session metrics have no data).

---

## Stack

- **Next.js 16** (App Router) + React 19 + TypeScript
- **Tailwind CSS 4**
- **TanStack Query v5** (hooks in `hooks/`), **Zustand** (`store/auth-store.ts`)
- **react-hook-form + zod** (schemas in `lib/schemas/`)
- **next-cloudinary** + signed-direct uploads (`lib/cloudinary-upload.ts`)
- lucide-react **v1.14.0** — old version; some icons don't exist (e.g.
  `Instagram` was replaced with `Camera`). Check before importing new icons.

---

## Architecture

### BFF pattern — all backend calls go through `app/api/*`

The browser never calls nuwa directly. Next API routes proxy to the backend
(`lib/backend-client.ts` → `API_URL`, default `http://localhost:3000`):

```
browser → /api/stores/me (Next route, reads yiiva_rt cookie)
        → nuwa /stores/me (server-to-server, Bearer token)
```

- **Refresh token** lives in the `yiiva_rt` httpOnly cookie (set by the Next
  auth routes — `lib/server-config.ts`). Access tokens are held client-side in
  the Zustand auth store, memory only.
- **`lib/api-client.ts`** is the client-side fetch wrapper: silent refresh +
  the four distinct 401 messages from the auth contract (expired → refresh +
  retry; inactive → `/login?reason=suspended`; the rest → hard logout).
- **`middleware.ts`** gates `/dashboard`, `/onboarding`, `/admin` on cookie
  presence; bounces authenticated users away from `/login`/`/register`.

### Route groups

```
app/(auth)/      login, register, verify-email, forgot/reset-password
app/(merchant)/  dashboard (real), dashboard-legacy (target UI, mock data),
                 onboarding (store wizard)
app/(admin)/     admin: store review, go-live queue, categories
app/api/         BFF proxy routes (auth, stores, products, categories, employees…)
```

### The dashboard routing matrix

`/dashboard/page.tsx` resolves the view from `user` + store status via
`lib/routing-matrix.ts`: wizard-draft → under-review-first →
approved-readiness → under-review-go-live → **active-store** → (suspended |
closed). Phase screens live in `components/phase-screens/`. BUYER-with-no-store
goes through the employee-fallback gate (localStorage employments cache)
before `/onboarding`.

When changing post-login behavior, start at the routing matrix — not the page.

---

## Conventions

- **Data fetching:** TanStack Query hooks in `hooks/` (`use-products.ts`,
  `use-store-me.ts`, …) calling typed functions in `lib/api/*` which hit the
  BFF routes. Follow that chain for new features.
- **Validation:** zod schemas in `lib/schemas/*`, shared by forms
  (react-hook-form resolvers) and API routes.
- **Money:** integer ZAR cents from the backend; render via
  `lib/format-money.ts`.
- **Uploads:** signed-direct Cloudinary (`POST /uploads/cloudinary-signature`
  via BFF → browser uploads to Cloudinary → URL patched onto the resource).
  Must send `source=uw` (part of the signed payload). See
  `docs/cloudinary-setup.md`.
- **Backend contracts:** `docs/Api-frontend-contracts/*.md` are the canonical
  endpoint specs + journey docs (merchant-journey, admin-journey,
  employee-journey). When the backend needs a change, write it up in
  `docs/backend-handoffs/` (existing files there show the format).

---

## Known footguns / state

- `dashboard-legacy/` runs entirely on **mock data** (Tol'thema/SUHU fixtures,
  assets under `public/suhu/`, `public/tol_thema/`). Don't mistake it for
  wired UI — it's the design target.
- **Port collision:** nuwa dev runs on `:3000`; `next dev` will auto-bump
  athena to `:3001`. `API_URL` (in `.env.local`) must point at nuwa's port.
- The admin segment redirects from `/dashboard` via the routing matrix —
  admins land on `/admin`.
- Employee (multi-store staff) support is partial: v1 welcome screen via the
  localStorage cache; a full employee dashboard waits on `/auth/me` exposing
  employments (backend backlog).
- Merchant chat + orders + analytics backend APIs **already exist in nuwa**
  (orders + chat) or are **designed** (analytics via Phalo) — the gap is on
  this side.

---

## Commands

```bash
npm run dev      # Next dev server (use :3001 when nuwa holds :3000)
npm run build    # production build
npm run lint     # eslint
```

Dev login: any seeded merchant; backend must be running (`../nuwa`,
`npm run start:dev`).

---

## Session protocol

**`CHANGELOG.md` is this repo's session log** — read its top entry on session
start for where work left off, and append a dated entry when a work session
ends (existing entries show the format). This file (CLAUDE.md) is the stable
reference — update it only when architecture, conventions, or product
direction change.
