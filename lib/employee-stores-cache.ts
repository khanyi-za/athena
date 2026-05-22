// Local cache for an employee's accepted stores. Per
// docs/Api-frontend-contracts/employee-journey.md §5 + §7:
//
//   - On every accept, append the store summary to localStorage under
//     `yiiva_employee_stores_${userId}` (array shape)
//   - On every login (returning session), read the array to figure out where
//     to send the user — single-store auto-routes, multi-store picker, zero
//     entries falls through to the buyer matrix
//
// The array shape (not a single value) is critical: it supports employees who
// work for multiple merchants without forcing overwrite on every new accept.
// `/auth/me` doesn't list employments, so this is the v1 mechanism. Coordinate
// with backend to add an employments endpoint as a follow-up.

const KEY_PREFIX = 'yiiva_employee_stores_'

export interface EmployeeStoreEntry {
  id: string
  displayName: string
  slug: string
  /** ISO 8601 — bumped on every accept + every successful dashboard entry. */
  lastAccessedAt: string
}

function keyFor(userId: string): string {
  return `${KEY_PREFIX}${userId}`
}

/**
 * Read the cached entries for a user. Returns [] on SSR, no entry, or any
 * parse error (corrupted localStorage is treated as empty).
 */
export function getEmployeeStores(userId: string): EmployeeStoreEntry[] {
  if (typeof window === 'undefined') return []
  const raw = window.localStorage.getItem(keyFor(userId))
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    // Defensive: filter out entries missing required fields. If localStorage
    // was tampered with or schema-evolved, this avoids surfacing junk.
    return parsed.filter(isValidEntry)
  } catch {
    return []
  }
}

/**
 * Add a new entry or update the existing one's lastAccessedAt + branding.
 * Idempotent — call on every accept and on every dashboard entry.
 */
export function upsertEmployeeStore(
  userId: string,
  entry: { id: string; displayName: string; slug: string },
): void {
  if (typeof window === 'undefined') return
  const existing = getEmployeeStores(userId)
  const now = new Date().toISOString()
  const filtered = existing.filter((e) => e.id !== entry.id)
  filtered.push({
    id: entry.id,
    displayName: entry.displayName,
    slug: entry.slug,
    lastAccessedAt: now,
  })
  window.localStorage.setItem(keyFor(userId), JSON.stringify(filtered))
}

/**
 * Prune an entry. Used when a 403 from /stores/:id/employees indicates the
 * employee has been deactivated/removed by that owner.
 */
export function removeEmployeeStore(userId: string, storeId: string): void {
  if (typeof window === 'undefined') return
  const existing = getEmployeeStores(userId)
  const next = existing.filter((e) => e.id !== storeId)
  if (next.length === 0) {
    window.localStorage.removeItem(keyFor(userId))
    return
  }
  window.localStorage.setItem(keyFor(userId), JSON.stringify(next))
}

/**
 * Bump lastAccessedAt for an entry. Cheap; used by the returning-session
 * router after a successful dashboard entry so the picker (if multi-store)
 * shows the right "last worked on" ordering.
 */
export function touchEmployeeStore(userId: string, storeId: string): void {
  if (typeof window === 'undefined') return
  const existing = getEmployeeStores(userId)
  const target = existing.find((e) => e.id === storeId)
  if (!target) return
  upsertEmployeeStore(userId, {
    id: target.id,
    displayName: target.displayName,
    slug: target.slug,
  })
}

function isValidEntry(value: unknown): value is EmployeeStoreEntry {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.id === 'string' &&
    typeof v.displayName === 'string' &&
    typeof v.slug === 'string' &&
    typeof v.lastAccessedAt === 'string'
  )
}
