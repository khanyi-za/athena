import { apiFetch } from '@/lib/api-client'
import {
  storeEarningsSchema,
  type StoreEarnings,
  type EarningsLedgerRow,
} from '@/lib/schemas/earnings'

// Typed client for merchant earnings. Calls the Next proxy under
// /api/stores/:storeId/earnings so auth + silent refresh come through apiFetch.

export interface EarningsFilters {
  month?: string // YYYY-MM
  cursor?: string
  take?: number
}

export async function getStoreEarnings(
  storeId: string,
  filters: EarningsFilters = {},
): Promise<StoreEarnings> {
  const params = new URLSearchParams()
  if (filters.month) params.set('month', filters.month)
  if (filters.cursor) params.set('cursor', filters.cursor)
  if (filters.take !== undefined) params.set('take', String(filters.take))
  const qs = params.toString()

  const data = await apiFetch<unknown>(
    `/api/stores/${storeId}/earnings${qs ? `?${qs}` : ''}`,
    { method: 'GET' },
  )
  return storeEarningsSchema.parse(data)
}

/** Build a bookkeeping-friendly CSV from ledger rows (client-side download). */
export function downloadEarningsCsv(
  rows: EarningsLedgerRow[],
  month: string,
  storeName: string,
): void {
  const header =
    'Order number,Date,Order status,Gross (R),Commission (R),Payout (R),Refunded (R)'
  const lines = rows.map((r) =>
    [
      r.orderNumber,
      r.confirmedAt ? r.confirmedAt.toISOString().slice(0, 10) : '',
      r.orderStatus,
      (r.grossInCents / 100).toFixed(2),
      (r.commissionInCents / 100).toFixed(2),
      (r.payoutInCents / 100).toFixed(2),
      (r.refundedInCents / 100).toFixed(2),
    ].join(','),
  )
  const csv = [header, ...lines].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `yiiva-earnings-${storeName.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-${month}.csv`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
