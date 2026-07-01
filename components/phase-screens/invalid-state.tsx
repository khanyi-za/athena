'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'

// Fallback for "should never occur" combos from auth-frontend-flows.md §3.1.
// Per spec: "fall back to a 'Something looks off — refreshing your session' UI
// that triggers a logout-and-relogin cycle."

export function InvalidStateScreen({ reason }: { reason: string }) {
  const router = useRouter()
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const accessToken = useAuthStore((s) => s.accessToken)

  useEffect(() => {
    // Log so the bug is visible in the error tracker once we have one.
    console.error('[routing-matrix] invalid state:', reason)
  }, [reason])

  async function handleRefresh() {
    if (accessToken) {
      // Fire-and-forget logout; clear local state regardless.
      fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      }).catch(() => null)
    }
    clearAuth()
    router.push('/login')
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 py-10 text-center">
      <h1 className="text-2xl font-semibold text-foreground">Something looks off</h1>
      <p className="text-sm text-muted-foreground leading-relaxed">
        We&apos;re refreshing your session to get back on track.
      </p>
      <div>
        <button
          type="button"
          onClick={handleRefresh}
          className="inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground hover:bg-brand/90 transition-colors"
        >
          Sign in again
        </button>
      </div>
    </div>
  )
}
