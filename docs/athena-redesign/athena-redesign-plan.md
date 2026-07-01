# Athena Redesign — Master Plan

> Modernize athena's look and data representation onto **shadcn/ui + Radix +
> YIIVA design tokens**, feature-preserving and feature-*enhancing*. Read
> [design-tokens.md](./design-tokens.md) first — it's the foundation this plan
> builds screens on.
>
> **Status: PLAN / awaiting approval.** No app code changed. Drafted 2026-07-01.
> Stack (verified): Next **16.2.1**, React **19.2.4**, Tailwind **v4**,
> TanStack Query v5, react-hook-form + zod, lucide-react, socket.io-client.

---

## 1. Principles

1. **Design system, not reskin.** The win is a token layer + a shared component
   kit, not painting screens one-off. Tokens (colors/type/spacing/radius) land
   before mass screen work so the target is fixed, not emergent.
2. **Feature-preserving.** athena's commerce features work (onboarding, products,
   orders, chat, admin review). Migration is *visual + interaction* polish on top
   of existing TanStack Query hooks, BFF routes, and zod schemas. **No API,
   auth, or data-flow changes.**
3. **shadcn = owned code, incremental.** Components are copied into `components/ui/`,
   not locked deps. Adopt primitive-by-primitive; old and new coexist during
   migration. Radix arrives *inside* shadcn — not a separate install decision.
4. **Enhance while re-skinning.** Every screen we touch also gains a real UX
   upgrade (sortable/filterable tables, real charts, skeletons, toasts, command
   palette) — not just new colors.
5. **Verify bleeding-edge compat.** React 19.2 / Next 16.2 / Tailwind 4 are new;
   pin + smoke-test each shadcn add and peripheral lib rather than assume.
6. **Portable to maya.** Token decisions (palette, semantic names) are chosen so
   the maya track can mirror them via `react-native-reusables`/NativeWind later.

---

## 2. Current-state grounding (from the audit)

**Foundation:** Tailwind v4 CSS-first, **2 tokens total**, no component lib, no
`clsx`/`cva`/`tailwind-merge`, no dark mode, no brand color.

**The 5 things making it look basic:**
1. Two neutrals fighting — `zinc` 672× vs `gray` 452×.
2. No brand identity — greyscale + black buttons only.
3. Order-status colors defined **twice, differently** (`orders/page.tsx`
   STATUS_CONFIG vs `active-store.tsx` ORDER_STATUS_CHIP).
4. **Four** separate layout shells (auth / admin / merchant legacy-shell /
   onboarding) — no shared chrome.
5. Hand-rolled data UI: raw `<table>` (orders), `<div>`-bar/inline-SVG "charts"
   (analytics mock), ~15 bespoke modals, grey `animate-pulse` loaders.

**Good bones to keep/extend:** `StatusPill` tone system, `Button`/`Input`
primitives, react-hook-form + zod + field-level **autosave** wizard, cursor
pagination, decent empty states, responsive card rows.

**Route reality:** live surface is `app/(merchant)/dashboard/*` +
`app/(admin)/admin/*` + `app/(auth)/*` + `app/(merchant)/onboarding`.
`dashboard-legacy/*` is a **design-reference mock** (incl. the analytics mock we
mine for chart requirements) — we mine it, we don't migrate it. `/dashboard/
analytics` is a 12-line **stub**; `/dashboard/messages` is **live** (378-line
two-pane inbox).

---

## 3. Component mapping — current → shadcn target

| Area | Today | Target | Notes |
|---|---|---|---|
| Button | `ui/button.tsx`, 2 variants, string-concat | shadcn `Button` (cva: default/secondary/ghost/outline/destructive + sizes) | keep ink primary (tokens §2); map old `primary`→`default`, `ghost`→`outline` |
| Input | `ui/input.tsx` (+ password toggle) | shadcn `Input` + `Label` + `Form` | preserve password-eye + error styling; wrap RHF with shadcn `Form` |
| Alert | `ui/alert.tsx` (error/info) | shadcn `Alert` (+ destructive) | 1:1 |
| StatusPill | `ui/status-pill.tsx` tone system | shadcn `Badge` with tone variants | **fold into one** semantic Badge; drive from `lib/order-status.ts` + `lib/store-status-labels.ts` |
| Modals (~15 bespoke) | hand-rolled backdrop+Esc+focus (`create-product-modal.tsx`, address, invite, delete…) | shadcn `Dialog` / `AlertDialog` (Radix) | **biggest dedupe** — deletes ~100 lines each; keeps `use-body-scroll-lock` semantics for free |
| Orders table | native `<table>` + STATUS_CONFIG | shadcn `DataTable` (TanStack Table v8) | sortable headers, column filters, keeps cursor "load more" |
| Product/queue rows | bespoke card rows | shadcn `Card` + shared `Table`/row where tabular | product cards stay card; admin queues → sortable table |
| Stat cards (×2 impls) | `StatCard` + `Tile` (divergent) | one shadcn-styled `StatCard` | add trend delta + optional sparkline; retire the duplicate |
| Charts | none (div bars / inline SVG) | **shadcn Charts (Recharts)** | `ChartContainer` + tokens `--chart-1..5`; **not Tremor** (§6) |
| Loading | grey `animate-pulse` boxes | shadcn `Skeleton` + content-shaped skeletons | e.g. `<OrdersTableSkeleton/>` |
| Toasts | none (inline errors) | **Sonner** | mutation success/error feedback app-wide |
| Tabs / filters | ad-hoc pills | shadcn `Tabs`, `Select`, `DropdownMenu` | products status tabs, order filters |
| Nav / shell | 4 shells | one shared `AppShell` (sidebar+topbar) | see §5 |
| Command palette | none | `cmdk` (shadcn `Command`) | ⌘K quick-nav + quick-create |
| Utilities | none | `cn()` in `lib/utils.ts` (`clsx`+`tailwind-merge`), `cva` | prereq |

---

## 4. Phase plan

Each phase is independently shippable and leaves the app fully working. Phases 0–2
are the foundation; 3+ are visible screen wins.

### Phase 0 — Scaffold & tokens (no visible change yet)
- Add `cva`, `clsx`, `tailwind-merge`, `next-themes`, animate util; create
  `lib/utils.ts` (`cn`).
- `shadcn init` (manual if the CLI fights Next 16 / Tailwind 4 — components are
  just files); base neutral = **zinc**.
- Write the token layer into `app/globals.css` per [design-tokens.md](./design-tokens.md)
  (light + dark + `@theme inline`).
- `ThemeProvider` (next-themes) in `app/layout.tsx`.
- **Exit check:** app builds; existing screens visually unchanged (they still use
  old utilities); dark class toggles background.

### Phase 1 — Primitives
- Bring in shadcn `Button, Input, Label, Textarea, Form, Card, Badge, Alert,
  Dialog, AlertDialog, DropdownMenu, Select, Tabs, Tooltip, Skeleton, Separator,
  Sonner, Command`.
- Re-implement the 4 existing `ui/*` primitives on shadcn, **keeping their public
  props** so call-sites don't churn (adapter approach). `StatusPill` →
  `Badge` tones; create `lib/order-status.ts` single source (fixes finding #3).
- Mount `<Toaster/>` (Sonner) in the shell.
- **Exit check:** `Button`/`Input`/`Alert`/`StatusPill` call-sites render via
  shadcn with no prop changes; one order-status color source.

### Phase 2 — Unified app shell
- Build one `AppShell` (collapsible sidebar + topbar: store switcher, ⌘K,
  notifications, theme toggle, user menu) as shadcn-styled.
- Adopt in `(merchant)/dashboard/layout.tsx` (replacing `legacy-dashboard-shell`),
  `(admin)/admin/layout.tsx`; align `(auth)` + `onboarding` chrome to tokens.
- **Exit check:** consistent nav/header/sidebar across surfaces; active-state uses
  `brand`; keyboard ⌘K opens command palette.

### Phase 3 — Merchant dashboard overview (highest visibility)
- Re-skin `dashboard/page.tsx` phase screens (esp. `active-store.tsx`): one
  `StatCard` with trend deltas + mini sparkline (Recharts), quick-actions as
  `Card` grid, recent-orders as a compact shadcn table, skeletons.
- **Exit check:** the first screen a merchant sees looks like a modern SaaS
  dashboard; parity on all data shown today.

### Phase 4 — Orders (list + detail)
- `dashboard/orders/page.tsx` → shadcn **DataTable**: sortable columns (date,
  total, status), status multi-filter, search, date-range; keep cursor load-more.
- Order-detail modal → `Dialog`; status badges from `lib/order-status.ts`;
  fulfilment timeline restyled; waybill/cancel actions in a `DropdownMenu`.
- **Exit check:** sort + filter work; no regression in cancel/label/detail flows.

### Phase 5 — Products & collections
- Products list → shadcn `Card` rows/`DataTable` toggle; **bulk-select toolbar**
  (archive / add-to-collection); product editor sections on `Card` + `Form`.
- Collections: dnd-kit reorder preserved, restyled; delete via `AlertDialog`.
- **Exit check:** bulk actions functional; editor + reorder unregressed.

### Phase 6 — Analytics (mock now, Phalo-ready contract)
- Build reusable chart components on shadcn Charts (Recharts): `AreaChart`,
  `BarChart`, `DonutChart`, KPI `StatCard` w/ delta.
- Rebuild the analytics screen against a **typed data contract** (see plan §6)
  fed by the mock today; swapping to Phalo `store_stats_daily` later is a
  data-source change only.
- **Exit check:** analytics looks real and slick; contract documented for Phalo.

### Phase 7 — Admin + auth + onboarding polish
- Admin queues → sortable tables + `Badge` tones; review modals → `Dialog`;
  category tree restyled.
- Auth cards + onboarding wizard reskinned to tokens (autosave indicator kept).
- **Exit check:** whole app on one design language; no raw `gray-*` left
  (lint/grep gate).

### Phase 8 — Enhancements & hardening
- `cmdk` command palette content; content-shaped skeletons everywhere; toast
  coverage on all mutations; a11y pass (focus rings via `ring`, contrast,
  keyboard); optional density toggle.

---

## 5. The unified shell (kills finding #4)

Four shells today. Target: one `components/shell/app-shell.tsx` parameterized by
`nav` items + `role`, used by merchant and admin; auth/onboarding keep minimal
centered chrome but pull the same tokens/wordmark. Sidebar active-state uses
`bg-brand-subtle text-brand`; topbar carries store switcher (merchant), ⌘K,
theme toggle, notifications, user menu.

---

## 6. Charts & the Phalo seam (D5)

**shadcn Charts (Recharts), not Tremor** — one design language with the rest of
the kit, themed via `--chart-1..5`; avoids a second styling system and the
Tailwind-v4/`@tremor/react` friction. **Reality check:** the analytics data is a
**mock** (`dashboard-legacy/analytics`) — Phalo's `store_stats_daily` (Phase 3 of
phalo) doesn't exist yet. So Phase 6 makes the *mock* beautiful behind a typed
contract:

```ts
// lib/analytics/contract.ts  (fed by mock now; Phalo later)
interface StoreAnalytics {
  overview: { revenueInCents, orders, conversionRate, aov, trends: {...} }
  salesSeries: { t: string; salesInCents: number }[]
  trafficSources: { source, visits, conversions, pct }[]
  topProducts: { id, name, views, purchases, revenueInCents, conversionRate }[]
  // …mirrors the mock; maps 1:1 to phalo.store_stats_daily / product_stats_daily
}
```

Wiring to Phalo later is swapping the data source behind this interface — zero
component change. (Flag: some mock metrics — session duration, bounce, device
split — have **no backing** in the schema; v1 drops them, per phalo foundation
PH-3. Note that in the analytics build so we don't ship charts for data that will
never exist.)

---

## 7. Feature enhancements (the "enhance, not just paint" list)

| Enhancement | Screen | Value |
|---|---|---|
| Sortable + multi-filter + date-range **DataTable** | orders, admin queues | real ops workflow vs today's status-dropdown-only |
| **Bulk actions** (select → archive / collection) | products | mass management |
| **Real charts** (Recharts) w/ tooltips, responsive | analytics, dashboard sparklines | credible analytics vs div-bars |
| **⌘K command palette** (`cmdk`) | global | quick nav + quick-create-product |
| **Toasts** (Sonner) | all mutations | feedback that today is silent/inline |
| **Content skeletons** | all lists/detail | perceived perf, no layout jump |
| **Theme toggle / dark mode** | global | modern expectation, demo wow |
| Trend deltas + sparklines on stat cards | dashboard | at-a-glance direction |

None of these touch backend contracts; all are additive UI on existing hooks.

---

## 8. Risks & rollback

| Risk | Likelihood | Mitigation |
|---|---|---|
| shadcn CLI friction on Next 16 / TW4 | Med | components are copy-in files; do manual add if CLI misbehaves; pin versions |
| Peripheral lib incompat on React 19.2 (cmdk, sonner, recharts) | Low-Med | smoke-test each on add; all have React 19 releases as of shadcn TW4 line |
| Two design languages mid-migration (transitional inconsistency) | High (expected) | phase order minimizes it; primitives (P1) + shell (P2) first so the *frame* is consistent before screens; time-box the migration |
| Prop churn breaking call-sites when swapping primitives | Med | adapter approach — new primitives keep old public props in P1 |
| Status-color regression | Low | single `lib/order-status.ts`, snapshot the 10 statuses before/after |
| Polishing a mock (analytics) reads as "done" when data is fake | Med | typed contract + explicit note; drop unbacked metrics; don't imply live data |
| Scope creep into feature work (messages, inventory) | Med | redesign track ≠ new-feature track; enhancements in §7 only |

**Rollback:** each phase is a separate branch/PR; primitives are additive until
call-sites switch. Worst case, revert a phase's PR — tokens in `globals.css` are
backward-compatible (old utilities keep working) so a partial migration never
bricks the app. No DB/migration/API risk anywhere in this track.

---

## 9. Explicitly out of scope (this track)

- Backend/API/auth/BFF changes.
- New features (chat rework, inventory dashboard, customer analytics) — separate
  product track; redesign only reskins what exists + the §7 UI enhancements.
- Wiring analytics to **real** Phalo data — blocked on phalo Phase 3; we build the
  contract + charts, they get real data later.
- maya redesign — follows athena on the same tokens via
  `react-native-reusables`/NativeWind; its own plan doc when we get there.

---

## 10. Open items to confirm before Phase 0

- **D1** brand accent hue (design-tokens §2) — the only hard blocker.
- **D2–D5** (README table) — all have recommended defaults; confirm or adjust.
- Whether to **keep `dashboard-legacy/`** as reference or delete after Phase 6
  mines it.
- Verify `/dashboard/messages` current polish level firsthand before deciding if
  it needs a Phase-7 reskin pass (it's live; likely just token alignment).
