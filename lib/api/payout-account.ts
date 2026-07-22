import { apiFetch } from '@/lib/api-client'
import {
  payoutAccountViewSchema,
  payoutBanksSchema,
  type PayoutAccountView,
  type PayoutBanks,
  type SetPayoutAccountInput,
} from '@/lib/schemas/payout-account'

/** Current settlement-account status (configured, bank, last 4). */
export async function getPayoutAccount(
  storeId: string,
): Promise<PayoutAccountView> {
  const data = await apiFetch<unknown>(`/api/stores/${storeId}/payout-account`)
  return payoutAccountViewSchema.parse(data)
}

/** SA bank list for the form (name + Paystack bank code). */
export async function getPayoutBanks(storeId: string): Promise<PayoutBanks> {
  const data = await apiFetch<unknown>(
    `/api/stores/${storeId}/payout-account/banks`,
  )
  return payoutBanksSchema.parse(data)
}

/**
 * Create/update the store's Paystack subaccount from bank details.
 * Idempotent per store. NOTE: Paystack holds a NEW subaccount's first payout
 * for one-time verification — surfaced in the section copy.
 */
export async function setPayoutAccount(
  storeId: string,
  input: SetPayoutAccountInput,
): Promise<PayoutAccountView> {
  const data = await apiFetch<unknown>(
    `/api/stores/${storeId}/payout-account`,
    { method: 'POST', body: JSON.stringify(input) },
  )
  return payoutAccountViewSchema.parse(data)
}
