'use client'

import type { StoreMe } from '@/lib/schemas/store'

// Operational metrics for the ACTIVE merchant per merchant-journey.md §8 Day-2
// onwards. Numbers come from /stores/me (already cached). The active-product
// count is a separate signal — passed in from the parent which already runs
// useActiveProductCount for the readiness checklist / metrics.
//
// All metrics are read-only and link out to deeper surfaces where applicable.

interface MetricsTilesProps {
  store: StoreMe
  activeProductCount: number
  isActiveCountLoading: boolean
}

export function MetricsTiles({
  store,
  activeProductCount,
  isActiveCountLoading,
}: MetricsTilesProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Tile label="Followers" value={store.followerCount.toLocaleString('en-ZA')} />
      <Tile
        label="Active products"
        value={
          isActiveCountLoading ? '—' : activeProductCount.toLocaleString('en-ZA')
        }
        hint={
          !isActiveCountLoading && store._count.products > activeProductCount
            ? `${store._count.products - activeProductCount} not active`
            : undefined
        }
      />
      <Tile label="Orders" value={store._count.orders.toLocaleString('en-ZA')} />
      <Tile
        label="Average rating"
        value={store.averageRating > 0 ? store.averageRating.toFixed(1) : '—'}
        hint={store.averageRating > 0 ? 'out of 5' : 'No reviews yet'}
      />
    </div>
  )
}

function Tile({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}
