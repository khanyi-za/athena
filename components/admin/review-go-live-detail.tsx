'use client'

import { CldImage } from 'next-cloudinary'

import { MaskedBankDisplay } from '@/components/admin/masked-bank-display'
import {
  Section,
  Field,
  relativeTime,
  absoluteDate,
} from '@/components/admin/review-store-detail'
import {
  INVENTORY_THUMB_200_RECIPE,
  STORE_BANNER_RECIPE,
  STORE_LOGO_RECIPE,
} from '@/lib/cloudinary-transforms'
import { useProducts } from '@/hooks/use-products'
import { formatZAR } from '@/lib/format-money'
import type { AdminPendingGoLiveStore } from '@/lib/schemas/store'

// Go-live review surface per store-frontend-flows §6.6 — same layout as the
// first-review detail with three additions:
//   1. Banner shown at full intended size (this is what the admin is verifying)
//   2. Story rendered in full
//   3. Horizontal preview of the store's active products
//
// Bank / payout is collapsed by default — already verified at first review.
// The admin focuses on what's *new* since first approval: products, banner,
// story, locations.

interface ReviewGoLiveDetailProps {
  store: AdminPendingGoLiveStore
}

const PREVIEW_LIMIT = 8

export function ReviewGoLiveDetail({ store }: ReviewGoLiveDetailProps) {
  // Active products for the preview strip. The queue endpoint already returns
  // `_count.products` (active count) so the strip's count is consistent.
  const { data: productsResponse, isLoading: productsLoading } = useProducts(
    store.id,
    { status: 'ACTIVE', limit: PREVIEW_LIMIT, sortBy: 'newest' },
  )
  const products = productsResponse?.data ?? []
  const totalActive = productsResponse?.meta.total ?? store._count.products

  return (
    <div className="flex flex-col gap-6">
      {/* Banner at full intended size — primary verification artefact for go-live */}
      <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <div className="p-5 pb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Banner
          </h2>
        </div>
        {store.bannerUrl ? (
          <a
            href={store.bannerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <CldImage
              src={store.bannerUrl}
              {...STORE_BANNER_RECIPE}
              alt={`${store.displayName} banner`}
              className="h-auto w-full object-cover"
            />
          </a>
        ) : (
          <div className="mx-5 mb-5 flex aspect-[4/1] items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 text-sm text-zinc-400">
            Banner not uploaded
          </div>
        )}
      </section>

      <Section title="Brand identity">
        <Field label="Display name" value={store.displayName} />
        <Field label="Slug" value={store.slug} mono />
        <Field label="Description" value={store.description} multiline />
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
              className="inline-block h-24 w-24 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50"
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
      </Section>

      {/* Story in full — read in its entirety, no truncation */}
      <Section title="Story">
        {store.story ? (
          <div className="sm:col-span-2">
            <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-950">
              {store.story}
            </p>
          </div>
        ) : (
          <p className="text-sm text-zinc-400">Story not provided</p>
        )}
      </Section>

      {/* Active product preview */}
      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Active products
          </h2>
          <p className="text-xs text-zinc-500">
            Showing {Math.min(products.length, PREVIEW_LIMIT)} of {totalActive}
          </p>
        </div>

        {productsLoading ? (
          <div className="mt-4 flex items-center justify-center py-8">
            <div
              aria-hidden
              className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-950"
            />
          </div>
        ) : products.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-400">No active products to preview.</p>
        ) : (
          <ul className="mt-4 flex gap-3 overflow-x-auto pb-2">
            {products.map((p) => (
              <li
                key={p.id}
                className="flex w-40 flex-shrink-0 flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-2"
              >
                <div className="aspect-square overflow-hidden rounded-md bg-zinc-50">
                  {p.images[0]?.url ? (
                    <CldImage
                      src={p.images[0].url}
                      {...INVENTORY_THUMB_200_RECIPE}
                      alt={p.images[0].altText ?? p.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-zinc-400">
                      No image
                    </div>
                  )}
                </div>
                <p className="line-clamp-2 text-xs font-medium text-zinc-950">
                  {p.title}
                </p>
                <p className="text-xs text-zinc-500">{formatZAR(p.priceInCents)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Section title="Locations">
        {store.addresses.length === 0 ? (
          <p className="text-sm text-zinc-400">No addresses on file.</p>
        ) : (
          <div className="sm:col-span-2 flex flex-col gap-3">
            {store.addresses.map((addr) => (
              <div
                key={addr.id}
                className="rounded-lg border border-zinc-200 bg-zinc-50 p-3"
              >
                <p className="text-sm text-zinc-950">
                  {addr.streetNumber} {addr.streetName}
                  {addr.buildingName ? `, ${addr.buildingName}` : ''}
                </p>
                <p className="text-xs text-zinc-500">
                  {addr.city} · {addr.postalCode}
                </p>
              </div>
            ))}
          </div>
        )}
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

      {/* Bank / payout collapsed by default — already verified at first review */}
      <Section title="Bank / payout (verified at first review)" defaultOpen={false}>
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
          label="Go-live requested"
          value={`${relativeTime(store.updatedAt)} · ${absoluteDate(store.updatedAt)}`}
        />
        {store.rejectionReason && (
          <Field
            label="Previous go-live rejection reason"
            value={store.rejectionReason}
            multiline
          />
        )}
      </Section>
    </div>
  )
}
