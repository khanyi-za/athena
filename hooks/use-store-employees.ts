'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getEmployees } from '@/lib/api/employees'
import { useAuthStore } from '@/store/auth-store'

// React Query wrapper for GET /stores/:storeId/employees. Caches per-storeId
// so a future store-switcher invalidates surgically. The list returned here is
// the complete record (pending + active + deactivated) — distinct from the
// employees array on /stores/me which only includes isActive: true.

const KEY = 'store-employees' as const

export function useStoreEmployees(storeId: string | null | undefined) {
  const accessToken = useAuthStore((s) => s.accessToken)
  return useQuery({
    queryKey: [KEY, storeId],
    queryFn: () => getEmployees(storeId as string),
    enabled: !!accessToken && !!storeId,
  })
}

export function useInvalidateStoreEmployees() {
  const queryClient = useQueryClient()
  return (storeId?: string) => {
    if (storeId) {
      return queryClient.invalidateQueries({ queryKey: [KEY, storeId] })
    }
    return queryClient.invalidateQueries({ queryKey: [KEY] })
  }
}
