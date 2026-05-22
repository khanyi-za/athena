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

    // Clear local state and redirect immediately — server revocation is fire-and-forget
    clearAuth()
    router.push('/login')

    fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
    }).catch(() => null)
  }

  return (
    <Button variant="ghost" fullWidth={false} loading={loading} onClick={handleLogout}>
      Sign out
    </Button>
  )
}
