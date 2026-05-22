'use client'

import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth-store'
import { fetchAuthMe } from '@/lib/fetch-auth-me'

// React Query wrapper around /auth/me that refetches on tab focus and pipes the
// result back into the Zustand auth store. Mount it anywhere a screen needs to
// observe live user state — most importantly the PENDING_REVIEW / PENDING_GO_LIVE
// waiting states, which detect admin approval via this refetch.
//
// Why Zustand stays the canonical source: existing components (login, verify-email,
// AuthProvider) already read from Zustand. This hook keeps that contract and uses
// React Query purely as a refresh trigger.

export function useAuthMeRefresh() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const setAuth = useAuthStore((s) => s.setAuth)

  const query = useQuery({
    queryKey: ['auth-me', accessToken],
    queryFn: () => {
      if (!accessToken) return null
      return fetchAuthMe(accessToken)
    },
    enabled: !!accessToken,
    // Inherits refetchOnWindowFocus + staleTime from the QueryProvider defaults.
  })

  // Sync the fetched profile back into Zustand whenever the query succeeds with
  // a non-null value. We don't tear down auth on transient failures — fetchAuthMe
  // already returns null on schema mismatches / network errors, and we keep the
  // last-known user intact in that case.
  useEffect(() => {
    if (query.data && accessToken) {
      setAuth(accessToken, query.data)
    }
  }, [query.data, accessToken, setAuth])

  return query
}
