'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'

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
  const [fields, setFields] = useState({
    firstName: '',
    lastName: '',
    email: '',
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
          <h1 className="text-xl font-semibold text-zinc-950">Check your email</h1>
          <p className="mt-2 text-sm text-zinc-500 leading-relaxed">
            We&apos;ve sent a verification link to{' '}
            <span className="font-medium text-zinc-950">{registeredEmail}</span>. Click the link in
            the email to activate your account.
          </p>
          <p className="mt-2 text-xs text-zinc-400">Verification links expire after 24 hours.</p>
        </div>
        <Link
          href="/login"
          className="text-center text-sm font-medium text-zinc-950 hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-950">Create your account</h1>
        <p className="mt-1 text-sm text-zinc-500">
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
                  className={`flex items-center gap-2 text-xs transition-colors ${met ? 'text-zinc-900' : 'text-zinc-400'}`}
                >
                  <span
                    className={`h-1.5 w-1.5 flex-shrink-0 rounded-full transition-colors ${met ? 'bg-zinc-950' : 'bg-zinc-300'}`}
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

      <p className="text-center text-sm text-zinc-500">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-zinc-950 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
