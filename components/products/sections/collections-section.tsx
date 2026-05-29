'use client'

import { useState } from 'react'

import { Alert } from '@/components/ui/alert'
import { CollectionPickerModal } from '@/components/products/collection-picker-modal'
import {
  useAdjustCollectionProductCount,
} from '@/hooks/use-collections'
import { useInvalidateProduct } from '@/hooks/use-product'
import { removeProductFromCollection } from '@/lib/api/collections'
import type { Product } from '@/lib/schemas/product'

// Collections section of the product editor per product-frontend-flows.md §4.7.
// Shows the merchant's collection chips for this product, with × to unlink and
// a multi-select picker to link more (with inline "+ Create new collection").
//
// Last-collection-on-ACTIVE protection: activation requires ≥1 collection
// (per M10's revised activation contract — see activation-readiness-panel),
// so removing the only collection from an ACTIVE product would break it.
// Pre-empted client-side; backend may also enforce.

interface CollectionsSectionProps {
  storeId: string
  product: Product
}

export function CollectionsSection({ storeId, product }: CollectionsSectionProps) {
  const invalidateProduct = useInvalidateProduct()
  const adjustCount = useAdjustCollectionProductCount()

  const [pickerOpen, setPickerOpen] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isArchived = product.status === 'ARCHIVED'
  const linkedCollections = product.collections.map((c) => c.collection)
  const isLastOnActive =
    product.status === 'ACTIVE' && linkedCollections.length === 1

  async function handleRemove(collectionId: string) {
    if (removingId) return
    setRemovingId(collectionId)
    setError(null)
    try {
      await removeProductFromCollection(storeId, collectionId, product.id)
      adjustCount(storeId, collectionId, -1)
      invalidateProduct(storeId, product.id)
    } catch (err) {
      const e = err as { status?: number; data?: { message?: string | string[] } }
      const message = typeof e.data?.message === 'string' ? e.data.message : ''
      // Backend's defensive "last collection on active" rule, mirroring our
      // client-side guard. Surface the message inline.
      if (e.status === 409 || (e.status === 400 && /last collection/i.test(message))) {
        setError(
          'Active products need at least one collection. Add another collection first.',
        )
        return
      }
      if (e.status === 404) {
        // Already gone — refresh anyway so the UI updates.
        invalidateProduct(storeId, product.id)
        return
      }
      setError('Something went wrong. Please try again.')
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <section id="section-collections" className="flex flex-col gap-6 scroll-mt-6">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 pb-3">
        <h2 className="text-lg font-semibold text-zinc-950">
          Collections{' '}
          <span className="text-sm font-normal text-zinc-500">
            ({linkedCollections.length})
          </span>
        </h2>
        {!isArchived && (
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="text-sm font-medium text-zinc-950 underline-offset-2 hover:underline"
          >
            + Add to collection
          </button>
        )}
      </header>

      {error && <Alert variant="error">{error}</Alert>}

      {linkedCollections.length === 0 ? (
        <EmptyState
          isArchived={isArchived}
          onAdd={() => setPickerOpen(true)}
        />
      ) : (
        <ul className="flex flex-wrap gap-2">
          {linkedCollections.map((c) => (
            <li key={c.id}>
              <CollectionChip
                name={c.name}
                disabled={isArchived}
                removeBlockedReason={
                  isLastOnActive
                    ? "Active products need at least one collection — add another first."
                    : null
                }
                isRemoving={removingId === c.id}
                onRemove={() => void handleRemove(c.id)}
              />
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-zinc-500">
        Collections are your custom groupings — they appear on your store page
        so buyers can browse curated picks. At least one collection is
        required to activate this product.
      </p>

      {pickerOpen && (
        <CollectionPickerModal
          storeId={storeId}
          productId={product.id}
          linkedCollectionIds={linkedCollections.map((c) => c.id)}
          onClose={() => setPickerOpen(false)}
          onLinked={() => {
            // Invalidate so product.collections refreshes from server.
            invalidateProduct(storeId, product.id)
          }}
        />
      )}
    </section>
  )
}

// ----------------------------------------------------------------------------
// Chip
// ----------------------------------------------------------------------------

function CollectionChip({
  name,
  disabled,
  removeBlockedReason,
  isRemoving,
  onRemove,
}: {
  name: string
  disabled: boolean
  removeBlockedReason: string | null
  isRemoving: boolean
  onRemove: () => void
}) {
  const removeDisabled = disabled || !!removeBlockedReason || isRemoving
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-sm">
      <span className="text-zinc-900">{name}</span>
      {!disabled && (
        <button
          type="button"
          onClick={onRemove}
          disabled={removeDisabled}
          aria-label={`Remove ${name}`}
          title={removeBlockedReason ?? 'Remove'}
          className={[
            'rounded-full text-xs font-semibold',
            removeDisabled
              ? 'cursor-not-allowed text-zinc-300'
              : 'text-zinc-500 hover:text-red-600',
          ].join(' ')}
        >
          ×
        </button>
      )}
    </span>
  )
}

function EmptyState({
  isArchived,
  onAdd,
}: {
  isArchived: boolean
  onAdd: () => void
}) {
  return (
    <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center">
      <p className="text-sm text-zinc-600">
        Not in any collection yet. Activation requires at least one.
      </p>
      {!isArchived && (
        <button
          type="button"
          onClick={onAdd}
          className="mt-3 text-sm font-medium text-zinc-950 underline-offset-2 hover:underline"
        >
          + Add to collection
        </button>
      )}
    </div>
  )
}
