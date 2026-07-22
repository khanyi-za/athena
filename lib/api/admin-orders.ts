import { apiFetch } from '@/lib/api-client'
import {
  adminOrderDetailSchema,
  adminOrderListSchema,
  adminRefundResponseSchema,
  reconcileResultSchema,
  type AdminCancelReason,
  type AdminEditOrderInput,
  type AdminOrderDetail,
  type AdminOrderList,
  type AdminRefundResponse,
  type ReconcileResult,
} from '@/lib/schemas/admin-order'
import type { OrderStatus } from '@/lib/schemas/order'

// Typed client for the admin-orders module. Calls the Next proxy under
// /api/admin/orders so auth + silent refresh come through apiFetch.

export interface AdminOrderListFilters {
  storeId?: string
  status?: OrderStatus
  search?: string
  buyerEmail?: string
  take?: number
  cursor?: string
}

export async function getAdminOrders(
  filters: AdminOrderListFilters = {},
): Promise<AdminOrderList> {
  const params = new URLSearchParams()
  if (filters.storeId) params.set('storeId', filters.storeId)
  if (filters.status) params.set('status', filters.status)
  if (filters.search) params.set('search', filters.search)
  if (filters.buyerEmail) params.set('buyerEmail', filters.buyerEmail)
  if (filters.take !== undefined) params.set('take', String(filters.take))
  if (filters.cursor) params.set('cursor', filters.cursor)
  const qs = params.toString()

  const data = await apiFetch<unknown>(`/api/admin/orders${qs ? `?${qs}` : ''}`, {
    method: 'GET',
  })
  return adminOrderListSchema.parse(data)
}

export async function getAdminOrderDetail(orderId: string): Promise<AdminOrderDetail> {
  const data = await apiFetch<unknown>(`/api/admin/orders/${orderId}`, {
    method: 'GET',
  })
  return adminOrderDetailSchema.parse(data)
}

/** Edit shipping snapshot / notes. Only send the fields being changed. */
export async function editAdminOrder(
  orderId: string,
  input: AdminEditOrderInput,
): Promise<{ id: string; status: OrderStatus }> {
  return apiFetch(`/api/admin/orders/${orderId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

/** Force-confirm a PENDING order (manual payment verification). */
export async function confirmAdminOrder(
  orderId: string,
): Promise<{ id: string; status: OrderStatus }> {
  return apiFetch(`/api/admin/orders/${orderId}/confirm`, { method: 'POST' })
}

export async function cancelAdminOrder(
  orderId: string,
  reason: AdminCancelReason,
  notes?: string,
): Promise<{ id: string; status: OrderStatus }> {
  return apiFetch(`/api/admin/orders/${orderId}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ reason, ...(notes ? { notes } : {}) }),
  })
}

/**
 * Paystack refund (synchronous on the admin side; Paystack confirms via webhook).
 * Partial refunds allowed while cumulative ≤ gross. Sandbox always rejects —
 * Paystack refunds work in test mode too (migration 2026-07).
 */
export async function refundAdminOrder(
  orderId: string,
  input: {
    amountInCents: number
    reason: string
    notifyBuyer?: boolean
  },
): Promise<AdminRefundResponse> {
  const data = await apiFetch<unknown>(`/api/admin/orders/${orderId}/refund`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return adminRefundResponseSchema.parse(data)
}

/**
 * Read-only Paystack reconcile for a stuck PaymentGroup — queries Paystack's
 * transaction history around the group's createdAt and reports a verdict.
 */
export async function reconcilePaymentGroup(
  paymentGroupId: string,
): Promise<ReconcileResult> {
  const data = await apiFetch<unknown>(
    `/api/admin/payments/groups/${paymentGroupId}/reconcile`,
    { method: 'GET' },
  )
  return reconcileResultSchema.parse(data)
}
