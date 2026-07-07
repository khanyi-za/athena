import { apiFetch } from '@/lib/api-client'
import {
  lowStockResponseSchema,
  type LowStockResponse,
} from '@/lib/schemas/inventory'

// Typed client for inventory alerts. Calls the Next proxy under
// /api/stores/:storeId/inventory so auth + silent refresh come through apiFetch.

export async function getLowStock(storeId: string): Promise<LowStockResponse> {
  const data = await apiFetch<unknown>(
    `/api/stores/${storeId}/inventory/low-stock`,
    { method: 'GET' },
  )
  return lowStockResponseSchema.parse(data)
}
