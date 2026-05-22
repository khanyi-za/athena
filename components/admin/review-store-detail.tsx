'use client'

import { CldImage } from 'next-cloudinary'

import { MaskedBankDisplay } from '@/components/admin/masked-bank-display'
import { STORE_LOGO_RECIPE, STORE_BANNER_RECIPE } from '@/lib/cloudinary-transforms'
import type { AdminPendingStore } from '@/lib/schemas/store'

// Full read-only display of a submitted store. The admin's decision surface
// per store-frontend-flows §6.2. Information-dense by design — admins read
// 50 of these in a sitting and want every relevant signal visible.
//
// All fields read-only. No edit affordance anywhere. Bank account masked by
// default with click-to-reveal (MaskedBankDisplay handles the re-mask logic).

interface ReviewStoreDetailProps {
  store: AdminPendingStore
}

export function ReviewStoreDetail({ store }: ReviewStoreDetailProps) {
  return (
    <div className="flex flex-col gap-6">
      <Section title="Brand identity">
        <Field label="Display name" value={store.displayName} />
        <Field label="Slug" value={store.slug} mono />
        <Field label="Company name" value={store.companyName} />
        <Field label="Description" value={store.description} multiline />
        <Field label="Story" value={store.story} multiline />
        <Field label="Website" value={store.websiteUrl} link />
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Logo
          </p>
          {store.logoUrl ? (
            <a
              href={store.logoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block h-32 w-32 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50"
            >
              <CldImage
                src={store.logoUrl}
                {...STORE_LOGO_RECIPE}
                alt={`${store.displayName} logo`}
                className="h-full w-full object-cover"
              />
            </a>
          ) : (
            <p className="text-sm text-zinc-400">No logo uploaded</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Banner
          </p>
          {store.bannerUrl ? (
            <a
              href={store.bannerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block aspect-[4/1] w-full overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50"
            >
              <CldImage
                src={store.bannerUrl}
                {...STORE_BANNER_RECIPE}
                alt={`${store.displayName} banner`}
                className="h-full w-full object-cover"
              />
            </a>
          ) : (
            <p className="text-sm text-zinc-400">Not yet uploaded</p>
          )}
        </div>
      </Section>

      <Section title="Owner">
        <Field
          label="Name"
          value={`${store.owner.firstName} ${store.owner.lastName}`}
        />
        <Field label="Email" value={store.owner.email} />
        <Field label="Phone" value={store.owner.phone ?? null} />
      </Section>

      <Section title="Contact (public-facing)">
        <Field label="Email" value={store.contactEmail} />
        <Field label="Phone" value={store.contactPhone} />
      </Section>

      <Section title="Business registration">
        <Field label="CIPC registration" value={store.businessRegNo} mono />
        <Field label="VAT number" value={store.vatNumber} mono />
      </Section>

      <Section title="Bank / payout">
        <Field label="Bank" value={store.bankName} />
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Account number
          </p>
          <MaskedBankDisplay value={store.bankAccountNo} />
        </div>
        <Field label="Branch code" value={store.bankBranchCode} mono />
        <Field label="Account type" value={store.bankAccountType} />
      </Section>

      <Section title="Submission timeline">
        <Field
          label="Submitted"
          value={`${relativeTime(store.updatedAt)} · ${absoluteDate(store.updatedAt)}`}
        />
        {store.rejectionReason && (
          <Field
            label="Previous rejection reason"
            value={store.rejectionReason}
            multiline
          />
        )}
      </Section>
    </div>
  )
}

// ----------------------------------------------------------------------------
// Sub-components
// ----------------------------------------------------------------------------

export function Section({
  title,
  children,
  defaultOpen,
}: {
  title: string
  children: React.ReactNode
  /** If provided, renders the section as a collapsible <details> block. */
  defaultOpen?: boolean
}) {
  if (defaultOpen !== undefined) {
    return (
      <details
        open={defaultOpen}
        className="group rounded-xl border border-zinc-200 bg-white p-5"
      >
        <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold uppercase tracking-wide text-zinc-500">
          {title}
          <span className="text-xs text-zinc-400 transition-transform group-open:rotate-180">
            ▼
          </span>
        </summary>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
      </details>
    )
  }
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
        {title}
      </h2>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </section>
  )
}

export function Field({
  label,
  value,
  multiline,
  mono,
  link,
}: {
  label: string
  value: string | null
  multiline?: boolean
  mono?: boolean
  link?: boolean
}) {
  const hasValue = value !== null && value.length > 0
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      {!hasValue ? (
        <p className="text-sm text-zinc-400">Not provided</p>
      ) : link ? (
        <a
          href={value as string}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-zinc-950 underline-offset-2 hover:underline"
        >
          {value}
        </a>
      ) : (
        <p
          className={[
            'text-sm text-zinc-950',
            multiline ? 'whitespace-pre-line leading-relaxed' : '',
            mono ? 'font-mono' : '',
          ].join(' ')}
        >
          {value}
        </p>
      )}
    </div>
  )
}

export function relativeTime(iso: string): string {
  const elapsed = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(elapsed / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function absoluteDate(iso: string): string {
  return new Date(iso).toLocaleString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
