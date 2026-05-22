'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'

import type {
  AdminPendingGoLiveStore,
  AdminPendingStore,
} from '@/lib/schemas/store'

// Reusable queue list — used by first-review (M6-B) and go-live (M6-C). The
// `extraSignals` render-prop injects readiness signals on go-live rows.
//
// Per admin-journey.md: information density is welcome. Each row packs logo +
// brand + owner + timestamp + (optional signals) + Review button onto one line.

type QueueStore = AdminPendingStore | AdminPendingGoLiveStore

interface StoreQueueListProps {
  data: QueueStore[]
  total: number
  page: number
  totalPages: number
  sortOrder: 'asc' | 'desc'
  isLoading: boolean
  isError: boolean
  reviewHref: (storeId: string) => string
  onPageChange: (page: number) => void
  onSortOrderChange: (sortOrder: 'asc' | 'desc') => void
  /** Optional signals rendered between the meta line and the Review button. */
  extraSignals?: (store: QueueStore) => ReactNode
  /** Label for the type of queue (e.g. "first-review", "go-live") shown in copy. */
  emptyStateCopy: string
  /** Heading title (e.g. "First-review queue"). */
  title: string
}

export function StoreQueueList({
  data,
  total,
  page,
  totalPages,
  sortOrder,
  isLoading,
  isError,
  reviewHref,
  onPageChange,
  onSortOrderChange,
  extraSignals,
  emptyStateCopy,
  title,
}: StoreQueueListProps) {
  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-zinc-950">
          {title}
          {!isLoading && !isError && (
            <span className="ml-2 text-base font-normal text-zinc-500">
              · {total} pending
            </span>
          )}
        </h1>
        <label className="flex items-center gap-2 text-sm text-zinc-600">
          Sort
          <select
            value={sortOrder}
            onChange={(e) => onSortOrderChange(e.target.value as 'asc' | 'desc')}
            className="rounded-lg border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-950 outline-none transition-colors focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950"
          >
            <option value="asc">Oldest first</option>
            <option value="desc">Newest first</option>
          </select>
        </label>
      </header>

      {isLoading ? (
        <InlineLoader />
      ) : isError ? (
        <ListErrorState />
      ) : data.length === 0 ? (
        <EmptyState copy={emptyStateCopy} />
      ) : (
        <ul className="flex flex-col gap-2">
          {data.map((store) => (
            <li key={store.id}>
              <QueueRow
                store={store}
                reviewHref={reviewHref(store.id)}
                extraSignals={extraSignals?.(store)}
              />
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-zinc-200 pt-4 text-sm text-zinc-600">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page === 1}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            ← Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}

// ----------------------------------------------------------------------------
// Row
// ----------------------------------------------------------------------------

function QueueRow({
  store,
  reviewHref,
  extraSignals,
}: {
  store: QueueStore
  reviewHref: string
  extraSignals?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border border-zinc-200 bg-white p-4">
      {/* Logo */}
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
        {store.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={store.logoUrl} alt={store.displayName} className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs text-zinc-400">—</span>
        )}
      </div>

      {/* Brand + owner */}
      <div className="flex flex-1 flex-col gap-0.5 min-w-0">
        <p className="truncate text-sm font-medium text-zinc-950">{store.displayName}</p>
        <p className="truncate text-xs text-zinc-500">
          {store.owner.firstName} {store.owner.lastName} · {store.owner.email}
        </p>
        {extraSignals && <div className="mt-1">{extraSignals}</div>}
      </div>

      {/* Submission timestamp */}
      <div className="hidden flex-shrink-0 text-right text-xs text-zinc-500 sm:block">
        <p>Submitted {relativeTime(store.updatedAt)}</p>
        <p className="text-zinc-400">{absoluteDate(store.updatedAt)}</p>
      </div>

      {/* Review */}
      <Link
        href={reviewHref}
        className="flex-shrink-0 rounded-lg bg-zinc-950 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
      >
        Review
      </Link>
    </div>
  )
}

// ----------------------------------------------------------------------------
// Empty / loading / error states
// ----------------------------------------------------------------------------

function EmptyState({ copy }: { copy: string }) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-12 text-center">
      <h2 className="text-base font-semibold text-zinc-950">You&apos;re all caught up</h2>
      <p className="mt-2 text-sm text-zinc-600">{copy}</p>
    </div>
  )
}

function InlineLoader() {
  return (
    <div className="flex items-center justify-center py-16">
      <div
        aria-hidden
        className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-950"
      />
    </div>
  )
}

function ListErrorState() {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center">
      <p className="text-sm text-zinc-600">
        Couldn&apos;t load the queue. Refresh to try again.
      </p>
    </div>
  )
}

// ----------------------------------------------------------------------------
// Time helpers — keep admin copy factual + dense per admin-journey
// ----------------------------------------------------------------------------

function relativeTime(iso: string): string {
  const elapsed = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(elapsed / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function absoluteDate(iso: string): string {
  return new Date(iso).toLocaleString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
