import { z } from 'zod'

// Wire shapes of nuwa /stores/:storeId/sales — catalogue sale campaigns.
// Applying a campaign discounts priceInCents (original parked on
// comparePriceInCents → buyer strikethrough); ending restores originals.
// Distinct from checkout promo codes (future feature).

export const saleDiscountTypeSchema = z.enum(['PERCENTAGE', 'FIXED_AMOUNT'])
export type SaleDiscountType = z.infer<typeof saleDiscountTypeSchema>

export const saleCampaignStatusSchema = z.enum(['ACTIVE', 'ENDED'])
export type SaleCampaignStatus = z.infer<typeof saleCampaignStatusSchema>

export const saleCampaignSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  discountType: saleDiscountTypeSchema,
  discountValue: z.coerce.number(),
  status: saleCampaignStatusSchema,
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date().nullable(),
  endedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  productCount: z.coerce.number(),
})

export type SaleCampaignSummary = z.infer<typeof saleCampaignSummarySchema>

export const saleCampaignListSchema = z.object({
  campaigns: z.array(saleCampaignSummarySchema),
})

export const saleCampaignDetailSchema = z.object({
  id: z.string(),
  name: z.string(),
  discountType: saleDiscountTypeSchema,
  discountValue: z.coerce.number(),
  status: saleCampaignStatusSchema,
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date().nullable(),
  endedAt: z.coerce.date().nullable(),
  products: z.array(
    z.object({
      productId: z.string(),
      title: z.string(),
      originalPriceInCents: z.coerce.number(),
      salePriceInCents: z.coerce.number(),
      currentPriceInCents: z.coerce.number(),
    }),
  ),
})

export type SaleCampaignDetail = z.infer<typeof saleCampaignDetailSchema>

export interface CreateSaleCampaignInput {
  name: string
  discountType: SaleDiscountType
  discountValue: number
  endsAt?: string
  productIds: string[]
}
