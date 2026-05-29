'use client'

import { useState } from 'react'

import { useAdminPendingStores } from '@/hooks/use-admin-pending-stores'
import { StoreQueueList } from '@/components/admin/store-queue-list'

// First-review queue. Admin-only access is enforced by the (admin) layout.
// Default landing — admin-journey.md §"Frequency of each surface" lists this
// as the highest-touch surface (many times per day).

const QUEUE_PAGE_SIZE = 20

export default function AdminFirstReviewQueuePage() {
  const [page, setPage] = useState(1)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const { data, isLoading, isError } = useAdminPendingStores({
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
      title="First-review queue"
      data={data?.data ?? []}
      total={data?.meta.total ?? 0}
      page={data?.meta.page ?? page}
      totalPages={data?.meta.totalPages ?? 1}
      sortOrder={sortOrder}
      isLoading={isLoading}
      isError={isError}
      reviewHref={(id) => `/admin/stores/${id}`}
      onPageChange={setPage}
      onSortOrderChange={changeSortOrder}
      emptyStateCopy="No store applications waiting for review. Check the launch queue →"
    />
  )
}
