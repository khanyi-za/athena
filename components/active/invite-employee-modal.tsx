'use client'

import { useEffect, useState } from 'react'
import { useBodyScrollLock } from "@/lib/use-body-scroll-lock"

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// Owner-only invite modal per store-frontend-flows §4.1. Single email field.
// Validation: on blur for format. The two 409 variants the parent must
// distinguish are surfaced via inline messages on the field.

interface InviteEmployeeModalProps {
  onCancel: () => void
  onConfirm: (email: string) => void
  loading: boolean
  error?: string | null
  /** Optional pivot for the "already invited" 409 case — when set, an inline
   *  link appears letting the owner jump to the pending row. */
  onShowExistingInvite?: () => void
  showExistingInviteLink?: boolean
}

export function InviteEmployeeModal({
  onCancel,
  onConfirm,
  loading,
  error,
  onShowExistingInvite,
  showExistingInviteLink,
}: InviteEmployeeModalProps) {
  const [email, setEmail] = useState('')
  const [formatError, setFormatError] = useState<string | null>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !loading) onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [loading, onCancel])

  useBodyScrollLock()

  function handleBlur() {
    if (email.length === 0) return setFormatError(null)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormatError("That doesn't look like a valid email.")
    } else {
      setFormatError(null)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) {
      setFormatError('Enter an email address.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setFormatError("That doesn't look like a valid email.")
      return
    }
    setFormatError(null)
    onConfirm(trimmed.toLowerCase())
  }

  const displayedError = formatError ?? error ?? null

  return (
    <div
      role="dialog"
      aria-modal
      aria-labelledby="invite-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 p-4"
      onClick={() => {
        if (!loading) onCancel()
      }}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
      >
        <h2 id="invite-modal-title" className="text-lg font-semibold text-zinc-950">
          Invite a teammate
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">
          We&apos;ll send them an email with a link to join your team. They&apos;ll
          need to sign up or log in to YIIVA to accept.
        </p>

        <div className="mt-5">
          <Input
            id="invite-email"
            label="Email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (formatError) setFormatError(null)
            }}
            onBlur={handleBlur}
            disabled={loading}
            placeholder="teammate@example.com"
            autoComplete="off"
            error={displayedError ?? undefined}
            required
          />
          {showExistingInviteLink && onShowExistingInvite && (
            <button
              type="button"
              onClick={onShowExistingInvite}
              className="mt-2 text-xs font-medium text-zinc-700 underline-offset-2 hover:underline"
            >
              Find them in your team list →
            </button>
          )}
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            fullWidth={false}
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" fullWidth={false} loading={loading}>
            Send invite
          </Button>
        </div>
      </form>
    </div>
  )
}
