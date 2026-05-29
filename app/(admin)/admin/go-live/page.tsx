'use client'

import { useState } from 'react'

import { useAdminPendingGoLiveStores } from '@/hooks/use-admin-pending-go-live-stores'
import { StoreQueueList } from '@/components/admin/store-queue-list'
import type {
  AdminPendingGoLiveStore,
  AdminPendingStore,
} from '@/lib/schemas/store'

// Go-live queue. Same structure as the first-review queue but readiness signals
// (active product count, location count, banner ✓, story ✓) are inlined on each
// row so the admin can spot-check at a glance without opening every detail page.

const QUEUE_PAGE_SIZE = 20

export default function AdminGoLiveQueuePage() {
  const [page, setPage] = useState(1)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const { data, isLoading, isError } = useAdminPendingGoLiveStores({
    page,
    limit: QUEUE_PAGE_SIZE,
    sortOrder,
  })

  function changeSortOrder(next: 'asc' | 'desc') {
    setSortOrder(next)
    setPage(1)
  }

  return (
    <StoreQueueList
      title="Launch queue"
      data={data?.data ?? []}
      total={data?.meta.total ?? 0}
      page={data?.meta.page ?? page}
      totalPages={data?.meta.totalPages ?? 1}
      sortOrder={sortOrder}
      isLoading={isLoading}
      isError={isError}
      reviewHref={(id) => `/admin/go-live/${id}`}
      onPageChange={setPage}
      onSortOrderChange={changeSortOrder}
      extraSignals={renderReadinessSignals}
      emptyStateCopy="No stores waiting to launch. Check the first-review queue →"
    />
  )
}

function renderReadinessSignals(
  store: AdminPendingStore | AdminPendingGoLiveStore,
) {
  // The queue endpoint typings union with the first-review row shape, but the
  // go-live queue always returns the go-live row shape — narrow defensively.
  if (!('addresses' in store)) return null

  const productCount = store._count.products
  const locationCount = store.addresses.length
  // Per M9, banner is multi-item. The admin queue endpoint surfaces
  // _count.bannerMedia specifically so we can render this signal cheaply.
  const bannerCount = store._count.bannerMedia
  const hasStory = !!store.story && store.story.trim().length > 0

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
      <Signal
        label={`${productCount} active product${productCount === 1 ? '' : 's'}`}
        ok={productCount > 0}
      />
      <Signal
        label={`${locationCount} location${locationCount === 1 ? '' : 's'}`}
        ok={locationCount > 0}
      />
      <Signal
        label={`${bannerCount} banner item${bannerCount === 1 ? '' : 's'}`}
        ok={bannerCount > 0}
      />
      <Signal label="Story" ok={hasStory} />
    </div>
  )
}

function Signal({ label, ok }: { label: string; ok: boolean }) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1',
        ok ? 'text-emerald-700' : 'text-amber-700',
      ].join(' ')}
    >
      <span aria-hidden>{ok ? '✓' : '!'}</span>
      {label}
    </span>
  )
}
