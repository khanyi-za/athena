'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getStoreMe } from '@/lib/api/store'
import { useAuthStore } from '@/store/auth-store'

// React Query wrapper around GET /stores/me. Returns the full store record
// (with addresses, employees, _count) — distinct from /auth/me's slim store
// summary which is used only for routing.
//
// The wizard hydrates from this; the readiness checklist (M4) and live-store
// dashboard (M6) consume it too. Invalidate after any PATCH/POST that mutates
// store state so subsequent reads stay fresh.

const STORE_ME_KEY = ['store-me'] as const

export function useStoreMe() {
  const accessToken = useAuthStore((s) => s.accessToken)
  return useQuery({
    queryKey: STORE_ME_KEY,
    queryFn: getStoreMe,
    enabled: !!accessToken,
  })
}

export function useInvalidateStoreMe() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: STORE_ME_KEY })
}
