'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { getStoreEarnings } from '@/lib/api/earnings'

// Merchant earnings — one infinite query per (store, month). Page 1 carries
// the summaries; later pages extend the ledger.
export function useStoreEarnings(storeId: string | undefined, month: string) {
  return useInfiniteQuery({
    queryKey: ['store-earnings', storeId, month],
    queryFn: ({ pageParam }) =>
      getStoreEarnings(storeId as string, { month, cursor: pageParam, take: 25 }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.ledger.nextCursor ?? undefined,
    enabled: !!storeId,
    staleTime: 60 * 1000,
  })
}
