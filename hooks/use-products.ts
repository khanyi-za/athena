'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getProducts } from '@/lib/api/products'
import { useAuthStore } from '@/store/auth-store'
import type { ProductListFilters } from '@/lib/schemas/product'

// React Query wrapper for the paginated product list. Filters are part of the
// query key so each unique filter combination caches independently — switching
// between status tabs feels instant after the first fetch.

const KEY = 'products' as const

export function useProducts(
  storeId: string | null | undefined,
  filters: ProductListFilters = {},
) {
  const accessToken = useAuthStore((s) => s.accessToken)
  return useQuery({
    queryKey: [KEY, storeId, filters],
    queryFn: () => getProducts(storeId as string, filters),
    enabled: !!accessToken && !!storeId,
  })
}

export function useInvalidateProducts() {
  const queryClient = useQueryClient()
  return (storeId?: string) => {
    if (storeId) {
      return queryClient.invalidateQueries({ queryKey: [KEY, storeId] })
    }
    return queryClient.invalidateQueries({ queryKey: [KEY] })
  }
}
