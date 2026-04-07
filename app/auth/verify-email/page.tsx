'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth-store'
import type { User } from '@/types/auth'

type VerifyStatus = 'loading' | 'success' | 'error'

function resolveRedirect(user: User): string {
  if (user.role === 'MERCHANT' || user.role === 'ADMIN') return '/dashboard'
  if (user.store?.status === 'ACTIVE') return '/dashboard'
  // Brand new BUYER — send to onboarding intent screen
  return '/onboarding'
}

function VerifyEmailInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [status, setStatus] = useState<VerifyStatus>('loading')

  useEffect(() => {
    const token = searchParams.get('token')

    // No token — someone navigated here manually
    if (!token) {
      router.replace('/login')
      return
    }

    fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        if (res.ok) {
          const { accessToken, user } = await res.json()
          setAuth(accessToken, user)
          setStatus('success')
          router.replace(resolveRedirect(user))
        } else {
          setStatus('error')
        }
      })
      .catch(() => setStatus('error'))
  }, [searchParams, setAuth, router])

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center gap-5 py-4 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-950" />
        <div>
          <h1 className="text-xl font-semibold text-zinc-950">Verifying your email</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Just a moment while we activate your account.
          </p>
        </div>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center gap-5 py-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-950">
          <CheckIcon />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-zinc-950">Email verified</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Your account is active. Redirecting you now&hellip;
          </p>
        </div>
      </div>
    )
  }

  // error state — invalid or expired token
  return (
    <div className="flex flex-col items-center gap-5 py-4 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-zinc-200 text-zinc-400">
        <XIcon />
      </div>
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-zinc-950">Link expired</h1>
        <p className="text-sm text-zinc-500">This link is invalid or has expired.</p>
        <p className="text-xs text-zinc-400">Verification links are valid for 24 hours.</p>
      </div>
      <Link href="/register" className="text-sm font-medium text-zinc-950 hover:underline">
        Request a new verification email
      </Link>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center gap-5 py-4 text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-950" />
          <p className="mt-2 text-sm text-zinc-500">Loading&hellip;</p>
        </div>
      }
    >
      <VerifyEmailInner />
    </Suspense>
  )
}

function CheckIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}
