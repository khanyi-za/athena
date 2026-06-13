'use client'

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  cancelStoreOrder,
  getStoreOrderDetail,
  getStoreOrders,
  updateOrderStatus,
  type OrderListFilters,
} from '@/lib/api/orders'
import type { MerchantCancelReason, OrderStatus } from '@/lib/schemas/order'

// Merchant order list (first page). Orders are operationally time-sensitive —
// keep the cache short so the overview's recent-orders card stays honest.
export function useStoreOrders(
  storeId: string | undefined,
  filters: OrderListFilters = {},
) {
  return useQuery({
    queryKey: ['store-orders', storeId, filters],
    queryFn: () => getStoreOrders(storeId as string, filters),
    enabled: !!storeId,
    staleTime: 30 * 1000,
  })
}

/** Cursor-paginated list for the Orders page ("Load more" accumulation). */
export function useStoreOrdersInfinite(
  storeId: string | undefined,
  filters: Omit<OrderListFilters, 'cursor'> = {},
) {
  return useInfiniteQuery({
    queryKey: ['store-orders', storeId, 'infinite', filters],
    queryFn: ({ pageParam }) =>
      getStoreOrders(storeId as string, { ...filters, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!storeId,
    staleTime: 30 * 1000,
  })
}

export function useStoreOrder(storeId: string | undefined, orderId: string | null) {
  return useQuery({
    queryKey: ['store-order', storeId, orderId],
    queryFn: () => getStoreOrderDetail(storeId as string, orderId as string),
    enabled: !!storeId && !!orderId,
    staleTime: 15 * 1000,
  })
}

export function useUpdateOrderStatus(storeId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: OrderStatus }) =>
      updateOrderStatus(storeId as string, orderId, status),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['store-orders', storeId] })
      queryClient.invalidateQueries({ queryKey: ['store-order', storeId, vars.orderId] })
    },
  })
}

export function useCancelStoreOrder(storeId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      orderId,
      reason,
      notes,
    }: {
      orderId: string
      reason: MerchantCancelReason
      notes?: string
    }) => cancelStoreOrder(storeId as string, orderId, reason, notes),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['store-orders', storeId] })
      queryClient.invalidateQueries({ queryKey: ['store-order', storeId, vars.orderId] })
    },
  })
}
