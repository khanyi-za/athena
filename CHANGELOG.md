# Changelog

All notable changes to the Athena merchant dashboard are documented here.

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
