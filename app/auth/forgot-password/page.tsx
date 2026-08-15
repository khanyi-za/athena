'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { useAuthStore } from '@/store/auth-store'

const RESEND_COOLDOWN_S = 60

type Step = 'email' | 'reset' | 'success'

// Two-step reset: request a 6-digit code by email, then enter code + new
// password on the same page. Replaces the old emailed-link flow.
export default function ForgotPasswordPage() {
  const router = useRouter()
  const clearAuth = useAuthStore((s) => s.clearAuth)

  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resendIn, setResendIn] = useState(0)

  useEffect(() => {
    if (resendIn <= 0) return
    const timer = setTimeout(() => setResendIn((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendIn])

  async function requestCode(): Promise<boolean> {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email }),
    })

    if (res.status === 429) {
      setError('Too many attempts. Please wait a moment and try again.')
      return false
    }
    if (res.status === 400) {
      setError('Please enter a valid email address.')
      return false
    }
    return true
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Always advances on 2xx — backend never reveals whether the email exists
      if (await requestCode()) {
        setStep('reset')
        setResendIn(RESEND_COOLDOWN_S)
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    setError(null)
    setNotice(null)
    try {
      if (await requestCode()) {
        setCode('')
        setResendIn(RESEND_COOLDOWN_S)
        setNotice('If an account with that email exists, a new code is on its way.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    }
  }

  async function handleResetSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setNotice(null)

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
        body: JSON.stringify({ email, code, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 400) {
          const messages = Array.isArray(data.message)
            ? data.message.join(' ')
            : data.message
          setError(messages ?? 'Invalid or expired reset code')
        } else if (res.status === 429) {
          setError('Too many attempts. Please wait a moment and try again.')
        } else {
          setError('Something went wrong. Please try again.')
        }
        return
      }

      // Backend revokes all sessions on success — clear local state
      clearAuth()
      setStep('success')
      setTimeout(() => router.push('/login'), 2000)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'success') {
    return (
      <div className="flex flex-col items-center gap-5 py-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand">
          <CheckIcon />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground">Password updated</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your password has been changed. Redirecting you to sign in&hellip;
          </p>
        </div>
      </div>
    )
  }

  if (step === 'reset') {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Check your inbox</h1>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            If an account with that email exists, we sent a 6-digit code to{' '}
            <span className="font-medium text-foreground">{email}</span>. Enter it below with your
            new password.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">Codes expire after 10 minutes.</p>
        </div>

        {error && <Alert variant="error">{error}</Alert>}
        {notice && <Alert variant="info">{notice}</Alert>}

        <form className="flex flex-col gap-5" noValidate onSubmit={handleResetSubmit}>
          <Input
            id="code"
            label="Reset code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="000000"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            disabled={loading}
            className="text-center text-2xl font-semibold tracking-[0.5em]"
            required
          />
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
          <Button type="submit" loading={loading} disabled={code.length !== 6}>
            Update password
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Didn&apos;t get it?{' '}
          {resendIn > 0 ? (
            <span>Resend available in {resendIn}s</span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              className="font-medium text-brand hover:underline"
            >
              Resend code
            </button>
          )}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Reset your password</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a 6-digit reset code.
        </p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <form className="flex flex-col gap-5" noValidate onSubmit={handleEmailSubmit}>
        <Input
          id="email"
          label="Email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          required
        />
        <Button type="submit" loading={loading}>
          Send reset code
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Remembered your password?{' '}
        <Link href="/login" className="font-medium text-brand hover:underline">
          Sign in
        </Link>
      </p>
    </div>
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
