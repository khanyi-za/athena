'use client'

import { useRef, useState } from 'react'
import { CldImage } from 'next-cloudinary'

import { MediaUploader } from '@/components/media-uploader'
import { useInvalidateProduct } from '@/hooks/use-product'
import { addProductImage, setPrimaryImage } from '@/lib/api/products'
import {
  PRODUCT_EDITOR_PREVIEW_800_RECIPE,
  videoFrameAtSecond,
} from '@/lib/cloudinary-transforms'
import type { Product, ProductImage } from '@/lib/schemas/product'

import { DeleteImageModal } from '@/components/products/delete-image-modal'

// Media section of the product editor. Add images + videos via Cloudinary,
// set primary (image only for now), delete.
//
// Activation gate: ≥1 image (mediaType: 'IMAGE') — videos don't count.
// Last-image protection: only blocks delete when removing the last IMAGE on an
// ACTIVE product; videos can be removed freely (since they're not gating
// activation). See activation-readiness-panel.tsx — it already filters by
// mediaType === 'IMAGE'.
//
// Primary item determines the catalog thumbnail. v1 keeps "primary = image
// only" because the productListItemSchema response doesn't carry mediaType,
// so a primary video would break inventory rendering. Backend can add that
// later and we relax this constraint by removing the !isImage gate below.

interface ImagesSectionProps {
  storeId: string
  product: Product
}

export function ImagesSection({ storeId, product }: ImagesSectionProps) {
  const invalidateProduct = useInvalidateProduct()
  const isArchived = product.status === 'ARCHIVED'

  const [busyImageId, setBusyImageId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<ProductImage | null>(null)
  const addImageTriggerRef = useRef<(() => void) | null>(null)

  async function handleUploaded(
    secureUrl: string,
    mediaType: 'IMAGE' | 'VIDEO',
  ) {
    try {
      // The first image added is auto-primary on the backend; subsequent uploads
      // are non-primary unless we send isPrimary: true. Videos uploaded into an
      // empty gallery would also become "first item", but the backend may or may
      // not auto-primary them — we leave that to the backend's decision.
      await addProductImage(storeId, product.id, {
        url: secureUrl,
        mediaType,
      })
    } finally {
      // Invalidate regardless of success — the upload is the user's intent;
      // refresh either shows the new item or reveals the failure state.
      invalidateProduct(storeId, product.id)
    }
  }

  async function handleSetPrimary(image: ProductImage) {
    // Videos can't be primary in v1 — see file header comment.
    if (image.mediaType !== 'IMAGE') return
    if (image.isPrimary || busyImageId) return
    setBusyImageId(image.id)
    try {
      await setPrimaryImage(storeId, product.id, image.id)
      invalidateProduct(storeId, product.id)
    } catch {
      // Swallowed — could surface inline; for v1, the user can retry.
    } finally {
      setBusyImageId(null)
    }
  }

  function handleDeleteSuccess() {
    invalidateProduct(storeId, product.id)
    setDeleting(null)
  }

  // Activation requires ≥1 IMAGE — videos don't count. So the "last image"
  // protection should only fire when:
  //   1. The product is ACTIVE
  //   2. The item being deleted is itself an IMAGE
  //   3. Removing it leaves zero images in the gallery
  // Deleting a video on an ACTIVE product is always safe.
  function isLastImageOnActive(item: ProductImage): boolean {
    if (product.status !== 'ACTIVE') return false
    if (item.mediaType !== 'IMAGE') return false
    const imageCount = product.images.filter((i) => i.mediaType === 'IMAGE').length
    return imageCount === 1
  }

  // Sorted by sortOrder (the API already returns them in that order, but be
  // defensive in case a refetch races a reorder).
  const sortedItems = [...product.images].sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <section id="section-images" className="scroll-mt-6 flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 pb-3">
        <h2 className="text-lg font-semibold text-zinc-950">Media</h2>
        {!isArchived && sortedItems.length > 0 && (
          <div className="flex items-center gap-3 text-sm">
            <MediaUploader
              purpose="product_image"
              storeId={storeId}
              productId={product.id}
              label="+ Add image"
              onUploaded={(url) => void handleUploaded(url, 'IMAGE')}
            >
              {({ onClick, isPreparing, disabled }) => {
                addImageTriggerRef.current = onClick
                return (
                  <button
                    type="button"
                    onClick={onClick}
                    disabled={disabled || isPreparing}
                    className="font-medium text-zinc-950 underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isPreparing ? 'Preparing…' : '+ Add image'}
                  </button>
                )
              }}
            </MediaUploader>
            <span aria-hidden className="text-zinc-300">
              |
            </span>
            <MediaUploader
              purpose="product_video"
              storeId={storeId}
              productId={product.id}
              label="+ Add video"
              onUploaded={(url) => void handleUploaded(url, 'VIDEO')}
            >
              {({ onClick, isPreparing, disabled }) => (
                <button
                  type="button"
                  onClick={onClick}
                  disabled={disabled || isPreparing}
                  className="font-medium text-zinc-950 underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isPreparing ? 'Preparing…' : '+ Add video'}
                </button>
              )}
            </MediaUploader>
          </div>
        )}
      </header>

      {sortedItems.length === 0 ? (
        <EmptyState
          storeId={storeId}
          productId={product.id}
          onUploaded={handleUploaded}
          disabled={isArchived}
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {sortedItems.map((item) => (
            <MediaCard
              key={item.id}
              item={item}
              isBusy={busyImageId === item.id}
              readOnly={isArchived}
              onSetPrimary={() => void handleSetPrimary(item)}
              onDelete={() => setDeleting(item)}
            />
          ))}
        </div>
      )}

      {sortedItems.length > 0 && (
        <p className="text-xs text-zinc-500">
          At least one image is required to activate this product. Videos are
          optional and shown alongside images. The primary image is what buyers
          see in search and product cards.
        </p>
      )}

      {deleting && (
        <DeleteImageModal
          storeId={storeId}
          productId={product.id}
          image={deleting}
          preventLastDelete={isLastImageOnActive(deleting)}
          onClose={() => setDeleting(null)}
          onSuccess={handleDeleteSuccess}
          onAddInstead={() => {
            setDeleting(null)
            addImageTriggerRef.current?.()
          }}
        />
      )}
    </section>
  )
}

// ----------------------------------------------------------------------------
// Media card — renders an image or a video frame with a ▶ badge
// ----------------------------------------------------------------------------

function MediaCard({
  item,
  isBusy,
  readOnly,
  onSetPrimary,
  onDelete,
}: {
  item: ProductImage
  isBusy: boolean
  readOnly: boolean
  onSetPrimary: () => void
  onDelete: () => void
}) {
  const isVideo = item.mediaType === 'VIDEO'

  return (
    <div className="relative overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
      <div className="relative aspect-square w-full">
        {isVideo ? (
          // assetType="video" routes through Cloudinary's video pipeline so
          // we can frame-extract at 2s (the secure_url is a .mp4 — passing it
          // to CldImage as a regular image would 404).
          <CldImage
            src={item.url}
            assetType="video"
            {...videoFrameAtSecond(2, 800, 800)}
            alt="Product video frame"
            className="h-full w-full object-cover"
          />
        ) : (
          <CldImage
            src={item.url}
            {...PRODUCT_EDITOR_PREVIEW_800_RECIPE}
            alt={item.altText ?? 'Product image'}
            className="h-full w-full object-cover"
          />
        )}
        {isVideo && (
          // Click-through to play the original video file in a new tab — no
          // inline player in v1.
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open video"
            className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-zinc-950/80 px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-zinc-950"
          >
            ▶ Play
          </a>
        )}
      </div>

      {item.isPrimary && (
        <span className="absolute left-2 top-2 inline-flex items-center rounded-full bg-zinc-950 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
          Primary
        </span>
      )}

      {!readOnly && (
        <div className="flex items-center justify-between gap-2 border-t border-zinc-200 bg-white px-3 py-2 text-xs">
          {item.isPrimary ? (
            <span className="text-zinc-500">Default for buyers</span>
          ) : isVideo ? (
            <span
              className="text-zinc-400"
              title="Only images can be the primary catalog thumbnail in v1."
            >
              Video
            </span>
          ) : (
            <button
              type="button"
              onClick={onSetPrimary}
              disabled={isBusy}
              className="font-medium text-zinc-700 transition-colors hover:text-zinc-950 disabled:opacity-50"
            >
              {isBusy ? 'Setting…' : 'Set primary'}
            </button>
          )}
          <button
            type="button"
            onClick={onDelete}
            disabled={isBusy}
            className="font-medium text-zinc-500 transition-colors hover:text-red-600 disabled:opacity-50"
          >
            Remove
          </button>
        </div>
      )}
    </div>
  )
}

// ----------------------------------------------------------------------------
// Empty state
// ----------------------------------------------------------------------------

function EmptyState({
  storeId,
  productId,
  onUploaded,
  disabled,
}: {
  storeId: string
  productId: string
  onUploaded: (secureUrl: string, mediaType: 'IMAGE' | 'VIDEO') => Promise<void>
  disabled: boolean
}) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center">
      <p className="text-sm text-zinc-600">
        Add images and videos so buyers can see what they&apos;re buying. At
        least one image is required to activate.
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        <MediaUploader
          purpose="product_image"
          storeId={storeId}
          productId={productId}
          label="+ Add image"
          onUploaded={(url) => void onUploaded(url, 'IMAGE')}
          disabled={disabled}
        />
        <MediaUploader
          purpose="product_video"
          storeId={storeId}
          productId={productId}
          label="+ Add video"
          onUploaded={(url) => void onUploaded(url, 'VIDEO')}
          disabled={disabled}
        />
      </div>
    </div>
  )
}
