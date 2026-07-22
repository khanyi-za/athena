import { z } from 'zod'
import { orderItemSchema, orderStatusSchema } from './order'

// Admin-orders module shapes (nuwa /admin/orders + /admin/payments/…/reconcile).
// Cross-store: every row carries the store name and buyer email; detail exposes
// payment internals (fee/net/commission/payout) the merchant surface hides.

export const adminOrderSummarySchema = z.object({
  id: z.string(),
  orderNumber: z.string(),
  status: orderStatusSchema,
  storeName: z.string(),
  subtotalInCents: z.coerce.number(),
  totalInCents: z.coerce.number(),
  itemCount: z.coerce.number(),
  buyerName: z.string(),
  buyerEmail: z.string(),
  placedAt: z.coerce.date(),
})

export type AdminOrderSummary = z.infer<typeof adminOrderSummarySchema>

export const adminOrderListSchema = z.object({
  orders: z.array(adminOrderSummarySchema),
  nextCursor: z.string().nullable(),
})

export type AdminOrderList = z.infer<typeof adminOrderListSchema>

// ── Detail ───────────────────────────────────────────────────────────────────

export const paymentGroupStatusSchema = z.enum([
  'PENDING',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
  'REFUNDED',
  'PARTIALLY_REFUNDED',
  'RECONCILE_REQUIRED',
])

export type PaymentGroupStatus = z.infer<typeof paymentGroupStatusSchema>

export const adminOrderDetailSchema = z.object({
  id: z.string(),
  orderNumber: z.string(),
  status: orderStatusSchema,
  subtotalInCents: z.coerce.number(),
  shippingInCents: z.coerce.number(),
  discountInCents: z.coerce.number(),
  totalInCents: z.coerce.number(),
  notes: z.string().nullable(),
  cancelReason: z.string().nullable(),
  timeline: z.object({
    placedAt: z.coerce.date(),
    confirmedAt: z.coerce.date().nullable(),
    dispatchedAt: z.coerce.date().nullable(),
    deliveredAt: z.coerce.date().nullable(),
    cancelledAt: z.coerce.date().nullable(),
  }),
  store: z.object({
    id: z.string(),
    displayName: z.string(),
    slug: z.string(),
  }),
  buyer: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    phone: z.string().nullable(),
    isGuestAccount: z.boolean(),
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
      amountFeeInCents: z.coerce.number(),
      amountNetInCents: z.coerce.number(),
      platformCommissionInCents: z.coerce.number(),
      merchantPayoutInCents: z.coerce.number(),
      refundedAmountInCents: z.coerce.number(),
      paymentGroup: z.object({
        id: z.string(),
        mPaymentId: z.string(),
        status: paymentGroupStatusSchema,
      }),
    })
    .nullable(),
})

export type AdminOrderDetail = z.infer<typeof adminOrderDetailSchema>

// ── Actions ──────────────────────────────────────────────────────────────────

export const adminCancelReasonSchema = z.enum([
  'FRAUD',
  'POLICY_VIOLATION',
  'CUSTOMER_REQUEST',
  'MERCHANT_REQUEST',
  'OTHER',
])

export type AdminCancelReason = z.infer<typeof adminCancelReasonSchema>

/** PATCH /admin/orders/:id body — all optional; empty string clears a field. */
export interface AdminEditOrderInput {
  notes?: string
  shippingName?: string
  shippingPhone?: string
  shippingAddress1?: string
  shippingAddress2?: string
  shippingCity?: string
  shippingProvince?: string
  shippingPostalCode?: string
}

export const adminRefundResponseSchema = z.object({
  id: z.string(),
  status: orderStatusSchema,
  refundId: z.string(),
  refundedThisCallInCents: z.coerce.number(),
  cumulativeRefundedInCents: z.coerce.number(),
})

export type AdminRefundResponse = z.infer<typeof adminRefundResponseSchema>

// ── Reconcile (GET /admin/payments/groups/:id/reconcile) ────────────────────

export const reconcileVerdictSchema = z.enum([
  'MATCH',
  'MISMATCH',
  'NOT_FOUND',
  'MATCH_PENDING',
])

export type ReconcileVerdict = z.infer<typeof reconcileVerdictSchema>

export const reconcileResultSchema = z.object({
  paymentGroup: z.object({
    id: z.string(),
    reference: z.string(),
    status: paymentGroupStatusSchema,
    amountGrossInCents: z.coerce.number(),
    createdAt: z.coerce.date(),
  }),
  paystack: z.object({
    found: z.boolean(),
    transactionId: z.coerce.number().optional(),
    status: z.string().optional(),
    amountInCents: z.coerce.number().optional(),
    paidAt: z.string().nullable().optional(),
    channel: z.string().optional(),
  }),
  verdict: reconcileVerdictSchema,
})

export type ReconcileResult = z.infer<typeof reconcileResultSchema>
