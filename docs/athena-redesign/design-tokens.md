# Athena Design Tokens & Palette

> The foundation. Every screen migration references these tokens instead of
> ad-hoc utilities. shadcn/ui on Tailwind v4 is **CSS-variable-first** — tokens
> live in `app/globals.css` under `:root` / `.dark` and are mapped to Tailwind
> utilities via `@theme inline`. This doc specifies the target values.
>
> **Status: D1 LOCKED (YIIVA Violet, 2026-07-01); D2–D4 on recommended
> defaults.** Values are concrete and ready to write into `globals.css` at
> Phase 0.

---

## 1. Why tokens first (the single biggest lever)

The audit showed the "basic/cheap" feel comes from *absence of a system*, not bad
components. The current `globals.css` is only:

```css
:root { --background: #ffffff; --foreground: #09090b; }
```

Two variables for the whole app. That's why it's near-conflict-free to adopt
shadcn (its `init` writes exactly this variable layer) — and why defining a real
token set is 80% of the visual win **before any screen is rebuilt**. Concretely,
tokens fix three of the five things making athena look basic: the fighting
neutrals (§3), the missing brand identity (§2), and the duplicated status colors
(§5).

---

## 2. Color model — ink primary + YIIVA brand accent (D1, D2)

**Decision (proposed):** keep **`--primary` = ink (near-black)** — it matches
athena's *existing* black-button / black-wordmark identity and reads timeless
(Vercel/Linear/Stripe all do near-black primary). Introduce a **separate
`--brand` accent** for the "wow" — used on active nav, links, focus rings, key
highlights, positive trends, and the primary chart series. This keeps buttons
classy and lets the brand color *pop* where it matters instead of shouting from
every CTA.

### The brand accent — ✅ LOCKED: YIIVA Violet (D1, 2026-07-01)

The app had **no brand color** (logo `ICON_BLACK.png`, all greyscale). Decision:

| Locked | Hue (oklch) | ~Hex | Reads as |
|---|---|---|---|
| **YIIVA Violet** | `oklch(0.55 0.23 285)` | `#6d28d9` | premium, creative, modern-tech |

Alternates considered and set aside: Coral/Terracotta `oklch(0.66 0.19 32)`,
Emerald `oklch(0.60 0.15 162)`. If real brand guidelines surface later, `--brand`
is the single swap point and everything downstream inherits it.

### Token set (light) — shadcn zinc base + YIIVA brand + semantic

```css
:root {
  --radius: 0.625rem;                     /* 10px base; see §6 */

  --background:        oklch(1 0 0);            /* white */
  --foreground:        oklch(0.21 0.006 285);   /* zinc-950 ink */

  --card:              oklch(1 0 0);
  --card-foreground:   oklch(0.21 0.006 285);
  --popover:           oklch(1 0 0);
  --popover-foreground:oklch(0.21 0.006 285);

  --primary:           oklch(0.21 0.006 285);   /* INK — buttons, wordmark */
  --primary-foreground:oklch(0.985 0 0);

  --brand:             oklch(0.55 0.23 285);    /* YIIVA accent (D1) */
  --brand-foreground:  oklch(0.985 0 0);
  --brand-subtle:      oklch(0.96 0.03 285);    /* tint bg for active states */

  --secondary:         oklch(0.967 0.001 286);  /* zinc-100 */
  --secondary-foreground: oklch(0.21 0.006 285);
  --muted:             oklch(0.967 0.001 286);
  --muted-foreground:  oklch(0.55 0.014 286);   /* zinc-500 */
  --accent:            oklch(0.967 0.001 286);
  --accent-foreground: oklch(0.21 0.006 285);

  --border:            oklch(0.92 0.004 286);   /* zinc-200 */
  --input:             oklch(0.92 0.004 286);
  --ring:              oklch(0.55 0.23 285);     /* brand — focus rings */

  /* Semantic (D-single-source; consumed by status maps §5, charts §6) */
  --success:           oklch(0.60 0.15 162);
  --success-foreground:oklch(0.985 0 0);
  --warning:           oklch(0.72 0.16 75);
  --warning-foreground:oklch(0.21 0.006 285);
  --danger:            oklch(0.58 0.22 27);      /* destructive */
  --danger-foreground: oklch(0.985 0 0);
  --info:              oklch(0.60 0.13 240);
  --info-foreground:   oklch(0.985 0 0);

  /* Chart series (§6) — brand-led, works in both themes */
  --chart-1: oklch(0.55 0.23 285);   /* brand */
  --chart-2: oklch(0.60 0.15 162);   /* success/green */
  --chart-3: oklch(0.60 0.13 240);   /* info/blue */
  --chart-4: oklch(0.72 0.16 75);    /* warning/amber */
  --chart-5: oklch(0.65 0.20 350);   /* pink */
}
```

### Token set (dark) — D4

```css
.dark {
  --background:        oklch(0.16 0.004 285);
  --foreground:        oklch(0.985 0 0);
  --card:              oklch(0.21 0.006 285);
  --card-foreground:   oklch(0.985 0 0);
  --popover:           oklch(0.21 0.006 285);
  --popover-foreground:oklch(0.985 0 0);

  --primary:           oklch(0.985 0 0);         /* invert: light primary on dark */
  --primary-foreground:oklch(0.21 0.006 285);

  --brand:             oklch(0.68 0.19 285);     /* lifted for dark contrast */
  --brand-foreground:  oklch(0.16 0.004 285);
  --brand-subtle:      oklch(0.27 0.06 285);

  --secondary:         oklch(0.27 0.006 286);
  --secondary-foreground: oklch(0.985 0 0);
  --muted:             oklch(0.27 0.006 286);
  --muted-foreground:  oklch(0.71 0.01 286);
  --accent:            oklch(0.27 0.006 286);
  --accent-foreground: oklch(0.985 0 0);

  --border:            oklch(1 0 0 / 10%);
  --input:             oklch(1 0 0 / 15%);
  --ring:              oklch(0.68 0.19 285);

  --success: oklch(0.70 0.15 162); --success-foreground: oklch(0.16 0.004 285);
  --warning: oklch(0.80 0.16 75);  --warning-foreground: oklch(0.16 0.004 285);
  --danger:  oklch(0.70 0.19 22);  --danger-foreground:  oklch(0.985 0 0);
  --info:    oklch(0.70 0.13 240); --info-foreground:    oklch(0.16 0.004 285);

  --chart-1: oklch(0.68 0.19 285); --chart-2: oklch(0.70 0.15 162);
  --chart-3: oklch(0.70 0.13 240); --chart-4: oklch(0.80 0.16 75);
  --chart-5: oklch(0.72 0.18 350);
}
```

### `@theme inline` mapping (makes them Tailwind utilities)

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-primary: var(--primary);
  --color-brand: var(--brand);
  --color-brand-subtle: var(--brand-subtle);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-border: var(--border);
  --color-ring: var(--ring);
  --color-success: var(--success);
  --color-warning: var(--warning);
  --color-danger: var(--danger);
  --color-info: var(--info);
  --color-chart-1: var(--chart-1); /* …2–5 */
  --radius-lg: var(--radius);
  --radius-md: calc(var(--radius) - 2px);
  --radius-sm: calc(var(--radius) - 4px);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}
```

→ yields `bg-brand`, `text-brand`, `ring-ring`, `text-muted-foreground`,
`bg-success/10`, `rounded-lg`, etc. — semantic classes, theme-aware for free.

---

## 3. Neutral: standardize on `zinc`, retire `gray` (D3)

Audit: **672** `zinc-*` uses vs **452** `gray-*`, sometimes in the same file.
This split is the #1 driver of the "cheap/inconsistent" look. Decision: **zinc
wins** (already dominant; shadcn's default neutral option). Migration is mostly a
mechanical `gray-N → zinc-N` sweep, but the *right* end-state is neutrals routed
through semantic tokens (`text-muted-foreground`, `border-border`, `bg-card`)
rather than raw `zinc-N`, so a future rebrand is one-file.

- Keep raw `zinc-N` only where a semantic token doesn't fit.
- `text-black` / `#09090b` → `text-foreground`. `bg-white` (as a surface) →
  `bg-card` or `bg-background`.

---

## 4. Typography

Keep **Geist Sans / Geist Mono** (already loaded via `next/font` in
`app/layout.tsx`). The gap is *scale discipline*, not the typeface. Standardize a
small set and stop mixing `font-bold` vs `font-semibold` and `text-black` vs
`text-zinc-950` for the same role.

| Role | Class recipe |
|---|---|
| Page title (h1) | `text-2xl font-semibold tracking-tight text-foreground` |
| Section title (h2) | `text-lg font-semibold text-foreground` |
| Card/stat value | `text-2xl font-semibold tabular-nums text-foreground` |
| Body | `text-sm text-foreground` |
| Label | `text-sm font-medium text-foreground` |
| Helper / meta | `text-xs text-muted-foreground` |
| Overline | `text-xs font-medium uppercase tracking-wide text-muted-foreground` |

Rules: headings `font-semibold` (never `font-bold`); numbers/money use
`tabular-nums`; muted text always `text-muted-foreground` (never raw `zinc-500`).

---

## 5. Semantic status colors — one source of truth

Audit found order status mapped **twice with different colors**
(`orders/page.tsx` STATUS_CONFIG = yellow/blue/purple/indigo vs
`active-store.tsx` ORDER_STATUS_CHIP = grey/black). Fix: **one module**
`lib/order-status.ts` exporting `{ label, tone }` per `OrderStatus`, where `tone`
∈ the semantic set below. Both screens (and any future one) import it. The
existing `components/ui/status-pill.tsx` tone system is the seed — fold it into a
shadcn `Badge` with `variant` = tone.

| Tone | Token | Used for |
|---|---|---|
| `neutral` | `muted` | pending, draft |
| `info` | `info` | confirmed, processing |
| `brand` | `brand` | in-transit, dispatched (in-motion) |
| `success` | `success` | delivered, active, paid |
| `warning` | `warning` | review, action-needed |
| `danger` | `danger` | cancelled, refund, rejected |

Badge renders as `bg-{tone}/10 text-{tone}` (subtle) — consistent everywhere,
theme-aware, one edit to restyle all statuses.

---

## 6. Spacing, radius, shadow

- **Radius**: base `--radius: 0.625rem` (10px). Cards/inputs/buttons →
  `rounded-lg`; pills/avatars → `rounded-full`. Retire the ad-hoc
  `rounded-lg`↔`rounded-xl` mix (49× xl / 73× lg today).
- **Elevation**: flat-first. Surfaces = `border border-border` + `bg-card`;
  `shadow-sm` only on raised cards; `shadow-lg`/`shadow-xl` reserved for
  popovers/dialogs (Radix-managed). Retire stray `shadow-xl` on flat cards.
- **Spacing scale**: page gutter `px-6 py-8` (or `p-6`), card padding `p-5`/`p-6`,
  stack gaps `gap-4`/`gap-6`, tight inline `gap-2`. Pick from
  {2,3,4,6,8} — stop free-styling `gap-1.5`/`gap-5`.

---

## 7. Dark mode (D4)

Cheap once tokens exist: add `next-themes`, `ThemeProvider` in root layout,
`darkMode` via the `.dark` class (Tailwind v4 `@custom-variant dark`). Every
component already speaking tokens (§2) flips automatically. Ship **light-default
+ a toggle** in the app shell. This is the payoff of doing tokens right — dark
mode is ~an afternoon, not a rewrite.

---

## 8. Utilities to add

shadcn requires these (currently absent — audit confirmed no `clsx`/`cva`/
`tailwind-merge`):

- `class-variance-authority` — type-safe variant maps (replaces the hand-rolled
  `variants: Record<string,string>` in `button.tsx`).
- `clsx` + `tailwind-merge` → the standard `cn()` helper in `lib/utils.ts`.
- `next-themes` — dark mode.
- `tw-animate-css` (or shadcn's animate setup) — enter/exit for Radix overlays.

Verify each resolves cleanly on React 19.2 / Next 16.2 / Tailwind 4 at install
time (all are known-compatible as of the shadcn Tailwind-v4 release, but pin and
smoke-test).
