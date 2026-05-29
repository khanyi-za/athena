'use client'

import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'

import { Alert } from '@/components/ui/alert'
import { useAuthStore } from '@/store/auth-store'
import { useBodyScrollLock } from '@/lib/use-body-scroll-lock'
import { getCollections } from '@/lib/api/collections'
import type { Collection } from '@/lib/schemas/collection'

// Read-only collection detail modal used by the admin product-review modal.
// Fetches via GET /stores/:storeId/collections (will need admin-read access
// landed by the same backend change pattern as products — see
// docs/backend-handoffs/admin-read-store-collections.md).
//
// One round-trip per store: we fetch the full list and pick the target by id.
// React Query caches the list per storeId, so drilling into a second
// collection on the same store costs nothing.

interface ReviewCollectionModalProps {
  storeId: string
  collectionId: string
  fallbackName?: string
  onClose: () => void
}

const KEY = 'admin-store-collection' as const

export function ReviewCollectionModal({
  storeId,
  collectionId,
  fallbackName,
  onClose,
}: ReviewCollectionModalProps) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const { data, isLoading, isError } = useQuery<Collection[]>({
    queryKey: [KEY, storeId],
    queryFn: () => getCollections(storeId),
    enabled: !!accessToken,
  })

  const collection = data?.find((c) => c.id === collectionId)

  useBodyScrollLock()

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal
      aria-labelledby="review-collection-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 p-4"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[calc(100vh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between gap-3 border-b border-zinc-200 p-5">
          <h2
            id="review-collection-title"
            className="truncate text-lg font-semibold text-zinc-950"
          >
            {collection?.name ?? fallbackName ?? 'Collection'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950"
          >
            ✕
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5">
          {isLoading ? (
            <LoadingState />
          ) : isError ? (
            // Most likely cause: GET /stores/:storeId/collections is owner-only
            // and the admin's 403'd. Backend follow-up: see
            // docs/backend-handoffs/admin-read-store-collections.md.
            <Alert variant="error">
              Couldn&apos;t load this collection&apos;s details from the admin
              account. The merchant has it linked
              {fallbackName ? (
                <>
                  {' '}
                  as <span className="font-medium">{fallbackName}</span>
                </>
              ) : null}
              .
            </Alert>
          ) : !collection ? (
            <Alert variant="error">
              This collection was removed from the store between page load and
              now. Close and reopen to refresh.
            </Alert>
          ) : (
            <article className="flex flex-col gap-5">
              {/* Cover image */}
              {collection.imageUrl ? (
                <a
                  href={collection.imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block aspect-video overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={collection.imageUrl}
                    alt={`${collection.name} cover`}
                    className="h-full w-full object-cover"
                  />
                </a>
              ) : (
                <div className="flex aspect-video items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 text-sm text-zinc-400">
                  No cover image
                </div>
              )}

              {/* Description */}
              <Section title="Description">
                {collection.description ? (
                  <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-950">
                    {collection.description}
                  </p>
                ) : (
                  <p className="text-sm italic text-zinc-400">
                    No description provided.
                  </p>
                )}
              </Section>

              {/* Slug + product count */}
              <Section title="Public URL slug">
                <span className="font-mono text-sm text-zinc-700">
                  collections/{collection.slug}
                </span>
              </Section>

              <Section title="Products in this collection">
                <p className="text-sm text-zinc-700">
                  {(collection._count?.products ?? 0).toLocaleString('en-ZA')}{' '}
                  active product
                  {(collection._count?.products ?? 0) === 1 ? '' : 's'}
                </p>
              </Section>

              <Section title="Created">
                <p className="text-sm text-zinc-700">
                  {new Date(collection.createdAt).toLocaleDateString('en-ZA', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </Section>
            </article>
          )}
        </div>
      </div>
    </div>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {title}
      </h3>
      <div>{children}</div>
    </section>
  )
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <div
        aria-hidden
        className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-950"
      />
    </div>
  )
}
