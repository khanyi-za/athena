'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { UserStore } from '@/types/auth'
import type { StoreAddress } from '@/lib/schemas/store'
import { useStoreMe, useInvalidateStoreMe } from '@/hooks/use-store-me'
import { StatusPill } from '@/components/ui/status-pill'
import { BannerMediaSection } from '@/components/approved/banner-media-section'
import { AddressSection } from '@/components/approved/address-section'
import { SettlementAccountSection } from '@/components/approved/settlement-account-section'
import { AddressFormModal } from '@/components/approved/address-form-modal'
import { DeleteAddressModal } from '@/components/approved/delete-address-modal'

// BUYER + PENDING_REVIEW view — Paystack-style "review runs in parallel"
// dashboard (redesigned 2026-08-18; was a read-only dead-end screen).
//
// The review itself covers business identity + banking, so those fields are
// frozen (read-only in Settings, PATCH blocked server-side). Everything
// operational stays open: catalogue (Products/Collections via nav), banner,
// locations, and — most valuably — the payout account, which the
// payout-account-before-go-live policy requires anyway. Review time becomes
// setup time. Approval is still detected via useAuthMeRefresh on tab focus.

type ModalState =
  | { kind: 'none' }
  | { kind: 'addingAddress' }
  | { kind: 'editingAddress'; address: StoreAddress }
  | { kind: 'deletingAddress'; address: StoreAddress }

export function UnderReviewFirstScreen({ store: storeRef }: { store: UserStore }) {
  const { data: store, isLoading } = useStoreMe()
  const invalidateStoreMe = useInvalidateStoreMe()
  const [modal, setModal] = useState<ModalState>({ kind: 'none' })

  const closeModal = () => setModal({ kind: 'none' })

  function handleAddressMutationSuccess() {
    invalidateStoreMe()
    setModal({ kind: 'none' })
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Review banner — the "Awaiting Review" treatment */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-foreground">
              Your store is under review
            </h1>
            <StatusPill status="PENDING_REVIEW" />
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We&apos;re checking your submission — reviews usually take 2–3
            business days, and we&apos;ll email you the moment we have an
            answer. Meanwhile, everything below is yours to keep working on.
          </p>
          <p className="text-xs text-muted-foreground">
            {storeRef.displayName} · submitted to YIIVA
          </p>
        </div>
      </div>

      {/* Quick links into the unlocked surfaces */}
      <div className="grid gap-4 sm:grid-cols-3">
        <QuickLink
          href="/dashboard/products"
          title="Products"
          description="Polish titles, images, prices and stock while you wait."
        />
        <QuickLink
          href="/dashboard/collections"
          title="Collections"
          description="Group products into collections buyers can browse."
        />
        <QuickLink
          href="/dashboard/settings"
          title="Settings"
          description="Banner, locations and your business details (read-only during review)."
        />
      </div>

      {isLoading || !store ? (
        <div className="flex justify-center py-10">
          <div
            aria-hidden
            className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-brand"
          />
        </div>
      ) : (
        <>
          {/* Payout account — satisfies the go-live requirement early */}
          <section className="flex flex-col gap-2">
            <p className="text-xs text-muted-foreground">
              Set up now and you&apos;re one step ahead: a payout account is
              required before your store can go live.
            </p>
            <SettlementAccountSection store={store} />
          </section>

          <BannerMediaSection store={store} onSavedRemote={invalidateStoreMe} />

          <AddressSection
            store={store}
            onAdd={() => setModal({ kind: 'addingAddress' })}
            onEdit={(address) => setModal({ kind: 'editingAddress', address })}
            onDelete={(address) => setModal({ kind: 'deletingAddress', address })}
          />

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
            preventLastDelete={store.addresses.length <= 1}
            onClose={closeModal}
            onSuccess={handleAddressMutationSuccess}
            onAddInstead={() => setModal({ kind: 'addingAddress' })}
          />
        </>
      )}
    </div>
  )
}

function QuickLink({
  href,
  title,
  description,
}: {
  href: string
  title: string
  description: string
}) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-1 rounded-xl border border-border bg-card p-4 transition-colors hover:border-ring"
    >
      <span className="text-sm font-semibold text-foreground">{title}</span>
      <span className="text-xs leading-relaxed text-muted-foreground">{description}</span>
    </Link>
  )
}
