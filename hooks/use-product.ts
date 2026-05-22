'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getProduct } from '@/lib/api/products'
import { useAuthStore } from '@/store/auth-store'

// React Query wrapper for GET /stores/:storeId/products/:productId. Keyed by
// both IDs so the cache survives navigation between products. Invalidate after
// any product mutation (PATCH, activate, archive, image/category changes).

const KEY = 'product' as const

export function useProduct(storeId: string | null | undefined, productId: string | null | undefined) {
  const accessToken = useAuthStore((s) => s.accessToken)
  return useQuery({
    queryKey: [KEY, storeId, productId],
    queryFn: () => getProduct(storeId as string, productId as string),
    enabled: !!accessToken && !!storeId && !!productId,
  })
}

export function useInvalidateProduct() {
  const queryClient = useQueryClient()
  return (storeId?: string, productId?: string) => {
    if (storeId && productId) {
      return queryClient.invalidateQueries({ queryKey: [KEY, storeId, productId] })
    }
    return queryClient.invalidateQueries({ queryKey: [KEY] })
  }
}
