'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import { Button } from '@/components/ui/button'

export function LogoutButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { accessToken, clearAuth } = useAuthStore()

  async function handleLogout() {
    setLoading(true)

    // Await the logout fetch so the Set-Cookie response actually clears the
    // refresh token cookie BEFORE we navigate. If we redirected immediately,
    // the middleware would still see the cookie on the /login request and
    // bounce us back to /dashboard — which then renders <Splash /> forever
    // because Zustand has user: null.
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      })
    } catch {
      // Best-effort. If the request never lands (network down), still clear
      // local state and try to navigate — the cookie will eventually expire,
      // and a manual refresh recovers the user from any in-between state.
    }

    clearAuth()
    router.push('/login')
  }

  return (
    <Button variant="ghost" fullWidth={false} loading={loading} onClick={handleLogout}>
      Sign out
    </Button>
  )
}
