import type { Collection } from '@/lib/schemas/collection'

// Local cache for merchant-side collections. Per product-frontend-flows.md §9,
// there is **no `GET /stores/:storeId/collections` merchant endpoint**. The
// public `GET /stores/:slug/collections` only returns results for ACTIVE
// stores. For pre-ACTIVE stores (APPROVED, PENDING_GO_LIVE) — which is where
// merchants are setting up — the frontend maintains a local list, populated
// by create/update calls and persisted to localStorage so it survives reload.
//
// Backend follow-up: once a merchant GET endpoint exists, this cache can be
// removed in favour of a normal React Query fetch.

const KEY_PREFIX = 'yiiva_collections_'

function keyFor(storeId: string): string {
  return `${KEY_PREFIX}${storeId}`
}

/**
 * Read the cached collections for a store. Returns [] on SSR, no entry, or
 * any parse error (corrupted localStorage is treated as empty).
 */
export function getCachedCollections(storeId: string): Collection[] {
  if (typeof window === 'undefined') return []
  const raw = window.localStorage.getItem(keyFor(storeId))
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isValidCollection)
  } catch {
    return []
  }
}

/**
 * Overwrite the cache for a store. Caller passes the full new list.
 */
export function setCachedCollections(
  storeId: string,
  collections: Collection[],
): void {
  if (typeof window === 'undefined') return
  if (collections.length === 0) {
    window.localStorage.removeItem(keyFor(storeId))
    return
  }
  window.localStorage.setItem(keyFor(storeId), JSON.stringify(collections))
}

/**
 * Wipe the cache for a store. Useful if we ever surface a "logout" or
 * "switch store" path.
 */
export function clearCachedCollections(storeId: string): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(keyFor(storeId))
}

// Defensive shape check — if a future schema bump adds required fields, old
// localStorage entries are dropped rather than crashing the UI.
function isValidCollection(value: unknown): value is Collection {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.id === 'string' &&
    typeof v.storeId === 'string' &&
    typeof v.name === 'string' &&
    typeof v.slug === 'string'
  )
}
