'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import {
  isSafeReturnUrl,
  persistPendingReturnUrl,
} from '@/lib/safe-return-url'

const passwordChecks = {
  length: (p: string) => p.length >= 8,
  uppercase: (p: string) => /[A-Z]/.test(p),
  lowercase: (p: string) => /[a-z]/.test(p),
  digit: (p: string) => /[0-9]/.test(p),
}

const requirements = [
  { id: 'length' as const, label: 'At least 8 characters' },
  { id: 'uppercase' as const, label: 'One uppercase letter (A–Z)' },
  { id: 'lowercase' as const, label: 'One lowercase letter (a–z)' },
  { id: 'digit' as const, label: 'One number (0–9)' },
]

export default function RegisterPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <RegisterPageInner />
    </Suspense>
  )
}

function RegisterPageInner() {
  const searchParams = useSearchParams()

  // Prefill email from query (used by the invite-accept flow). The field is
  // NOT locked — users may want to use a different account. Helper text below
  // makes the intent explicit.
  const prefilledEmail = searchParams.get('email') ?? ''
  const rawReturnUrl = searchParams.get('returnUrl')
  const safeReturnUrl = isSafeReturnUrl(rawReturnUrl) ? rawReturnUrl : null

  const [fields, setFields] = useState({
    firstName: '',
    lastName: '',
    email: prefilledEmail,
    password: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null)

  function update(field: keyof typeof fields) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setFields((prev) => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(fields),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 409) {
          setError('An account with this email already exists.')
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

      // Persist returnUrl so verify-email can honour it after the user clicks
      // the link in their email. The link itself can't carry the returnUrl
      // (it's generated server-side without that context), so we stash it
      // locally and the verify-email page consumes it on success.
      if (safeReturnUrl) {
        persistPendingReturnUrl(safeReturnUrl)
      }

      setRegisteredEmail(fields.email)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (registeredEmail) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Check your email</h1>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            We&apos;ve sent a verification link to{' '}
            <span className="font-medium text-foreground">{registeredEmail}</span>. Click the link in
            the email to activate your account.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Verification links expire after 24 hours.
            {safeReturnUrl && ' Open the link on this device to continue where you left off.'}
          </p>
        </div>
        <Link
          href={
            safeReturnUrl
              ? `/login?returnUrl=${encodeURIComponent(safeReturnUrl)}`
              : '/login'
          }
          className="text-center text-sm font-medium text-brand hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Create your account</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Set up your YIIVA merchant account to get started.
        </p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <form className="flex flex-col gap-5" noValidate onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4">
          <Input
            id="firstName"
            label="First name"
            type="text"
            placeholder="Jane"
            autoComplete="given-name"
            value={fields.firstName}
            onChange={update('firstName')}
            disabled={loading}
            required
          />
          <Input
            id="lastName"
            label="Last name"
            type="text"
            placeholder="Doe"
            autoComplete="family-name"
            value={fields.lastName}
            onChange={update('lastName')}
            disabled={loading}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Input
            id="email"
            label="Email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            value={fields.email}
            onChange={update('email')}
            disabled={loading}
            required
          />
          {prefilledEmail && (
            <p className="text-xs text-muted-foreground">
              This email matches the invite. You can change it if you&apos;d
              rather use a different account.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Input
            id="password"
            label="Password"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            value={fields.password}
            onChange={update('password')}
            disabled={loading}
            required
          />
          <ul className="flex flex-col gap-1.5 pl-0.5">
            {requirements.map((req) => {
              const met = passwordChecks[req.id](fields.password)
              return (
                <li
                  key={req.id}
                  className={`flex items-center gap-2 text-xs transition-colors ${met ? 'text-foreground' : 'text-muted-foreground'}`}
                >
                  <span
                    className={`h-1.5 w-1.5 flex-shrink-0 rounded-full transition-colors ${met ? 'bg-brand' : 'bg-border'}`}
                  />
                  {req.label}
                </li>
              )
            })}
          </ul>
        </div>

        <Button type="submit" loading={loading}>
          Create account
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link
          href={
            safeReturnUrl
              ? `/login?returnUrl=${encodeURIComponent(safeReturnUrl)}`
              : '/login'
          }
          className="font-medium text-brand hover:underline"
        >
          Sign in
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
