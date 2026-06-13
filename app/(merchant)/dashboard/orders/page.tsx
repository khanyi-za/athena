'use client'

import { useEffect, useState } from 'react'
import {
  Search,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  Eye,
  RefreshCw,
  User,
  MapPin,
  Download,
  X,
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
import type {
  MerchantCancelReason,
  MerchantOrderDetail,
  OrderStatus,
} from '@/lib/schemas/order'

// Orders — the legacy-dashboard design wired to the merchant-orders API.
// List (status filter + order-number search + cursor "Load more"), detail
// modal (items, buyer, shipping, payout breakdown, fulfilment timeline),
// status transitions (CONFIRMED → PROCESSING → READY_FOR_DISPATCH), merchant
// cancel with reason, and waybill PDF download (available once the courier
// shipment is booked).

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; icon: React.ComponentType<{ size?: number; className?: string }> }
> = {
  PENDING: { label: 'Pending payment', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  CONFIRMED: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  PROCESSING: { label: 'Processing', color: 'bg-purple-100 text-purple-800', icon: RefreshCw },
  READY_FOR_DISPATCH: { label: 'Ready for dispatch', color: 'bg-indigo-100 text-indigo-800', icon: Package },
  DISPATCHED: { label: 'Dispatched', color: 'bg-indigo-100 text-indigo-800', icon: Truck },
  IN_TRANSIT: { label: 'In transit', color: 'bg-indigo-100 text-indigo-800', icon: Truck },
  DELIVERED: { label: 'Delivered', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle },
  REFUND_REQUESTED: { label: 'Refund requested', color: 'bg-red-100 text-red-800', icon: XCircle },
  REFUNDED: { label: 'Refunded', color: 'bg-gray-100 text-gray-800', icon: XCircle },
}

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
  CONFIRMED: { target: 'PROCESSING', cta: 'Start Processing' },
  PROCESSING: { target: 'READY_FOR_DISPATCH', cta: 'Mark Ready for Dispatch' },
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

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function OrdersPage() {
  const { data: store } = useStoreMe()
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [viewingOrderId, setViewingOrderId] = useState<string | null>(null)

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

  const orders = ordersQuery.data?.pages.flatMap((p) => p.orders) ?? []

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-black">Orders</h1>
          <p className="text-gray-600">Manage and fulfill customer orders</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order number…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black text-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black text-sm bg-white"
          >
            <option value="all">All statuses</option>
            {FILTERABLE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_CONFIG[status].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {ordersQuery.isPending ? (
          <div className="p-6 space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-gray-100" />
            ))}
          </div>
        ) : ordersQuery.isError ? (
          <div className="p-12 text-center">
            <p className="text-sm text-gray-500 mb-4">Couldn&apos;t load orders.</p>
            <button
              onClick={() => ordersQuery.refetch()}
              className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium"
            >
              Retry
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">
            <Package size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="font-medium text-black mb-1">No orders found</p>
            <p className="text-sm text-gray-500">
              {search || statusFilter !== 'all'
                ? 'Try adjusting your filters.'
                : 'Orders appear here the moment a buyer checks out.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <Th>Order</Th>
                    <Th>Customer</Th>
                    <Th>Items</Th>
                    <Th>Total</Th>
                    <Th>Status</Th>
                    <Th>
                      <span className="sr-only">Actions</span>
                    </Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map((order) => {
                    const chip = STATUS_CONFIG[order.status]
                    return (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-black text-sm">{order.orderNumber}</p>
                          <p className="text-xs text-gray-500">{formatDate(order.placedAt)}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{order.buyerName}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{order.itemCount}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-black">
                          {formatZAR(order.totalInCents)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${chip.color}`}
                          >
                            {chip.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setViewingOrderId(order.id)}
                            className="inline-flex items-center px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-lg hover:border-black hover:text-black transition-colors"
                          >
                            <Eye size={14} className="mr-1.5" />
                            View
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {ordersQuery.hasNextPage && (
              <div className="p-4 border-t border-gray-100 text-center">
                <button
                  onClick={() => ordersQuery.fetchNextPage()}
                  disabled={ordersQuery.isFetchingNextPage}
                  className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:border-black hover:text-black transition-colors disabled:opacity-50"
                >
                  {ordersQuery.isFetchingNextPage ? 'Loading…' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

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

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
      {children}
    </th>
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
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Modal header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-black">
              {order ? order.orderNumber : 'Order'}
            </h2>
            {order && (
              <span
                className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CONFIG[order.status].color}`}
              >
                {STATUS_CONFIG[order.status].label}
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-black">
            <X size={20} />
          </button>
        </div>

        {detailQuery.isPending ? (
          <div className="p-6 space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-lg bg-gray-100" />
            ))}
          </div>
        ) : detailQuery.isError || !order ? (
          <div className="p-12 text-center text-sm text-gray-500">
            Couldn&apos;t load this order.
          </div>
        ) : (
          <div className="p-6 space-y-6">
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
                  className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {updateStatus.isPending ? 'Updating…' : NEXT_TRANSITION[order.status]!.cta}
                </button>
              )}
              {LABEL_ELIGIBLE.includes(order.status) && (
                <button
                  onClick={handleLabelDownload}
                  disabled={labelState === 'downloading'}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:border-black hover:text-black transition-colors flex items-center disabled:opacity-50"
                >
                  <Download size={14} className="mr-1.5" />
                  {labelState === 'downloading'
                    ? 'Fetching…'
                    : labelState === 'unavailable'
                      ? 'Label not ready yet'
                      : 'Download Waybill'}
                </button>
              )}
              {CANCELLABLE.includes(order.status) && !showCancel && (
                <button
                  onClick={() => setShowCancel(true)}
                  className="px-4 py-2 border border-red-200 text-red-700 rounded-lg text-sm font-medium hover:border-red-400 transition-colors"
                >
                  Cancel Order
                </button>
              )}
            </div>

            {/* Cancel confirm */}
            {showCancel && (
              <div className="border border-red-200 bg-red-50 rounded-lg p-4 space-y-3">
                <p className="text-sm font-medium text-red-800">
                  Cancel this order? The buyer will see it as cancelled.
                </p>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value as MerchantCancelReason)}
                  className="w-full px-3 py-2 border border-red-200 rounded-lg text-sm bg-white"
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
                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                  >
                    {cancelOrder.isPending ? 'Cancelling…' : 'Confirm Cancel'}
                  </button>
                  <button
                    onClick={() => setShowCancel(false)}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-black"
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
                        className="w-14 h-16 rounded-lg object-cover bg-gray-100"
                      />
                    ) : (
                      <div className="w-14 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
                        <Package size={18} className="text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-black">{item.productTitle}</p>
                      <p className="text-xs text-gray-500">
                        {item.variantName ? `${item.variantName} · ` : ''}Qty {item.quantity} ·{' '}
                        {formatZAR(item.unitPriceInCents)} each
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-black">
                      {formatZAR(item.totalInCents)}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Totals + payout */}
            <section className="bg-gray-50 rounded-lg p-4">
              <Row label="Subtotal" value={formatZAR(order.subtotalInCents)} />
              <Row
                label="Shipping (paid by YIIVA to courier)"
                value={formatZAR(order.shippingInCents)}
              />
              {order.discountInCents > 0 && (
                <Row label="Discount" value={`−${formatZAR(order.discountInCents)}`} />
              )}
              <div className="border-t border-gray-200 my-2" />
              <Row label="Order total" value={formatZAR(order.totalInCents)} bold />
              {order.payment && (
                <>
                  <div className="border-t border-gray-200 my-2" />
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <section className="border border-gray-200 rounded-lg p-4">
                <SectionTitle>
                  <User size={14} className="inline mr-1.5" />
                  Customer
                </SectionTitle>
                <p className="text-sm font-medium text-black">{order.buyer.name}</p>
                <p className="text-sm text-gray-600">{order.buyer.email}</p>
                {order.buyer.phone && (
                  <p className="text-sm text-gray-600">{order.buyer.phone}</p>
                )}
              </section>
              <section className="border border-gray-200 rounded-lg p-4">
                <SectionTitle>
                  <MapPin size={14} className="inline mr-1.5" />
                  Ship to
                </SectionTitle>
                <p className="text-sm font-medium text-black">
                  {order.shippingAddress.recipientName}
                </p>
                <p className="text-sm text-gray-600">
                  {order.shippingAddress.addressLine1}
                  {order.shippingAddress.addressLine2
                    ? `, ${order.shippingAddress.addressLine2}`
                    : ''}
                </p>
                <p className="text-sm text-gray-600">
                  {order.shippingAddress.city}, {order.shippingAddress.postalCode}
                </p>
                <p className="text-sm text-gray-600">{order.shippingAddress.province}</p>
              </section>
            </div>

            {/* Timeline */}
            <section>
              <SectionTitle>Timeline</SectionTitle>
              <Timeline order={order} />
            </section>

            {order.cancelReason && (
              <p className="text-xs text-gray-500">
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
    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
      {children}
    </h3>
  )
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between py-1">
      <span className={`text-sm ${bold ? 'font-semibold text-black' : 'text-gray-600'}`}>
        {label}
      </span>
      <span className={`text-sm ${bold ? 'font-semibold text-black' : 'text-gray-900'}`}>
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
            className={`w-2.5 h-2.5 rounded-full ${
              step.date
                ? step.label === 'Cancelled'
                  ? 'bg-red-500'
                  : 'bg-green-500'
                : 'bg-gray-300'
            }`}
          />
          <span className={`text-sm ${step.date ? 'text-black' : 'text-gray-400'}`}>
            {step.label}
          </span>
          {step.date && (
            <span className="text-xs text-gray-500 ml-auto">{formatDate(step.date)}</span>
          )}
        </div>
      ))}
    </div>
  )
}
