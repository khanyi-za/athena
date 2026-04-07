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

    // Clear local state immediately — logout must feel instant
    clearAuth()

    // Best-effort server-side token revocation
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      })
    } catch {
      // Ignore — local state is already cleared
    }

    router.push('/login')
  }

  return (
    <Button variant="ghost" fullWidth={false} loading={loading} onClick={handleLogout}>
      Sign out
    </Button>
  )
}
