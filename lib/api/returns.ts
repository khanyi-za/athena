import { apiFetch } from '@/lib/api-client'
import {
  returnListSchema,
  type ReturnAction,
  type ReturnList,
  type ReturnStatus,
} from '@/lib/schemas/returns'

// Typed client for the merchant returns queue. Calls the Next proxy under
// /api/stores/:storeId/returns so auth + silent refresh come through apiFetch.

export interface ReturnListFilters {
  status?: ReturnStatus
  cursor?: string
  take?: number
}

export async function getStoreReturns(
  storeId: string,
  filters: ReturnListFilters = {},
): Promise<ReturnList> {
  const params = new URLSearchParams()
  if (filters.status) params.set('status', filters.status)
  if (filters.cursor) params.set('cursor', filters.cursor)
  if (filters.take !== undefined) params.set('take', String(filters.take))
  const qs = params.toString()

  const data = await apiFetch<unknown>(
    `/api/stores/${storeId}/returns${qs ? `?${qs}` : ''}`,
    { method: 'GET' },
  )
  return returnListSchema.parse(data)
}

export async function actionReturn(
  storeId: string,
  returnId: string,
  action: ReturnAction,
  notes?: string,
): Promise<{ id: string; status: string }> {
  return apiFetch(`/api/stores/${storeId}/returns/${returnId}/${action}`, {
    method: 'POST',
    body: JSON.stringify(notes ? { notes } : {}),
  })
}
