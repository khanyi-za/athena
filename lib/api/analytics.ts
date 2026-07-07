import { apiFetch } from '@/lib/api-client'
import {
  storeAnalyticsResponseSchema,
  type StoreAnalyticsResponse,
} from '@/lib/schemas/store-analytics'

// Typed client for merchant analytics. Calls the Next proxy under
// /api/stores/:storeId/analytics so auth + silent refresh come through apiFetch.

export async function getStoreAnalytics(
  storeId: string,
): Promise<StoreAnalyticsResponse> {
  const data = await apiFetch<unknown>(`/api/stores/${storeId}/analytics`, {
    method: 'GET',
  })
  return storeAnalyticsResponseSchema.parse(data)
}
