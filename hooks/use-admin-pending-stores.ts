'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getAdminPendingStores } from '@/lib/api/store'
import { useAuthStore } from '@/store/auth-store'
import type { AdminQueueFilters } from '@/lib/schemas/store'

// React Query wrapper for the first-review queue. Each filter combination
// caches independently. Refetch-on-focus comes from QueryClient defaults —
// useful since admins may work multiple browser windows.

const KEY = 'admin-pending-stores' as const

export function useAdminPendingStores(filters: AdminQueueFilters = {}) {
  const accessToken = useAuthStore((s) => s.accessToken)
  return useQuery({
    queryKey: [KEY, filters],
    queryFn: () => getAdminPendingStores(filters),
    enabled: !!accessToken,
  })
}

export function useInvalidateAdminPendingStores() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: [KEY] })
}
