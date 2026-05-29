'use client'

import { useEffect, useState } from 'react'
import { CldImage } from 'next-cloudinary'

import { Alert } from '@/components/ui/alert'
import { ProductStatusPill } from '@/components/ui/status-pill'
import { ReviewCollectionModal } from '@/components/admin/review-collection-modal'
import {
  INVENTORY_THUMB_200_RECIPE,
  PDP_DISPLAY_1200_RECIPE,
  videoFrameAtSecond,
} from '@/lib/cloudinary-transforms'
import { formatZAR } from '@/lib/format-money'
import { useBodyScrollLock } from '@/lib/use-body-scroll-lock'
import { useProduct } from '@/hooks/use-product'
import type { ProductImage } from '@/lib/schemas/product'

// Read-only product detail modal used by the admin launch-review screen.
// Fetches the full product via the existing useProduct hook (which now works
// for admin users thanks to the backend's May 2026 admin-read change). Pure
// display — no edit affordances, no actions. The admin is here to look at
// what the merchant submitted before approving the store launch.

interface ReviewProductModalProps {
  storeId: string
  productId: string
  onClose: () => void
}

export function ReviewProductModal({
  storeId,
  productId,
  onClose,
}: ReviewProductModalProps) {
  const { data: product, isLoading, isError } = useProduct(storeId, productId)

  // Drill-down into a single collection's details. Stays in this modal's
  // scope — the collection modal renders on top of this one with its own
  // body scroll lock counter (so closing it restores us, not the page).
  const [inspectingCollection, setInspectingCollection] = useState<{
    id: string
    name: string
  } | null>(null)

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
      aria-labelledby="review-product-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 p-4"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[calc(100vh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between gap-3 border-b border-zinc-200 p-5">
          <h2
            id="review-product-title"
            className="truncate text-lg font-semibold text-zinc-950"
          >
            {product?.title ?? 'Product'}
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
          ) : isError || !product ? (
            <Alert variant="error">
              Couldn&apos;t load this product. The merchant may have removed it,
              or there&apos;s a network issue.
            </Alert>
          ) : (
            <article className="flex flex-col gap-6">
              {/* Status + price line */}
              <div className="flex flex-wrap items-center gap-3">
                <ProductStatusPill status={product.status} />
                <span className="text-2xl font-semibold text-zinc-950">
                  {formatZAR(product.priceInCents)}
                </span>
                {product.comparePriceInCents !== null &&
                  product.comparePriceInCents > product.priceInCents && (
                    <span className="text-sm text-zinc-400 line-through">
                      {formatZAR(product.comparePriceInCents)}
                    </span>
                  )}
              </div>

              {/* Media — hero + thumbnail strip */}
              <MediaSection images={product.images} title={product.title} />

              {/* Description */}
              <Section title="Description">
                {product.description ? (
                  <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-950">
                    {product.description}
                  </p>
                ) : (
                  <p className="text-sm italic text-zinc-400">
                    No description provided.
                  </p>
                )}
              </Section>

              {/* Stock / variants */}
              <Section title="Stock & variants">
                {product.variants.length === 0 ? (
                  <p className="text-sm text-zinc-700">
                    {product.totalStock.toLocaleString('en-ZA')} in stock
                    {product.sku ? (
                      <span className="ml-2 font-mono text-xs text-zinc-500">
                        SKU {product.sku}
                      </span>
                    ) : null}
                  </p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {product.variants.map((v) => (
                      <li
                        key={v.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-zinc-200 bg-zinc-50 p-2 text-sm"
                      >
                        <span className="text-zinc-950">{v.name}</span>
                        <span className="flex flex-wrap items-center gap-3 text-xs text-zinc-600">
                          {v.priceInCents !== null && (
                            <span>{formatZAR(v.priceInCents)}</span>
                          )}
                          <span>{v.stock.toLocaleString('en-ZA')} in stock</span>
                          {v.sku && (
                            <span className="font-mono text-zinc-500">
                              SKU {v.sku}
                            </span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>

              {/* Collections (since collections gate activation in the new
                  contract, surfacing them helps the admin verify alignment).
                  Chips are clickable — open the collection detail modal so
                  the admin can spot-check description, cover, and member
                  count without leaving the review screen. */}
              {product.collections.length > 0 && (
                <Section title="Collections">
                  <ul className="flex flex-wrap gap-2">
                    {product.collections.map(({ collection }) => (
                      <li key={collection.id}>
                        <button
                          type="button"
                          onClick={() =>
                            setInspectingCollection({
                              id: collection.id,
                              name: collection.name,
                            })
                          }
                          className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-sm text-zinc-900 transition-colors hover:border-zinc-400 hover:bg-zinc-100"
                        >
                          {collection.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {/* Categories — backwards-compatible, may be empty under the
                  M10 contract */}
              {product.categories.length > 0 && (
                <Section title="Categories">
                  <ChipList
                    items={product.categories.map((c) => c.category.name)}
                  />
                </Section>
              )}

              {/* Tags */}
              {product.tags.length > 0 && (
                <Section title="Tags">
                  <ChipList items={product.tags.map((t) => t.tag.name)} />
                </Section>
              )}

              {/* Slug — useful for the admin verifying the public URL shape */}
              <Section title="Public URL slug">
                <span className="font-mono text-sm text-zinc-700">
                  /{product.slug}
                </span>
              </Section>
            </article>
          )}
        </div>

        {inspectingCollection && (
          <ReviewCollectionModal
            storeId={storeId}
            collectionId={inspectingCollection.id}
            fallbackName={inspectingCollection.name}
            onClose={() => setInspectingCollection(null)}
          />
        )}
      </div>
    </div>
  )
}

// ----------------------------------------------------------------------------
// Sub-bodies
// ----------------------------------------------------------------------------

function MediaSection({
  images,
  title,
}: {
  images: ProductImage[]
  title: string
}) {
  const sorted = [...images].sort((a, b) => a.sortOrder - b.sortOrder)
  const primary =
    sorted.find((i) => i.isPrimary && i.mediaType === 'IMAGE') ??
    sorted.find((i) => i.mediaType === 'IMAGE') ??
    sorted[0]

  if (!primary) {
    return (
      <Section title="Media">
        <p className="text-sm italic text-zinc-400">No images uploaded.</p>
      </Section>
    )
  }

  const rest = sorted.filter((i) => i.id !== primary.id)

  return (
    <Section title="Media">
      <a
        href={primary.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50"
      >
        <CldImage
          src={primary.url}
          {...(primary.mediaType === 'VIDEO'
            ? { assetType: 'video' as const, ...videoFrameAtSecond(2, 1200, 1200) }
            : PDP_DISPLAY_1200_RECIPE)}
          alt={primary.altText ?? title}
          className="h-auto w-full object-contain"
        />
      </a>
      {rest.length > 0 && (
        <ul className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {rest.map((item) => (
            <li key={item.id} className="flex-shrink-0">
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="relative block h-20 w-20 overflow-hidden rounded-md border border-zinc-200 bg-zinc-50"
              >
                <CldImage
                  src={item.url}
                  {...(item.mediaType === 'VIDEO'
                    ? { assetType: 'video' as const, ...videoFrameAtSecond(2, 200, 200) }
                    : INVENTORY_THUMB_200_RECIPE)}
                  alt={item.altText ?? title}
                  className="h-full w-full object-cover"
                />
                {item.mediaType === 'VIDEO' && (
                  <span className="absolute bottom-0.5 right-0.5 rounded-full bg-zinc-950/80 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    ▶
                  </span>
                )}
              </a>
            </li>
          ))}
        </ul>
      )}
    </Section>
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

function ChipList({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((name, i) => (
        <li
          key={i}
          className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-sm text-zinc-900"
        >
          {name}
        </li>
      ))}
    </ul>
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
