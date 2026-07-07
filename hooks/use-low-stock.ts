'use client'

import { useQuery } from '@tanstack/react-query'
import { getLowStock } from '@/lib/api/inventory'

export function useLowStock(storeId: string | undefined) {
  return useQuery({
    queryKey: ['low-stock', storeId],
    queryFn: () => getLowStock(storeId as string),
    enabled: !!storeId,
    staleTime: 60 * 1000,
  })
}
