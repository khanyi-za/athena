'use client'

import { useState } from 'react'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { CollectionFormModal } from '@/components/collections/collection-form-modal'
import { DeleteCollectionModal } from '@/components/collections/delete-collection-modal'
import { useCollections } from '@/hooks/use-collections'
import { useStoreMe } from '@/hooks/use-store-me'
import type { Collection } from '@/lib/schemas/collection'

// Merchant-side collection management per product-frontend-flows.md §9.
//
// Surface: list of the store's collections with create + edit + delete.
// Detail pages (per-collection product lists) are deferred to a future
// milestone — for now the merchant manages collection membership inline from
// the product editor's Collections section (M10-D).
//
// Listing caveat: there's no merchant `GET /stores/:storeId/collections`
// endpoint. We read from a localStorage-backed cache populated by create/
// update calls. The cache survives reload but is per-device. On a fresh
// browser the merchant won't see prior-device collections until backend ships
// the list endpoint. Backend follow-up flagged in the M10 handoff.

type Modal =
  | { kind: 'none' }
  | { kind: 'create' }
  | { kind: 'edit'; target: Collection }
  | { kind: 'delete'; target: Collection }

export default function CollectionsPage() {
  const { data: store, isLoading: isStoreLoading } = useStoreMe()
  const { data: collections, isLoading: isCollectionsLoading } = useCollections(
    store?.id,
  )

  const [modal, setModal] = useState<Modal>({ kind: 'none' })

  if (isStoreLoading || isCollectionsLoading) return <LoadingState />
  if (!store) return <NoStoreState />

  const list = collections ?? []
  const closeModal = () => setModal({ kind: 'none' })

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-950">Collections</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Curated groupings of your products. Buyers browse these on your
            store page.
          </p>
        </div>
        <Button
          type="button"
          fullWidth={false}
          onClick={() => setModal({ kind: 'create' })}
        >
          + New collection
        </Button>
      </header>

      <Alert variant="info">
        Collections you create here are visible to buyers once your store is
        live. They&apos;re saved locally for now — once your store goes live, they
        appear on your public store page.
      </Alert>

      {list.length === 0 ? (
        <EmptyState onCreate={() => setModal({ kind: 'create' })} />
      ) : (
        <ul className="flex flex-col gap-3">
          {list
            .slice()
            .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
            .map((collection) => (
              <li key={collection.id}>
                <CollectionRow
                  collection={collection}
                  onEdit={() => setModal({ kind: 'edit', target: collection })}
                  onDelete={() => setModal({ kind: 'delete', target: collection })}
                />
              </li>
            ))}
        </ul>
      )}

      {(modal.kind === 'create' || modal.kind === 'edit') && (
        <CollectionFormModal
          storeId={store.id}
          mode={
            modal.kind === 'create'
              ? { kind: 'create' }
              : { kind: 'edit', target: modal.target }
          }
          onCancel={closeModal}
          onSaved={() => setModal({ kind: 'none' })}
        />
      )}

      {modal.kind === 'delete' && (
        <DeleteCollectionModal
          storeId={store.id}
          collection={modal.target}
          onCancel={closeModal}
          onDeleted={() => setModal({ kind: 'none' })}
        />
      )}
    </div>
  )
}

// ----------------------------------------------------------------------------
// Row
// ----------------------------------------------------------------------------

function CollectionRow({
  collection,
  onEdit,
  onDelete,
}: {
  collection: Collection
  onEdit: () => void
  onDelete: () => void
}) {
  const productCount = collection._count?.products ?? 0
  const createdDate = new Date(collection.createdAt).toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-zinc-200 bg-white p-4">
      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
        {collection.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={collection.imageUrl}
            alt={`${collection.name} cover`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-zinc-400">
            No cover
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-0.5 min-w-0">
        <p className="truncate text-sm font-semibold text-zinc-950">
          {collection.name}
        </p>
        <p
          className={[
            'truncate text-xs',
            collection.description ? 'text-zinc-600' : 'italic text-zinc-400',
          ].join(' ')}
        >
          {collection.description ?? 'no description'}
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          {productCount} product{productCount === 1 ? '' : 's'} · created {createdDate} ·{' '}
          <span className="font-mono">collections/{collection.slug}</span>
        </p>
      </div>

      <div className="flex flex-shrink-0 items-center gap-2 text-sm">
        <button
          type="button"
          onClick={onEdit}
          className="font-medium text-zinc-700 transition-colors hover:text-zinc-950"
        >
          Edit
        </button>
        <span aria-hidden className="text-zinc-300">
          ·
        </span>
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Delete ${collection.name}`}
          className="font-medium text-zinc-500 transition-colors hover:text-red-600"
        >
          Delete
        </button>
      </div>
    </div>
  )
}

// ----------------------------------------------------------------------------
// States
// ----------------------------------------------------------------------------

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-12 text-center">
      <h2 className="text-base font-semibold text-zinc-950">No collections yet</h2>
      <p className="mt-2 text-sm text-zinc-600">
        Group your products into collections like &quot;Summer 2026&quot; or
        &quot;Sale&quot;. Buyers see them on your store page.
      </p>
      <div className="mt-5 flex justify-center">
        <Button type="button" fullWidth={false} onClick={onCreate}>
          Create your first collection
        </Button>
      </div>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-16">
      <div
        aria-hidden
        className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-950"
      />
    </div>
  )
}

function NoStoreState() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
      <h2 className="text-lg font-semibold text-zinc-950">No store yet</h2>
      <p className="text-sm text-zinc-500">
        Set up your store first, then come back to organise your products into
        collections.
      </p>
    </div>
  )
}
