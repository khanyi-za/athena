'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getPlatformCategories } from '@/lib/api/categories'

// React Query wrapper for the public category tree. The endpoint is public
// (no auth) but we still want caching + invalidation when admins mutate.

const KEY = 'platform-categories' as const

export function useCategoriesTree() {
  return useQuery({
    queryKey: [KEY],
    queryFn: getPlatformCategories,
  })
}

export function useInvalidateCategoriesTree() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: [KEY] })
}
