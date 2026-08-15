'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { VerifyCodeForm } from '@/components/auth/verify-code-form'

// Code-entry verification for users who left the register flow (e.g. login
// bounced them here with a 403). Their original code has likely expired, so
// the resend button is available immediately (initialCooldown 0).
function VerifyEmailInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const email = searchParams.get('email')

  useEffect(() => {
    // No email — someone navigated here manually
    if (!email) router.replace('/login')
  }, [email, router])

  if (!email) return null

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Verify your email</h1>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          Enter the 6-digit code we sent to{' '}
          <span className="font-medium text-foreground">{email}</span>. If your code has expired,
          request a new one below.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">Codes expire after 10 minutes.</p>
      </div>
      <VerifyCodeForm email={email} initialCooldown={0} />
      <Link href="/login" className="text-center text-sm font-medium text-brand hover:underline">
        Back to sign in
      </Link>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center gap-5 py-4 text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-brand" />
          <p className="mt-2 text-sm text-muted-foreground">Loading&hellip;</p>
        </div>
      }
    >
      <VerifyEmailInner />
    </Suspense>
  )
}
