'use client'

import { useMemo, useState } from 'react'
import { RotateCcw } from 'lucide-react'

import { useStoreMe } from '@/hooks/use-store-me'
import { useReturnAction, useStoreReturnsInfinite } from '@/hooks/use-returns'
import { formatZAR } from '@/lib/format-money'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge, type BadgeTone } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { ReturnRequest, ReturnStatus } from '@/lib/schemas/returns'

// Returns — merchant queue for buyer return requests (30-day window from
// delivery). Lifecycle here: approve/reject a request, mark the parcel
// received, then close once the refund/exchange is settled (the refund itself
// runs through YIIVA's admin Paystack tool — merchants never move money).

const RETURN_STATUS: Record<ReturnStatus, { label: string; tone: BadgeTone }> = {
  REQUESTED: { label: 'Requested', tone: 'warning' },
  APPROVED: { label: 'Approved', tone: 'info' },
  REJECTED: { label: 'Rejected', tone: 'danger' },
  RECEIVED: { label: 'Received', tone: 'brand' },
  CLOSED: { label: 'Closed', tone: 'neutral' },
}

const REASON_LABELS: Record<string, string> = {
  WRONG_SIZE: 'Wrong size',
  NOT_AS_DESCRIBED: 'Not as described',
  DAMAGED: 'Damaged',
  CHANGED_MIND: 'Changed mind',
  OTHER: 'Other',
}

const FILTERS: { value: ReturnStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'REQUESTED', label: 'Needs review' },
  { value: 'APPROVED', label: 'Awaiting parcel' },
  { value: 'RECEIVED', label: 'To settle' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'CLOSED', label: 'Closed' },
]

const btnOutline =
  'inline-flex h-8 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50'

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function ReturnsPage() {
  const { data: store } = useStoreMe()
  const [filter, setFilter] = useState<ReturnStatus | 'all'>('all')

  const returnsQuery = useStoreReturnsInfinite(
    store?.id,
    filter === 'all' ? undefined : filter,
  )

  const returns = useMemo(
    () => returnsQuery.data?.pages.flatMap((p) => p.returns) ?? [],
    [returnsQuery.data],
  )

  return (
    <div className="max-w-full space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Returns</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Buyer return requests — approve, track the parcel back, and settle. Refunds are
          processed by YIIVA once you&apos;ve received the item.
        </p>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
              filter === f.value
                ? 'border-brand bg-brand-subtle text-brand'
                : 'border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Queue */}
      {returnsQuery.isPending ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : returnsQuery.isError ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Couldn&apos;t load returns.{' '}
            <button onClick={() => returnsQuery.refetch()} className="font-medium text-brand hover:underline">
              Retry
            </button>
          </CardContent>
        </Card>
      ) : returns.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <span className="mx-auto mb-3 grid size-11 place-items-center rounded-xl bg-brand-subtle text-brand">
              <RotateCcw size={20} />
            </span>
            <p className="font-medium text-foreground">
              {filter === 'all' ? 'No return requests' : 'Nothing here'}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {filter === 'all'
                ? 'Buyers can request a return within 30 days of delivery — requests land here.'
                : 'Try a different filter.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {returns.map((r) => (
            <ReturnCard key={r.id} request={r} storeId={store!.id} />
          ))}
          {returnsQuery.hasNextPage && (
            <div className="pt-2 text-center">
              <button
                onClick={() => returnsQuery.fetchNextPage()}
                disabled={returnsQuery.isFetchingNextPage}
                className={btnOutline}
              >
                {returnsQuery.isFetchingNextPage ? 'Loading…' : 'Load more'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ----------------------------------------------------------------------------
// Card
// ----------------------------------------------------------------------------

function ReturnCard({ request, storeId }: { request: ReturnRequest; storeId: string }) {
  const action = useReturnAction(storeId)
  const [rejecting, setRejecting] = useState(false)
  const [notes, setNotes] = useState('')

  const s = RETURN_STATUS[request.status]
  const busy = action.isPending

  return (
    <Card>
      <CardContent className="space-y-3 py-4">
        <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-foreground">{request.order.orderNumber}</p>
              <Badge tone={s.tone} dot>
                {s.label}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {formatZAR(request.order.totalInCents)}
              </span>
            </div>
            <p className="mt-1 text-sm text-foreground">
              {REASON_LABELS[request.reason] ?? request.reason}
              {request.details && (
                <span className="text-muted-foreground"> — “{request.details}”</span>
              )}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {request.buyer.name} · {request.buyer.email} · requested{' '}
              {formatDate(request.createdAt)}
              {request.order.deliveredAt && ` · delivered ${formatDate(request.order.deliveredAt)}`}
            </p>
            {request.merchantNotes && (
              <p className="mt-1 text-xs text-muted-foreground">Note: {request.merchantNotes}</p>
            )}
          </div>

          {/* Actions by state */}
          <div className="flex items-center gap-2">
            {request.status === 'REQUESTED' && !rejecting && (
              <>
                <button
                  onClick={() => action.mutate({ returnId: request.id, action: 'approve' })}
                  disabled={busy}
                  className="inline-flex h-8 items-center rounded-lg bg-brand px-3 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand/90 disabled:opacity-50"
                >
                  {busy ? 'Working…' : 'Approve'}
                </button>
                <button
                  onClick={() => setRejecting(true)}
                  disabled={busy}
                  className="inline-flex h-8 items-center rounded-lg border border-danger/30 px-3 text-sm font-medium text-danger transition-colors hover:bg-danger/10 disabled:opacity-50"
                >
                  Reject
                </button>
              </>
            )}
            {request.status === 'APPROVED' && (
              <button
                onClick={() => action.mutate({ returnId: request.id, action: 'received' })}
                disabled={busy}
                className={btnOutline}
              >
                {busy ? 'Working…' : 'Parcel received'}
              </button>
            )}
            {request.status === 'RECEIVED' && (
              <button
                onClick={() => action.mutate({ returnId: request.id, action: 'close' })}
                disabled={busy}
                className={btnOutline}
              >
                {busy ? 'Working…' : 'Mark settled'}
              </button>
            )}
          </div>
        </div>

        {rejecting && request.status === 'REQUESTED' && (
          <div className="space-y-2 rounded-lg border border-danger/30 bg-danger/5 p-3">
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Reason shown to the buyer (optional)"
              maxLength={1000}
              className="h-9 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring"
            />
            <div className="flex gap-2">
              <button
                onClick={() =>
                  action.mutate(
                    { returnId: request.id, action: 'reject', notes: notes.trim() || undefined },
                    { onSuccess: () => setRejecting(false) },
                  )
                }
                disabled={busy}
                className="inline-flex h-8 items-center rounded-lg bg-danger px-3 text-sm font-medium text-danger-foreground transition-colors hover:bg-danger/90 disabled:opacity-50"
              >
                {busy ? 'Rejecting…' : 'Confirm reject'}
              </button>
              <button
                onClick={() => setRejecting(false)}
                className="px-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {action.isError && (
          <p className="text-sm text-danger">{(action.error as Error).message}</p>
        )}
      </CardContent>
    </Card>
  )
}
