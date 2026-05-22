'use client'

import { useQuery } from '@tanstack/react-query'
import { getPlatformCategories } from '@/lib/api/categories'

// React Query wrapper for the public platform-category tree. Used by the
// product editor's category picker. The taxonomy is stable (weekly-to-monthly
// admin changes per the admin journey doc) so we lean on a long staleTime
// to avoid re-fetching on every picker open.

const KEY = ['platform-categories'] as const

export function usePlatformCategories() {
  return useQuery({
    queryKey: KEY,
    queryFn: getPlatformCategories,
    // The category tree rarely changes. 5 minutes is generous without being stale.
    staleTime: 5 * 60 * 1000,
  })
}
