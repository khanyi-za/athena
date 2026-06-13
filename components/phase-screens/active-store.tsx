'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ShoppingCart,
  Package,
  Users,
  Star,
  Plus,
  TrendingUp,
  MapPin,
  ArrowRight,
  User,
  Copy,
  Check,
} from 'lucide-react'

import { useStoreMe, useInvalidateStoreMe } from '@/hooks/use-store-me'
import { useActiveProductCount } from '@/hooks/use-active-product-count'
import { useStoreOrders } from '@/hooks/use-store-orders'
import { useAuthStore } from '@/store/auth-store'
import { GoLiveCelebrationModal } from '@/components/active/go-live-celebration-modal'
import { AddressSection } from '@/components/approved/address-section'
import { AddressFormModal } from '@/components/approved/address-form-modal'
import { DeleteAddressModal } from '@/components/approved/delete-address-modal'
import { formatZAR } from '@/lib/format-money'
import type { StoreAddress } from '@/lib/schemas/store'
import type { MerchantOrderSummary, OrderStatus } from '@/lib/schemas/order'

// MERCHANT + ACTIVE overview — the legacy-dashboard design wired to real data
// (the LegacyDashboardShell in the dashboard layout provides the sidebar
// chrome). Stats come from /stores/me; recent orders from the merchant-orders
// proxy. Top-products insights wait on the Phalo analytics engine.
//
// Functionality preserved from the pre-legacy version: locations management
// (AddressSection + modals) and the one-time go-live celebration modal.

type ModalState =
  | { kind: 'none' }
  | { kind: 'addingAddress' }
  | { kind: 'editingAddress'; address: StoreAddress }
  | { kind: 'deletingAddress'; address: StoreAddress }

export function ActiveStoreScreen() {
  const user = useAuthStore((s) => s.user)
  const { data: store, isLoading, isError } = useStoreMe()
  const { data: activeProductCount, isLoading: isActiveCountLoading } =
    useActiveProductCount(store?.id)
  const ordersQuery = useStoreOrders(store?.id, { take: 5 })
  const invalidateStoreMe = useInvalidateStoreMe()

  const [modal, setModal] = useState<ModalState>({ kind: 'none' })

  if (isLoading) return <LoadingState />
  if (isError || !store) return <ErrorState />

  const closeModal = () => setModal({ kind: 'none' })
  const openAddAddress = () => setModal({ kind: 'addingAddress' })
  const openEditAddress = (address: StoreAddress) =>
    setModal({ kind: 'editingAddress', address })
  const openDeleteAddress = (address: StoreAddress) =>
    setModal({ kind: 'deletingAddress', address })

  function handleAddressMutationSuccess() {
    invalidateStoreMe()
    setModal({ kind: 'none' })
  }

  function isOnlyAddress(address: StoreAddress): boolean {
    return store!.addresses.length === 1 && store!.addresses[0].id === address.id
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-black rounded-xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back{user ? `, ${user.firstName}` : ''}!
        </h1>
        <p className="text-gray-300 mb-1">
          Here&apos;s what&apos;s happening with {store.displayName} today
        </p>
        <PublicUrlLine slug={store.slug} />
        <div className="flex space-x-4 mt-4">
          <Link
            href="/dashboard/products"
            className="bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center"
          >
            <Plus size={16} className="mr-2" />
            Add New Product
          </Link>
          <Link
            href="/dashboard/products"
            className="bg-gray-800 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors border border-gray-600 flex items-center"
          >
            <Package size={16} className="mr-2" />
            Manage My Products
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Orders"
          value={store._count.orders.toLocaleString('en-ZA')}
          subtitle="All time"
          icon={ShoppingCart}
        />
        <StatCard
          title="Followers"
          value={store.followerCount.toLocaleString('en-ZA')}
          subtitle="On your brand"
          icon={Users}
        />
        <StatCard
          title="Active Products"
          value={isActiveCountLoading ? '—' : (activeProductCount ?? 0).toLocaleString('en-ZA')}
          subtitle={
            !isActiveCountLoading &&
            store._count.products > (activeProductCount ?? 0)
              ? `${store._count.products - (activeProductCount ?? 0)} not active`
              : 'In catalog'
          }
          icon={Package}
        />
        <StatCard
          title="Average Rating"
          value={store.averageRating > 0 ? store.averageRating.toFixed(1) : '—'}
          subtitle={store.averageRating > 0 ? 'Out of 5' : 'No reviews yet'}
          icon={Star}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
            </div>
            <div className="p-6">
              <RecentOrders
                orders={ordersQuery.data?.orders}
                isLoading={ordersQuery.isPending}
                isError={ordersQuery.isError}
              />
              <div className="mt-6">
                <Link
                  href="/dashboard/orders"
                  className="text-black hover:text-gray-600 font-medium text-sm flex items-center"
                >
                  View all orders
                  <ArrowRight size={16} className="ml-2" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Top Products — Phalo analytics placeholder */}
        <div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Top Products</h2>
            </div>
            <div className="p-6">
              <div className="flex flex-col items-center text-center py-6">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                  <TrendingUp size={20} className="text-gray-500" />
                </div>
                <p className="font-medium text-black text-sm mb-1">
                  Insights are on the way
                </p>
                <p className="text-xs text-gray-500">
                  Product performance rankings arrive with the analytics engine.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-black mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/dashboard/collections"
            className="p-4 border border-gray-200 rounded-lg hover:border-black hover:bg-gray-50 transition-colors text-center"
          >
            <div className="mb-2 flex justify-center">
              <Package size={24} className="text-gray-600" />
            </div>
            <h3 className="font-medium text-black">Curate Collections</h3>
            <p className="text-sm text-gray-500">Group products into stories</p>
          </Link>
          <Link
            href="/dashboard/team"
            className="p-4 border border-gray-200 rounded-lg hover:border-black hover:bg-gray-50 transition-colors text-center"
          >
            <div className="mb-2 flex justify-center">
              <Users size={24} className="text-gray-600" />
            </div>
            <h3 className="font-medium text-black">Manage Team</h3>
            <p className="text-sm text-gray-500">Invite people to help run the store</p>
          </Link>
          <Link
            href="#section-locations"
            className="p-4 border border-gray-200 rounded-lg hover:border-black hover:bg-gray-50 transition-colors text-center"
          >
            <div className="mb-2 flex justify-center">
              <MapPin size={24} className="text-gray-600" />
            </div>
            <h3 className="font-medium text-black">Locations</h3>
            <p className="text-sm text-gray-500">Where your brand is based</p>
          </Link>
        </div>
      </div>

      {/* Locations */}
      <div id="section-locations">
        <AddressSection
          store={store}
          onAdd={openAddAddress}
          onEdit={openEditAddress}
          onDelete={openDeleteAddress}
        />
      </div>

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
        preventLastDelete={
          modal.kind === 'deletingAddress' && isOnlyAddress(modal.address)
        }
        onClose={closeModal}
        onSuccess={handleAddressMutationSuccess}
        onAddInstead={openAddAddress}
      />

      <CelebrationGate
        storeId={store.id}
        displayName={store.displayName}
        slug={store.slug}
      />
    </div>
  )
}

// ----------------------------------------------------------------------------
// Pieces
// ----------------------------------------------------------------------------

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string
  value: string | number
  subtitle: string
  icon: React.ComponentType<{ size?: number; className?: string }>
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-black">{value}</p>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
        <div className="p-3 bg-gray-100 rounded-lg">
          <Icon size={24} className="text-gray-600" />
        </div>
      </div>
    </div>
  )
}

const ORDER_STATUS_CHIP: Record<OrderStatus, { label: string; className: string }> = {
  PENDING: { label: 'Pending', className: 'bg-gray-100 text-gray-800' },
  CONFIRMED: { label: 'Confirmed', className: 'bg-gray-100 text-gray-800' },
  PROCESSING: { label: 'Processing', className: 'bg-gray-200 text-gray-800' },
  READY_FOR_DISPATCH: { label: 'Ready', className: 'bg-gray-200 text-gray-800' },
  DISPATCHED: { label: 'Dispatched', className: 'bg-black text-white' },
  IN_TRANSIT: { label: 'In transit', className: 'bg-black text-white' },
  DELIVERED: { label: 'Delivered', className: 'bg-black text-white' },
  CANCELLED: { label: 'Cancelled', className: 'bg-red-50 text-red-700' },
  REFUND_REQUESTED: { label: 'Refund requested', className: 'bg-red-50 text-red-700' },
  REFUNDED: { label: 'Refunded', className: 'bg-red-50 text-red-700' },
}

function RecentOrders({
  orders,
  isLoading,
  isError,
}: {
  orders: MerchantOrderSummary[] | undefined
  isLoading: boolean
  isError: boolean
}) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-lg bg-gray-100" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <p className="text-sm text-gray-500 py-4">
        Couldn&apos;t load orders right now. Refresh to try again.
      </p>
    )
  }

  if (!orders || orders.length === 0) {
    return (
      <p className="text-sm text-gray-500 py-4">
        No orders yet — they&apos;ll show up here the moment a buyer checks out.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => {
        const chip = ORDER_STATUS_CHIP[order.status]
        return (
          <div
            key={order.id}
            className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
          >
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <User size={16} className="text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-black">{order.buyerName}</p>
                  <p className="text-sm text-gray-500">
                    {order.orderNumber} · {order.itemCount}{' '}
                    {order.itemCount === 1 ? 'item' : 'items'}
                  </p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-black">{formatZAR(order.totalInCents)}</p>
              <span
                className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${chip.className}`}
              >
                {chip.label}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function PublicUrlLine({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false)
  const base = process.env.NEXT_PUBLIC_PUBLIC_STORE_URL_BASE ?? ''
  const publicUrl = `${base}/${slug}`

  function copy() {
    void navigator.clipboard.writeText(publicUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
      title="Copy your public store link"
    >
      <span>{publicUrl}</span>
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  )
}

// ----------------------------------------------------------------------------
// Celebration gate — owns the localStorage decision so the parent doesn't have
// to run a setState-in-effect. The useState lazy initializer reads localStorage
// once on mount; from then on it's plain state. Per React 19's
// react-hooks/set-state-in-effect rule, this is the conditional-mount pattern.
// ----------------------------------------------------------------------------

function CelebrationGate({
  storeId,
  displayName,
  slug,
}: {
  storeId: string
  displayName: string
  slug: string
}) {
  const [visible, setVisible] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return !localStorage.getItem(celebrationKeyFor(storeId))
  })

  function dismiss() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(celebrationKeyFor(storeId), '1')
    }
    setVisible(false)
  }

  if (!visible) return null

  const base = process.env.NEXT_PUBLIC_PUBLIC_STORE_URL_BASE ?? ''
  const publicUrl = `${base}/${slug}`

  return (
    <GoLiveCelebrationModal
      storeDisplayName={displayName}
      publicUrl={publicUrl}
      onDismiss={dismiss}
    />
  )
}

// localStorage flag per store id — switching stores (future feature) will
// celebrate each new ACTIVE store independently.
function celebrationKeyFor(storeId: string): string {
  return `seen_go_live_celebration_${storeId}`
}

// ----------------------------------------------------------------------------
// States
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
      <h2 className="text-lg font-semibold text-zinc-950">
        Couldn&apos;t load your store
      </h2>
      <p className="text-sm text-zinc-500">
        Something went wrong on our side. Refresh the page to try again.
      </p>
    </div>
  )
}
