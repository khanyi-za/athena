'use client'

import { useEffect } from 'react'
import { useBodyScrollLock } from "@/lib/use-body-scroll-lock"
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

// Confirmation modal for "Request go-live" per store-frontend-flows §2.6.
// Pure presentation — request logic + error handling live in the parent
// (ApprovedReadinessScreen). Missing-requirements errors close this modal and
// surface as a top-of-screen banner so the merchant can see them alongside the
// readiness checklist.

interface RequestGoLiveModalProps {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
  loading: boolean
  error?: string | null
}

export function RequestGoLiveModal({
  open,
  onCancel,
  onConfirm,
  loading,
  error,
}: RequestGoLiveModalProps) {
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !loading) onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, loading, onCancel])

  useBodyScrollLock(open)

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal
      aria-labelledby="go-live-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={() => {
        if (!loading) onCancel()
      }}
    >
      <div
        className="relative w-full max-w-md rounded-xl bg-card text-card-foreground border border-border p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="go-live-modal-title" className="text-lg font-semibold text-foreground">
          Launch your store?
        </h2>

        <div className="mt-3 flex flex-col gap-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            Once you launch, you won&apos;t be able to edit your store until the review
            is complete. Final reviews usually take 2–3 business days.
          </p>
          <p>We&apos;ll email you as soon as we have an answer.</p>
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
            Launch store
          </Button>
        </div>
      </div>
    </div>
  )
}
