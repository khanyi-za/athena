'use client'

import { useEffect } from 'react'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

// Confirmation modal for "Activate this product" per product-frontend-flows §5.2.
// Pure presentation — activation call + multi-error parsing live in the shell.
// Reassures the merchant: "you can keep editing after activation".

interface ActivateProductModalProps {
  productTitle: string
  onCancel: () => void
  onConfirm: () => void
  loading: boolean
  error?: string | null
}

export function ActivateProductModal({
  productTitle,
  onCancel,
  onConfirm,
  loading,
  error,
}: ActivateProductModalProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !loading) onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [loading, onCancel])

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  return (
    <div
      role="dialog"
      aria-modal
      aria-labelledby="activate-product-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 p-4"
      onClick={() => {
        if (!loading) onCancel()
      }}
    >
      <div
        className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="activate-product-title" className="text-lg font-semibold text-zinc-950">
          Activate &ldquo;{productTitle}&rdquo;?
        </h2>

        <div className="mt-3 flex flex-col gap-3 text-sm leading-relaxed text-zinc-600">
          <p>
            Once activated, your product will be visible to buyers on YIIVA. You can keep
            editing it after activation — all changes will be live immediately.
          </p>
          <p>Make sure your title, price, images, and description are accurate.</p>
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
            Activate
          </Button>
        </div>
      </div>
    </div>
  )
}
