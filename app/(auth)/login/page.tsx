'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { useAuthStore } from '@/store/auth-store'
import { fetchAuthMe } from '@/lib/fetch-auth-me'
import { pathForView, resolveDashboardView } from '@/lib/routing-matrix'
import { isSafeReturnUrl } from '@/lib/safe-return-url'

export default function LoginPage() {
  // Suspense is required because LoginPageInner reads useSearchParams.
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LoginPageInner />
    </Suspense>
  )
}

function LoginPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const setAuth = useAuthStore((s) => s.setAuth)

  // Pull a safe returnUrl from the query string. When set (e.g. coming from
  // the invite-accept page), we skip the post-login routing matrix and route
  // directly to the returnUrl — the user has an explicit destination in mind.
  const rawReturnUrl = searchParams.get('returnUrl')
  const safeReturnUrl = isSafeReturnUrl(rawReturnUrl) ? rawReturnUrl : null

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 429) {
          setError('Too many attempts. Please wait a moment and try again.')
        } else if (res.status === 401) {
          setError('Incorrect email or password.')
        } else if (res.status === 403) {
          if (/verify your email/i.test(data.message ?? '')) {
            // Unverified account — send them to code entry with a resend button
            router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`)
            return
          }
          setError(data.message)
        } else {
          setError('Something went wrong. Please try again.')
        }
        return
      }

      // Login returns the slim user (no `store`). Fetch /auth/me to hydrate the
      // full profile before routing so the matrix sees store/accountStatus.
      const fullUser = await fetchAuthMe(data.accessToken)
      const userToStore = fullUser ?? data.user
      setAuth(data.accessToken, userToStore)

      // returnUrl wins over the post-login matrix. The matrix is the default
      // when there's no explicit destination from the prior page.
      if (safeReturnUrl) {
        router.push(safeReturnUrl)
        return
      }
      router.push(pathForView(resolveDashboardView(userToStore)))
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Sign in</h1>
        <p className="mt-1 text-sm text-muted-foreground">Welcome back. Enter your details to continue.</p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <form className="flex flex-col gap-5" noValidate onSubmit={handleSubmit}>
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
        <Input
          id="password"
          label="Password"
          labelRight={
            <Link
              href="/auth/forgot-password"
              className="text-xs text-muted-foreground transition-colors hover:text-brand"
            >
              Forgot password?
            </Link>
          }
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          required
        />
        <Button type="submit" loading={loading}>
          Sign in
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link
          href={
            safeReturnUrl
              ? `/register?returnUrl=${encodeURIComponent(safeReturnUrl)}`
              : '/register'
          }
          className="font-medium text-brand hover:underline"
        >
          Create one
        </Link>
      </p>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="flex flex-col items-center gap-3 py-8">
      <div
        aria-hidden
        className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-brand"
      />
    </div>
  )
}
