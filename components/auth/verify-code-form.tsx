'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { useAuthStore } from '@/store/auth-store'
import { fetchAuthMe } from '@/lib/fetch-auth-me'
import { pathForView, resolveDashboardView } from '@/lib/routing-matrix'
import { consumePendingReturnUrl } from '@/lib/safe-return-url'

const RESEND_COOLDOWN_S = 60

interface VerifyCodeFormProps {
  email: string
  // 60 when a code was just sent (register flow); 0 when the user landed here
  // later (login redirect) and may need a fresh code immediately.
  initialCooldown?: number
}

// 6-digit email-verification code entry. On success the user is fully logged
// in (backend auto-issues tokens) and routed via returnUrl/matrix — the same
// post-verify behaviour the old link flow had.
export function VerifyCodeForm({ email, initialCooldown = RESEND_COOLDOWN_S }: VerifyCodeFormProps) {
  const router = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)

  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resendIn, setResendIn] = useState(initialCooldown)

  useEffect(() => {
    if (resendIn <= 0) return
    const timer = setTimeout(() => setResendIn((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendIn])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setNotice(null)
    setLoading(true)

    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, code }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 429) {
          setError('Too many attempts. Please wait a moment and try again.')
        } else if (res.status === 400) {
          const messages = Array.isArray(data.message)
            ? data.message.join(' ')
            : data.message
          setError(messages ?? 'Invalid or expired verification code')
        } else {
          setError('Something went wrong. Please try again.')
        }
        return
      }

      // Verify returns the slim user — hydrate the full profile before routing
      // so the matrix sees store/accountStatus.
      const fullUser = await fetchAuthMe(data.accessToken)
      const userToStore = fullUser ?? data.user
      setAuth(data.accessToken, userToStore)

      const pendingReturnUrl = consumePendingReturnUrl()
      router.replace(
        pendingReturnUrl ?? pathForView(resolveDashboardView(userToStore)),
      )
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
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email }),
      })

      if (res.status === 429) {
        setError('Too many attempts. Please wait a moment and try again.')
        return
      }

      setCode('')
      setResendIn(RESEND_COOLDOWN_S)
      setNotice('If your account is unverified, a new code is on its way.')
    } catch {
      setError('Something went wrong. Please try again.')
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {error && <Alert variant="error">{error}</Alert>}
      {notice && <Alert variant="info">{notice}</Alert>}

      <form className="flex flex-col gap-5" noValidate onSubmit={handleSubmit}>
        <Input
          id="code"
          label="Verification code"
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
        <Button type="submit" loading={loading} disabled={code.length !== 6}>
          Verify email
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
