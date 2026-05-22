import { apiFetch } from '@/lib/api-client'
import {
  adminReviewBodySchema,
  adminReviewResponseSchema,
  createStoreBodySchema,
  paginatedAdminPendingGoLiveStoresSchema,
  paginatedAdminPendingStoresSchema,
  storeMeSchema,
  storeSchema,
  updateStoreBodySchema,
  type AdminQueueFilters,
  type AdminReviewBody,
  type AdminReviewResponse,
  type CreateStoreBody,
  type PaginatedAdminPendingGoLiveStores,
  type PaginatedAdminPendingStores,
  type Store,
  type StoreMe,
  type UpdateStoreBody,
} from '@/lib/schemas/store'

// Typed client for the store module. Calls the Next.js proxy routes under
// /api/stores/* so auth (Bearer token) and silent refresh handling go through
// the shared apiFetch interceptor. Responses are zod-parsed so contract drift
// surfaces loudly rather than silently propagating malformed data.

/**
 * GET /stores/me — full private store view, or `null` when the user has no store.
 * The contract returns a 200 with body `null` rather than a 404.
 */
export async function getStoreMe(): Promise<StoreMe | null> {
  const data = await apiFetch<unknown>('/api/stores/me', { method: 'GET' })
  if (data === null) return null
  return storeMeSchema.parse(data)
}

/**
 * POST /stores — create a new store in DRAFT status.
 *
 * Throws on 409 conflicts (existing store / duplicate names) and 400 validation
 * errors — the caller maps these to inline field errors per store-frontend-flows §2.1.
 */
export async function createStore(body: CreateStoreBody): Promise<Store> {
  const validated = createStoreBodySchema.parse(body)
  const data = await apiFetch<unknown>('/api/stores', {
    method: 'POST',
    body: JSON.stringify(validated),
  })
  return storeSchema.parse(data)
}

/**
 * PATCH /stores/:id — partial update. Allowed in DRAFT, APPROVED, ACTIVE.
 *
 * Used by the wizard's autosave (one field at a time) and the product-editor
 * basics section in later milestones.
 */
export async function updateStore(id: string, body: UpdateStoreBody): Promise<Store> {
  const validated = updateStoreBodySchema.parse(body)
  const data = await apiFetch<unknown>(`/api/stores/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(validated),
  })
  return storeSchema.parse(data)
}

/**
 * POST /stores/:id/submit — submit a DRAFT store for first-review.
 *
 * On the success path, the store transitions to PENDING_REVIEW. On 400 with a
 * "The following fields are required..." message, the caller parses the list
 * and highlights each missing field in the wizard.
 */
export async function submitStore(id: string): Promise<Store> {
  const data = await apiFetch<unknown>(`/api/stores/${id}/submit`, {
    method: 'POST',
  })
  return storeSchema.parse(data)
}

/**
 * POST /stores/:id/request-go-live — request the second admin review.
 *
 * Allowed only on APPROVED stores. On success, status flips to PENDING_GO_LIVE
 * and any prior rejectionReason from a previous go-live attempt is cleared.
 * On 400 with "Cannot request go-live. Missing requirements: <list>", the
 * caller parses the list and surfaces inline in the readiness checklist.
 */
export async function requestGoLive(id: string): Promise<Store> {
  const data = await apiFetch<unknown>(`/api/stores/${id}/request-go-live`, {
    method: 'POST',
  })
  return storeSchema.parse(data)
}

// ----------------------------------------------------------------------------
// Admin endpoints
// ----------------------------------------------------------------------------

/**
 * GET /stores/admin/pending — first-review queue. Default sort oldest-first
 * (FIFO) per spec.
 */
export async function getAdminPendingStores(
  filters: AdminQueueFilters = {},
): Promise<PaginatedAdminPendingStores> {
  const params = new URLSearchParams()
  if (filters.page !== undefined) params.set('page', String(filters.page))
  if (filters.limit !== undefined) params.set('limit', String(filters.limit))
  if (filters.sortOrder) params.set('sortOrder', filters.sortOrder)

  const qs = params.toString()
  const url = qs ? `/api/stores/admin/pending?${qs}` : '/api/stores/admin/pending'

  const data = await apiFetch<unknown>(url, { method: 'GET' })
  return paginatedAdminPendingStoresSchema.parse(data)
}

/**
 * GET /stores/admin/pending-go-live — go-live queue. Rows include readiness
 * signals (addresses + active product count) so the admin can skim.
 */
export async function getAdminPendingGoLiveStores(
  filters: AdminQueueFilters = {},
): Promise<PaginatedAdminPendingGoLiveStores> {
  const params = new URLSearchParams()
  if (filters.page !== undefined) params.set('page', String(filters.page))
  if (filters.limit !== undefined) params.set('limit', String(filters.limit))
  if (filters.sortOrder) params.set('sortOrder', filters.sortOrder)

  const qs = params.toString()
  const url = qs
    ? `/api/stores/admin/pending-go-live?${qs}`
    : '/api/stores/admin/pending-go-live'

  const data = await apiFetch<unknown>(url, { method: 'GET' })
  return paginatedAdminPendingGoLiveStoresSchema.parse(data)
}

/**
 * POST /stores/:id/review — approve OR reject the first-review submission.
 *
 * On APPROVE: store moves to APPROVED, owner's role flips to MERCHANT, email
 * sent. On REJECT: store returns to DRAFT with rejectionReason set, email sent.
 */
export async function reviewStore(
  id: string,
  body: AdminReviewBody,
): Promise<AdminReviewResponse> {
  const validated = adminReviewBodySchema.parse(body)
  const data = await apiFetch<unknown>(`/api/stores/${id}/review`, {
    method: 'POST',
    body: JSON.stringify(validated),
  })
  return adminReviewResponseSchema.parse(data)
}

/**
 * POST /stores/:id/review-go-live — approve OR reject the go-live request.
 *
 * On APPROVE: store moves to ACTIVE (live to buyers). On REJECT: store returns
 * to APPROVED with rejectionReason set; merchant keeps MERCHANT role.
 */
export async function reviewGoLive(
  id: string,
  body: AdminReviewBody,
): Promise<AdminReviewResponse> {
  const validated = adminReviewBodySchema.parse(body)
  const data = await apiFetch<unknown>(`/api/stores/${id}/review-go-live`, {
    method: 'POST',
    body: JSON.stringify(validated),
  })
  return adminReviewResponseSchema.parse(data)
}
