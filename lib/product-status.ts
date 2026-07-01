import type { ProductStatus } from '@/lib/schemas/product'
import type { BadgeTone } from '@/components/ui/badge'

// Single source of truth for product-status label + badge tone (YIIVA redesign),
// mirroring lib/order-status.ts. Supersedes the ProductStatusPill tone map.

export const PRODUCT_STATUS: Record<ProductStatus, { label: string; tone: BadgeTone }> = {
  DRAFT: { label: 'Draft', tone: 'neutral' },
  ACTIVE: { label: 'Active', tone: 'success' },
  OUT_OF_STOCK: { label: 'Out of stock', tone: 'warning' },
  ARCHIVED: { label: 'Archived', tone: 'neutral' },
}
