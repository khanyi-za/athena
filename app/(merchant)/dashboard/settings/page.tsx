'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'

import { useStoreMe, useInvalidateStoreMe } from '@/hooks/use-store-me'
import { storeToFormValues, type WizardFormValues } from '@/components/wizard/form-values'
import { BrandIdentitySection } from '@/components/wizard/sections/brand-identity'
import { ContactSection } from '@/components/wizard/sections/contact'
import { BusinessRegistrationSection } from '@/components/wizard/sections/business-registration'
import { PayoutSection } from '@/components/wizard/sections/payout'
import { BannerMediaSection } from '@/components/approved/banner-media-section'
import { AddressSection } from '@/components/approved/address-section'
import { SettlementAccountSection } from '@/components/approved/settlement-account-section'
import { ShopifySection } from '@/components/approved/shopify-section'
import { AddressFormModal } from '@/components/approved/address-form-modal'
import { DeleteAddressModal } from '@/components/approved/delete-address-modal'
import { ReviewLockedDetails } from '@/components/review/review-locked-details'
import type { StoreAddress, StoreMe } from '@/lib/schemas/store'

// Settings page for ACTIVE merchants per store-frontend-flows §2.8. Composes
// the wizard sections (brand identity, contact, business reg, bank) +
// approved-readiness sections (banner, locations) under one read/edit surface.
//
// All fields autosave per-field via the existing useAutosaveField hook —
// backend allows PATCH on DRAFT, APPROVED, and ACTIVE, so the same code paths
// work regardless of status.
//
// Distinct from the wizard:
//   - No completion tracking + no submit button (submit is wizard-only)
//   - No rejection banner (rejection-recovery lives in phase screens)
//   - No "required for submission" framing — these are just operational edits

type ModalState =
  | { kind: 'none' }
  | { kind: 'addingAddress' }
  | { kind: 'editingAddress'; address: StoreAddress }
  | { kind: 'deletingAddress'; address: StoreAddress }

const SECTIONS = [
  { id: 'section-brandIdentity', label: 'Brand identity' },
  { id: 'section-banner', label: 'Banner image' },
  { id: 'section-contact', label: 'Contact' },
  { id: 'section-business', label: 'Business registration' },
  { id: 'section-payout', label: 'Bank & payout' },
  { id: 'section-settlement', label: 'Automatic payouts' },
  { id: 'section-shopify', label: 'Shopify sync' },
  { id: 'section-locations', label: 'Locations' },
]

// PENDING_REVIEW: the reviewed fields collapse into one read-only summary
// (backend rejects PATCH in that status); operational sections stay live.
const REVIEW_LOCKED_SECTIONS = [
  { id: 'section-review-locked', label: 'Business details' },
  { id: 'section-banner', label: 'Banner image' },
  { id: 'section-settlement', label: 'Automatic payouts' },
  { id: 'section-shopify', label: 'Shopify sync' },
  { id: 'section-locations', label: 'Locations' },
]

export default function SettingsPage() {
  const { data: store, isLoading, isError } = useStoreMe()

  if (isLoading) return <LoadingState />
  if (isError) return <ErrorState reason="error" />
  if (!store) return <ErrorState reason="no-store" />

  return <SettingsForm store={store} />
}

function SettingsForm({ store }: { store: StoreMe }) {
  const invalidateStoreMe = useInvalidateStoreMe()
  const reviewLocked = store.status === 'PENDING_REVIEW'

  const initialValues = storeToFormValues(store)
  const form = useForm<WizardFormValues>({
    defaultValues: initialValues,
    mode: 'onBlur',
  })

  const [modal, setModal] = useState<ModalState>({ kind: 'none' })

  function handleSavedRemote() {
    invalidateStoreMe()
  }

  const closeModal = () => setModal({ kind: 'none' })
  const openAddAddress = () => setModal({ kind: 'addingAddress' })
  const openEditAddress = (address: StoreAddress) =>
    setModal({ kind: 'editingAddress', address })
  const openDeleteAddress = (address: StoreAddress) =>
    setModal({ kind: 'deletingAddress', address })

  function handleAddressMutationSuccess() {
    invalidateStoreMe()
    setModal({ kind: 'none' })
  }

  function isOnlyAddress(address: StoreAddress): boolean {
    return store.addresses.length === 1 && store.addresses[0].id === address.id
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/dashboard"
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Back to dashboard
        </Link>
      </div>

      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-foreground">Store settings</h1>
        <p className="text-sm text-muted-foreground">
          {reviewLocked
            ? 'Your business details are locked while under review — everything else stays editable and saves automatically.'
            : 'Update your brand, contact details, payout info, and locations. Changes save automatically.'}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <SectionNav sections={reviewLocked ? REVIEW_LOCKED_SECTIONS : SECTIONS} />
        </aside>

        <main className="flex flex-col gap-12">
          {reviewLocked ? (
            <ReviewLockedDetails store={store} />
          ) : (
            <BrandIdentitySection
              control={form.control}
              storeId={store.id}
              initialValues={initialValues}
              onSavedRemote={handleSavedRemote}
            />
          )}

          <BannerMediaSection store={store} onSavedRemote={handleSavedRemote} />

          {!reviewLocked && (
            <>
              <ContactSection
                control={form.control}
                storeId={store.id}
                initialValues={initialValues}
                onSavedRemote={handleSavedRemote}
              />

              <BusinessRegistrationSection
                control={form.control}
                storeId={store.id}
                initialValues={initialValues}
                onSavedRemote={handleSavedRemote}
              />

              <PayoutSection
                control={form.control}
                storeId={store.id}
                initialValues={initialValues}
                onSavedRemote={handleSavedRemote}
              />
            </>
          )}

          <SettlementAccountSection store={store} />

          <ShopifySection />

          <div id="section-locations" className="scroll-mt-6">
            <AddressSection
              store={store}
              onAdd={openAddAddress}
              onEdit={openEditAddress}
              onDelete={openDeleteAddress}
            />
          </div>
        </main>
      </div>

      <AddressFormModal
        open={modal.kind === 'addingAddress' || modal.kind === 'editingAddress'}
        storeId={store.id}
        address={modal.kind === 'editingAddress' ? modal.address : null}
        onClose={closeModal}
        onSuccess={handleAddressMutationSuccess}
      />

      <DeleteAddressModal
        open={modal.kind === 'deletingAddress'}
        storeId={store.id}
        address={modal.kind === 'deletingAddress' ? modal.address : null}
        preventLastDelete={
          modal.kind === 'deletingAddress' && isOnlyAddress(modal.address)
        }
        onClose={closeModal}
        onSuccess={handleAddressMutationSuccess}
        onAddInstead={openAddAddress}
      />
    </div>
  )
}

// ----------------------------------------------------------------------------
// Sticky section nav
// ----------------------------------------------------------------------------

function SectionNav({ sections }: { sections: { id: string; label: string }[] }) {
  return (
    <nav className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Sections
      </p>
      <ul className="flex flex-col gap-1">
        {sections.map((s) => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              className="block rounded-md px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-accent"
            >
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

// ----------------------------------------------------------------------------
// States
// ----------------------------------------------------------------------------

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-16">
      <div
        aria-hidden
        className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-brand"
      />
    </div>
  )
}

function ErrorState({ reason }: { reason: 'error' | 'no-store' }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
      <h2 className="text-lg font-semibold text-foreground">
        {reason === 'no-store' ? 'No store to settings yet' : "Couldn't load your store"}
      </h2>
      <p className="text-sm text-muted-foreground">
        {reason === 'no-store'
          ? 'Create your store first, then come back to manage settings.'
          : 'Refresh the page to try again.'}
      </p>
      <Link
        href="/dashboard"
        className="mt-2 inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand/90"
      >
        Back to dashboard
      </Link>
    </div>
  )
}
