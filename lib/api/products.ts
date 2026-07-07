import { apiFetch } from '@/lib/api-client'
import {
  addProductImageBodySchema,
  createProductBodySchema,
  createVariantBodySchema,
  paginatedProductsResponseSchema,
  productImageSchema,
  productSchema,
  productVariantSchema,
  reorderProductImagesBodySchema,
  updateProductBodySchema,
  updateVariantBodySchema,
  type AddProductImageBody,
  type CreateProductBody,
  type CreateVariantBody,
  type PaginatedProductsResponse,
  type Product,
  type ProductImage,
  type ProductListFilters,
  type ProductVariant,
  type ReorderProductImagesBody,
  type UpdateProductBody,
  type UpdateVariantBody,
} from '@/lib/schemas/product'

// Typed client for the product module. Calls Next.js proxy routes under
// /api/stores/:storeId/products/* so auth + silent refresh come through
// apiFetch. Responses are zod-parsed.

// ----------------------------------------------------------------------------
// Reads
// ----------------------------------------------------------------------------

/**
 * Get the count of ACTIVE products for a store. Used by the M4 go-live
 * readiness checklist.
 */
export async function getActiveProductCount(storeId: string): Promise<number> {
  const params = new URLSearchParams({ status: 'ACTIVE', limit: '1' })
  const data = await apiFetch<unknown>(
    `/api/stores/${storeId}/products?${params.toString()}`,
    { method: 'GET' },
  )
  const parsed = paginatedProductsResponseSchema.parse(data)
  return parsed.meta.total
}

/**
 * Paginated, filterable product list. Works regardless of store status.
 */
export async function getProducts(
  storeId: string,
  filters: ProductListFilters = {},
): Promise<PaginatedProductsResponse> {
  const params = new URLSearchParams()
  if (filters.page !== undefined) params.set('page', String(filters.page))
  if (filters.limit !== undefined) params.set('limit', String(filters.limit))
  if (filters.status) params.set('status', filters.status)
  if (filters.search) params.set('search', filters.search)
  if (filters.categoryId) params.set('categoryId', filters.categoryId)
  if (filters.collectionId) params.set('collectionId', filters.collectionId)
  if (filters.sortBy) params.set('sortBy', filters.sortBy)

  const qs = params.toString()
  const url = qs
    ? `/api/stores/${storeId}/products?${qs}`
    : `/api/stores/${storeId}/products`

  const data = await apiFetch<unknown>(url, { method: 'GET' })
  return paginatedProductsResponseSchema.parse(data)
}

/**
 * Full product detail with all relations (images, variants, categories,
 * tags, collections).
 */
export async function getProduct(storeId: string, productId: string): Promise<Product> {
  const data = await apiFetch<unknown>(
    `/api/stores/${storeId}/products/${productId}`,
    { method: 'GET' },
  )
  return productSchema.parse(data)
}

// ----------------------------------------------------------------------------
// Lifecycle
// ----------------------------------------------------------------------------

/**
 * Create a new product in DRAFT status. Minimum payload is title + price.
 */
export async function createProduct(
  storeId: string,
  body: CreateProductBody,
): Promise<Product> {
  const validated = createProductBodySchema.parse(body)
  const data = await apiFetch<unknown>(`/api/stores/${storeId}/products`, {
    method: 'POST',
    body: JSON.stringify(validated),
  })
  return productSchema.parse(data)
}

/**
 * Partial update of scalar fields. Sub-resources (images, variants, etc.)
 * have their own dedicated endpoints — this PATCH doesn't accept them.
 */
export async function updateProduct(
  storeId: string,
  productId: string,
  body: UpdateProductBody,
): Promise<Product> {
  const validated = updateProductBodySchema.parse(body)
  const data = await apiFetch<unknown>(
    `/api/stores/${storeId}/products/${productId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(validated),
    },
  )
  return productSchema.parse(data)
}

/**
 * Publish — moves status to ACTIVE. On 400, `message` is an ARRAY listing every
 * failing requirement (not a string). Callers should detect Array.isArray and
 * render each line — see the wizard's submit error parsing for the pattern.
 */
export async function activateProduct(storeId: string, productId: string): Promise<Product> {
  const data = await apiFetch<unknown>(
    `/api/stores/${storeId}/products/${productId}/activate`,
    { method: 'POST' },
  )
  return productSchema.parse(data)
}

/**
 * Remove from sale — moves status to ARCHIVED. One-way: no reactivation endpoint.
 */
export async function archiveProduct(storeId: string, productId: string): Promise<Product> {
  const data = await apiFetch<unknown>(
    `/api/stores/${storeId}/products/${productId}/archive`,
    { method: 'POST' },
  )
  return productSchema.parse(data)
}

/**
 * Permanently delete. Only DRAFT products can be deleted — backend returns
 * 409 for any other status.
 */
export async function deleteProduct(storeId: string, productId: string): Promise<void> {
  await apiFetch<unknown>(`/api/stores/${storeId}/products/${productId}`, {
    method: 'DELETE',
  })
}

// ----------------------------------------------------------------------------
// Images
// ----------------------------------------------------------------------------

/**
 * Add an image or video. The `url` must be from the configured Cloudinary
 * cloud — backend validates the prefix. First image added is auto-primary.
 */
export async function addProductImage(
  storeId: string,
  productId: string,
  body: AddProductImageBody,
): Promise<ProductImage> {
  const validated = addProductImageBodySchema.parse(body)
  const data = await apiFetch<unknown>(
    `/api/stores/${storeId}/products/${productId}/images`,
    {
      method: 'POST',
      body: JSON.stringify(validated),
    },
  )
  return productImageSchema.parse(data)
}

/**
 * Promote an image to primary. The previous primary is automatically demoted.
 */
export async function setPrimaryImage(
  storeId: string,
  productId: string,
  imageId: string,
): Promise<ProductImage> {
  const data = await apiFetch<unknown>(
    `/api/stores/${storeId}/products/${productId}/images/${imageId}/primary`,
    { method: 'PATCH' },
  )
  return productImageSchema.parse(data)
}

/**
 * Reorder images. The `imageIds` array MUST contain the exact set of current
 * image IDs in the desired order — no more, no fewer. Backend rejects miscounts.
 *
 * Returns the full re-ordered image list.
 */
export async function reorderProductImages(
  storeId: string,
  productId: string,
  body: ReorderProductImagesBody,
): Promise<ProductImage[]> {
  const validated = reorderProductImagesBodySchema.parse(body)
  const data = await apiFetch<unknown>(
    `/api/stores/${storeId}/products/${productId}/images/reorder`,
    {
      method: 'PATCH',
      body: JSON.stringify(validated),
    },
  )
  // Response is an array of images, not a single one.
  if (!Array.isArray(data)) throw new Error('Unexpected reorder response shape')
  return data.map((item) => productImageSchema.parse(item))
}

/**
 * Remove an image. Last-image-on-ACTIVE returns 409 — callers replace the
 * deletion confirmation with the "Add another / archive instead" recovery UI.
 */
export async function deleteProductImage(
  storeId: string,
  productId: string,
  imageId: string,
): Promise<void> {
  await apiFetch<unknown>(
    `/api/stores/${storeId}/products/${productId}/images/${imageId}`,
    { method: 'DELETE' },
  )
}

// ----------------------------------------------------------------------------
// Variants
// ----------------------------------------------------------------------------
// A variant's stock is independent of the product's totalStock: once a product
// has variants, carts sell from variant stock and the bare totalStock is
// ignored. Store must be APPROVED/PENDING_GO_LIVE/ACTIVE; archived products 409.

/**
 * Add a variant. Omit priceInCents to inherit the product's base price.
 * sortOrder defaults to the end of the list.
 */
export async function createProductVariant(
  storeId: string,
  productId: string,
  body: CreateVariantBody,
): Promise<ProductVariant> {
  const validated = createVariantBodySchema.parse(body)
  const data = await apiFetch<unknown>(
    `/api/stores/${storeId}/products/${productId}/variants`,
    {
      method: 'POST',
      body: JSON.stringify(validated),
    },
  )
  return productVariantSchema.parse(data)
}

/**
 * Partial update. Pass priceInCents: null to clear a price override (variant
 * falls back to the product's base price).
 */
export async function updateProductVariant(
  storeId: string,
  productId: string,
  variantId: string,
  body: UpdateVariantBody,
): Promise<ProductVariant> {
  const validated = updateVariantBodySchema.parse(body)
  const data = await apiFetch<unknown>(
    `/api/stores/${storeId}/products/${productId}/variants/${variantId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(validated),
    },
  )
  return productVariantSchema.parse(data)
}

/**
 * Delete a variant. Backend renumbers the remaining variants' sortOrder.
 */
export async function deleteProductVariant(
  storeId: string,
  productId: string,
  variantId: string,
): Promise<void> {
  await apiFetch<unknown>(
    `/api/stores/${storeId}/products/${productId}/variants/${variantId}`,
    { method: 'DELETE' },
  )
}

// ----------------------------------------------------------------------------
// Category links
// ----------------------------------------------------------------------------

/**
 * Link a platform category to the product. Idempotent — re-linking returns
 * the existing link silently (no error).
 */
export async function linkProductCategory(
  storeId: string,
  productId: string,
  categoryId: string,
): Promise<void> {
  await apiFetch<unknown>(
    `/api/stores/${storeId}/products/${productId}/categories/${categoryId}`,
    { method: 'POST' },
  )
}

/**
 * Unlink. Last-category-on-ACTIVE returns 409 — callers replace deletion with
 * the "Add another / archive instead" recovery UI.
 */
export async function unlinkProductCategory(
  storeId: string,
  productId: string,
  categoryId: string,
): Promise<void> {
  await apiFetch<unknown>(
    `/api/stores/${storeId}/products/${productId}/categories/${categoryId}`,
    { method: 'DELETE' },
  )
}
