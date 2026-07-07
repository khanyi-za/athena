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
  ArrowDown,
  ArrowUp,
  ChevronsUpDown,
  Eye,
  MapPin,
  Package,
  Pencil,
  RefreshCw,
  Search,
  User,
  X,
} from 'lucide-react'

import {
  useAdminCancelOrder,
  useAdminEditOrder,
  useAdminOrder,
  useAdminOrdersInfinite,
  useAdminRefundOrder,
  useForceConfirmOrder,
  useReconcilePaymentGroup,
} from '@/hooks/use-admin-orders'
import { formatZAR } from '@/lib/format-money'
import { cn } from '@/lib/utils'
import { ORDER_STATUS } from '@/lib/order-status'
import { Card, CardContent } from '@/components/ui/card'
import { Badge, type BadgeTone } from '@/components/ui/badge'
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
  AdminCancelReason,
  AdminEditOrderInput,
  AdminOrderDetail,
  AdminOrderSummary,
  PaymentGroupStatus,
  ReconcileVerdict,
} from '@/lib/schemas/admin-order'
import type { OrderStatus } from '@/lib/schemas/order'

// Admin Orders — cross-store list + full-power detail modal (force-confirm,
// cancel-with-admin-reason, shipping/notes edit, PayFast refund, reconcile).
// Mirrors the merchant Orders page conventions (DataTable, unified status
// badges, token-styled server filters, cursor "Load more").

const FILTERABLE_STATUSES: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'READY_FOR_DISPATCH',
  'DISPATCHED',
  'IN_TRANSIT',
  'DELIVERED',
  'CANCELLED',
  'REFUND_REQUESTED',
  'REFUNDED',
]

// Admin can cancel from any state except these (mirrors nuwa TERMINAL_STATES
// + already-cancelled guard).
const NON_CANCELLABLE: OrderStatus[] = ['DELIVERED', 'REFUNDED', 'CANCELLED']

const CANCEL_REASONS: { value: AdminCancelReason; label: string }[] = [
  { value: 'FRAUD', label: 'Fraud' },
  { value: 'POLICY_VIOLATION', label: 'Policy violation' },
  { value: 'CUSTOMER_REQUEST', label: 'Customer request' },
  { value: 'MERCHANT_REQUEST', label: 'Merchant request' },
  { value: 'OTHER', label: 'Other' },
]

const PAYMENT_GROUP_STATUS: Record<PaymentGroupStatus, { label: string; tone: BadgeTone }> = {
  PENDING: { label: 'Pending', tone: 'neutral' },
  COMPLETED: { label: 'Completed', tone: 'success' },
  FAILED: { label: 'Failed', tone: 'danger' },
  CANCELLED: { label: 'Cancelled', tone: 'danger' },
  REFUNDED: { label: 'Refunded', tone: 'danger' },
  PARTIALLY_REFUNDED: { label: 'Partially refunded', tone: 'warning' },
  RECONCILE_REQUIRED: { label: 'Reconcile required', tone: 'warning' },
}

const RECONCILE_VERDICT: Record<ReconcileVerdict, { label: string; tone: BadgeTone; hint: string }> = {
  MATCH: {
    label: 'Match',
    tone: 'success',
    hint: 'PayFast and YIIVA agree on the terminal state.',
  },
  MATCH_PENDING: {
    label: 'Both pending',
    tone: 'info',
    hint: 'Both sides still pending — checkout in flight or abandoned.',
  },
  MISMATCH: {
    label: 'Mismatch',
    tone: 'danger',
    hint: 'PayFast and YIIVA disagree — investigate before touching this order.',
  },
  NOT_FOUND: {
    label: 'Not found at PayFast',
    tone: 'warning',
    hint: 'PayFast has no record of this m_payment_id in the ±7-day window.',
  },
}

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
const btnDangerOutline =
  'inline-flex h-9 items-center gap-2 rounded-lg border border-danger/30 px-4 text-sm font-medium text-danger transition-colors hover:bg-danger/10 disabled:opacity-50'
const inputBase =
  'h-9 rounded-lg border border-border bg-card px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring'

export default function AdminOrdersPage() {
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [buyerEmailInput, setBuyerEmailInput] = useState('')
  const [buyerEmail, setBuyerEmail] = useState('')
  const [viewingOrderId, setViewingOrderId] = useState<string | null>(null)
  const [sorting, setSorting] = useState<SortingState>([{ id: 'order', desc: true }])

  // Debounce both server-side text filters.
  useEffect(() => {
    const handle = setTimeout(() => setSearch(searchInput.trim()), 300)
    return () => clearTimeout(handle)
  }, [searchInput])
  useEffect(() => {
    const handle = setTimeout(() => setBuyerEmail(buyerEmailInput.trim()), 300)
    return () => clearTimeout(handle)
  }, [buyerEmailInput])

  const ordersQuery = useAdminOrdersInfinite({
    ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
    ...(search ? { search } : {}),
    ...(buyerEmail ? { buyerEmail } : {}),
    take: 20,
  })

  const orders = useMemo(
    () => ordersQuery.data?.pages.flatMap((p) => p.orders) ?? [],
    [ordersQuery.data],
  )

  const columns = useMemo<ColumnDef<AdminOrderSummary>[]>(
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
        accessorKey: 'storeName',
        header: ({ column }) => <SortHeader column={column} label="Store" />,
        cell: ({ getValue }) => <span className="text-sm text-foreground">{getValue<string>()}</span>,
      },
      {
        accessorKey: 'buyerName',
        header: ({ column }) => <SortHeader column={column} label="Customer" />,
        cell: ({ row }) => (
          <div>
            <p className="text-sm text-foreground">{row.original.buyerName}</p>
            <p className="text-xs text-muted-foreground">{row.original.buyerEmail}</p>
          </div>
        ),
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
        <p className="mt-1 text-sm text-muted-foreground">
          Every order across every store. Force-confirm, cancel, edit, refund, reconcile.
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-col gap-3 py-4 lg:flex-row">
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
              className={cn(inputBase, 'w-full pl-9 pr-3')}
            />
          </div>
          <div className="relative flex-1">
            <User
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Filter by buyer email…"
              value={buyerEmailInput}
              onChange={(e) => setBuyerEmailInput(e.target.value)}
              className={cn(inputBase, 'w-full pl-9 pr-3')}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
            className={inputBase}
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
              {search || buyerEmail || statusFilter !== 'all'
                ? 'Try adjusting your filters.'
                : 'Orders appear here the moment a buyer checks out anywhere on YIIVA.'}
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

      {viewingOrderId && (
        <AdminOrderDetailModal orderId={viewingOrderId} onClose={() => setViewingOrderId(null)} />
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

type Panel = 'none' | 'cancel' | 'edit' | 'refund' | 'reconcile'

function AdminOrderDetailModal({ orderId, onClose }: { orderId: string; onClose: () => void }) {
  const detailQuery = useAdminOrder(orderId)
  const forceConfirm = useForceConfirmOrder()
  const [panel, setPanel] = useState<Panel>('none')

  const order = detailQuery.data

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-card text-card-foreground shadow-xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {order ? order.orderNumber : 'Order'}
            </h2>
            {order && (
              <div className="mt-1 flex items-center gap-2">
                <Badge tone={ORDER_STATUS[order.status].tone} dot>
                  {ORDER_STATUS[order.status].label}
                </Badge>
                <span className="text-xs text-muted-foreground">{order.store.displayName}</span>
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
              {order.status === 'PENDING' && (
                <button
                  onClick={() => forceConfirm.mutate({ orderId })}
                  disabled={forceConfirm.isPending}
                  className={btnBrand}
                >
                  {forceConfirm.isPending ? 'Confirming…' : 'Force confirm'}
                </button>
              )}
              <button
                onClick={() => setPanel(panel === 'edit' ? 'none' : 'edit')}
                className={btnOutline}
              >
                <Pencil size={14} /> Edit details
              </button>
              {order.payment && !['PENDING', 'REFUNDED'].includes(order.status) && (
                <button
                  onClick={() => setPanel(panel === 'refund' ? 'none' : 'refund')}
                  className={btnOutline}
                >
                  Refund
                </button>
              )}
              {order.payment && (
                <button
                  onClick={() => setPanel(panel === 'reconcile' ? 'none' : 'reconcile')}
                  className={btnOutline}
                >
                  <RefreshCw size={14} /> Reconcile
                </button>
              )}
              {!NON_CANCELLABLE.includes(order.status) && (
                <button
                  onClick={() => setPanel(panel === 'cancel' ? 'none' : 'cancel')}
                  className={btnDangerOutline}
                >
                  Cancel order
                </button>
              )}
            </div>

            {forceConfirm.isError && (
              <PanelError message={(forceConfirm.error as Error).message} />
            )}

            {panel === 'cancel' && (
              <CancelPanel orderId={orderId} onDone={() => setPanel('none')} />
            )}
            {panel === 'edit' && (
              <EditPanel order={order} onDone={() => setPanel('none')} />
            )}
            {panel === 'refund' && order.payment && (
              <RefundPanel orderId={orderId} payment={order.payment} />
            )}
            {panel === 'reconcile' && order.payment && (
              <ReconcilePanel paymentGroupId={order.payment.paymentGroup.id} />
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

            {/* Totals + payment internals */}
            <section className="rounded-lg bg-muted/50 p-4">
              <Row label="Subtotal" value={formatZAR(order.subtotalInCents)} />
              <Row label="Shipping (YIIVA pays courier)" value={formatZAR(order.shippingInCents)} />
              {order.discountInCents > 0 && (
                <Row label="Discount" value={`−${formatZAR(order.discountInCents)}`} />
              )}
              <div className="my-2 border-t border-border" />
              <Row label="Order total" value={formatZAR(order.totalInCents)} bold />
              {order.payment && (
                <>
                  <div className="my-2 border-t border-border" />
                  <div className="flex items-center justify-between py-1">
                    <span className="text-sm text-muted-foreground">Payment group</span>
                    <span className="flex items-center gap-2">
                      <Badge tone={PAYMENT_GROUP_STATUS[order.payment.paymentGroup.status].tone}>
                        {PAYMENT_GROUP_STATUS[order.payment.paymentGroup.status].label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {order.payment.paymentGroup.mPaymentId}
                      </span>
                    </span>
                  </div>
                  <Row label="Gross (this store)" value={formatZAR(order.payment.amountGrossInCents)} />
                  <Row label="PayFast fee" value={`−${formatZAR(order.payment.amountFeeInCents)}`} />
                  <Row label="Net" value={formatZAR(order.payment.amountNetInCents)} />
                  <Row
                    label="Platform commission (5.5%)"
                    value={`−${formatZAR(order.payment.platformCommissionInCents)}`}
                  />
                  <Row
                    label="Merchant payout"
                    value={formatZAR(order.payment.merchantPayoutInCents)}
                    bold
                  />
                  {order.payment.refundedAmountInCents > 0 && (
                    <Row
                      label="Refunded so far"
                      value={`−${formatZAR(order.payment.refundedAmountInCents)}`}
                    />
                  )}
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
                <p className="text-sm font-medium text-foreground">
                  {order.buyer.name}
                  {order.buyer.isGuestAccount && (
                    <span className="ml-2 align-middle">
                      <Badge tone="neutral">Guest</Badge>
                    </span>
                  )}
                </p>
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

            {order.notes && (
              <p className="text-xs text-muted-foreground">Notes: {order.notes}</p>
            )}
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

// ----------------------------------------------------------------------------
// Action panels
// ----------------------------------------------------------------------------

function CancelPanel({ orderId, onDone }: { orderId: string; onDone: () => void }) {
  const cancelOrder = useAdminCancelOrder()
  const [reason, setReason] = useState<AdminCancelReason>('CUSTOMER_REQUEST')
  const [notes, setNotes] = useState('')

  return (
    <div className="space-y-3 rounded-lg border border-danger/30 bg-danger/5 p-4">
      <p className="text-sm font-medium text-danger">
        Cancel this order? The buyer is notified and sees it as cancelled.
      </p>
      <select
        value={reason}
        onChange={(e) => setReason(e.target.value as AdminCancelReason)}
        className={cn(inputBase, 'w-full')}
      >
        {CANCEL_REASONS.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>
      <input
        type="text"
        placeholder="Notes (recorded with the reason; optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        maxLength={500}
        className={cn(inputBase, 'w-full')}
      />
      {cancelOrder.isError && <PanelError message={(cancelOrder.error as Error).message} />}
      <div className="flex gap-3">
        <button
          onClick={() =>
            cancelOrder.mutate(
              { orderId, reason, notes: notes.trim() || undefined },
              { onSuccess: onDone },
            )
          }
          disabled={cancelOrder.isPending}
          className="inline-flex h-9 items-center rounded-lg bg-danger px-4 text-sm font-medium text-danger-foreground transition-colors hover:bg-danger/90 disabled:opacity-50"
        >
          {cancelOrder.isPending ? 'Cancelling…' : 'Confirm cancel'}
        </button>
        <button
          onClick={onDone}
          className="px-4 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Keep order
        </button>
      </div>
    </div>
  )
}

function EditPanel({ order, onDone }: { order: AdminOrderDetail; onDone: () => void }) {
  const editOrder = useAdminEditOrder()
  const [form, setForm] = useState({
    notes: order.notes ?? '',
    shippingName: order.shippingAddress.recipientName,
    shippingPhone: order.shippingAddress.phone,
    shippingAddress1: order.shippingAddress.addressLine1,
    shippingAddress2: order.shippingAddress.addressLine2 ?? '',
    shippingCity: order.shippingAddress.city,
    shippingProvince: order.shippingAddress.province,
    shippingPostalCode: order.shippingAddress.postalCode,
  })

  const initial = useMemo(
    () => ({
      notes: order.notes ?? '',
      shippingName: order.shippingAddress.recipientName,
      shippingPhone: order.shippingAddress.phone,
      shippingAddress1: order.shippingAddress.addressLine1,
      shippingAddress2: order.shippingAddress.addressLine2 ?? '',
      shippingCity: order.shippingAddress.city,
      shippingProvince: order.shippingAddress.province,
      shippingPostalCode: order.shippingAddress.postalCode,
    }),
    [order],
  )

  // Only send fields that actually changed — PATCH rejects empty payloads.
  const dirty = useMemo(() => {
    const out: AdminEditOrderInput = {}
    for (const key of Object.keys(form) as (keyof typeof form)[]) {
      if (form[key] !== initial[key]) out[key] = form[key]
    }
    return out
  }, [form, initial])

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const fields: { key: keyof typeof form; label: string; span?: boolean }[] = [
    { key: 'shippingName', label: 'Recipient name' },
    { key: 'shippingPhone', label: 'Phone' },
    { key: 'shippingAddress1', label: 'Address line 1', span: true },
    { key: 'shippingAddress2', label: 'Address line 2', span: true },
    { key: 'shippingCity', label: 'City' },
    { key: 'shippingProvince', label: 'Province' },
    { key: 'shippingPostalCode', label: 'Postal code' },
    { key: 'notes', label: 'Admin notes' },
  ]

  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
      <p className="text-sm font-medium text-foreground">Edit shipping details / notes</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {fields.map((f) => (
          <label key={f.key} className={cn('space-y-1', f.span && 'sm:col-span-2')}>
            <span className="text-xs font-medium text-muted-foreground">{f.label}</span>
            <input
              type="text"
              value={form[f.key]}
              onChange={set(f.key)}
              className={cn(inputBase, 'w-full')}
            />
          </label>
        ))}
      </div>
      {editOrder.isError && <PanelError message={(editOrder.error as Error).message} />}
      <div className="flex gap-3">
        <button
          onClick={() =>
            editOrder.mutate({ orderId: order.id, input: dirty }, { onSuccess: onDone })
          }
          disabled={editOrder.isPending || Object.keys(dirty).length === 0}
          className={btnBrand}
        >
          {editOrder.isPending ? 'Saving…' : 'Save changes'}
        </button>
        <button
          onClick={onDone}
          className="px-4 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Discard
        </button>
      </div>
    </div>
  )
}

function RefundPanel({
  orderId,
  payment,
}: {
  orderId: string
  payment: NonNullable<AdminOrderDetail['payment']>
}) {
  const refund = useAdminRefundOrder()
  const remainingInCents = payment.amountGrossInCents - payment.refundedAmountInCents
  const [amountRands, setAmountRands] = useState((remainingInCents / 100).toFixed(2))
  const [reason, setReason] = useState('')
  const [accType, setAccType] = useState<'current' | 'savings'>('current')
  const [notifyBuyer, setNotifyBuyer] = useState(true)

  const amountInCents = Math.round(parseFloat(amountRands || '0') * 100)
  const amountValid = Number.isFinite(amountInCents) && amountInCents > 0 && amountInCents <= remainingInCents

  return (
    <div className="space-y-3 rounded-lg border border-warning/40 bg-warning/5 p-4">
      <p className="text-sm font-medium text-foreground">
        Refund via PayFast — {formatZAR(remainingInCents)} refundable
        {payment.refundedAmountInCents > 0 &&
          ` (${formatZAR(payment.refundedAmountInCents)} already refunded)`}
      </p>
      <p className="text-xs text-muted-foreground">
        Synchronous: PayFast is called immediately, then confirms by ITN. Sandbox credentials
        always reject refunds — production only.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Amount (R)</span>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={amountRands}
            onChange={(e) => setAmountRands(e.target.value)}
            className={cn(inputBase, 'w-full')}
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground">
            Buyer bank account type
          </span>
          <select
            value={accType}
            onChange={(e) => setAccType(e.target.value as 'current' | 'savings')}
            className={cn(inputBase, 'w-full')}
          >
            <option value="current">Current (cheque)</option>
            <option value="savings">Savings</option>
          </select>
        </label>
        <label className="space-y-1 sm:col-span-2">
          <span className="text-xs font-medium text-muted-foreground">
            Reason (shown to the buyer)
          </span>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={255}
            placeholder="e.g. Item returned — condition verified"
            className={cn(inputBase, 'w-full')}
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-foreground sm:col-span-2">
          <input
            type="checkbox"
            checked={notifyBuyer}
            onChange={(e) => setNotifyBuyer(e.target.checked)}
            className="size-4 accent-[var(--brand)]"
          />
          PayFast emails the buyer a refund confirmation
        </label>
      </div>
      {refund.isError && <PanelError message={(refund.error as Error).message} />}
      {refund.isSuccess && (
        <p className="text-sm text-success">
          Refund submitted (id {refund.data.refundId}). Cumulative refunded:{' '}
          {formatZAR(refund.data.cumulativeRefundedInCents)}. PayFast will confirm via ITN.
        </p>
      )}
      <button
        onClick={() =>
          refund.mutate({ orderId, amountInCents, reason: reason.trim(), accType, notifyBuyer })
        }
        disabled={refund.isPending || !amountValid || !reason.trim()}
        className={btnBrand}
      >
        {refund.isPending ? 'Submitting…' : `Refund ${amountValid ? formatZAR(amountInCents) : ''}`}
      </button>
    </div>
  )
}

function ReconcilePanel({ paymentGroupId }: { paymentGroupId: string }) {
  const reconcile = useReconcilePaymentGroup(paymentGroupId, true)

  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">PayFast reconcile</p>
        <button
          onClick={() => reconcile.refetch()}
          disabled={reconcile.isFetching}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
        >
          <RefreshCw size={12} className={cn(reconcile.isFetching && 'animate-spin')} />
          Re-run
        </button>
      </div>
      {reconcile.isPending ? (
        <Skeleton className="h-24 w-full" />
      ) : reconcile.isError ? (
        <PanelError message={(reconcile.error as Error).message} />
      ) : reconcile.data ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge tone={RECONCILE_VERDICT[reconcile.data.verdict].tone} dot>
              {RECONCILE_VERDICT[reconcile.data.verdict].label}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {RECONCILE_VERDICT[reconcile.data.verdict].hint}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-x-6 text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                YIIVA
              </p>
              <Row
                label="Status"
                value={PAYMENT_GROUP_STATUS[reconcile.data.paymentGroup.status].label}
              />
              <Row
                label="Gross"
                value={formatZAR(reconcile.data.paymentGroup.amountGrossInCents)}
              />
              <Row label="m_payment_id" value={reconcile.data.paymentGroup.mPaymentId} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                PayFast
              </p>
              {reconcile.data.payfast.found ? (
                <>
                  <Row label="Status" value={reconcile.data.payfast.paymentStatus ?? '—'} />
                  <Row label="Gross" value={`R${reconcile.data.payfast.amountGross ?? '—'}`} />
                  <Row label="pf_payment_id" value={reconcile.data.payfast.pfPaymentId ?? '—'} />
                </>
              ) : (
                <p className="py-1 text-sm text-muted-foreground">
                  No matching transaction found.
                </p>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Window searched: {reconcile.data.window.from} → {reconcile.data.window.to}. Read-only —
            nothing was changed.
          </p>
        </div>
      ) : null}
    </div>
  )
}

// ----------------------------------------------------------------------------
// Shared bits
// ----------------------------------------------------------------------------

function PanelError({ message }: { message: string }) {
  return <p className="text-sm text-danger">{message}</p>
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

function Timeline({ order }: { order: AdminOrderDetail }) {
  const t = order.timeline
  const steps: { label: string; date: Date | null }[] = t.cancelledAt
    ? [
        { label: 'Order placed', date: t.placedAt },
        ...(t.confirmedAt ? [{ label: 'Payment confirmed', date: t.confirmedAt }] : []),
        { label: 'Cancelled', date: t.cancelledAt },
      ]
    : [
        { label: 'Order placed', date: t.placedAt },
        { label: 'Payment confirmed', date: t.confirmedAt },
        { label: 'Dispatched', date: t.dispatchedAt },
        { label: 'Delivered', date: t.deliveredAt },
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
