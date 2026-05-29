'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'

import { Alert } from '@/components/ui/alert'
import { RejectionBanner } from '@/components/rejection-banner'
import { useStoreMe, useInvalidateStoreMe } from '@/hooks/use-store-me'
import {
  useActiveProductCount,
  useInvalidateActiveProductCount,
} from '@/hooks/use-active-product-count'
import { useAuthStore } from '@/store/auth-store'
import { fetchAuthMe } from '@/lib/fetch-auth-me'
import { requestGoLive } from '@/lib/api/store'
import type { StoreAddress } from '@/lib/schemas/store'

import { ReadinessChecklist } from '@/components/approved/readiness-checklist'
import { BannerMediaSection } from '@/components/approved/banner-media-section'
import { StorySection } from '@/components/approved/story-section'
import { AddressSection } from '@/components/approved/address-section'
import { AddressFormModal } from '@/components/approved/address-form-modal'
import { DeleteAddressModal } from '@/components/approved/delete-address-modal'
import { RequestGoLiveModal } from '@/components/approved/request-go-live-modal'

// MERCHANT + APPROVED view. Merchant is approved and preparing for go-live.
// Renders the readiness checklist + editor sections for the remaining work
// (banner, story, addresses) + the request-go-live action.

type ModalState =
  | { kind: 'none' }
  | { kind: 'addingAddress' }
  | { kind: 'editingAddress'; address: StoreAddress }
  | { kind: 'deletingAddress'; address: StoreAddress }
  | { kind: 'requestingGoLive' }

export function ApprovedReadinessScreen() {
  const router = useRouter()
  const { data: store, isLoading, isError } = useStoreMe()
  const { data: activeProductCount, isLoading: isCountLoading } = useActiveProductCount(
    store?.id,
  )
  const invalidateStoreMe = useInvalidateStoreMe()
  const invalidateActiveProductCount = useInvalidateActiveProductCount()
  const queryClient = useQueryClient()
  const accessToken = useAuthStore((s) => s.accessToken)
  const setAuth = useAuthStore((s) => s.setAuth)

  const [modal, setModal] = useState<ModalState>({ kind: 'none' })
  const [isRequestingGoLive, setIsRequestingGoLive] = useState(false)
  const [requestGoLiveError, setRequestGoLiveError] = useState<string | null>(null)
  const [missingRequirements, setMissingRequirements] = useState<string[] | null>(null)

  if (isLoading) return <LoadingState />
  if (isError || !store) return <ErrorState />

  const closeModal = () => {
    if (isRequestingGoLive) return
    setModal({ kind: 'none' })
    setRequestGoLiveError(null)
  }
  const openAddAddress = () => setModal({ kind: 'addingAddress' })
  const openEditAddress = (address: StoreAddress) =>
    setModal({ kind: 'editingAddress', address })
  const openDeleteAddress = (address: StoreAddress) =>
    setModal({ kind: 'deletingAddress', address })

  function openRequestGoLive() {
    setRequestGoLiveError(null)
    setMissingRequirements(null) // clear stale banner if user is retrying
    setModal({ kind: 'requestingGoLive' })
  }

  function handleAddressMutationSuccess() {
    invalidateStoreMe()
    setModal({ kind: 'none' })
  }

  function isOnlyAddress(address: StoreAddress): boolean {
    return store!.addresses.length === 1 && store!.addresses[0].id === address.id
  }

  async function refreshAuthMe() {
    if (!accessToken) return
    const fullUser = await fetchAuthMe(accessToken)
    if (fullUser) setAuth(accessToken, fullUser)
    queryClient.invalidateQueries({ queryKey: ['auth-me'] })
  }

  async function handleConfirmRequestGoLive() {
    setIsRequestingGoLive(true)
    setRequestGoLiveError(null)

    try {
      await requestGoLive(store!.id)
      // Success — store flipped from APPROVED to PENDING_GO_LIVE. Refreshing
      // /auth/me re-evaluates the matrix; the dashboard swaps this screen out
      // for UnderReviewGoLiveScreen.
      invalidateStoreMe()
      await refreshAuthMe()
      // Defensively close the modal + router.push to /dashboard. The matrix
      // should swap the screen on its own, but if refreshAuthMe was slow or
      // returned stale data the screen could appear stuck — same pattern as
      // the wizard submit flow we hardened earlier.
      setModal({ kind: 'none' })
      router.push('/dashboard')
    } catch (err) {
      handleRequestGoLiveError(err)
    } finally {
      setIsRequestingGoLive(false)
    }
  }

  function handleRequestGoLiveError(err: unknown) {
    const error = err as { status?: number; data?: { message?: string | string[] } }
    const status = error.status
    const messageRaw = error.data?.message
    const message = typeof messageRaw === 'string' ? messageRaw : ''

    // 400 missing requirements — the most important branch. Parse the list,
    // close modal, surface as a top banner the merchant can read alongside
    // the readiness checklist (which auto-updates after refresh).
    if (status === 400 && /missing requirements/i.test(message)) {
      const items = parseMissingRequirements(message)
      setMissingRequirements(items)
      setModal({ kind: 'none' })
      // Refetch so the checklist accurately reflects current state.
      invalidateStoreMe()
      if (store?.id) invalidateActiveProductCount(store.id)
      scrollToTop()
      return
    }

    // Other 400s mean the store status changed (already in go-live queue, already
    // active, regressed to DRAFT/PENDING_REVIEW, suspended, closed). In all
    // cases, refresh state and let the matrix re-route.
    if (status === 400) {
      invalidateStoreMe()
      void refreshAuthMe()
      setModal({ kind: 'none' })
      return
    }

    if (status === 403 || status === 404) {
      invalidateStoreMe()
      void refreshAuthMe()
      setModal({ kind: 'none' })
      return
    }

    setRequestGoLiveError('Something went wrong. Please try again.')
  }

  return (
    <div className="flex flex-col gap-6">
      <RejectionBanner storeStatus={store.status} rejectionReason={store.rejectionReason} />

      {missingRequirements && missingRequirements.length > 0 && (
        <Alert variant="error">
          <div className="flex flex-col gap-2">
            <p className="font-medium">
              Some items still need attention before you can go live.
            </p>
            <ul className="list-disc pl-5 text-sm">
              {missingRequirements.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        </Alert>
      )}

      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-zinc-950">{store.displayName}</h1>
        <p className="text-sm text-zinc-500">
          Your store is approved. Finish a few things to request to go live.
        </p>
      </header>

      <ReadinessChecklist
        store={store}
        activeProductCount={activeProductCount ?? 0}
        isProductCountLoading={isCountLoading}
        onAddBanner={() => scrollToSection('section-banner')}
        onWriteStory={() => scrollAndFocus('section-story', 'story')}
        onAddLocation={openAddAddress}
        onAddProducts={() => router.push('/dashboard/products')}
        onRequestGoLive={openRequestGoLive}
        isRequestingGoLive={isRequestingGoLive}
      />

      <BannerMediaSection store={store} onSavedRemote={() => invalidateStoreMe()} />

      <StorySection store={store} onSavedRemote={() => invalidateStoreMe()} />

      <AddressSection
        store={store}
        onAdd={openAddAddress}
        onEdit={openEditAddress}
        onDelete={openDeleteAddress}
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
        preventLastDelete={modal.kind === 'deletingAddress' && isOnlyAddress(modal.address)}
        onClose={closeModal}
        onSuccess={handleAddressMutationSuccess}
        onAddInstead={openAddAddress}
      />

      <RequestGoLiveModal
        open={modal.kind === 'requestingGoLive'}
        onCancel={closeModal}
        onConfirm={handleConfirmRequestGoLive}
        loading={isRequestingGoLive}
        error={requestGoLiveError}
      />
    </div>
  )
}

// ----------------------------------------------------------------------------
// Missing-requirements parser
// ----------------------------------------------------------------------------
// Backend returns a string like:
//   "Cannot request go-live. Missing requirements: bannerUrl, story, at least one address"
// We extract the comma-separated list. Items may be field names or human phrases
// (e.g. "at least 7 active products (currently has 5)") — we pass through as-is.

function parseMissingRequirements(message: string): string[] {
  const match = message.match(/missing requirements:\s*(.+)$/i)
  if (!match) return []
  return match[1]
    .split(/,\s*/)
    .map((s) => s.trim().replace(/\.$/, ''))
    .filter(Boolean)
}

// ----------------------------------------------------------------------------
// Scroll helpers
// ----------------------------------------------------------------------------

function scrollToSection(id: string) {
  if (typeof document === 'undefined') return
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function scrollAndFocus(sectionId: string, fieldId: string) {
  if (typeof document === 'undefined') return
  document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  setTimeout(() => {
    const el = document.getElementById(fieldId)
    if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
      el.focus()
    }
  }, 400)
}

function scrollToTop() {
  if (typeof window === 'undefined') return
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// ----------------------------------------------------------------------------
// Loading / error states
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
      <h2 className="text-lg font-semibold text-zinc-950">Couldn&apos;t load your store</h2>
      <p className="text-sm text-zinc-500">
        Something went wrong on our side. Refresh the page to try again.
      </p>
    </div>
  )
}
