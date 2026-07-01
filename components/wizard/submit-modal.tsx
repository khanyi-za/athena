'use client'

import { useEffect } from 'react'
import { useBodyScrollLock } from "@/lib/use-body-scroll-lock"
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

// Confirmation modal for "Submit for review" per store-frontend-flows §2.3.
// Pure presentation — submit logic + error handling live in the wizard shell.

interface SubmitModalProps {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
  loading: boolean
  error?: string | null
}

export function SubmitModal({ open, onCancel, onConfirm, loading, error }: SubmitModalProps) {
  // Escape closes the modal (unless mid-submit — never lose work on a stray key).
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !loading) onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, loading, onCancel])

  // Lock body scroll while the modal is open.
  useBodyScrollLock(open)

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal
      aria-labelledby="submit-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={() => {
        if (!loading) onCancel()
      }}
    >
      <div
        className="relative w-full max-w-md rounded-xl bg-card text-card-foreground border border-border p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="submit-modal-title" className="text-lg font-semibold text-foreground">
          Submit your store for review?
        </h2>

        <div className="mt-3 flex flex-col gap-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            Once you submit, you won&apos;t be able to edit your store until the review is
            complete. Reviews usually take 2–3 business days.
          </p>
          <p>
            Make sure your details are accurate — especially your bank account info (we use it
            to pay you out).
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
          <Button type="button" fullWidth={false} onClick={onConfirm} loading={loading}>
            Submit for review
          </Button>
        </div>
      </div>
    </div>
  )
}
