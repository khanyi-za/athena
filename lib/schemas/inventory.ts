import { z } from 'zod'
import { productStatusSchema } from './product'

// Wire shape of nuwa GET /stores/:storeId/inventory/low-stock.
// Variant-aware and reservation-aware: "available" is net of stock sitting in
// buyers' carts. lowVariants only lists the variants at/below threshold.

export const lowStockVariantSchema = z.object({
  id: z.string(),
  name: z.string(),
  sku: z.string().nullable(),
  stock: z.coerce.number(),
  reservedStock: z.coerce.number(),
  availableStock: z.coerce.number(),
})

export const lowStockItemSchema = z.object({
  productId: z.string(),
  title: z.string(),
  status: productStatusSchema,
  primaryImageUrl: z.string().nullable(),
  lowStockThreshold: z.coerce.number(),
  availableStock: z.coerce.number(),
  hasVariants: z.boolean(),
  lowVariants: z.array(lowStockVariantSchema),
})

export type LowStockItem = z.infer<typeof lowStockItemSchema>

export const lowStockResponseSchema = z.object({
  items: z.array(lowStockItemSchema),
  count: z.coerce.number(),
})

export type LowStockResponse = z.infer<typeof lowStockResponseSchema>
