# Changelog

All notable changes to the Athena merchant dashboard are documented here.

---

## [uncommitted] — 2026-07-06

### Merchant-demo feature round: admin orders + variants + live analytics + earnings/promotions/low-stock/returns

Built for the in-person brand demos (2026-07-07) — all MVP-bound, all backed
by real new nuwa endpoints (see `../nuwa/STATUS.md` for the backend half).
**Two waves, both UNCOMMITTED in this repo.**

**Wave 1 — the three long-standing gaps:**
- **Admin Orders** (`/admin/orders`, new nav tab): cross-store list
  (order-number / buyer-email / status filters, cursor Load-more) + detail
  modal with force-confirm, admin cancel (FRAUD/POLICY_VIOLATION/…), shipping
  /notes edit, PayFast **refund** (partial/full, remaining-refundable shown)
  and a **reconcile panel** (verdict badges; PayFast sandbox rejects the
  history API with 401 — production-only, like refunds).
- **Variant editing** (product editor → new Variants section + side-nav
  entry): add/edit/delete with price-override semantics (blank = inherit
  base; clearing sends `priceInCents: null`), reserved-aware availability.
  The old "M6 deferred" note in `lib/schemas/product.ts` is gone.
- **Live analytics** — the "▶ PHALO SWAP POINT" swap happened:
  `useStoreAnalytics` now queries nuwa `GET /stores/:id/analytics`
  (14-day revenue/orders series + trends; followers/products/rating flat
  sparks until history accumulates). Falls back to the sample (+badges) while
  loading or against an older backend. Fixed the revenue trend chip that
  hard-coded `+`/green (real negatives now signed + red).

**Wave 2 — operational overhead features (AppShell nav grew 3 tabs):**
- **Earnings** (`/dashboard/earnings`): accrued per-order ledger
  (gross → 5.5% commission → payout, refunds shown), monthly statement
  selector, CSV export (client-side). Copy carefully avoids claiming
  disbursement — Payout records are a later phase.
- **Promotions** (`/dashboard/promotions`): run a catalogue sale (% or R off,
  optional end date, product picker with live sale-price preview). Prices
  change immediately (original → strikethrough via comparePriceInCents),
  revert on end; one live sale per product; R1 floor. NOT promo codes —
  checkout money math untouched.
- **Returns** (`/dashboard/returns`): buyer return requests queue with
  lifecycle actions (approve / reject-with-note / parcel received / settle).
  Refund money movement stays on the admin tool.
- **Low-stock alerts**: Overview "Stock alerts" card
  (`components/dashboard/low-stock-card.tsx`) — variant- and
  reservation-aware, deep-links to the product editor. `lowStockThreshold`
  now merchant-editable via PATCH (schema updated; editor field is a
  follow-up).

New plumbing follows the standard chain exactly: `lib/schemas/{admin-order,
earnings,sales,returns,inventory,store-analytics}.ts` → `lib/api/*` →
`hooks/use-{admin-orders,earnings,sales,returns,low-stock}.ts` → BFF proxies
under `app/api/admin/*` + `app/api/stores/[id]/{earnings,sales,returns,
inventory,analytics,products/[productId]/variants}`.

Demo state: nuwa :3005 runs the new build with **seeded order history**
(116 orders / 8 weeks / 6 brands, demo buyers `*.demo@demo.yiiva.co.za` /
`DemoPass1`), 5+1 return requests, and a LIVE "Winter Warmers — 20% off" sale
on Tol'thema. tsc + eslint clean; verified end-to-end through the BFF.

---

## [note] — 2026-07-02

### ⚠️ Backend data divergence: demo DB (:3005) vs dev DB (:3000)

The platform **Category tree was overhauled in the DEMO env only**
(`yiiva_demo`, served on :3005 — where athena currently points via
`.env.local`): 18 buyer-facing categories with Cloudinary card images replaced
the old 4-category seed (`bottoms` was deleted), product↔category links were
re-derived, and `Product.genderType` was gender-curated per brand. The dev DB
(`ayana` / nuwa on :3000) still has the OLD 4 categories and un-curated gender
data.

Athena impact: the **admin categories page** manages whichever DB the BFF
points at — edits made against :3005 don't exist in dev and vice versa. When
repointing `API_URL` back to :3000, expect the old category tree; don't "fix"
the mismatch by hand-editing — run the nuwa importer's `seed-demo` + `relink`
+ `regender` against that DB instead. Full detail: `../nuwa/STATUS.md`
(2026-07-02 divergence note).

---

## [ca91642] — 2026-07-01

### Design-system redesign — COMPLETE (4 commits, all on main)

The full visual redesign onto shadcn-style design tokens + **YIIVA Violet**
brand accent (`oklch(0.55 0.23 285)` ≈ `#6d28d9`, decision D1 locked) + dark
mode. 100% token coverage — the final app-wide raw-palette sweep is empty
(intentional exclusions: `components/preview/*` prototype kit,
`dashboard-legacy/*` reference mock, dead `legacy-dashboard-shell.tsx`).
Plan + decisions in `docs/athena-redesign/` (README, design-tokens,
9-phase plan). Feature-preserving; no backend/API/auth changes.
tsc + lint + `next build` verified clean at every step.

- **[05c8c77] Merchant dashboard on tokens**: `globals.css` token layer
  (light + dark, `@theme`, `@custom-variant dark`); real primitives in
  `components/ui/` (card, badge, skeleton, stat-card, table, button, input —
  Button/Input reimplemented on tokens+cva with public props preserved, new
  `brand`/`danger` variants); `lib/order-status.ts` + `lib/product-status.ts`
  single sources; unified `components/shell/app-shell.tsx` (violet sidebar +
  sticky topbar) **replaces `LegacyDashboardShell`** in the dashboard layout
  (legacy file kept but dead — no imports); overview re-skinned on real data;
  orders → sortable TanStack DataTable (`@tanstack/react-table`); products
  list + editor + all 8 lifecycle modals; collections, team, settings,
  messages, shared wizard sections. Deps: recharts, next-themes, cva, clsx,
  tailwind-merge, @tanstack/react-table.
- **[f97532b] Admin + auth + onboarding + shared primitives**: admin layout,
  queues, store-review + go-live detail, categories (+ tree/form/modals),
  approve/reject modals — `StatusPill` TONE_CLASSES remapped to tokens
  (adapter, all call-sites intact); (auth) login/register, verify-email,
  forgot/reset, invites/accept, both auth layouts; onboarding + wizard shell +
  submit modal; AutosaveIndicator, Alert, Splash, masked-bank-account
  tokenized.
- **[baa872b] Charted overview behind a Phalo-ready contract**: new
  `lib/analytics/store-analytics.ts` = `StoreAnalytics` interface +
  `useStoreAnalytics` MOCK hook (`isSample: true`, deterministic sample data;
  **PHALO SWAP POINT** documented — swap the hook body for a real query, set
  `isSample: false`, UI unchanged). `components/ui/charts.tsx` (Sparkline +
  RevenueChart, recharts, token colors); overview shows revenue area chart +
  4 stat cards with trend deltas + sparklines. KPI VALUES are real store
  counts; trends/sparklines/revenue-series are sample ("Sample" badges).
- **[ca91642] Dark mode + last-mile coverage**: `components/ui/theme-toggle.tsx`
  (next-themes, `enableSystem=false`) surfaced in AppShell topbar, admin
  header, non-ACTIVE dashboard header, onboarding header, both auth layouts;
  phase-screens cluster migrated (approved-readiness, under-review ×2,
  suspended, closed, invalid-state, wizard-draft, phase router), analytics
  stub, approved/* extras, active/* (celebration modal, store-header,
  metrics-tiles).

**Deferred (optional follow-ups):** Radix Dialog dedup across ~15 hand-rolled
modals; delete dead `legacy-dashboard-shell.tsx` (kept per user, not yet);
mobile nav drawer for AppShell (<lg); wire the Top Products card + swap
`useStoreAnalytics` to real data when Phalo Phase 3 (`store_stats_daily`)
lands.

---

## [Unreleased] — 2026-06-12

### Legacy-dashboard alignment (ACTIVE stores) — phases 1–3

Product direction confirmed: once a store is ACTIVE, the merchant dashboard
becomes the `dashboard-legacy/` interface wired to real data. `CLAUDE.md`
added to the repo (durable context + this direction).

- **Shell**: new `components/legacy-shell/legacy-dashboard-shell.tsx` — the
  legacy sidebar chrome with the real store identity in the header (logo,
  name, link to settings), user + logout preserved, nav at `/dashboard/*`
  (incl. Collections + Team), honest quick actions. Applied by
  `dashboard/layout.tsx` only for MERCHANT + ACTIVE; all other states keep
  the thin header.
- **Overview**: `ActiveStoreScreen` rebuilt in the legacy design with real
  data — welcome banner (copy-public-URL), four real stat cards
  (orders/followers/active products/rating from `/stores/me`), live Recent
  Orders card, Top Products as a Phalo placeholder. Locations management and
  the go-live celebration modal preserved.
- **Orders** (`/dashboard/orders`): full order management — status filter +
  order-number search + cursor Load-more list; detail modal with items,
  buyer/shipping, payout breakdown (commission + merchant payout), fulfilment
  timeline; transitions CONFIRMED→PROCESSING→READY_FOR_DISPATCH; merchant
  cancel with reason; waybill PDF download (binary BFF passthrough,
  "not ready yet" state pre-booking). New `apiFetchBlob` in `api-client.ts`.
- **Messages** (`/dashboard/messages`): merchant chat — two-pane inbox
  (conversation list with unread badges + live thread). REST via new BFF
  proxies under `/api/stores/:id/conversations*`; realtime via socket.io
  straight to the backend `/chat` namespace (`lib/chat-socket.ts`,
  `NEXT_PUBLIC_API_URL`); optimistic replies with Idempotency-Key; buyer
  image attachments render. Dep added: `socket.io-client`.
- **Build fix (pre-existing)**: `/invites/accept` wrapped in a Suspense
  boundary — `next build` had been failing on its bare `useSearchParams()`.

New BFF routes: stores/[id]/orders (+detail/status/cancel/shipping-label),
stores/[id]/conversations (+messages/read). New schemas: `order.ts`,
`chat.ts`. New hooks: `use-store-orders`, `use-store-conversations`.

Remaining on this track: Analytics (waits on Phalo), restyling the wired
products/collections/team/settings screens to the legacy look.

---

## [Unreleased] — 2026-05-06

### Auth — API Contract Alignment

- **Base URL**: Fixed default `API_URL` fallback in `lib/server-config.ts` from `localhost:3001` to `localhost:3000`
- **`credentials: 'include'`**: Added to every `fetch` call across all auth pages (`login`, `register`, `verify-email`, `forgot-password`, `reset-password`), `AuthProvider`, `LogoutButton`, and `api-client.ts` — required because the backend uses `credentials: true` CORS config
- **Removed redundant `/auth/me` calls**: `login`, `verify-email`, and `refresh` API routes were each making a secondary `GET /auth/me` after receiving tokens. The user object is already included in those responses — the extra call was removed from all three routes
- **401 handling**: Expanded `api-client.ts` to handle all four distinct 401 messages from the contract:
  - `"Access token has expired"` → silent refresh + retry
  - `"Account is inactive or does not exist"` → clear auth, redirect to `/login?reason=suspended`
  - `"Authentication required"` / `"Invalid access token"` → clear auth, redirect to `/login`
- **Post-login routing**: Login page now routes by `user.role` after successful auth — `MERCHANT` / `ADMIN` → `/dashboard`, `BUYER` → `/onboarding`
- **Logout fire-and-forget**: `LogoutButton` now clears local auth state and redirects to `/login` immediately; server-side token revocation runs in the background
- **New route `POST /api/auth/logout-all`**: Added `app/api/auth/logout-all/route.ts` to proxy the backend's logout-all-devices endpoint

### Types

- **`StoreStatus`**: Added `APPROVED` status (`'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'ACTIVE' | 'SUSPENDED' | 'CLOSED'`)
- **`AccountStatus`**: New type — `'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED' | 'PENDING_VERIFICATION'`
- **`User`**: Added missing fields from `/auth/me` contract — `phone`, `emailVerified`, `phoneVerified`, `accountStatus`, `createdAt`

### Dashboard — UI (pre-backend)

- Replaced `/dashboard` with a full merchant dashboard UI (committed separately as `5621410`)
- Added sub-routes: `/dashboard/products`, `/dashboard/orders`, `/dashboard/messages`, `/dashboard/analytics`
- Added brand assets to `/public/suhu/` and `/public/tol_thema/` (product images and hero videos for Tol'thema and SUHU)
- Added `/public/ICON_BLACK.png` (YIIVA logo)
- Fixed `lucide-react` v1.14.0 incompatibility — `Instagram` icon removed from that version, replaced with `Camera` across `layout.tsx`, `page.tsx`, `analytics/page.tsx`; removed unused import from `products/page.tsx`

### Middleware

- Auth guard for `/dashboard` reinstated after UI testing phase (`/dashboard` and `/onboarding` are both protected)

---

## [5621410] — 2026-05-04

### Dashboard

- Initial dashboard UI added with sidebar layout, merchant switcher (Tol'thema / SUHU), and overview page with mock stats

---

## [ce8a93a] — Initial commit

- Existing project files added: auth flows (login, register, verify-email, forgot-password, reset-password), middleware, Zustand auth store, API proxy routes, UI component library (Button, Input, Alert)
