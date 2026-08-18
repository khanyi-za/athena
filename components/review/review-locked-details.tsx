'use client'

import { StatusPill } from '@/components/ui/status-pill'
import type { StoreMe } from '@/lib/schemas/store'

// Read-only summary of the fields the admin review covers (identity, contact,
// business registration, banking) — shown in place of the editable wizard
// sections while the store is PENDING_REVIEW. The backend rejects PATCH in
// that status anyway; this makes the freeze legible instead of erroring.
// Modeled on Paystack's frozen compliance summary with its PENDING stamp.

export function ReviewLockedDetails({ store }: { store: StoreMe }) {
  return (
    <section
      id="section-review-locked"
      className="scroll-mt-6 rounded-xl border border-border bg-card p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">Business details</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            These are the details our team is reviewing, so they&apos;re locked
            until the review is complete. Everything else on this page stays
            editable.
          </p>
        </div>
        <StatusPill status="PENDING_REVIEW" className="shrink-0" />
      </div>

      <dl className="mt-6 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
        <Row label="Company name" value={store.companyName} />
        <Row label="Display name" value={store.displayName} />
        <Row label="Description" value={store.description} className="sm:col-span-2" />
        <Row label="Contact email" value={store.contactEmail} />
        <Row label="Contact phone" value={store.contactPhone} />
        <Row label="Business registration no." value={store.businessRegNo} />
        <Row label="VAT number" value={store.vatNumber} />
        <Row label="Bank" value={store.bankName} />
        <Row label="Account number" value={maskAccount(store.bankAccountNo)} />
        <Row label="Branch code" value={store.bankBranchCode} />
        <Row label="Account type" value={store.bankAccountType} />
      </dl>
    </section>
  )
}

function Row({
  label,
  value,
  className = '',
}: {
  label: string
  value: string | null
  className?: string
}) {
  return (
    <div className={className}>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-foreground">
        {value?.trim() ? value : <span className="text-muted-foreground">—</span>}
      </dd>
    </div>
  )
}

function maskAccount(accountNo: string | null): string | null {
  if (!accountNo) return null
  const digits = accountNo.trim()
  if (digits.length <= 4) return digits
  return `•••• ${digits.slice(-4)}`
}
