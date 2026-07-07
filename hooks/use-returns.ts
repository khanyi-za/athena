'use client'

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { actionReturn, getStoreReturns } from '@/lib/api/returns'
import type { ReturnAction, ReturnStatus } from '@/lib/schemas/returns'

export function useStoreReturnsInfinite(
  storeId: string | undefined,
  status?: ReturnStatus,
) {
  return useInfiniteQuery({
    queryKey: ['store-returns', storeId, status ?? 'all'],
    queryFn: ({ pageParam }) =>
      getStoreReturns(storeId as string, { status, cursor: pageParam, take: 20 }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!storeId,
    staleTime: 30 * 1000,
  })
}

export function useReturnAction(storeId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      returnId,
      action,
      notes,
    }: {
      returnId: string
      action: ReturnAction
      notes?: string
    }) => actionReturn(storeId as string, returnId, action, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-returns', storeId] })
    },
  })
}
