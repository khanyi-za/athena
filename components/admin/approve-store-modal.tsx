'use client'

import { useEffect, useState } from 'react'
import { useBodyScrollLock } from "@/lib/use-body-scroll-lock"

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

// Confirmation modal for approving a first-review store per store-frontend-flows §6.3.
// States consequences plainly; offers an optional welcome note that goes into
// the rejection email body (maps to the review body's `reason` field — which
// the contract names "reason" but is actually optional and reused as a welcome
// note on APPROVE per spec).

interface ApproveStoreModalProps {
  storeDisplayName: string
  ownerFirstName: string
  onCancel: () => void
  onConfirm: (welcomeNote?: string) => void
  loading: boolean
  error?: string | null
  /** When true, copy is tailored to the go-live decision (M6-C re-uses this). */
  variant?: 'first-review' | 'go-live'
}

export function ApproveStoreModal({
  storeDisplayName,
  ownerFirstName,
  onCancel,
  onConfirm,
  loading,
  error,
  variant = 'first-review',
}: ApproveStoreModalProps) {
  const [welcomeNote, setWelcomeNote] = useState('')

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !loading) onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [loading, onCancel])

  useBodyScrollLock()

  const consequences =
    variant === 'go-live'
      ? [
          `Move the store to ACTIVE status`,
          `Make ${storeDisplayName} visible to buyers immediately`,
          `Send ${ownerFirstName} a celebratory email with their public URL`,
        ]
      : [
          `Upgrade ${ownerFirstName}'s account to MERCHANT`,
          `Move the store to APPROVED status`,
          `Send ${ownerFirstName} an email with next steps`,
        ]

  return (
    <div
      role="dialog"
      aria-modal
      aria-labelledby="approve-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={() => {
        if (!loading) onCancel()
      }}
    >
      <div
        className="relative w-full max-w-lg rounded-xl bg-card text-card-foreground border border-border p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="approve-modal-title" className="text-lg font-semibold text-foreground">
          {variant === 'go-live'
            ? `Approve ${storeDisplayName} to launch?`
            : `Approve ${storeDisplayName}?`}
        </h2>

        <div className="mt-3 flex flex-col gap-2 text-sm leading-relaxed text-muted-foreground">
          <p>Approving will:</p>
          <ul className="ml-1 list-disc pl-5">
            {consequences.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
          {variant === 'first-review' && (
            <p className="mt-2">
              The store won&apos;t be visible to buyers yet — that&apos;s the next gate
              (launch review).
            </p>
          )}
        </div>

        <div className="mt-5 flex flex-col gap-1.5">
          <label
            htmlFor="welcome-note"
            className="text-sm font-medium text-foreground"
          >
            {variant === 'go-live'
              ? 'Optional personal note'
              : 'Optional welcome note'}
          </label>
          <textarea
            id="welcome-note"
            rows={3}
            maxLength={500}
            value={welcomeNote}
            onChange={(e) => setWelcomeNote(e.target.value)}
            disabled={loading}
            placeholder={
              variant === 'go-live'
                ? "Congratulations on launching!"
                : 'Love the brand. Welcome to YIIVA!'
            }
            className="w-full resize-y rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring"
          />
          <p className="text-xs text-muted-foreground">
            Gets included in the approval email. Leave blank for the default.
          </p>
        </div>

        {error && (
          <div className="mt-4">
            <Alert variant="error">{error}</Alert>
          </div>
        )}

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
          <Button
            type="button"
            fullWidth={false}
            onClick={() => onConfirm(welcomeNote.trim() || undefined)}
            loading={loading}
          >
            {variant === 'go-live' ? 'Approve and launch' : 'Approve'}
          </Button>
        </div>
      </div>
    </div>
  )
}
