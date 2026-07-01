'use client'

import { useEffect, useState } from 'react'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useBodyScrollLock } from '@/lib/use-body-scroll-lock'
import { deleteCollection } from '@/lib/api/collections'
import { useRemoveCollectionFromCache } from '@/hooks/use-collections'
import type { Collection } from '@/lib/schemas/collection'

// Delete-collection confirmation per spec §9.3. The important UX line:
// products themselves are NOT deleted — only the grouping. Make that explicit
// in the body so the merchant isn't worried about losing their catalog.

interface DeleteCollectionModalProps {
  storeId: string
  collection: Collection
  onCancel: () => void
  onDeleted: () => void
}

export function DeleteCollectionModal({
  storeId,
  collection,
  onCancel,
  onDeleted,
}: DeleteCollectionModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const removeFromCache = useRemoveCollectionFromCache()

  useBodyScrollLock()

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !loading) onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [loading, onCancel])

  async function handleConfirm() {
    setLoading(true)
    setError(null)
    try {
      await deleteCollection(storeId, collection.id)
      removeFromCache(storeId, collection.id)
      onDeleted()
    } catch (err) {
      const e = err as { status?: number }
      if (e.status === 404) {
        // Already gone — treat as success so the parent updates its UI.
        removeFromCache(storeId, collection.id)
        onDeleted()
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
        if (!loading) onCancel()
      }}
    >
      <div
        className="relative w-full max-w-md rounded-xl bg-card text-card-foreground border border-border p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-foreground">
          Delete &quot;{collection.name}&quot;?
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          The collection and its product groupings will be removed.{' '}
          <span className="font-medium text-foreground">
            Your products themselves will not be deleted
          </span>{' '}
          — only this grouping.
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
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            fullWidth={false}
            onClick={handleConfirm}
            loading={loading}
            className="!bg-danger !text-danger-foreground hover:!bg-danger/90"
          >
            Delete collection
          </Button>
        </div>
      </div>
    </div>
  )
}
