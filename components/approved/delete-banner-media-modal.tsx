'use client'

import { useEffect, useState } from 'react'
import { useBodyScrollLock } from "@/lib/use-body-scroll-lock"
import { CldImage } from 'next-cloudinary'

import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { removeBannerMedia } from '@/lib/api/store'
import {
  SQUARE_THUMB_500_RECIPE,
  videoFrameAtSecond,
} from '@/lib/cloudinary-transforms'
import type { BannerMedia } from '@/lib/schemas/store'

// Per-item delete confirmation for a banner media row. Two states:
// - Standard: confirm + thumbnail + destructive Remove
// - Recovery: "You can't remove this item" when it's the last one on a
//   PENDING_GO_LIVE or ACTIVE store. Parent's preventLastDelete flag drives
//   this; backend also returns a 400 we surface defensively.

interface DeleteBannerMediaModalProps {
  storeId: string
  item: BannerMedia
  preventLastDelete: boolean
  onClose: () => void
  onSuccess: () => void
  onAddInstead: () => void
}

export function DeleteBannerMediaModal({
  storeId,
  item,
  preventLastDelete,
  onClose,
  onSuccess,
  onAddInstead,
}: DeleteBannerMediaModalProps) {
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
      await removeBannerMedia(storeId, item.id)
      onSuccess()
    } catch (err) {
      const e = err as { status?: number; data?: { message?: string | string[] } }
      const message = typeof e.data?.message === 'string' ? e.data.message : ''

      // Backend rejects last-item delete on PENDING_GO_LIVE / ACTIVE with 400.
      if (e.status === 400 && /at least one banner/i.test(message)) {
        setShowRecovery(true)
        return
      }

      if (e.status === 404) {
        // Already gone — succeed so the parent invalidates + refreshes.
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
              You can&apos;t remove this item
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600">
              Your store needs at least one banner item to stay live. Add a
              replacement first, then you can remove this one.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" fullWidth={false} onClick={onClose}>
                Cancel
              </Button>
              <Button type="button" fullWidth={false} onClick={onAddInstead}>
                Add another item
              </Button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-zinc-950">
              Remove this banner item?
            </h2>

            <div className="mt-4 flex items-start gap-3">
              <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
                {item.mediaType === 'VIDEO' ? (
                  <>
                    <CldImage
                      src={item.url}
                      assetType="video"
                      {...videoFrameAtSecond(2, 500, 500)}
                      alt="Banner video frame"
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
                    src={item.url}
                    {...SQUARE_THUMB_500_RECIPE}
                    alt="Banner image"
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <p className="text-sm text-zinc-600">
                Buyers won&apos;t see this {item.mediaType === 'VIDEO' ? 'video' : 'image'}{' '}
                anymore. This can&apos;t be undone.
                {item.isPrimary && (
                  <span className="mt-1 block text-xs text-zinc-500">
                    This is your cover — the next item by order will take its place.
                  </span>
                )}
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
                className="!bg-red-600 hover:!bg-red-700"
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
