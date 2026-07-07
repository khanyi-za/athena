'use client'

import { useMemo, useState } from 'react'
import { Download, Wallet } from 'lucide-react'

import { useStoreMe } from '@/hooks/use-store-me'
import { useStoreEarnings } from '@/hooks/use-earnings'
import { downloadEarningsCsv } from '@/lib/api/earnings'
import { formatZAR } from '@/lib/format-money'
import { cn } from '@/lib/utils'
import { ORDER_STATUS } from '@/lib/order-status'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// Earnings — merchant money visibility. Accrued earnings from Payment rows
// (commission + payout were locked per order at checkout). Monthly statement
// view + bookkeeping CSV export. IMPORTANT COPY RULE: these are accrued
// amounts — nothing here claims money has been disbursed (Payout records are
// a later phase).

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7)
}

function formatMonthLabel(month: string): string {
  const d = new Date(`${month}-01T00:00:00Z`)
  return d.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric', timeZone: 'UTC' })
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' })
}

const btnOutline =
  'inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50'

export default function EarningsPage() {
  const { data: store } = useStoreMe()
  const [month, setMonth] = useState(currentMonth())

  const earningsQuery = useStoreEarnings(store?.id, month)

  const summary = earningsQuery.data?.pages[0]?.summary
  const rows = useMemo(
    () => earningsQuery.data?.pages.flatMap((p) => p.ledger.rows) ?? [],
    [earningsQuery.data],
  )

  return (
    <div className="max-w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Earnings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            What you&apos;ve earned per order — sales, YIIVA&apos;s 5.5% commission, and your payout.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="month"
            value={month}
            max={currentMonth()}
            onChange={(e) => e.target.value && setMonth(e.target.value)}
            className="h-9 rounded-lg border border-border bg-card px-3 text-sm text-foreground outline-none transition-colors focus:border-ring focus:ring-1 focus:ring-ring"
          />
          <button
            onClick={() => store && downloadEarningsCsv(rows, month, store.displayName)}
            disabled={rows.length === 0}
            className={btnOutline}
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Summary cards */}
      {earningsQuery.isPending ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            label={`${formatMonthLabel(month)} payout`}
            value={formatZAR(summary.period.payoutInCents)}
            hint={`${summary.period.orderCount} paid order${summary.period.orderCount === 1 ? '' : 's'}`}
            highlight
          />
          <SummaryCard
            label={`${formatMonthLabel(month)} sales`}
            value={formatZAR(summary.period.grossInCents)}
            hint={`Commission ${formatZAR(summary.period.commissionInCents)}`}
          />
          <SummaryCard
            label="Lifetime payout"
            value={formatZAR(summary.lifetime.payoutInCents)}
            hint={`${summary.lifetime.orderCount} paid order${summary.lifetime.orderCount === 1 ? '' : 's'} all-time`}
          />
          <SummaryCard
            label="Refunded (lifetime)"
            value={formatZAR(summary.lifetime.refundedInCents)}
            hint={summary.lifetime.refundedInCents > 0 ? 'Deducted from payouts' : 'No refunds yet'}
          />
        </div>
      ) : null}

      {/* Statement */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Statement — {formatMonthLabel(month)}</CardTitle>
        </CardHeader>
        {earningsQuery.isPending ? (
          <div className="space-y-3 p-5">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : earningsQuery.isError ? (
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Couldn&apos;t load earnings.{' '}
            <button onClick={() => earningsQuery.refetch()} className="font-medium text-brand hover:underline">
              Retry
            </button>
          </CardContent>
        ) : rows.length === 0 ? (
          <CardContent className="py-12 text-center">
            <span className="mx-auto mb-3 grid size-11 place-items-center rounded-xl bg-brand-subtle text-brand">
              <Wallet size={20} />
            </span>
            <p className="font-medium text-foreground">No paid orders this month</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Every paid order lands here the moment the payment clears.
            </p>
          </CardContent>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Sales</TableHead>
                  <TableHead className="text-right">Commission</TableHead>
                  <TableHead className="text-right">Refunded</TableHead>
                  <TableHead className="text-right">Your payout</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.orderId}>
                    <TableCell>
                      <p className="text-sm font-medium text-foreground">{row.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {row.confirmedAt ? formatDate(row.confirmedAt) : '—'}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge tone={ORDER_STATUS[row.orderStatus].tone} dot>
                        {ORDER_STATUS[row.orderStatus].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums text-foreground">
                      {formatZAR(row.grossInCents)}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                      −{formatZAR(row.commissionInCents)}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {row.refundedInCents > 0 ? (
                        <span className="text-danger">−{formatZAR(row.refundedInCents)}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-sm font-semibold tabular-nums text-foreground">
                      {formatZAR(row.payoutInCents)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {earningsQuery.hasNextPage && (
              <div className="border-t border-border p-4 text-center">
                <button
                  onClick={() => earningsQuery.fetchNextPage()}
                  disabled={earningsQuery.isFetchingNextPage}
                  className={btnOutline}
                >
                  {earningsQuery.isFetchingNextPage ? 'Loading…' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
      </Card>

      <p className="text-xs text-muted-foreground">
        Amounts are accrued earnings from cleared payments. Shipping is paid by YIIVA
        directly to the courier and never affects your payout.
      </p>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  hint,
  highlight,
}: {
  label: string
  value: string
  hint: string
  highlight?: boolean
}) {
  return (
    <Card className={cn(highlight && 'border-brand/40')}>
      <CardContent className="py-5">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className={cn('mt-2 text-2xl font-semibold tabular-nums', highlight ? 'text-brand' : 'text-foreground')}>
          {value}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  )
}
