import { z } from 'zod'

// Merchant settlement account for Paystack split payouts. The bank details
// themselves live at Paystack; nuwa returns only status + display metadata.

export const payoutAccountViewSchema = z.object({
  configured: z.boolean(),
  subaccountCode: z.string().nullable(),
  bankName: z.string().nullable(),
  accountLast4: z.string().nullable(),
})
export type PayoutAccountView = z.infer<typeof payoutAccountViewSchema>

export const payoutBanksSchema = z.object({
  banks: z.array(z.object({ name: z.string(), code: z.string() })),
})
export type PayoutBanks = z.infer<typeof payoutBanksSchema>

export const setPayoutAccountInputSchema = z.object({
  bankCode: z.string().regex(/^\d{3,6}$/, 'Select a bank'),
  accountNumber: z
    .string()
    .regex(/^\d{6,13}$/, 'Account number must be 6–13 digits'),
  businessName: z.string().max(120).optional(),
})
export type SetPayoutAccountInput = z.infer<typeof setPayoutAccountInputSchema>
