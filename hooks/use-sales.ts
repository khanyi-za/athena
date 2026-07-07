'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createSaleCampaign,
  endSaleCampaign,
  getSaleCampaign,
  getSaleCampaigns,
} from '@/lib/api/sales'
import type { CreateSaleCampaignInput } from '@/lib/schemas/sales'

export function useSaleCampaigns(storeId: string | undefined) {
  return useQuery({
    queryKey: ['sale-campaigns', storeId],
    queryFn: () => getSaleCampaigns(storeId as string),
    enabled: !!storeId,
    staleTime: 30 * 1000,
  })
}

export function useSaleCampaign(storeId: string | undefined, campaignId: string | null) {
  return useQuery({
    queryKey: ['sale-campaign', storeId, campaignId],
    queryFn: () => getSaleCampaign(storeId as string, campaignId as string),
    enabled: !!storeId && !!campaignId,
    staleTime: 15 * 1000,
  })
}

// Sales mutate live product prices — invalidate product caches too so the
// products page and editors show the discounted prices immediately.
function useInvalidateAfterSaleChange(storeId: string | undefined) {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: ['sale-campaigns', storeId] })
    queryClient.invalidateQueries({ queryKey: ['sale-campaign', storeId] })
    queryClient.invalidateQueries({ queryKey: ['products', storeId] })
    queryClient.invalidateQueries({ queryKey: ['product', storeId] })
  }
}

export function useCreateSaleCampaign(storeId: string | undefined) {
  const invalidate = useInvalidateAfterSaleChange(storeId)
  return useMutation({
    mutationFn: (input: CreateSaleCampaignInput) =>
      createSaleCampaign(storeId as string, input),
    onSuccess: invalidate,
  })
}

export function useEndSaleCampaign(storeId: string | undefined) {
  const invalidate = useInvalidateAfterSaleChange(storeId)
  return useMutation({
    mutationFn: ({ campaignId }: { campaignId: string }) =>
      endSaleCampaign(storeId as string, campaignId),
    onSuccess: invalidate,
  })
}
