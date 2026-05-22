'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getActiveProductCount } from '@/lib/api/products'
import { useAuthStore } from '@/store/auth-store'

// React Query wrapper for the active-product-count gate used by the go-live
// readiness checklist. Keyed by storeId so cache survives across renders and
// the invalidate helper can target a specific store (relevant once we have a
// store switcher — not in M4, but cheap to design for).

const KEY = 'active-product-count' as const

export function useActiveProductCount(storeId: string | null | undefined) {
  const accessToken = useAuthStore((s) => s.accessToken)
  return useQuery({
    queryKey: [KEY, storeId],
    queryFn: () => getActiveProductCount(storeId as string),
    enabled: !!accessToken && !!storeId,
  })
}

export function useInvalidateActiveProductCount() {
  const queryClient = useQueryClient()
  return (storeId?: string) => {
    if (storeId) {
      return queryClient.invalidateQueries({ queryKey: [KEY, storeId] })
    }
    return queryClient.invalidateQueries({ queryKey: [KEY] })
  }
}
