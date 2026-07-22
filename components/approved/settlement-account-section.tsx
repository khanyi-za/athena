'use client'

import { useMemo, useState } from 'react'
import { CheckCircle2, Landmark } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  usePayoutAccount,
  usePayoutBanks,
  useSetPayoutAccount,
} from '@/hooks/use-payout-account'
import { setPayoutAccountInputSchema } from '@/lib/schemas/payout-account'
import { cn } from '@/lib/utils'
import type { StoreMe } from '@/lib/schemas/store'

/**
 * Settlement account (Paystack subaccount) — what actually moves money.
 * Once configured, each sale's share (subtotal − 2.5% commission, minus
 * proportional processing fees) settles DIRECTLY to the merchant's bank on
 * Paystack's next-business-day cycle. Distinct from the legacy free-text
 * payout fields above it (kept for the business record / admin review).
 *
 * Prefills from the legacy fields where possible: account number verbatim,
 * bank by fuzzy name match against the live Paystack bank list.
 */
export function SettlementAccountSection({ store }: { store: StoreMe }) {
  const account = usePayoutAccount(store.id)
  const banks = usePayoutBanks(store.id)
  const save = useSetPayoutAccount(store.id)

  const [bankCode, setBankCode] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [touched, setTouched] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)

  // Prefill from the legacy payout fields once the bank list arrives.
  const prefill = useMemo(() => {
    const bankList = banks.data?.banks ?? []
    const legacyBank = (store.bankName ?? '').trim().toLowerCase()
    const match = legacyBank
      ? bankList.find(
          (b) =>
            b.name.toLowerCase().includes(legacyBank) ||
            legacyBank.includes(b.name.toLowerCase().split(' ')[0]),
        )
      : undefined
    return {
      bankCode: match?.code ?? '',
      accountNumber: (store.bankAccountNo ?? '').replace(/\D/g, ''),
    }
  }, [banks.data, store.bankName, store.bankAccountNo])

  const effBankCode = touched ? bankCode : bankCode || prefill.bankCode
  const effAccountNumber = touched
    ? accountNumber
    : accountNumber || prefill.accountNumber

  const showForm = editing || (account.data && !account.data.configured)

  function handleSubmit() {
    setFormError(null)
    const parsed = setPayoutAccountInputSchema.safeParse({
      bankCode: effBankCode,
      accountNumber: effAccountNumber,
    })
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Check the form')
      return
    }
    save.mutate(parsed.data, {
      onSuccess: () => {
        setEditing(false)
        setTouched(false)
      },
      onError: (err) => setFormError((err as Error).message),
    })
  }

  return (
    <section id="section-settlement" className="flex flex-col gap-6 scroll-mt-6">
      <header className="flex items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-foreground">
            Automatic payouts
          </h2>
          {account.data?.configured ? (
            <Badge tone="success" dot>
              Active
            </Badge>
          ) : (
            <Badge tone="warning" dot>
              Not set up
            </Badge>
          )}
        </div>
      </header>

      <p className="text-sm text-muted-foreground">
        Link your bank account to get paid automatically: your share of every
        sale (after the 2.5% commission and card processing fees) is settled
        directly to your bank on the next business day — no waiting for manual
        payouts. Your account details are held securely by Paystack; YIIVA
        stores only the last four digits.
      </p>

      {account.isPending ? (
        <div className="h-20 animate-pulse rounded-lg bg-muted" />
      ) : account.data?.configured && !showForm ? (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <Landmark size={20} className="text-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {account.data.bankName ?? 'Bank account'} ••••
                {account.data.accountLast4}
              </p>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <CheckCircle2 size={12} className="text-success" />
                Payouts settle automatically via Paystack
              </p>
            </div>
          </div>
          <button
            onClick={() => setEditing(true)}
            className="text-sm font-medium text-primary transition-colors hover:underline"
          >
            Change bank
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">
                Bank
              </span>
              <select
                value={effBankCode}
                onChange={(e) => {
                  setTouched(true)
                  setBankCode(e.target.value)
                  setAccountNumber(effAccountNumber)
                }}
                className={cn(
                  'h-9 w-full rounded-md border border-input bg-background px-3 text-sm',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                )}
              >
                <option value="">
                  {banks.isPending ? 'Loading banks…' : 'Select your bank'}
                </option>
                {(banks.data?.banks ?? []).map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">
                Account number
              </span>
              <Input
                inputMode="numeric"
                value={effAccountNumber}
                onChange={(e) => {
                  setTouched(true)
                  setBankCode(effBankCode)
                  setAccountNumber(e.target.value.replace(/\D/g, ''))
                }}
                placeholder="e.g. 62001236789"
              />
            </label>
          </div>

          {formError && <p className="text-sm text-danger">{formError}</p>}

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Paystack verifies new accounts — the first payout can be briefly
              held while they confirm the details.
            </p>
            <div className="flex shrink-0 items-center gap-2">
              {editing && (
                <button
                  onClick={() => {
                    setEditing(false)
                    setFormError(null)
                  }}
                  className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={handleSubmit}
                disabled={save.isPending}
                className={cn(
                  'rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground',
                  'transition-colors hover:bg-primary/90 disabled:opacity-50',
                )}
              >
                {save.isPending
                  ? 'Linking…'
                  : account.data?.configured
                    ? 'Update bank account'
                    : 'Link bank account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
