import { z } from 'zod'

import { apiFetch } from '@/lib/api-client'
import {
  collectionSchema,
  createCollectionBodySchema,
  updateCollectionBodySchema,
  type Collection,
  type CreateCollectionBody,
  type UpdateCollectionBody,
} from '@/lib/schemas/collection'

// Typed client for merchant-side collection management. Backend exposes
// `GET /stores/:storeId/collections` (added during M10), so the list endpoint
// is the canonical source of truth. The localStorage cache in
// hooks/use-collections.ts is a degraded-mode fallback for offline / network
// failures.

const collectionsListResponseSchema = z.object({
  data: z.array(collectionSchema),
})

/**
 * GET /stores/:storeId/collections — list the store's collections.
 *
 * Ordered by sortOrder asc then name asc. Each row includes _count.products.
 * Works on DRAFT / PENDING_REVIEW stores too.
 */
export async function getCollections(storeId: string): Promise<Collection[]> {
  const data = await apiFetch<unknown>(`/api/stores/${storeId}/collections`, {
    method: 'GET',
  })
  return collectionsListResponseSchema.parse(data).data
}

/**
 * POST /stores/:storeId/collections — create a new collection.
 *
 * Backend auto-generates the slug from the name. The slug is fixed at
 * creation; subsequent name changes do NOT regenerate it.
 */
export async function createCollection(
  storeId: string,
  body: CreateCollectionBody,
): Promise<Collection> {
  const validated = createCollectionBodySchema.parse(body)
  const data = await apiFetch<unknown>(`/api/stores/${storeId}/collections`, {
    method: 'POST',
    body: JSON.stringify(validated),
  })
  return collectionSchema.parse(data)
}

/**
 * PATCH /stores/:storeId/collections/:collectionId — partial update.
 *
 * `slug` is not editable — it's fixed at creation. Helper text in the form
 * should make this explicit.
 */
export async function updateCollection(
  storeId: string,
  collectionId: string,
  body: UpdateCollectionBody,
): Promise<Collection> {
  const validated = updateCollectionBodySchema.parse(body)
  const data = await apiFetch<unknown>(
    `/api/stores/${storeId}/collections/${collectionId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(validated),
    },
  )
  return collectionSchema.parse(data)
}

/**
 * DELETE /stores/:storeId/collections/:collectionId — remove a collection.
 *
 * Products linked to the collection are NOT deleted — only the grouping.
 * The merchant's product catalogue is untouched.
 */
export async function deleteCollection(
  storeId: string,
  collectionId: string,
): Promise<void> {
  await apiFetch<unknown>(
    `/api/stores/${storeId}/collections/${collectionId}`,
    { method: 'DELETE' },
  )
}

/**
 * POST /stores/:storeId/collections/:collectionId/products/:productId — add
 * a product to a collection. Idempotent — backend returns the existing record
 * on duplicate.
 */
export async function addProductToCollection(
  storeId: string,
  collectionId: string,
  productId: string,
): Promise<void> {
  await apiFetch<unknown>(
    `/api/stores/${storeId}/collections/${collectionId}/products/${productId}`,
    { method: 'POST' },
  )
}

/**
 * DELETE /stores/:storeId/collections/:collectionId/products/:productId —
 * remove a product from a collection. Backend enforces the "last collection
 * on ACTIVE product" rule with a 400 — the frontend pre-empts client-side
 * but should still handle the 400 defensively.
 */
export async function removeProductFromCollection(
  storeId: string,
  collectionId: string,
  productId: string,
): Promise<void> {
  await apiFetch<unknown>(
    `/api/stores/${storeId}/collections/${collectionId}/products/${productId}`,
    { method: 'DELETE' },
  )
}
