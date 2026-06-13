import { apiFetch, apiFetchBlob } from '@/lib/api-client'
import {
  merchantOrderDetailSchema,
  merchantOrderListSchema,
  type MerchantCancelReason,
  type MerchantOrderDetail,
  type MerchantOrderList,
  type OrderStatus,
} from '@/lib/schemas/order'

// Typed client for the merchant-orders module. Calls the Next proxy under
// /api/stores/:storeId/orders so auth + silent refresh come through apiFetch.

export interface OrderListFilters {
  status?: OrderStatus
  search?: string
  take?: number
  cursor?: string
}

export async function getStoreOrders(
  storeId: string,
  filters: OrderListFilters = {},
): Promise<MerchantOrderList> {
  const params = new URLSearchParams()
  if (filters.status) params.set('status', filters.status)
  if (filters.search) params.set('search', filters.search)
  if (filters.take !== undefined) params.set('take', String(filters.take))
  if (filters.cursor) params.set('cursor', filters.cursor)
  const qs = params.toString()

  const data = await apiFetch<unknown>(
    `/api/stores/${storeId}/orders${qs ? `?${qs}` : ''}`,
    { method: 'GET' },
  )
  return merchantOrderListSchema.parse(data)
}

export async function getStoreOrderDetail(
  storeId: string,
  orderId: string,
): Promise<MerchantOrderDetail> {
  const data = await apiFetch<unknown>(`/api/stores/${storeId}/orders/${orderId}`, {
    method: 'GET',
  })
  return merchantOrderDetailSchema.parse(data)
}

/** Advance fulfilment: CONFIRMED → PROCESSING → READY_FOR_DISPATCH. */
export async function updateOrderStatus(
  storeId: string,
  orderId: string,
  status: OrderStatus,
): Promise<{ id: string; status: OrderStatus }> {
  return apiFetch(`/api/stores/${storeId}/orders/${orderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export async function cancelStoreOrder(
  storeId: string,
  orderId: string,
  reason: MerchantCancelReason,
  notes?: string,
): Promise<{ id: string; status: OrderStatus }> {
  return apiFetch(`/api/stores/${storeId}/orders/${orderId}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ reason, ...(notes ? { notes } : {}) }),
  })
}

/**
 * Download the courier waybill PDF (available once the shipment is booked —
 * 404 before then; callers surface that as "not available yet").
 */
export async function downloadShippingLabel(
  storeId: string,
  orderId: string,
  orderNumber: string,
): Promise<void> {
  const blob = await apiFetchBlob(
    `/api/stores/${storeId}/orders/${orderId}/shipping-label`,
    { method: 'GET' },
  )
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `waybill-${orderNumber}.pdf`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
