import { apiFetch } from '@/lib/api-client'
import {
  createAddressBodySchema,
  storeAddressSchema,
  updateAddressBodySchema,
  type CreateAddressBody,
  type StoreAddress,
  type UpdateAddressBody,
} from '@/lib/schemas/store'

// Typed client for store-address CRUD. All three endpoints hit the same proxy
// routes under /api/stores/:storeId/addresses* so auth + silent-refresh come
// through apiFetch. Responses are zod-parsed.

/**
 * POST /stores/:storeId/addresses — adds a physical location.
 *
 * Allowed on any store status except CLOSED. Per contract §"Last-address rule",
 * APPROVED/PENDING_GO_LIVE/ACTIVE stores must have ≥1 address.
 */
export async function createAddress(
  storeId: string,
  body: CreateAddressBody,
): Promise<StoreAddress> {
  const validated = createAddressBodySchema.parse(body)
  const data = await apiFetch<unknown>(`/api/stores/${storeId}/addresses`, {
    method: 'POST',
    body: JSON.stringify(validated),
  })
  return storeAddressSchema.parse(data)
}

/**
 * PATCH /stores/:storeId/addresses/:addressId — partial update.
 */
export async function updateAddress(
  storeId: string,
  addressId: string,
  body: UpdateAddressBody,
): Promise<StoreAddress> {
  const validated = updateAddressBodySchema.parse(body)
  const data = await apiFetch<unknown>(
    `/api/stores/${storeId}/addresses/${addressId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(validated),
    },
  )
  return storeAddressSchema.parse(data)
}

/**
 * DELETE /stores/:storeId/addresses/:addressId
 *
 * The backend returns `{ message: "Address deleted" }` on success. Per contract,
 * APPROVED+ stores get a `400 "Cannot delete the last address..."` instead —
 * the caller maps that to the "Add another first" recovery UI.
 */
export async function deleteAddress(storeId: string, addressId: string): Promise<void> {
  await apiFetch<unknown>(`/api/stores/${storeId}/addresses/${addressId}`, {
    method: 'DELETE',
  })
}
