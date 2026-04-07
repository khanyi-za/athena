'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/store/auth-store'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setAuth, clearAuth, setInitializing } = useAuthStore()

  useEffect(() => {
    async function initAuth() {
      try {
        const res = await fetch('/api/auth/refresh', { method: 'POST' })
        if (res.ok) {
          const { accessToken, user } = await res.json()
          setAuth(accessToken, user)
        } else {
          clearAuth()
        }
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
