import { z } from 'zod'

// Shopify merchant onboarding (nuwa src/shopify/). All endpoints are
// USER-scoped (JWT), not store-scoped — the import may create the store.

export const genderTypeSchema = z.enum(['WOMEN', 'MEN', 'UNISEX'])
export type GenderType = z.infer<typeof genderTypeSchema>

// GET /shopify/connection omits productsCount + websiteDomain (POST-only
// fields, computed from the live shop call at connect time) — keep optional.
export const shopifyConnectionSchema = z.object({
  id: z.string(),
  shopDomain: z.string(),
  shopName: z.string().nullable(),
  currencyCode: z.string().nullable(),
  currencySupported: z.boolean(),
  linkedStoreId: z.string().nullable(),
  connectedAt: z.coerce.date(),
  productsCount: z.number().optional(),
  websiteDomain: z.string().nullable().optional(),
})
export type ShopifyConnection = z.infer<typeof shopifyConnectionSchema>

export const connectShopifyInputSchema = z.object({
  shopDomain: z
    .string()
    .trim()
    .min(3, 'Enter your myshopify.com store domain')
    .max(120),
  // Dev Dashboard app credentials (Shopify retired in-admin custom apps
  // 2026-01-01 — permanent shpat_ tokens no longer exist for new apps; nuwa
  // exchanges these for auto-refreshed 24h access tokens).
  clientId: z
    .string()
    .trim()
    .min(10, 'Paste the Client ID from your app’s Settings page')
    .max(120),
  clientSecret: z
    .string()
    .trim()
    .min(20, 'Paste the Client secret from your app’s Settings page')
    .max(200),
})
export type ConnectShopifyInput = z.infer<typeof connectShopifyInputSchema>

export const shopifyImportPreviewSchema = z.object({
  shop: z.object({
    name: z.string(),
    domain: z.string(),
    currencyCode: z.string(),
  }),
  counts: z.object({
    products: z.number(),
    variants: z.number(),
    images: z.number(),
    collections: z.number(),
    locations: z.number(),
  }),
  genders: z.object({
    WOMEN: z.number(),
    MEN: z.number(),
    UNISEX: z.number(),
  }),
  warnings: z.object({
    productsWithoutImages: z.number(),
    productsWithoutCategory: z.number(),
    productsWithUntrackedStock: z.number(),
    productsOutOfStock: z.number(),
  }),
  sample: z.array(
    z.object({
      title: z.string(),
      priceInCents: z.number(),
      genderType: genderTypeSchema,
      suggestedCategorySlug: z.string().nullable(),
      imageCount: z.number(),
      variantCount: z.number(),
      stock: z.number(),
    }),
  ),
})
export type ShopifyImportPreview = z.infer<typeof shopifyImportPreviewSchema>

// The executor writes summary incrementally — null until the first progress
// write, and fields may appear over time. Never let a malformed summary break
// the poller: every field optional, whole object falls back to null.
export const importSummarySchema = z
  .object({
    phase: z.enum(['PULLING', 'IMPORTING', 'DONE']).optional(),
    totalProducts: z.number().optional(),
    productsImported: z.number().optional(),
    productsSkippedExisting: z.number().optional(),
    productsSkippedNoImage: z.number().optional(),
    productsFailed: z.number().optional(),
    variantsImported: z.number().optional(),
    imagesUploaded: z.number().optional(),
    imagesFailed: z.number().optional(),
    collectionsCreated: z.number().optional(),
    storeCreated: z.boolean().optional(),
  })
  .nullable()
  .catch(null)
export type ImportSummary = z.infer<typeof importSummarySchema>

export const shopifyImportJobSchema = z.object({
  id: z.string(),
  status: z.enum(['PENDING', 'RUNNING', 'COMPLETED', 'FAILED']),
  summary: importSummarySchema,
  error: z.string().nullable(),
  startedAt: z.coerce.date().nullable(),
  finishedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
})
export type ShopifyImportJob = z.infer<typeof shopifyImportJobSchema>

export const startImportInputSchema = z.object({
  defaultGenderType: genderTypeSchema.optional(),
})
export type StartImportInput = z.infer<typeof startImportInputSchema>
