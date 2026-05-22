'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { fetchAuthMe } from '@/lib/fetch-auth-me'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setAuth, clearAuth, setInitializing } = useAuthStore()

  useEffect(() => {
    async function initAuth() {
      try {
        const refreshRes = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include',
        })

        if (!refreshRes.ok) {
          clearAuth()
          return
        }

        const { accessToken, user: slimUser } = await refreshRes.json()

        // Hydrate the full profile (store, accountStatus, phone, verification flags,
        // createdAt) via /auth/me before downstream components mount. If /auth/me
        // fails (network blip, 5xx), fall back to the slim user — consumers that
        // need the full shape can refetch on demand.
        const fullUser = await fetchAuthMe(accessToken)
        setAuth(accessToken, fullUser ?? slimUser)
      } catch {
        clearAuth()
      } finally {
        setInitializing(false)
      }
    }

    initAuth()
  }, [setAuth, clearAuth, setInitializing])

  return <>{children}</>
}
