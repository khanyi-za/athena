'use client'

import type { StoreMe } from '@/lib/schemas/store'

// The go-live readiness checklist — central UI element for the APPROVED phase.
// 7 items, each ✓ or ☐. Action buttons appear next to ☐ items only when the
// parent passes a callback (later M4 checkpoints wire address, banner, story;
// product activation comes in M5).
//
// Source: docs/Api-frontend-contracts/store-frontend-flows.md §2.5.

const REQUIRED_ACTIVE_PRODUCTS = 7

interface ReadinessChecklistProps {
  store: StoreMe
  activeProductCount: number
  isProductCountLoading?: boolean
  onAddBanner?: () => void
  onWriteStory?: () => void
  onAddLocation?: () => void
  onAddProducts?: () => void
  onRequestGoLive?: () => void
  isRequestingGoLive?: boolean
}

export function ReadinessChecklist({
  store,
  activeProductCount,
  isProductCountLoading,
  onAddBanner,
  onWriteStory,
  onAddLocation,
  onAddProducts,
  onRequestGoLive,
  isRequestingGoLive,
}: ReadinessChecklistProps) {
  const state = computeReadinessState(store, activeProductCount)
  const allReady = Object.values(state).every(Boolean)

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-zinc-950">Get ready to go live</h2>
        <p className="text-sm text-zinc-500">
          Complete these before you can launch.
        </p>
      </div>

      <ul className="mt-6 flex flex-col gap-3">
        <ChecklistItem
          checked={state.brandBasics}
          label="Brand basics"
          hint="logo, description, contact"
        />
        <ChecklistItem checked={state.bankDetails} label="Bank details" />
        <ChecklistItem checked={state.businessReg} label="Business registration" />
        <ChecklistItem
          checked={state.banner}
          label="Banner image"
          action={onAddBanner ? { label: 'Add banner', onClick: onAddBanner } : undefined}
        />
        <ChecklistItem
          checked={state.story}
          label="Brand story"
          action={onWriteStory ? { label: 'Write story', onClick: onWriteStory } : undefined}
        />
        <ChecklistItem
          checked={state.location}
          label="At least one location"
          action={onAddLocation ? { label: 'Add location', onClick: onAddLocation } : undefined}
        />
        <ChecklistItem
          checked={state.activeProducts}
          label="At least 7 active products"
          hint={
            isProductCountLoading
              ? '…'
              : `${activeProductCount} / ${REQUIRED_ACTIVE_PRODUCTS}`
          }
          action={
            onAddProducts ? { label: 'Add products', onClick: onAddProducts } : undefined
          }
        />
      </ul>

      <button
        type="button"
        disabled={!allReady || !!isRequestingGoLive || !onRequestGoLive}
        onClick={onRequestGoLive}
        title={
          !onRequestGoLive
            ? 'Coming next'
            : allReady
              ? 'Ready to launch'
              : 'Complete all items above to launch your store'
        }
        className="mt-6 w-full rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isRequestingGoLive ? 'Launching…' : 'Launch store'}
      </button>
    </div>
  )
}

// ----------------------------------------------------------------------------
// Item
// ----------------------------------------------------------------------------

interface ChecklistItemProps {
  checked: boolean
  label: string
  hint?: string
  action?: { label: string; onClick: () => void }
}

function ChecklistItem({ checked, label, hint, action }: ChecklistItemProps) {
  return (
    <li className="flex items-start gap-3">
      <span
        aria-hidden
        className={[
          'mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md',
          checked ? 'bg-emerald-500 text-white' : 'border border-zinc-300 bg-white',
        ].join(' ')}
      >
        {checked && <CheckIcon />}
      </span>
      <div className="flex flex-1 items-center justify-between gap-3">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span
            className={`text-sm ${checked ? 'text-zinc-500' : 'font-medium text-zinc-950'}`}
          >
            {label}
          </span>
          {hint && <span className="text-xs text-zinc-500">({hint})</span>}
        </div>
        {action && !checked && (
          <button
            type="button"
            onClick={action.onClick}
            className="text-sm font-medium text-zinc-950 underline-offset-2 hover:underline"
          >
            {action.label}
          </button>
        )}
      </div>
    </li>
  )
}

function CheckIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

// ----------------------------------------------------------------------------
// Readiness derivation
// ----------------------------------------------------------------------------

interface ReadinessState {
  brandBasics: boolean
  bankDetails: boolean
  businessReg: boolean
  banner: boolean
  story: boolean
  location: boolean
  activeProducts: boolean
}

function computeReadinessState(store: StoreMe, activeProductCount: number): ReadinessState {
  return {
    brandBasics:
      hasField(store.logoUrl) &&
      hasField(store.description) &&
      hasField(store.contactEmail) &&
      hasField(store.contactPhone),
    bankDetails:
      hasField(store.bankName) &&
      hasField(store.bankAccountNo) &&
      hasField(store.bankBranchCode) &&
      hasField(store.bankAccountType),
    businessReg: hasField(store.businessRegNo),
    // Banner readiness = at least one media item in the gallery. Per M9, the
    // single bannerUrl field was replaced by a multi-item bannerMedia array.
    banner: store.bannerMedia.length > 0,
    story: hasField(store.story),
    location: store.addresses.length > 0,
    activeProducts: activeProductCount >= REQUIRED_ACTIVE_PRODUCTS,
  }
}

function hasField(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0
}
