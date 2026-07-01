'use client'

import { useEffect, useState } from 'react'
import { useBodyScrollLock } from "@/lib/use-body-scroll-lock"
import { CldImage } from 'next-cloudinary'

import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { deleteProductImage } from '@/lib/api/products'
import {
  SQUARE_THUMB_500_RECIPE,
  videoFrameAtSecond,
} from '@/lib/cloudinary-transforms'
import type { ProductImage } from '@/lib/schemas/product'

// Two-state delete confirmation per product-frontend-flows §4.3.
// - Standard: "Remove this image?" with thumbnail + destructive confirm
// - Recovery: "You can't remove this image" when it's the last image on an
//   ACTIVE product. Backend returns 409; we also pre-check via preventLastDelete.

interface DeleteImageModalProps {
  storeId: string
  productId: string
  image: ProductImage
  preventLastDelete: boolean
  onClose: () => void
  onSuccess: () => void
  onAddInstead: () => void
}

export function DeleteImageModal({
  storeId,
  productId,
  image,
  preventLastDelete,
  onClose,
  onSuccess,
  onAddInstead,
}: DeleteImageModalProps) {
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

  useBodyScrollLock()

  async function handleConfirm() {
    setLoading(true)
    setError(null)
    try {
      await deleteProductImage(storeId, productId, image.id)
      onSuccess()
    } catch (err) {
      const e = err as { status?: number; data?: { message?: string | string[] } }
      const message = typeof e.data?.message === 'string' ? e.data.message : ''

      if (e.status === 409 && /last image/i.test(message)) {
        setShowRecovery(true)
        return
      }

      if (e.status === 404) {
        // Already gone — succeed so parent invalidates + refreshes.
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={() => {
        if (!loading) onClose()
      }}
    >
      <div
        className="relative w-full max-w-md rounded-xl bg-card text-card-foreground border border-border p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {showRecovery ? (
          <>
            <h2 className="text-lg font-semibold text-foreground">
              You can&apos;t remove this image
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Active products need at least one image. Add a replacement first, or archive
              this product to take it off sale.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" fullWidth={false} onClick={onClose}>
                Cancel
              </Button>
              <Button type="button" fullWidth={false} onClick={onAddInstead}>
                Add another image
              </Button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-foreground">
              Remove this {image.mediaType === 'VIDEO' ? 'video' : 'image'}?
            </h2>

            <div className="mt-4 flex items-start gap-3">
              <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                {image.mediaType === 'VIDEO' ? (
                  <>
                    <CldImage
                      src={image.url}
                      assetType="video"
                      {...videoFrameAtSecond(2, 500, 500)}
                      alt="Product video frame"
                      className="h-full w-full object-cover"
                    />
                    <span
                      aria-hidden
                      className="absolute bottom-1 right-1 rounded-full bg-zinc-950/80 px-1.5 py-0.5 text-[10px] font-medium text-white"
                    >
                      ▶
                    </span>
                  </>
                ) : (
                  <CldImage
                    src={image.url}
                    {...SQUARE_THUMB_500_RECIPE}
                    alt={image.altText ?? 'Product image'}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Buyers won&apos;t see this{' '}
                {image.mediaType === 'VIDEO' ? 'video' : 'image'} anymore. This
                can&apos;t be undone.
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
