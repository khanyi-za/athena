import { z } from 'zod'

// Wire shapes of nuwa /stores/:storeId/returns — merchant returns queue.
// Lifecycle: REQUESTED → approve/reject; APPROVED → received; RECEIVED →
// close (after the admin Paystack refund tool has moved the money).

export const returnStatusSchema = z.enum([
  'REQUESTED',
  'APPROVED',
  'REJECTED',
  'RECEIVED',
  'CLOSED',
])

export type ReturnStatus = z.infer<typeof returnStatusSchema>

export const returnRequestSchema = z.object({
  id: z.string(),
  reason: z.string(),
  details: z.string().nullable(),
  status: returnStatusSchema,
  merchantNotes: z.string().nullable(),
  createdAt: z.coerce.date(),
  resolvedAt: z.coerce.date().nullable(),
  order: z.object({
    id: z.string(),
    orderNumber: z.string(),
    totalInCents: z.coerce.number(),
    deliveredAt: z.coerce.date().nullable(),
  }),
  buyer: z.object({
    name: z.string(),
    email: z.string(),
  }),
})

export type ReturnRequest = z.infer<typeof returnRequestSchema>

export const returnListSchema = z.object({
  returns: z.array(returnRequestSchema),
  nextCursor: z.string().nullable(),
})

export type ReturnList = z.infer<typeof returnListSchema>

export type ReturnAction = 'approve' | 'reject' | 'received' | 'close'
