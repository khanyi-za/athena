'use client'

import { useEffect, useMemo, useState } from 'react'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { CollectionFormModal } from '@/components/collections/collection-form-modal'
import {
  useAdjustCollectionProductCount,
  useCollections,
} from '@/hooks/use-collections'
import { useBodyScrollLock } from '@/lib/use-body-scroll-lock'
import { addProductToCollection } from '@/lib/api/collections'
import type { Collection } from '@/lib/schemas/collection'

// Multi-select picker for adding a product to collections per
// product-frontend-flows.md §4.7. Already-linked collections render disabled
// with an "(already added)" label so the merchant doesn't accidentally re-add
// (backend's POST is idempotent anyway, but the affordance signals state).
//
// Inline "+ Create new collection" opens the standard CollectionFormModal
// (M10-C) so the merchant can stay on the editor while creating. Freshly
// created collections auto-select on save.

interface CollectionPickerModalProps {
  storeId: string
  productId: string
  linkedCollectionIds: string[]
  onClose: () => void
  onLinked: () => void
}

export function CollectionPickerModal({
  storeId,
  productId,
  linkedCollectionIds,
  onClose,
  onLinked,
}: CollectionPickerModalProps) {
  const { data: collections, isLoading } = useCollections(storeId)
  const adjustCount = useAdjustCollectionProductCount()

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  useBodyScrollLock()

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !submitting) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [submitting, onClose])

  const linkedSet = useMemo(
    () => new Set(linkedCollectionIds),
    [linkedCollectionIds],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = collections ?? []
    if (!q) return list
    return list.filter((c) => c.name.toLowerCase().includes(q))
  }, [collections, search])

  function toggle(id: string) {
    if (linkedSet.has(id)) return // already linked — can't toggle
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleSubmit() {
    if (selected.size === 0) {
      onClose()
      return
    }
    setSubmitting(true)
    setError(null)
    const ids = Array.from(selected)
    try {
      // POST in parallel — backend's add is idempotent, so a partial failure
      // on one doesn't block the others. We invalidate at the end.
      const results = await Promise.allSettled(
        ids.map((id) => addProductToCollection(storeId, id, productId)),
      )
      const failures = results.filter((r) => r.status === 'rejected')
      const successes = results
        .map((r, i) => (r.status === 'fulfilled' ? ids[i] : null))
        .filter((id): id is string => id !== null)

      // Bump local count for each successful add.
      for (const id of successes) {
        adjustCount(storeId, id, 1)
      }

      if (failures.length === ids.length) {
        setError('Something went wrong. Please try again.')
        return
      }
      if (failures.length > 0) {
        setError(
          `Added ${successes.length} of ${ids.length}. Try again for the rest.`,
        )
        // Keep failed ones still selected; remove successes.
        setSelected(new Set(ids.filter((id) => !successes.includes(id))))
        onLinked()
        return
      }

      onLinked()
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCreated(collection: Collection) {
    // The merchant clearly wanted this collection on this product — that's
    // why they used the inline-create path from the picker. Link the product
    // immediately and close both modals in one flow, rather than leaving the
    // picker open and asking them to click "Add selected" again.
    setCreateOpen(false)
    setSubmitting(true)
    setError(null)
    try {
      await addProductToCollection(storeId, collection.id, productId)
      adjustCount(storeId, collection.id, 1)
      onLinked()
      onClose()
    } catch {
      // Link failed but the collection itself was created — leave the picker
      // open with the new collection auto-selected so the merchant can retry
      // via "Add selected".
      setSelected((prev) => new Set(prev).add(collection.id))
      setError(
        'Collection created, but adding it to this product failed. Click "Add" to try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div
        role="dialog"
        aria-modal
        aria-labelledby="collection-picker-title"
        className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 p-4"
        onClick={() => {
          if (!submitting) onClose()
        }}
      >
        <div
          className="relative flex max-h-[calc(100vh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <header className="border-b border-zinc-200 p-5 pb-4">
            <h2 id="collection-picker-title" className="text-lg font-semibold text-zinc-950">
              Add to collections
            </h2>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search your collections…"
              className="mt-3 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950"
              disabled={submitting}
            />
          </header>

          <div className="flex-1 overflow-y-auto p-5 pt-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div
                  aria-hidden
                  className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-950"
                />
              </div>
            ) : filtered.length === 0 ? (
              <EmptyListState
                hasQuery={search.trim().length > 0}
                onCreate={() => setCreateOpen(true)}
              />
            ) : (
              <ul className="flex flex-col gap-1">
                {filtered.map((c) => {
                  const alreadyLinked = linkedSet.has(c.id)
                  const checked = alreadyLinked || selected.has(c.id)
                  return (
                    <li key={c.id}>
                      <label
                        className={[
                          'flex items-center gap-3 rounded-md px-2 py-2 text-sm',
                          alreadyLinked
                            ? 'cursor-not-allowed text-zinc-400'
                            : 'cursor-pointer hover:bg-zinc-50',
                        ].join(' ')}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggle(c.id)}
                          disabled={alreadyLinked || submitting}
                          className="h-4 w-4 accent-zinc-950"
                        />
                        <span className="flex-1 truncate">
                          {c.name}
                          {alreadyLinked && (
                            <span className="ml-2 text-xs italic">
                              (already added)
                            </span>
                          )}
                        </span>
                      </label>
                    </li>
                  )
                })}
              </ul>
            )}

            {error && (
              <div className="mt-4">
                <Alert variant="error">{error}</Alert>
              </div>
            )}
          </div>

          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 p-5 pt-4">
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              disabled={submitting}
              className="text-sm font-medium text-zinc-950 underline-offset-2 hover:underline disabled:opacity-50"
            >
              + Create new collection
            </button>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                fullWidth={false}
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                fullWidth={false}
                onClick={handleSubmit}
                loading={submitting}
              >
                Add {selected.size} selected
              </Button>
            </div>
          </footer>
        </div>
      </div>

      {createOpen && (
        <CollectionFormModal
          storeId={storeId}
          mode={{ kind: 'create' }}
          onCancel={() => setCreateOpen(false)}
          onSaved={handleCreated}
        />
      )}
    </>
  )
}

// ----------------------------------------------------------------------------
// Empty list state
// ----------------------------------------------------------------------------

function EmptyListState({
  hasQuery,
  onCreate,
}: {
  hasQuery: boolean
  onCreate: () => void
}) {
  if (hasQuery) {
    return (
      <div className="py-8 text-center text-sm text-zinc-600">
        No matching collections.{' '}
        <button
          type="button"
          onClick={onCreate}
          className="font-medium text-zinc-950 underline-offset-2 hover:underline"
        >
          Create new
        </button>
      </div>
    )
  }
  return (
    <div className="py-8 text-center">
      <p className="text-sm text-zinc-600">
        You don&apos;t have any collections yet.
      </p>
      <button
        type="button"
        onClick={onCreate}
        className="mt-3 text-sm font-medium text-zinc-950 underline-offset-2 hover:underline"
      >
        + Create your first collection
      </button>
    </div>
  )
}
