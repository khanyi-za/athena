# Changelog

All notable changes to the Athena merchant dashboard are documented here.

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
