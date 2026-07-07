import { apiFetch } from '@/lib/api-client'
import {
  saleCampaignDetailSchema,
  saleCampaignListSchema,
  type CreateSaleCampaignInput,
  type SaleCampaignDetail,
  type SaleCampaignSummary,
} from '@/lib/schemas/sales'

// Typed client for sale campaigns. Calls the Next proxy under
// /api/stores/:storeId/sales so auth + silent refresh come through apiFetch.

export async function getSaleCampaigns(
  storeId: string,
): Promise<SaleCampaignSummary[]> {
  const data = await apiFetch<unknown>(`/api/stores/${storeId}/sales`, {
    method: 'GET',
  })
  return saleCampaignListSchema.parse(data).campaigns
}

export async function getSaleCampaign(
  storeId: string,
  campaignId: string,
): Promise<SaleCampaignDetail> {
  const data = await apiFetch<unknown>(
    `/api/stores/${storeId}/sales/${campaignId}`,
    { method: 'GET' },
  )
  return saleCampaignDetailSchema.parse(data)
}

/**
 * Create + apply immediately. 409 = a selected product is already in an
 * active sale; 400 = discount would price something below R1.
 */
export async function createSaleCampaign(
  storeId: string,
  input: CreateSaleCampaignInput,
): Promise<{ id: string }> {
  return apiFetch(`/api/stores/${storeId}/sales`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

/** End now — restores original prices (hand-edited prices are left alone). */
export async function endSaleCampaign(
  storeId: string,
  campaignId: string,
): Promise<{ id: string; status: string }> {
  return apiFetch(`/api/stores/${storeId}/sales/${campaignId}/end`, {
    method: 'POST',
  })
}
