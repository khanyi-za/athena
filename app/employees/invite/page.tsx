'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

// Defensive redirect. The canonical employee-invite URL is /invites/accept
// per employee-journey.md §3. Backend email templates have at times been
// generated with /employees/invite instead — this shim keeps any such
// link working by forwarding the token to the right route.
//
// If the canonical URL ever drifts again, fix the email template; this shim
// is the safety net, not the source of truth.

export default function EmployeeInviteRedirectPage() {
  return (
    <Suspense fallback={null}>
      <RedirectInner />
    </Suspense>
  )
}

function RedirectInner() {
  const router = useRouter()
  const params = useSearchParams()

  useEffect(() => {
    const token = params.get('token') ?? ''
    const target = token
      ? `/invites/accept?token=${encodeURIComponent(token)}`
      : '/invites/accept'
    router.replace(target)
  }, [router, params])

  return null
}
