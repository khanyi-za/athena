// Currency helpers for ZAR. Backend stores all prices as integer cents.
// Display surface always shows `R 249.00` per docs/Api-frontend-contracts/product-frontend-flows.md §12.2.

/**
 * Formats integer cents as a ZAR string with a space after the prefix and two decimals.
 *   24900   -> "R 249.00"
 *   0       -> "R 0.00"
 *   null    -> ""  (caller can substitute a placeholder)
 */
export function formatZAR(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return ''
  const rands = cents / 100
  const formatted = rands.toLocaleString('en-ZA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return `R ${formatted}`
}

/**
 * Parses a user-entered ZAR string into integer cents.
 *   "249"       -> 24900
 *   "249.5"     -> 24950
 *   "R 249.00"  -> 24900
 *   "1 499,99"  -> 149999 (handles en-ZA comma decimal too)
 *   ""          -> null
 *   "abc"       -> null
 *
 * Negative inputs return null — the caller should reject at the field level.
 */
export function parseZAR(input: string): number | null {
  if (!input || typeof input !== 'string') return null

  // Strip currency prefix, spaces, and convert any comma decimal to a dot.
  const cleaned = input
    .replace(/[Rr]/g, '')
    .replace(/\s/g, '')
    .replace(/,/g, '.')
    .trim()

  if (cleaned === '') return null

  const value = Number(cleaned)
  if (!Number.isFinite(value) || value < 0) return null

  return Math.round(value * 100)
}
