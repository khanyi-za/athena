'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { useAuthStore } from '@/store/auth-store'

type ResetStatus = 'form' | 'success' | 'expired'

function ResetPasswordInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const clearAuth = useAuthStore((s) => s.clearAuth)

  const token = searchParams.get('token')

  const [status, setStatus] = useState<ResetStatus>(token ? 'form' : 'expired')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 400 && data.message === 'Invalid or expired reset token') {
          setStatus('expired')
        } else if (res.status === 400) {
          const messages = Array.isArray(data.message)
            ? data.message.join(' ')
            : data.message
          setError(messages)
        } else if (res.status === 429) {
          setError('Too many attempts. Please wait a moment and try again.')
        } else {
          setError('Something went wrong. Please try again.')
        }
        return
      }

      // Backend revokes all sessions on success — clear local state
      clearAuth()
      setStatus('success')
      setTimeout(() => router.push('/login'), 2000)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'expired') {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-950">Link expired</h1>
          <p className="mt-2 text-sm text-zinc-500 leading-relaxed">
            This reset link is invalid or has expired. Reset links are valid for 1 hour.
          </p>
        </div>
        <Link
          href="/auth/forgot-password"
          className="text-center text-sm font-medium text-zinc-950 hover:underline"
        >
          Request a new link
        </Link>
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
          <h1 className="text-xl font-semibold text-zinc-950">Password updated</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Your password has been changed. Redirecting you to sign in&hellip;
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-950">Set a new password</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Must be at least 8 characters with an uppercase letter, lowercase letter, and number.
        </p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <form className="flex flex-col gap-5" noValidate onSubmit={handleSubmit}>
        <Input
          id="password"
          label="New password"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          required
        />
        <Input
          id="confirmPassword"
          label="Confirm new password"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={loading}
          required
        />
        <Button type="submit" loading={loading}>
          Update password
        </Button>
      </form>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-950" />
        </div>
      }
    >
      <ResetPasswordInner />
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
