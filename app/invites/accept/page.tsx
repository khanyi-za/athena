'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CldImage } from 'next-cloudinary'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { STORE_LOGO_RECIPE } from '@/lib/cloudinary-transforms'
import { acceptInvite, validateInvite } from '@/lib/api/invites'
import { upsertEmployeeStore } from '@/lib/employee-stores-cache'
import { useAuthStore } from '@/store/auth-store'
import type {
  AcceptInviteResponse,
  ValidateInviteResponse,
} from '@/lib/schemas/invite'

// Public invite landing per auth-frontend-flows §2.8 + §2.9.
// State machine:
//   loading | valid | invalid
// Within valid, four substates derived from auth:
//   signed-out / matching / mismatch
// Within matching, three accept modes:
//   preview (CTA) → form (employee number) → success (brief celebration)

type ValidateState =
  | { kind: 'loading' }
  | { kind: 'valid'; invite: ValidateInviteResponse }
  | { kind: 'invalid'; reason: 'expired-or-used' | 'network' | 'missing-token' }

type AcceptMode =
  | { kind: 'preview' }
  | { kind: 'form' }
  | { kind: 'success'; result: AcceptInviteResponse }

const POST_ACCEPT_REDIRECT_MS = 1500

// useSearchParams() requires a Suspense boundary for prerendering — the
// default export wraps the real page so `next build` can static-shell it.
export default function InviteAcceptPage() {
  return (
    <Suspense fallback={null}>
      <InviteAcceptContent />
    </Suspense>
  )
}

function InviteAcceptContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const clearAuth = useAuthStore((s) => s.clearAuth)

  const token = searchParams.get('token') ?? ''

  const [state, setState] = useState<ValidateState>({ kind: 'loading' })
  const [acceptMode, setAcceptMode] = useState<AcceptMode>({ kind: 'preview' })
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Validate on mount.
  useEffect(() => {
    if (!token) {
      setState({ kind: 'invalid', reason: 'missing-token' })
      return
    }

    let cancelled = false
    void (async () => {
      try {
        const invite = await validateInvite(token)
        if (!cancelled) setState({ kind: 'valid', invite })
      } catch (err) {
        if (cancelled) return
        const e = err as { status?: number }
        if (e.status === 400) {
          setState({ kind: 'invalid', reason: 'expired-or-used' })
        } else {
          setState({ kind: 'invalid', reason: 'network' })
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [token])

  // Auto-redirect a short while after success — gives the user a moment to
  // register "I'm in", then transitions to the dashboard. The dashboard's
  // employee returning-session logic lands in Checkpoint D.
  useEffect(() => {
    if (acceptMode.kind !== 'success') return
    const id = setTimeout(() => {
      router.push('/dashboard')
    }, POST_ACCEPT_REDIRECT_MS)
    return () => clearTimeout(id)
  }, [acceptMode.kind, router])

  async function handleSignOutAndSwitch() {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    } finally {
      clearAuth()
      const returnUrl = `/invites/accept?token=${encodeURIComponent(token)}`
      router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`)
    }
  }

  async function handleSubmitAccept(employeeNumber: string) {
    setSubmitting(true)
    setSubmitError(null)
    try {
      const result = await acceptInvite({
        token,
        employeeNumber: employeeNumber.trim() || undefined,
      })

      // Persist the store summary so subsequent logins can route the user
      // back here without an /auth/me employments field (see employee-journey §7).
      if (user?.id) {
        upsertEmployeeStore(user.id, {
          id: result.store.id,
          displayName: result.store.displayName,
          slug: result.store.slug,
        })
      }

      setAcceptMode({ kind: 'success', result })
    } catch (err) {
      handleAcceptError(err)
    } finally {
      setSubmitting(false)
    }
  }

  function handleAcceptError(err: unknown) {
    const e = err as { status?: number; data?: { message?: string | string[] } }
    const message = typeof e.data?.message === 'string' ? e.data.message : ''

    // 400 "Invalid or expired invitation" — swap to invalid-invite UI.
    if (e.status === 400 && /invalid or expired/i.test(message)) {
      setState({ kind: 'invalid', reason: 'expired-or-used' })
      return
    }

    // 400 "Different email address" — the user's email no longer matches
    // (e.g., they switched accounts in another tab). Force re-render with
    // mismatch substate by clearing the accept mode + flagging the user.
    if (e.status === 400 && /different email/i.test(message)) {
      setSubmitError(
        "This invite was sent to a different email. Sign out and switch to the right account.",
      )
      setAcceptMode({ kind: 'preview' })
      return
    }

    setSubmitError('Something went wrong. Please try again.')
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-12 sm:px-6">
      {state.kind === 'loading' && <LoadingState />}
      {state.kind === 'invalid' && <InvalidState reason={state.reason} />}
      {state.kind === 'valid' && (
        <ValidLanding
          invite={state.invite}
          currentUserEmail={user?.email ?? null}
          token={token}
          acceptMode={acceptMode}
          submitting={submitting}
          submitError={submitError}
          onAcceptCtaClick={() => {
            setSubmitError(null)
            setAcceptMode({ kind: 'form' })
          }}
          onBackToPreview={() => {
            setSubmitError(null)
            setAcceptMode({ kind: 'preview' })
          }}
          onSubmit={handleSubmitAccept}
          onSignOutAndSwitch={handleSignOutAndSwitch}
        />
      )}
    </div>
  )
}

// ----------------------------------------------------------------------------
// States
// ----------------------------------------------------------------------------

function LoadingState() {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <div
        aria-hidden
        className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-950"
      />
      <p className="text-sm text-zinc-500">Loading invite…</p>
    </div>
  )
}

function InvalidState({
  reason,
}: {
  reason: 'expired-or-used' | 'network' | 'missing-token'
}) {
  const title =
    reason === 'expired-or-used'
      ? 'This invite is no longer valid'
      : reason === 'missing-token'
        ? 'No invite token found'
        : "Couldn't load your invite"

  const body =
    reason === 'expired-or-used'
      ? 'Invitations expire after 7 days, or this one may have already been accepted. Ask the person who invited you to send a new one.'
      : reason === 'missing-token'
        ? "The link you followed didn't include an invite token. Check the original invite email and try again."
        : 'Something went wrong on our side. Refresh the page to try again.'

  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-zinc-200 bg-white p-8 text-center">
      <h1 className="text-lg font-semibold text-zinc-950">{title}</h1>
      <p className="text-sm text-zinc-600">{body}</p>
      <Link
        href="/login"
        className="mt-4 text-sm font-medium text-zinc-700 underline-offset-2 hover:text-zinc-950 hover:underline"
      >
        Back to sign in
      </Link>
    </div>
  )
}

// ----------------------------------------------------------------------------
// Valid — 4 substates based on auth, plus accept-mode inside matching
// ----------------------------------------------------------------------------

interface ValidLandingProps {
  invite: ValidateInviteResponse
  currentUserEmail: string | null
  token: string
  acceptMode: AcceptMode
  submitting: boolean
  submitError: string | null
  onAcceptCtaClick: () => void
  onBackToPreview: () => void
  onSubmit: (employeeNumber: string) => void
  onSignOutAndSwitch: () => void
}

function ValidLanding({
  invite,
  currentUserEmail,
  token,
  acceptMode,
  submitting,
  submitError,
  onAcceptCtaClick,
  onBackToPreview,
  onSubmit,
  onSignOutAndSwitch,
}: ValidLandingProps) {
  const isSignedIn = currentUserEmail !== null
  const emailMatches =
    isSignedIn &&
    currentUserEmail.toLowerCase() === invite.email.toLowerCase()

  const substate: 'signed-out' | 'matching' | 'mismatch' = !isSignedIn
    ? 'signed-out'
    : emailMatches
      ? 'matching'
      : 'mismatch'

  const returnUrl = `/invites/accept?token=${encodeURIComponent(token)}`

  // Once accepted, show only the celebration — the branding card stays for
  // continuity but the action cluster becomes the success message.
  if (acceptMode.kind === 'success') {
    return (
      <div className="flex flex-col gap-6 rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
        <StoreBrandingCard invite={invite} />
        <SuccessActions result={acceptMode.result} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
      <StoreBrandingCard invite={invite} />

      {substate === 'signed-out' && (
        <SignedOutActions invite={invite} returnUrl={returnUrl} />
      )}

      {substate === 'matching' && acceptMode.kind === 'preview' && (
        <MatchingPreviewActions
          invite={invite}
          submitError={submitError}
          onAcceptCtaClick={onAcceptCtaClick}
        />
      )}

      {substate === 'matching' && acceptMode.kind === 'form' && (
        <AcceptForm
          invite={invite}
          submitting={submitting}
          submitError={submitError}
          onBack={onBackToPreview}
          onSubmit={onSubmit}
        />
      )}

      {substate === 'mismatch' && (
        <MismatchedEmailActions
          invite={invite}
          currentUserEmail={currentUserEmail!}
          onSignOutAndSwitch={onSignOutAndSwitch}
        />
      )}
    </div>
  )
}

function StoreBrandingCard({ invite }: { invite: ValidateInviteResponse }) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50">
        {invite.store.logoUrl ? (
          <CldImage
            src={invite.store.logoUrl}
            {...STORE_LOGO_RECIPE}
            alt={`${invite.store.displayName} logo`}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-xs text-zinc-400">No logo</span>
        )}
      </div>
      <div>
        <h1 className="text-xl font-semibold text-zinc-950">
          You&apos;ve been invited to help manage{' '}
          <span className="font-bold">{invite.store.displayName}</span> on YIIVA.
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          This invite was sent to{' '}
          <span className="font-medium text-zinc-700">{invite.email}</span>.
        </p>
      </div>
    </div>
  )
}

function SignedOutActions({
  invite,
  returnUrl,
}: {
  invite: ValidateInviteResponse
  returnUrl: string
}) {
  return (
    <div className="flex flex-col gap-3">
      <Link
        href={`/login?returnUrl=${encodeURIComponent(returnUrl)}`}
        className="inline-flex h-11 items-center justify-center rounded-lg bg-zinc-950 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
      >
        Sign in to accept
      </Link>
      <Link
        href={`/register?email=${encodeURIComponent(invite.email)}&returnUrl=${encodeURIComponent(returnUrl)}`}
        className="inline-flex h-11 items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-50"
      >
        Create a YIIVA account
      </Link>
      <p className="text-center text-xs text-zinc-500">
        Already a buyer or seller on YIIVA? Sign in with that account.
      </p>
    </div>
  )
}

function MatchingPreviewActions({
  invite,
  submitError,
  onAcceptCtaClick,
}: {
  invite: ValidateInviteResponse
  submitError: string | null
  onAcceptCtaClick: () => void
}) {
  return (
    <div className="flex flex-col gap-3">
      {submitError && <Alert variant="error">{submitError}</Alert>}
      <Button type="button" onClick={onAcceptCtaClick}>
        Accept invitation
      </Button>
      <p className="text-center text-xs text-zinc-500">
        Joining {invite.store.displayName} won&apos;t change your YIIVA account
        — it just adds you to their team.
      </p>
    </div>
  )
}

function AcceptForm({
  invite,
  submitting,
  submitError,
  onBack,
  onSubmit,
}: {
  invite: ValidateInviteResponse
  submitting: boolean
  submitError: string | null
  onBack: () => void
  onSubmit: (employeeNumber: string) => void
}) {
  const [employeeNumber, setEmployeeNumber] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit(employeeNumber)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        id="employee-number"
        label="Employee number (optional)"
        type="text"
        value={employeeNumber}
        onChange={(e) => setEmployeeNumber(e.target.value)}
        disabled={submitting}
        maxLength={50}
        placeholder="e.g. EMP001"
        autoComplete="off"
      />
      <p className="-mt-2 text-xs text-zinc-500">
        Some teams track teammates by employee numbers. You can leave this
        blank.
      </p>

      {submitError && <Alert variant="error">{submitError}</Alert>}

      <Button type="submit" loading={submitting}>
        Join {invite.store.displayName}
      </Button>
      <button
        type="button"
        onClick={onBack}
        disabled={submitting}
        className="text-center text-sm text-zinc-500 transition-colors hover:text-zinc-950 disabled:opacity-50"
      >
        ← Back
      </button>
    </form>
  )
}

function SuccessActions({ result }: { result: AcceptInviteResponse }) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-2xl">
        🎉
      </div>
      <p className="text-base font-semibold text-zinc-950">You&apos;re in!</p>
      <p className="text-sm text-zinc-600">
        Welcome to {result.store.displayName}. Taking you to your dashboard…
      </p>
      <div
        aria-hidden
        className="mt-2 h-6 w-6 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-950"
      />
    </div>
  )
}

function MismatchedEmailActions({
  invite,
  currentUserEmail,
  onSignOutAndSwitch,
}: {
  invite: ValidateInviteResponse
  currentUserEmail: string
  onSignOutAndSwitch: () => void
}) {
  return (
    <div className="flex flex-col gap-3">
      <Alert variant="info">
        This invite was sent to{' '}
        <span className="font-medium">{invite.email}</span>, but you&apos;re
        signed in as{' '}
        <span className="font-medium">{currentUserEmail}</span>.
      </Alert>
      <Button type="button" onClick={onSignOutAndSwitch}>
        Sign out and switch account
      </Button>
    </div>
  )
}
