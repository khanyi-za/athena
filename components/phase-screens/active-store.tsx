'use client'

import { useState } from 'react'
import Link from 'next/link'

import { useStoreMe, useInvalidateStoreMe } from '@/hooks/use-store-me'
import { useActiveProductCount } from '@/hooks/use-active-product-count'
import { StoreHeader } from '@/components/active/store-header'
import { MetricsTiles } from '@/components/active/metrics-tiles'
import { GoLiveCelebrationModal } from '@/components/active/go-live-celebration-modal'
import { AddressSection } from '@/components/approved/address-section'
import { AddressFormModal } from '@/components/approved/address-form-modal'
import { DeleteAddressModal } from '@/components/approved/delete-address-modal'
import type { StoreAddress } from '@/lib/schemas/store'

// MERCHANT + ACTIVE view per store-frontend-flows §2.8 + merchant-journey §8.
// The merchant's day-to-day operating surface. Reads from /stores/me; metrics
// derived from _count + scalar fields on the response.
//
// What lives here in M7-A through D:
//   - Store header (logo, name, ACTIVE pill, public URL with Copy link)
//   - Metrics tiles (followers, active products, orders, average rating)
//   - Quick-actions cards (Products, Settings, Team, Locations)
//   - Locations management (reused from M4 ApprovedReadiness)
//   - One-time go-live celebration modal (M7-B; localStorage-gated per store)

type ModalState =
  | { kind: 'none' }
  | { kind: 'addingAddress' }
  | { kind: 'editingAddress'; address: StoreAddress }
  | { kind: 'deletingAddress'; address: StoreAddress }

export function ActiveStoreScreen() {
  const { data: store, isLoading, isError } = useStoreMe()
  const { data: activeProductCount, isLoading: isActiveCountLoading } =
    useActiveProductCount(store?.id)
  const invalidateStoreMe = useInvalidateStoreMe()

  const [modal, setModal] = useState<ModalState>({ kind: 'none' })

  if (isLoading) return <LoadingState />
  if (isError || !store) return <ErrorState />

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
    return store!.addresses.length === 1 && store!.addresses[0].id === address.id
  }

  return (
    <div className="flex flex-col gap-6">
      <StoreHeader store={store} />

      <MetricsTiles
        store={store}
        activeProductCount={activeProductCount ?? 0}
        isActiveCountLoading={isActiveCountLoading}
      />

      <QuickActions />

      <div id="section-locations">
        <AddressSection
          store={store}
          onAdd={openAddAddress}
          onEdit={openEditAddress}
          onDelete={openDeleteAddress}
        />
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

      <CelebrationGate
        storeId={store.id}
        displayName={store.displayName}
        slug={store.slug}
      />
    </div>
  )
}

// ----------------------------------------------------------------------------
// Celebration gate — owns the localStorage decision so the parent doesn't have
// to run a setState-in-effect. The useState lazy initializer reads localStorage
// once on mount; from then on it's plain state. Per React 19's
// react-hooks/set-state-in-effect rule, this is the conditional-mount pattern.
// ----------------------------------------------------------------------------

function CelebrationGate({
  storeId,
  displayName,
  slug,
}: {
  storeId: string
  displayName: string
  slug: string
}) {
  const [visible, setVisible] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return !localStorage.getItem(celebrationKeyFor(storeId))
  })

  function dismiss() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(celebrationKeyFor(storeId), '1')
    }
    setVisible(false)
  }

  if (!visible) return null

  const base = process.env.NEXT_PUBLIC_PUBLIC_STORE_URL_BASE ?? ''
  const publicUrl = `${base}/${slug}`

  return (
    <GoLiveCelebrationModal
      storeDisplayName={displayName}
      publicUrl={publicUrl}
      onDismiss={dismiss}
    />
  )
}

// localStorage flag per store id — switching stores (future feature) will
// celebrate each new ACTIVE store independently.
function celebrationKeyFor(storeId: string): string {
  return `seen_go_live_celebration_${storeId}`
}

// ----------------------------------------------------------------------------
// Quick actions — nav hub to operational surfaces
// ----------------------------------------------------------------------------

function QuickActions() {
  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <ActionCard
        href="/dashboard/products"
        title="Products"
        description="Manage inventory, add new products, activate or archive listings."
        cta="Open products →"
      />
      <ActionCard
        href="/dashboard/settings"
        title="Store settings"
        description="Edit your brand, banner, contact, payout, and locations."
        cta="Open settings →"
      />
      <ActionCard
        href="/dashboard/team"
        title="Team"
        description="Invite teammates and manage who can help run your store."
        cta="Open team →"
      />
      <ActionCard
        href="#section-locations"
        title="Locations"
        description="Update where your brand is based. Shown on your public profile."
        cta="Manage locations ↓"
      />
    </section>
  )
}

function ActionCard({
  href,
  title,
  description,
  cta,
}: {
  href: string
  title: string
  description: string
  cta: string
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-400 hover:bg-zinc-50"
    >
      <h3 className="text-base font-semibold text-zinc-950">{title}</h3>
      <p className="text-sm text-zinc-600">{description}</p>
      <p className="mt-2 text-sm font-medium text-zinc-950">{cta}</p>
    </Link>
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

function ErrorState() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
      <h2 className="text-lg font-semibold text-zinc-950">
        Couldn&apos;t load your store
      </h2>
      <p className="text-sm text-zinc-500">
        Something went wrong on our side. Refresh the page to try again.
      </p>
    </div>
  )
}
