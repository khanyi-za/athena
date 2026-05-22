'use client'

import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { unlinkProductCategory } from '@/lib/api/products'

// Two-state confirmation for unlinking a category from a product. Mirrors the
// delete-image-modal pattern: standard "Remove" UI, OR "You can't remove this
// category" recovery on ACTIVE products with only one category linked.

interface DeleteCategoryLinkModalProps {
  storeId: string
  productId: string
  categoryId: string
  categoryPath: string
  preventLastDelete: boolean
  onClose: () => void
  onSuccess: () => void
  onAddInstead: () => void
}

export function DeleteCategoryLinkModal({
  storeId,
  productId,
  categoryId,
  categoryPath,
  preventLastDelete,
  onClose,
  onSuccess,
  onAddInstead,
}: DeleteCategoryLinkModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showRecovery, setShowRecovery] = useState(preventLastDelete)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !loading) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [loading, onClose])

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  async function handleConfirm() {
    setLoading(true)
    setError(null)
    try {
      await unlinkProductCategory(storeId, productId, categoryId)
      onSuccess()
    } catch (err) {
      const e = err as { status?: number; data?: { message?: string | string[] } }
      const message = typeof e.data?.message === 'string' ? e.data.message : ''

      if (e.status === 409 && /last category/i.test(message)) {
        setShowRecovery(true)
        return
      }

      if (e.status === 404) {
        // Already unlinked — succeed so parent invalidates + refreshes.
        onSuccess()
        return
      }

      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 p-4"
      onClick={() => {
        if (!loading) onClose()
      }}
    >
      <div
        className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {showRecovery ? (
          <>
            <h2 className="text-lg font-semibold text-zinc-950">
              You can&apos;t remove this category
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600">
              Active products need at least one category. Add another category first, or
              archive the product to take it off sale.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" fullWidth={false} onClick={onClose}>
                Cancel
              </Button>
              <Button type="button" fullWidth={false} onClick={onAddInstead}>
                Add another category
              </Button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-zinc-950">Remove this category?</h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600">{categoryPath}</p>
            <p className="mt-1 text-sm text-zinc-500">
              This product won&apos;t appear under this category anymore.
            </p>

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
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                fullWidth={false}
                onClick={handleConfirm}
                loading={loading}
              >
                Remove
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
