'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { deleteAddress } from '@/lib/api/addresses'
import type { StoreAddress } from '@/lib/schemas/store'

// Two-state delete confirmation per store-frontend-flows.md §3.3:
// - Standard "Remove this location?" with destructive confirm
// - "You can't remove this location" recovery when this is the last address
//   on an APPROVED+ store (which is exactly the state we're in here)
//
// Pre-checks via `preventLastDelete` from the parent. Also handles the 400
// response defensively if our local state happened to be stale at click time.

interface DeleteAddressModalProps {
  open: boolean
  storeId: string
  address: StoreAddress | null
  preventLastDelete: boolean
  onClose: () => void
  onSuccess: () => void
  onAddInstead: () => void
}

export function DeleteAddressModal({
  open,
  storeId,
  address,
  preventLastDelete,
  onClose,
  onSuccess,
  onAddInstead,
}: DeleteAddressModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showRecovery, setShowRecovery] = useState(preventLastDelete)

  // Reset on open (or address swap).
  useEffect(() => {
    if (!open) return
    setLoading(false)
    setError(null)
    setShowRecovery(preventLastDelete)
  }, [open, preventLastDelete, address])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !loading) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, loading, onClose])

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  if (!open || !address) return null

  async function handleConfirm() {
    if (!address) return
    setLoading(true)
    setError(null)

    try {
      await deleteAddress(storeId, address.id)
      onSuccess()
    } catch (err) {
      const e = err as { status?: number; data?: { message?: string | string[] } }
      const message = typeof e.data?.message === 'string' ? e.data.message : ''

      if (e.status === 400 && /last address|approved stores/i.test(message)) {
        // Local state was stale (e.g., another tab deleted a different address).
        // Swap to the recovery UI.
        setShowRecovery(true)
        return
      }

      if (e.status === 404) {
        // Already gone — treat as success so the parent invalidates + refreshes.
        onSuccess()
        return
      }

      if (e.status === 403) {
        setError("You don't have permission to manage this store's addresses.")
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
              You can&apos;t remove this location
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600">
              Approved stores need at least one location. Add another location first, or close
              this dialog.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" fullWidth={false} onClick={onClose}>
                Cancel
              </Button>
              <Button type="button" fullWidth={false} onClick={onAddInstead}>
                Add another location
              </Button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-zinc-950">Remove this location?</h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600">
              {address.streetNumber} {address.streetName}
              {address.buildingName ? `, ${address.buildingName}` : ''}, {address.city}
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              This won&apos;t be visible on your store profile anymore.
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
