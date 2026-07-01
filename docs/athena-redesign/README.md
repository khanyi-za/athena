# Athena Redesign — Plan Index

> Goal: make athena (merchant + admin dashboard) look **modern, slick, and
> branded** — without regressing features, and while *enhancing* how data is
> represented. Foundation: **shadcn/ui + Radix** (Radix arrives inside shadcn),
> a **YIIVA design-token layer** on Tailwind v4, and **Recharts** (via shadcn
> Charts) for data viz. This is athena first; maya follows with the same design
> language (via `react-native-reusables`/NativeWind) in a later track.
>
> **Status: aesthetic APPROVED via prototype (2026-07-01).** The dashboard-overview
> vertical slice at `/overview-preview` (route `app/overview-preview/` + scoped
> `components/preview/*`, mock data, isolated) was built and signed off — shadcn/ui
> primitives + YIIVA tokens (violet accent) + Recharts + dark mode. Foundation
> touches already landed: `globals.css` token layer, `lib/utils.ts` (`cn`),
> deps (recharts, next-themes, cva, clsx, tailwind-merge), `suppressHydrationWarning`
> on root `<html>`. **Next: promote primitives into `components/ui/` and begin the
> live migration (Phase 0→).** Drafted 2026-07-01.

## Read in this order

1. **[design-tokens.md](./design-tokens.md)** — the load-bearing artifact. Palette
   (neutral + YIIVA brand accent + semantic), typography, spacing, radius, shadow,
   dark mode. Everything downstream references these tokens.
2. **[athena-redesign-plan.md](./athena-redesign-plan.md)** — the master plan:
   principles, current-state grounding, component→shadcn mapping, phased screen
   migration order, feature enhancements, risks + rollback.

## The one-paragraph summary

athena isn't ugly — it's **undesigned**: `globals.css` defines only 2 tokens, there's
no component library, no accent color, two neutral palettes (`zinc` 672× vs `gray`
452×) fighting, order-status colors defined twice with *different* colors, four
separate layout shells, and all data UI (tables, "charts", modals, loaders)
hand-rolled per screen. The fix is a **design system**, not a reskin: install shadcn
onto the (near-empty, low-conflict) Tailwind v4 token layer, define YIIVA tokens
**first**, unify the app shell, then re-skin screens highest-impact-first while
upgrading the data-display UX (real DataTable, real charts, one Dialog, real
skeletons, toasts, command palette).

## Decisions needed from you before Phase 0 starts

| # | Decision | Recommended default | Where |
|---|---|---|---|
| D1 | **Brand accent color** (the "wow" pop) | ✅ **LOCKED: YIIVA Violet** `oklch(0.55 0.23 285)` ≈ `#6d28d9` (2026-07-01) | design-tokens §2 |
| D2 | **Primary button stays ink (near-black)?** | Yes — matches current identity; brand accent used for highlights, not every button | design-tokens §2 |
| D3 | **Neutral = `zinc`** (retire `gray`) | Yes — zinc already dominant | design-tokens §3 |
| D4 | **Dark mode in v1 scope?** | Yes — cheap with shadcn tokens; ship light-default + toggle | design-tokens §7 |
| D5 | **Charts lib = shadcn Charts (Recharts), not Tremor** | Yes — one design language; analytics is mock until Phalo | plan §6 |
