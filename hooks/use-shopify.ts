import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  connectShopify,
  disconnectShopify,
  getLatestShopifyImport,
  getShopifyConnection,
  getShopifyImportPreview,
  startShopifyImport,
} from '@/lib/api/shopify'
import type { StartImportInput } from '@/lib/schemas/shopify'

const CONNECTION_KEY = ['shopify-connection'] as const
const PREVIEW_KEY = ['shopify-import-preview'] as const
const LATEST_IMPORT_KEY = ['shopify-import-latest'] as const

/** `data === null` means "not connected" (404 is data, not an error). */
export function useShopifyConnection() {
  return useQuery({
    queryKey: CONNECTION_KEY,
    queryFn: getShopifyConnection,
  })
}

export function useConnectShopify() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: connectShopify,
    // Direct cache write — the POST view carries productsCount/websiteDomain,
    // which a refetched GET would drop.
    onSuccess: (view) => queryClient.setQueryData(CONNECTION_KEY, view),
  })
}

export function useDisconnectShopify() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: disconnectShopify,
    onSuccess: () => {
      queryClient.setQueryData(CONNECTION_KEY, null)
      queryClient.removeQueries({ queryKey: PREVIEW_KEY })
    },
  })
}

/**
 * The preview re-pulls the merchant's whole catalogue from Shopify — an
 * expensive upstream call. Never auto-retry or focus-refetch it; a 5-minute
 * staleTime lets step navigation reuse the result.
 */
export function useShopifyImportPreview(enabled: boolean) {
  return useQuery({
    queryKey: PREVIEW_KEY,
    queryFn: getShopifyImportPreview,
    enabled,
    retry: false,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

export function useStartShopifyImport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: StartImportInput) => startShopifyImport(input),
    // Seed the poller with the PENDING job so polling starts immediately.
    onSuccess: (job) => queryClient.setQueryData(LATEST_IMPORT_KEY, job),
  })
}

const isJobLive = (status: string | undefined) =>
  status === 'PENDING' || status === 'RUNNING'

/**
 * Latest import job, polling every 2.5s while it is PENDING/RUNNING and
 * stopping on terminal states (COMPLETED/FAILED/none). Polling pauses while
 * the tab is hidden and catches up on focus.
 */
export function useLatestShopifyImport(opts?: { enabled?: boolean }) {
  return useQuery({
    queryKey: LATEST_IMPORT_KEY,
    queryFn: getLatestShopifyImport,
    enabled: opts?.enabled ?? true,
    refetchInterval: (query) =>
      isJobLive(query.state.data?.status) ? 2500 : false,
    refetchOnWindowFocus: (query) => isJobLive(query.state.data?.status),
  })
}
