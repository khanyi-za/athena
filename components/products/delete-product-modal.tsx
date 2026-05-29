'use client'

import { useEffect } from 'react'
import { useBodyScrollLock } from "@/lib/use-body-scroll-lock"

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

// Confirmation modal for hard-delete per product-frontend-flows §7. Only DRAFT
// products can be deleted — backend returns 409 for any other status.
// Emphasises the permanent nature.

interface DeleteProductModalProps {
  productTitle: string
  onCancel: () => void
  onConfirm: () => void
  loading: boolean
  error?: string | null
}

export function DeleteProductModal({
  productTitle,
  onCancel,
  onConfirm,
  loading,
  error,
}: DeleteProductModalProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !loading) onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [loading, onCancel])

  useBodyScrollLock()

  return (
    <div
      role="dialog"
      aria-modal
      aria-labelledby="delete-product-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 p-4"
      onClick={() => {
        if (!loading) onCancel()
      }}
    >
      <div
        className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="delete-product-title" className="text-lg font-semibold text-zinc-950">
          Delete &ldquo;{productTitle}&rdquo;?
        </h2>

        <div className="mt-3 flex flex-col gap-3 text-sm leading-relaxed text-zinc-600">
          <p>
            This permanently removes the product, including any images, variants, tags, and
            category links you&apos;ve added.
          </p>
          <p className="font-medium text-zinc-700">
            This can&apos;t be undone. If you want to keep a record of this product later,
            archive it after activation instead.
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
            Delete forever
          </Button>
        </div>
      </div>
    </div>
  )
}
