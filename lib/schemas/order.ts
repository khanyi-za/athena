import { z } from 'zod'

// Merchant-orders module shapes (nuwa GET /stores/:storeId/orders).
// List rows are summaries; the full detail schema lands with the Orders page.

export const orderStatusSchema = z.enum([
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'READY_FOR_DISPATCH',
  'DISPATCHED',
  'IN_TRANSIT',
  'DELIVERED',
  'CANCELLED',
  'REFUND_REQUESTED',
  'REFUNDED',
])

export type OrderStatus = z.infer<typeof orderStatusSchema>

export const merchantOrderSummarySchema = z.object({
  id: z.string(),
  orderNumber: z.string(),
  status: orderStatusSchema,
  subtotalInCents: z.coerce.number(),
  totalInCents: z.coerce.number(),
  itemCount: z.coerce.number(),
  buyerName: z.string(),
  placedAt: z.coerce.date(),
})

export type MerchantOrderSummary = z.infer<typeof merchantOrderSummarySchema>

export const merchantOrderListSchema = z.object({
  orders: z.array(merchantOrderSummarySchema),
  nextCursor: z.string().nullable(),
})

export type MerchantOrderList = z.infer<typeof merchantOrderListSchema>

// ── Detail (GET /stores/:storeId/orders/:orderId) ────────────────────────────

export const merchantCancelReasonSchema = z.enum([
  'OUT_OF_STOCK',
  'CANNOT_FULFILL',
  'OTHER',
])

export type MerchantCancelReason = z.infer<typeof merchantCancelReasonSchema>

export const orderItemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  variantId: z.string().nullable(),
  productTitle: z.string(),
  variantName: z.string().nullable(),
  productImageUrl: z.string().nullable(),
  quantity: z.coerce.number(),
  unitPriceInCents: z.coerce.number(),
  totalInCents: z.coerce.number(),
})

export type OrderItem = z.infer<typeof orderItemSchema>

export const merchantOrderDetailSchema = z.object({
  id: z.string(),
  orderNumber: z.string(),
  status: orderStatusSchema,
  subtotalInCents: z.coerce.number(),
  shippingInCents: z.coerce.number(),
  discountInCents: z.coerce.number(),
  totalInCents: z.coerce.number(),
  notes: z.string().nullable(),
  cancelReason: z.string().nullable(),
  placedAt: z.coerce.date(),
  confirmedAt: z.coerce.date().nullable(),
  dispatchedAt: z.coerce.date().nullable(),
  deliveredAt: z.coerce.date().nullable(),
  cancelledAt: z.coerce.date().nullable(),
  buyer: z.object({
    name: z.string(),
    email: z.string(),
    phone: z.string().nullable(),
  }),
  shippingAddress: z.object({
    recipientName: z.string(),
    phone: z.string(),
    addressLine1: z.string(),
    addressLine2: z.string().nullable(),
    city: z.string(),
    province: z.string(),
    postalCode: z.string(),
    country: z.string(),
  }),
  items: z.array(orderItemSchema),
  payment: z
    .object({
      status: z.string(),
      amountGrossInCents: z.coerce.number(),
      platformCommissionInCents: z.coerce.number(),
      merchantPayoutInCents: z.coerce.number(),
    })
    .nullable(),
})

export type MerchantOrderDetail = z.infer<typeof merchantOrderDetailSchema>
