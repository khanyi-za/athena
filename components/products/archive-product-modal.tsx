'use client'

import { useEffect } from 'react'
import { useBodyScrollLock } from "@/lib/use-body-scroll-lock"

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

// Confirmation modal for archive per product-frontend-flows §6. Critically
// notes that archive is one-way — no reactivation endpoint exists.

interface ArchiveProductModalProps {
  productTitle: string
  onCancel: () => void
  onConfirm: () => void
  loading: boolean
  error?: string | null
}

export function ArchiveProductModal({
  productTitle,
  onCancel,
  onConfirm,
  loading,
  error,
}: ArchiveProductModalProps) {
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
      aria-labelledby="archive-product-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={() => {
        if (!loading) onCancel()
      }}
    >
      <div
        className="relative w-full max-w-md rounded-xl bg-card text-card-foreground border border-border p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="archive-product-title" className="text-lg font-semibold text-foreground">
          Archive &ldquo;{productTitle}&rdquo;?
        </h2>

        <div className="mt-3 flex flex-col gap-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            Buyers won&apos;t see this product anymore. Your sales history, reviews, and any
            pending orders stay intact.
          </p>
          <p className="font-medium text-foreground">
            You can&apos;t reactivate an archived product later — if you want this product
            back, you&apos;ll need to create a new one.
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
            Archive
          </Button>
        </div>
      </div>
    </div>
  )
}
