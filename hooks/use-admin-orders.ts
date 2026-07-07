'use client'

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  cancelAdminOrder,
  confirmAdminOrder,
  editAdminOrder,
  getAdminOrderDetail,
  getAdminOrders,
  reconcilePaymentGroup,
  refundAdminOrder,
  type AdminOrderListFilters,
} from '@/lib/api/admin-orders'
import type { AdminCancelReason, AdminEditOrderInput } from '@/lib/schemas/admin-order'

// Admin cross-store orders. Same cache posture as the merchant orders page —
// operationally time-sensitive, keep it short.

/** Cursor-paginated cross-store list ("Load more" accumulation). */
export function useAdminOrdersInfinite(filters: Omit<AdminOrderListFilters, 'cursor'> = {}) {
  return useInfiniteQuery({
    queryKey: ['admin-orders', 'infinite', filters],
    queryFn: ({ pageParam }) => getAdminOrders({ ...filters, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 30 * 1000,
  })
}

export function useAdminOrder(orderId: string | null) {
  return useQuery({
    queryKey: ['admin-order', orderId],
    queryFn: () => getAdminOrderDetail(orderId as string),
    enabled: !!orderId,
    staleTime: 15 * 1000,
  })
}

function useInvalidateAdminOrder() {
  const queryClient = useQueryClient()
  return (orderId: string) => {
    queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
    queryClient.invalidateQueries({ queryKey: ['admin-order', orderId] })
  }
}

export function useForceConfirmOrder() {
  const invalidate = useInvalidateAdminOrder()
  return useMutation({
    mutationFn: ({ orderId }: { orderId: string }) => confirmAdminOrder(orderId),
    onSuccess: (_data, vars) => invalidate(vars.orderId),
  })
}

export function useAdminCancelOrder() {
  const invalidate = useInvalidateAdminOrder()
  return useMutation({
    mutationFn: ({
      orderId,
      reason,
      notes,
    }: {
      orderId: string
      reason: AdminCancelReason
      notes?: string
    }) => cancelAdminOrder(orderId, reason, notes),
    onSuccess: (_data, vars) => invalidate(vars.orderId),
  })
}

export function useAdminEditOrder() {
  const invalidate = useInvalidateAdminOrder()
  return useMutation({
    mutationFn: ({ orderId, input }: { orderId: string; input: AdminEditOrderInput }) =>
      editAdminOrder(orderId, input),
    onSuccess: (_data, vars) => invalidate(vars.orderId),
  })
}

export function useAdminRefundOrder() {
  const invalidate = useInvalidateAdminOrder()
  return useMutation({
    mutationFn: ({
      orderId,
      amountInCents,
      reason,
      accType,
      notifyBuyer,
    }: {
      orderId: string
      amountInCents: number
      reason: string
      accType: 'current' | 'savings'
      notifyBuyer?: boolean
    }) => refundAdminOrder(orderId, { amountInCents, reason, accType, notifyBuyer }),
    onSuccess: (_data, vars) => invalidate(vars.orderId),
  })
}

/**
 * PayFast reconcile — hits PayFast's transactions/history API, so it only runs
 * when the operator opens the panel (`enabled`), and never auto-retries.
 */
export function useReconcilePaymentGroup(paymentGroupId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ['admin-reconcile', paymentGroupId],
    queryFn: () => reconcilePaymentGroup(paymentGroupId as string),
    enabled: enabled && !!paymentGroupId,
    staleTime: 30 * 1000,
    retry: 0,
    refetchOnWindowFocus: false,
  })
}
