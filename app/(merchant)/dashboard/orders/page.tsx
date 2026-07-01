'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {
  Search,
  Package,
  User,
  MapPin,
  Download,
  X,
  ArrowUp,
  ArrowDown,
  ChevronsUpDown,
  Eye,
} from 'lucide-react'

import { useStoreMe } from '@/hooks/use-store-me'
import {
  useCancelStoreOrder,
  useStoreOrder,
  useStoreOrdersInfinite,
  useUpdateOrderStatus,
} from '@/hooks/use-store-orders'
import { downloadShippingLabel } from '@/lib/api/orders'
import { formatZAR } from '@/lib/format-money'
import { cn } from '@/lib/utils'
import { ORDER_STATUS } from '@/lib/order-status'
import { Card, CardContent } from '@/components/ui/card'
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
import type {
  MerchantCancelReason,
  MerchantOrderDetail,
  MerchantOrderSummary,
  OrderStatus,
} from '@/lib/schemas/order'

// Orders — YIIVA redesign. Sortable DataTable (@tanstack/react-table) with the
// unified status badges (lib/order-status.ts), token-styled server filters
// (status + order-number search + cursor "Load more"), and the full detail modal
// (items, buyer, shipping, payout, timeline, status transitions, cancel-with-
// reason, waybill PDF). Sorting is client-side over the currently-loaded rows.

const FILTERABLE_STATUSES: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'READY_FOR_DISPATCH',
  'DISPATCHED',
  'IN_TRANSIT',
  'DELIVERED',
  'CANCELLED',
]

const NEXT_TRANSITION: Partial<Record<OrderStatus, { target: OrderStatus; cta: string }>> = {
  CONFIRMED: { target: 'PROCESSING', cta: 'Start processing' },
  PROCESSING: { target: 'READY_FOR_DISPATCH', cta: 'Mark ready for dispatch' },
}

const CANCELLABLE: OrderStatus[] = ['CONFIRMED', 'PROCESSING']
const LABEL_ELIGIBLE: OrderStatus[] = [
  'CONFIRMED',
  'PROCESSING',
  'READY_FOR_DISPATCH',
  'DISPATCHED',
  'IN_TRANSIT',
  'DELIVERED',
]

const RIGHT_ALIGNED = new Set(['itemCount', 'totalInCents', 'actions'])

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const btnBrand =
  'inline-flex h-9 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand/90 disabled:opacity-50'
const btnOutline =
  'inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50'

export default function OrdersPage() {
  const { data: store } = useStoreMe()
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [viewingOrderId, setViewingOrderId] = useState<string | null>(null)
  const [sorting, setSorting] = useState<SortingState>([{ id: 'order', desc: true }])

  // Debounce the order-number search (server-side filter).
  useEffect(() => {
    const handle = setTimeout(() => setSearch(searchInput.trim()), 300)
    return () => clearTimeout(handle)
  }, [searchInput])

  const ordersQuery = useStoreOrdersInfinite(store?.id, {
    ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
    ...(search ? { search } : {}),
    take: 20,
  })

  const orders = useMemo(
    () => ordersQuery.data?.pages.flatMap((p) => p.orders) ?? [],
    [ordersQuery.data],
  )

  const columns = useMemo<ColumnDef<MerchantOrderSummary>[]>(
    () => [
      {
        id: 'order',
        accessorFn: (row) => row.placedAt,
        sortingFn: 'datetime',
        header: ({ column }) => <SortHeader column={column} label="Order" />,
        cell: ({ row }) => (
          <div>
            <p className="text-sm font-medium text-foreground">{row.original.orderNumber}</p>
            <p className="text-xs text-muted-foreground">{formatDate(row.original.placedAt)}</p>
          </div>
        ),
      },
      {
        accessorKey: 'buyerName',
        header: ({ column }) => <SortHeader column={column} label="Customer" />,
        cell: ({ getValue }) => <span className="text-sm text-foreground">{getValue<string>()}</span>,
      },
      {
        accessorKey: 'itemCount',
        header: ({ column }) => <SortHeader column={column} label="Items" align="right" />,
        cell: ({ getValue }) => (
          <span className="text-sm tabular-nums text-muted-foreground">{getValue<number>()}</span>
        ),
      },
      {
        accessorKey: 'totalInCents',
        header: ({ column }) => <SortHeader column={column} label="Total" align="right" />,
        cell: ({ getValue }) => (
          <span className="text-sm font-semibold tabular-nums text-foreground">
            {formatZAR(getValue<number>())}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        enableSorting: false,
        header: () => 'Status',
        cell: ({ getValue }) => {
          const s = ORDER_STATUS[getValue<OrderStatus>()]
          return (
            <Badge tone={s.tone} dot>
              {s.label}
            </Badge>
          )
        },
      },
      {
        id: 'actions',
        enableSorting: false,
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <button
            onClick={() => setViewingOrderId(row.original.id)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            <Eye size={14} /> View
          </button>
        ),
      },
    ],
    [],
  )

  const table = useReactTable({
    data: orders,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
  })

  return (
    <div className="max-w-full space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Orders</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage and fulfil customer orders.</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-col gap-3 py-4 sm:flex-row">
          <div className="relative flex-1">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Search by order number…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="h-9 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
            className="h-9 rounded-lg border border-border bg-card px-3 text-sm text-foreground outline-none transition-colors focus:border-ring focus:ring-1 focus:ring-ring"
          >
            <option value="all">All statuses</option>
            {FILTERABLE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {ORDER_STATUS[status].label}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        {ordersQuery.isPending ? (
          <div className="space-y-3 p-5">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-40" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>
        ) : ordersQuery.isError ? (
          <div className="p-12 text-center">
            <p className="mb-4 text-sm text-muted-foreground">Couldn&apos;t load orders.</p>
            <button onClick={() => ordersQuery.refetch()} className={btnBrand}>
              Retry
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">
            <span className="mx-auto mb-3 grid size-11 place-items-center rounded-xl bg-brand-subtle text-brand">
              <Package size={20} />
            </span>
            <p className="font-medium text-foreground">No orders found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {search || statusFilter !== 'all'
                ? 'Try adjusting your filters.'
                : 'Orders appear here the moment a buyer checks out.'}
            </p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id} className="hover:bg-transparent">
                    {hg.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className={cn(RIGHT_ALIGNED.has(header.column.id) && 'text-right')}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={cn(RIGHT_ALIGNED.has(cell.column.id) && 'text-right')}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {ordersQuery.hasNextPage && (
              <div className="border-t border-border p-4 text-center">
                <button
                  onClick={() => ordersQuery.fetchNextPage()}
                  disabled={ordersQuery.isFetchingNextPage}
                  className={btnOutline}
                >
                  {ordersQuery.isFetchingNextPage ? 'Loading…' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
      </Card>

      {viewingOrderId && store && (
        <OrderDetailModal
          storeId={store.id}
          orderId={viewingOrderId}
          onClose={() => setViewingOrderId(null)}
        />
      )}
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SortHeader({ column, label, align }: { column: any; label: string; align?: 'right' }) {
  const sorted = column.getIsSorted() as false | 'asc' | 'desc'
  return (
    <button
      onClick={() => column.toggleSorting(sorted === 'asc')}
      className={cn(
        'inline-flex items-center gap-1 uppercase tracking-wide transition-colors hover:text-foreground',
        align === 'right' && 'flex-row-reverse',
      )}
    >
      {label}
      {sorted === 'asc' ? (
        <ArrowUp size={12} />
      ) : sorted === 'desc' ? (
        <ArrowDown size={12} />
      ) : (
        <ChevronsUpDown size={12} className="opacity-40" />
      )}
    </button>
  )
}

// ----------------------------------------------------------------------------
// Detail modal
// ----------------------------------------------------------------------------

function OrderDetailModal({
  storeId,
  orderId,
  onClose,
}: {
  storeId: string
  orderId: string
  onClose: () => void
}) {
  const detailQuery = useStoreOrder(storeId, orderId)
  const updateStatus = useUpdateOrderStatus(storeId)
  const cancelOrder = useCancelStoreOrder(storeId)
  const [showCancel, setShowCancel] = useState(false)
  const [cancelReason, setCancelReason] = useState<MerchantCancelReason>('OUT_OF_STOCK')
  const [labelState, setLabelState] = useState<'idle' | 'downloading' | 'unavailable'>('idle')

  const order = detailQuery.data

  async function handleLabelDownload() {
    if (!order) return
    setLabelState('downloading')
    try {
      await downloadShippingLabel(storeId, orderId, order.orderNumber)
      setLabelState('idle')
    } catch {
      // 404 = courier shipment not booked yet (post-payment hook / webhook).
      setLabelState('unavailable')
      setTimeout(() => setLabelState('idle'), 3000)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-card text-card-foreground shadow-xl">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {order ? order.orderNumber : 'Order'}
            </h2>
            {order && (
              <div className="mt-1">
                <Badge tone={ORDER_STATUS[order.status].tone} dot>
                  {ORDER_STATUS[order.status].label}
                </Badge>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>

        {detailQuery.isPending ? (
          <div className="space-y-3 p-6">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : detailQuery.isError || !order ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            Couldn&apos;t load this order.
          </div>
        ) : (
          <div className="space-y-6 p-6">
            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              {NEXT_TRANSITION[order.status] && (
                <button
                  onClick={() =>
                    updateStatus.mutate({
                      orderId,
                      status: NEXT_TRANSITION[order.status]!.target,
                    })
                  }
                  disabled={updateStatus.isPending}
                  className={btnBrand}
                >
                  {updateStatus.isPending ? 'Updating…' : NEXT_TRANSITION[order.status]!.cta}
                </button>
              )}
              {LABEL_ELIGIBLE.includes(order.status) && (
                <button
                  onClick={handleLabelDownload}
                  disabled={labelState === 'downloading'}
                  className={btnOutline}
                >
                  <Download size={14} />
                  {labelState === 'downloading'
                    ? 'Fetching…'
                    : labelState === 'unavailable'
                      ? 'Label not ready yet'
                      : 'Download waybill'}
                </button>
              )}
              {CANCELLABLE.includes(order.status) && !showCancel && (
                <button
                  onClick={() => setShowCancel(true)}
                  className="inline-flex h-9 items-center rounded-lg border border-danger/30 px-4 text-sm font-medium text-danger transition-colors hover:bg-danger/10"
                >
                  Cancel order
                </button>
              )}
            </div>

            {/* Cancel confirm */}
            {showCancel && (
              <div className="space-y-3 rounded-lg border border-danger/30 bg-danger/5 p-4">
                <p className="text-sm font-medium text-danger">
                  Cancel this order? The buyer will see it as cancelled.
                </p>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value as MerchantCancelReason)}
                  className="h-9 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring"
                >
                  <option value="OUT_OF_STOCK">Out of stock</option>
                  <option value="CANNOT_FULFILL">Cannot fulfill</option>
                  <option value="OTHER">Other</option>
                </select>
                <div className="flex gap-3">
                  <button
                    onClick={() =>
                      cancelOrder.mutate(
                        { orderId, reason: cancelReason },
                        { onSuccess: () => setShowCancel(false) },
                      )
                    }
                    disabled={cancelOrder.isPending}
                    className="inline-flex h-9 items-center rounded-lg bg-danger px-4 text-sm font-medium text-danger-foreground transition-colors hover:bg-danger/90 disabled:opacity-50"
                  >
                    {cancelOrder.isPending ? 'Cancelling…' : 'Confirm cancel'}
                  </button>
                  <button
                    onClick={() => setShowCancel(false)}
                    className="px-4 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Keep order
                  </button>
                </div>
              </div>
            )}

            {/* Items */}
            <section>
              <SectionTitle>Items</SectionTitle>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    {item.productImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.productImageUrl}
                        alt={item.productTitle}
                        className="h-16 w-14 rounded-lg bg-muted object-cover"
                      />
                    ) : (
                      <div className="grid h-16 w-14 place-items-center rounded-lg bg-muted">
                        <Package size={18} className="text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{item.productTitle}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.variantName ? `${item.variantName} · ` : ''}Qty {item.quantity} ·{' '}
                        {formatZAR(item.unitPriceInCents)} each
                      </p>
                    </div>
                    <p className="text-sm font-semibold tabular-nums text-foreground">
                      {formatZAR(item.totalInCents)}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Totals + payout */}
            <section className="rounded-lg bg-muted/50 p-4">
              <Row label="Subtotal" value={formatZAR(order.subtotalInCents)} />
              <Row
                label="Shipping (paid by YIIVA to courier)"
                value={formatZAR(order.shippingInCents)}
              />
              {order.discountInCents > 0 && (
                <Row label="Discount" value={`−${formatZAR(order.discountInCents)}`} />
              )}
              <div className="my-2 border-t border-border" />
              <Row label="Order total" value={formatZAR(order.totalInCents)} bold />
              {order.payment && (
                <>
                  <div className="my-2 border-t border-border" />
                  <Row
                    label="Platform commission"
                    value={`−${formatZAR(order.payment.platformCommissionInCents)}`}
                  />
                  <Row
                    label="Your payout"
                    value={formatZAR(order.payment.merchantPayoutInCents)}
                    bold
                  />
                </>
              )}
            </section>

            {/* Customer + shipping */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <section className="rounded-lg border border-border p-4">
                <SectionTitle>
                  <User size={14} className="mr-1.5 inline" />
                  Customer
                </SectionTitle>
                <p className="text-sm font-medium text-foreground">{order.buyer.name}</p>
                <p className="text-sm text-muted-foreground">{order.buyer.email}</p>
                {order.buyer.phone && (
                  <p className="text-sm text-muted-foreground">{order.buyer.phone}</p>
                )}
              </section>
              <section className="rounded-lg border border-border p-4">
                <SectionTitle>
                  <MapPin size={14} className="mr-1.5 inline" />
                  Ship to
                </SectionTitle>
                <p className="text-sm font-medium text-foreground">
                  {order.shippingAddress.recipientName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {order.shippingAddress.addressLine1}
                  {order.shippingAddress.addressLine2
                    ? `, ${order.shippingAddress.addressLine2}`
                    : ''}
                </p>
                <p className="text-sm text-muted-foreground">
                  {order.shippingAddress.city}, {order.shippingAddress.postalCode}
                </p>
                <p className="text-sm text-muted-foreground">{order.shippingAddress.province}</p>
              </section>
            </div>

            {/* Timeline */}
            <section>
              <SectionTitle>Timeline</SectionTitle>
              <Timeline order={order} />
            </section>

            {order.cancelReason && (
              <p className="text-xs text-muted-foreground">
                Cancellation reason: {order.cancelReason}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </h3>
  )
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between py-1">
      <span className={cn('text-sm', bold ? 'font-semibold text-foreground' : 'text-muted-foreground')}>
        {label}
      </span>
      <span
        className={cn(
          'text-sm tabular-nums',
          bold ? 'font-semibold text-foreground' : 'text-foreground',
        )}
      >
        {value}
      </span>
    </div>
  )
}

function Timeline({ order }: { order: MerchantOrderDetail }) {
  const steps: { label: string; date: Date | null }[] = order.cancelledAt
    ? [
        { label: 'Order placed', date: order.placedAt },
        ...(order.confirmedAt
          ? [{ label: 'Payment confirmed', date: order.confirmedAt }]
          : []),
        { label: 'Cancelled', date: order.cancelledAt },
      ]
    : [
        { label: 'Order placed', date: order.placedAt },
        { label: 'Payment confirmed', date: order.confirmedAt },
        { label: 'Dispatched', date: order.dispatchedAt },
        { label: 'Delivered', date: order.deliveredAt },
      ]

  return (
    <div className="space-y-2">
      {steps.map((step) => (
        <div key={step.label} className="flex items-center gap-3">
          <span
            className={cn(
              'size-2.5 rounded-full',
              step.date
                ? step.label === 'Cancelled'
                  ? 'bg-danger'
                  : 'bg-success'
                : 'bg-muted-foreground/30',
            )}
          />
          <span className={cn('text-sm', step.date ? 'text-foreground' : 'text-muted-foreground')}>
            {step.label}
          </span>
          {step.date && (
            <span className="ml-auto text-xs text-muted-foreground">{formatDate(step.date)}</span>
          )}
        </div>
      ))}
    </div>
  )
}
