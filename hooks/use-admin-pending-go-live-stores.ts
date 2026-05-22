'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getAdminPendingGoLiveStores } from '@/lib/api/store'
import { useAuthStore } from '@/store/auth-store'
import type { AdminQueueFilters } from '@/lib/schemas/store'

// React Query wrapper for the go-live queue. Same pattern as the first-review
// queue hook — separate query key so the two queues cache independently.

const KEY = 'admin-pending-go-live-stores' as const

export function useAdminPendingGoLiveStores(filters: AdminQueueFilters = {}) {
  const accessToken = useAuthStore((s) => s.accessToken)
  return useQuery({
    queryKey: [KEY, filters],
    queryFn: () => getAdminPendingGoLiveStores(filters),
    enabled: !!accessToken,
  })
}

export function useInvalidateAdminPendingGoLiveStores() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: [KEY] })
}
