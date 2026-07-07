import { z } from 'zod'
import { orderStatusSchema } from './order'

// Wire shapes of nuwa GET /stores/:storeId/earnings — merchant money
// visibility. All amounts are integer ZAR cents. These are ACCRUED earnings
// (payment landed via ITN); payout disbursement records are a later phase and
// the UI must not imply money has been transferred.

export const earningsTotalsSchema = z.object({
  grossInCents: z.coerce.number(),
  commissionInCents: z.coerce.number(),
  payoutInCents: z.coerce.number(),
  refundedInCents: z.coerce.number(),
  orderCount: z.coerce.number(),
})

export type EarningsTotals = z.infer<typeof earningsTotalsSchema>

export const earningsLedgerRowSchema = z.object({
  orderId: z.string(),
  orderNumber: z.string(),
  orderStatus: orderStatusSchema,
  confirmedAt: z.coerce.date().nullable(),
  grossInCents: z.coerce.number(),
  commissionInCents: z.coerce.number(),
  payoutInCents: z.coerce.number(),
  refundedInCents: z.coerce.number(),
})

export type EarningsLedgerRow = z.infer<typeof earningsLedgerRowSchema>

export const storeEarningsSchema = z.object({
  summary: z.object({
    lifetime: earningsTotalsSchema,
    period: earningsTotalsSchema.extend({ month: z.string() }),
  }),
  ledger: z.object({
    rows: z.array(earningsLedgerRowSchema),
    nextCursor: z.string().nullable(),
  }),
})

export type StoreEarnings = z.infer<typeof storeEarningsSchema>
