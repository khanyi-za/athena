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
import { BannerSection } from '@/components/approved/banner-section'
import { AddressSection } from '@/components/approved/address-section'
import { AddressFormModal } from '@/components/approved/address-form-modal'
import { DeleteAddressModal } from '@/components/approved/delete-address-modal'
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
          className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-950"
        >
          ← Back to dashboard
        </Link>
      </div>

      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-zinc-950">Store settings</h1>
        <p className="text-sm text-zinc-500">
          Update your brand, contact details, payout info, and locations.
          Changes save automatically.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <SectionNav />
        </aside>

        <main className="flex flex-col gap-12">
          <BrandIdentitySection
            control={form.control}
            storeId={store.id}
            initialValues={initialValues}
            onSavedRemote={handleSavedRemote}
          />

          <BannerSection store={store} onSavedRemote={handleSavedRemote} />

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

function SectionNav() {
  return (
    <nav className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        Sections
      </p>
      <ul className="flex flex-col gap-1">
        {SECTIONS.map((s) => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              className="block rounded-md px-2 py-1.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-100"
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
        className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-950"
      />
    </div>
  )
}

function ErrorState({ reason }: { reason: 'error' | 'no-store' }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
      <h2 className="text-lg font-semibold text-zinc-950">
        {reason === 'no-store' ? 'No store to settings yet' : "Couldn't load your store"}
      </h2>
      <p className="text-sm text-zinc-500">
        {reason === 'no-store'
          ? 'Create your store first, then come back to manage settings.'
          : 'Refresh the page to try again.'}
      </p>
      <Link
        href="/dashboard"
        className="mt-2 inline-flex items-center justify-center rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
      >
        Back to dashboard
      </Link>
    </div>
  )
}
