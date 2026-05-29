'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth-store'
import { getCollections } from '@/lib/api/collections'
import {
  getCachedCollections,
  setCachedCollections,
} from '@/lib/collections-cache'
import type { Collection } from '@/lib/schemas/collection'

// Merchant-side collection list. Backend exposes `GET /stores/:storeId/collections`
// (added in M10) — that's the canonical source of truth. The localStorage
// cache acts as a degraded-mode fallback: we read it as the immediate render
// (so the UI isn't blank during the network round-trip), then overwrite with
// the server result on success. On network failure the cache stays.

const KEY = 'merchant-collections' as const

type CollectionsKey = readonly [typeof KEY, string | null | undefined]

export function useCollections(storeId: string | null | undefined) {
  const accessToken = useAuthStore((s) => s.accessToken)
  return useQuery<Collection[], Error, Collection[], CollectionsKey>({
    queryKey: [KEY, storeId] as const,
    queryFn: async () => {
      if (!storeId) return []
      try {
        const fresh = await getCollections(storeId)
        setCachedCollections(storeId, fresh)
        return fresh
      } catch (err) {
        // Network / 5xx / parse fail — fall back to the local snapshot so
        // the page still renders something useful. 401/403 don't land here
        // — apiFetch handles those at a higher level.
        const cached = getCachedCollections(storeId)
        if (cached.length > 0) return cached
        throw err
      }
    },
    enabled: !!accessToken && !!storeId,
    // Initial render uses the cache so the first paint isn't empty.
    initialData: (): Collection[] | undefined => {
      if (!storeId) return undefined
      const cached = getCachedCollections(storeId)
      return cached.length > 0 ? cached : undefined
    },
    refetchOnWindowFocus: true,
  })
}

/**
 * Insert a freshly created collection into the cache, or replace an existing
 * one by id. Call after a successful create or update.
 */
export function useUpsertCollectionInCache() {
  const queryClient = useQueryClient()
  return (storeId: string, collection: Collection) => {
    queryClient.setQueryData<Collection[]>([KEY, storeId], (prev = []) => {
      const idx = prev.findIndex((c) => c.id === collection.id)
      const next =
        idx >= 0
          ? prev.map((c) => (c.id === collection.id ? collection : c))
          : [...prev, collection]
      setCachedCollections(storeId, next)
      return next
    })
  }
}

/**
 * Drop a collection from the cache. Call after a successful delete.
 */
export function useRemoveCollectionFromCache() {
  const queryClient = useQueryClient()
  return (storeId: string, collectionId: string) => {
    queryClient.setQueryData<Collection[]>([KEY, storeId], (prev = []) => {
      const next = prev.filter((c) => c.id !== collectionId)
      setCachedCollections(storeId, next)
      return next
    })
  }
}

/**
 * Bump the _count.products on a cached collection by ±1 when a product is
 * added or removed. Idempotent — clamps at zero.
 */
export function useAdjustCollectionProductCount() {
  const queryClient = useQueryClient()
  return (storeId: string, collectionId: string, delta: 1 | -1) => {
    queryClient.setQueryData<Collection[]>([KEY, storeId], (prev = []) => {
      const next = prev.map((c) => {
        if (c.id !== collectionId) return c
        const current = c._count?.products ?? 0
        return {
          ...c,
          _count: { products: Math.max(0, current + delta) },
        }
      })
      setCachedCollections(storeId, next)
      return next
    })
  }
}
