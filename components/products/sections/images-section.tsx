'use client'

import { useRef, useState } from 'react'
import { CldImage } from 'next-cloudinary'

import { MediaUploader } from '@/components/media-uploader'
import { useInvalidateProduct } from '@/hooks/use-product'
import { addProductImage, setPrimaryImage } from '@/lib/api/products'
import { PRODUCT_EDITOR_PREVIEW_800_RECIPE } from '@/lib/cloudinary-transforms'
import type { Product, ProductImage } from '@/lib/schemas/product'

import { DeleteImageModal } from '@/components/products/delete-image-modal'

// Images section of the product editor. Add via Cloudinary, set primary, delete.
// Drag-to-reorder is deferred to M6 polish — the backend's reorder endpoint
// requires the exact set of current image IDs which means a meaningful drag
// implementation. Not blocking activation in M5.

interface ImagesSectionProps {
  storeId: string
  product: Product
}

export function ImagesSection({ storeId, product }: ImagesSectionProps) {
  const invalidateProduct = useInvalidateProduct()
  const isArchived = product.status === 'ARCHIVED'

  const [busyImageId, setBusyImageId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<ProductImage | null>(null)
  const uploadTriggerRef = useRef<(() => void) | null>(null)

  async function handleUploaded(secureUrl: string) {
    try {
      // The first image added is auto-primary on the backend; subsequent uploads
      // are non-primary unless we send isPrimary: true.
      await addProductImage(storeId, product.id, {
        url: secureUrl,
        mediaType: 'IMAGE',
      })
    } finally {
      // Invalidate regardless of success — the upload is the user's intent;
      // refresh either shows the new image or reveals the failure state.
      invalidateProduct(storeId, product.id)
    }
  }

  async function handleSetPrimary(image: ProductImage) {
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

  function isOnlyImageOnActive(image: ProductImage): boolean {
    if (product.status !== 'ACTIVE') return false
    return product.images.length === 1 && product.images[0].id === image.id
  }

  // Sorted by sortOrder (the API already returns them in that order, but be
  // defensive in case a refetch races a reorder).
  const sortedImages = [...product.images].sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <section id="section-images" className="scroll-mt-6 flex flex-col gap-6">
      <header className="flex items-center justify-between gap-3 border-b border-zinc-200 pb-3">
        <h2 className="text-lg font-semibold text-zinc-950">Images</h2>
        {!isArchived && sortedImages.length > 0 && (
          <MediaUploader
            purpose="product_image"
            storeId={storeId}
            productId={product.id}
            label="+ Add image"
            onUploaded={(secureUrl) => void handleUploaded(secureUrl)}
          >
            {({ onClick, isPreparing, disabled }) => {
              uploadTriggerRef.current = onClick
              return (
                <button
                  type="button"
                  onClick={onClick}
                  disabled={disabled || isPreparing}
                  className="text-sm font-medium text-zinc-950 underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isPreparing ? 'Preparing…' : '+ Add image'}
                </button>
              )
            }}
          </MediaUploader>
        )}
      </header>

      {sortedImages.length === 0 ? (
        <EmptyState
          storeId={storeId}
          productId={product.id}
          onUploaded={handleUploaded}
          disabled={isArchived}
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {sortedImages.map((image) => (
            <ImageCard
              key={image.id}
              image={image}
              isBusy={busyImageId === image.id}
              readOnly={isArchived}
              onSetPrimary={() => void handleSetPrimary(image)}
              onDelete={() => setDeleting(image)}
            />
          ))}
        </div>
      )}

      {sortedImages.length > 0 && (
        <p className="text-xs text-zinc-500">
          At least one image is required to activate this product. The primary image is what
          buyers see in search and product cards.
        </p>
      )}

      {deleting && (
        <DeleteImageModal
          storeId={storeId}
          productId={product.id}
          image={deleting}
          preventLastDelete={isOnlyImageOnActive(deleting)}
          onClose={() => setDeleting(null)}
          onSuccess={handleDeleteSuccess}
          onAddInstead={() => {
            setDeleting(null)
            uploadTriggerRef.current?.()
          }}
        />
      )}
    </section>
  )
}

// ----------------------------------------------------------------------------
// Image card
// ----------------------------------------------------------------------------

function ImageCard({
  image,
  isBusy,
  readOnly,
  onSetPrimary,
  onDelete,
}: {
  image: ProductImage
  isBusy: boolean
  readOnly: boolean
  onSetPrimary: () => void
  onDelete: () => void
}) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
      <div className="aspect-square w-full">
        <CldImage
          src={image.url}
          {...PRODUCT_EDITOR_PREVIEW_800_RECIPE}
          alt={image.altText ?? 'Product image'}
          className="h-full w-full object-cover"
        />
      </div>

      {image.isPrimary && (
        <span className="absolute left-2 top-2 inline-flex items-center rounded-full bg-zinc-950 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
          Primary
        </span>
      )}

      {!readOnly && (
        <div className="flex items-center justify-between gap-2 border-t border-zinc-200 bg-white px-3 py-2 text-xs">
          {image.isPrimary ? (
            <span className="text-zinc-500">Default for buyers</span>
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
  onUploaded: (secureUrl: string) => Promise<void>
  disabled: boolean
}) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center">
      <p className="text-sm text-zinc-600">
        Add at least one image so buyers can see what they&apos;re buying.
      </p>
      <div className="mt-4 inline-flex">
        <MediaUploader
          purpose="product_image"
          storeId={storeId}
          productId={productId}
          label="+ Add your first image"
          onUploaded={(secureUrl) => void onUploaded(secureUrl)}
          disabled={disabled}
        />
      </div>
    </div>
  )
}
