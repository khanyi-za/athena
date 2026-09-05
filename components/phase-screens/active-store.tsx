'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ShoppingCart,
  Package,
  Users,
  Star,
  Plus,
  Sparkles,
  MapPin,
  ArrowRight,
  FolderTree,
  TrendingUp,
} from 'lucide-react'

import { CldImage } from 'next-cloudinary'
import { INVENTORY_THUMB_200_RECIPE } from '@/lib/cloudinary-transforms'
import { useStoreMe, useInvalidateStoreMe } from '@/hooks/use-store-me'
import { useStoreOrders } from '@/hooks/use-store-orders'
import { useAuthStore } from '@/store/auth-store'
import { GoLiveCelebrationModal } from '@/components/active/go-live-celebration-modal'
import { LowStockCard } from '@/components/dashboard/low-stock-card'
import { AddressSection } from '@/components/approved/address-section'
import { AddressFormModal } from '@/components/approved/address-form-modal'
import { DeleteAddressModal } from '@/components/approved/delete-address-modal'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { StatCard } from '@/components/ui/stat-card'
import { RevenueChart } from '@/components/ui/charts'
import { useStoreAnalytics } from '@/lib/analytics/store-analytics'
import { ORDER_STATUS } from '@/lib/order-status'
import { formatZAR } from '@/lib/format-money'
import type { StoreAddress } from '@/lib/schemas/store'
import type { MerchantOrderSummary } from '@/lib/schemas/order'

// MERCHANT + ACTIVE overview — YIIVA redesign (shadcn-style primitives + tokens).
// KPI *values* come from /stores/me; recent orders from the merchant-orders proxy.
// Revenue chart, trend deltas and sparklines come from useStoreAnalytics, which
// returns SAMPLE data (isSample → "Sample" badge) until the Phalo analytics
// engine is wired — swapping to real data changes nothing in this component.
// Top-products insights remain a placeholder pending Phalo.
//
// Functionality preserved: locations management (AddressSection + modals) and the
// one-time go-live celebration modal.

// Azure #0ea5e9 — matched to maya's merchant-dashboard hero (owner call, with
// the revenue chart + Add product button below).
const AZURE_ICON = 'bg-[#0ea5e9]/10 text-[#0ea5e9]'

type ModalState =
  | { kind: 'none' }
  | { kind: 'addingAddress' }
  | { kind: 'editingAddress'; address: StoreAddress }
  | { kind: 'deletingAddress'; address: StoreAddress }

export function ActiveStoreScreen() {
  const user = useAuthStore((s) => s.user)
  const { data: store, isLoading, isError } = useStoreMe()
  const ordersQuery = useStoreOrders(store?.id, { take: 5 })
  const invalidateStoreMe = useInvalidateStoreMe()
  const analytics = useStoreAnalytics(store)

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Welcome back{user ? `, ${user.firstName}` : ''}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here&apos;s what&apos;s happening with {store.displayName} today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/products"
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            <Package size={16} /> Manage inventory
          </Link>
          <Link
            href="/dashboard/products"
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-gradient-to-br from-[#0ea5e9] to-[#0369a1] px-4 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            <Plus size={16} /> Add product
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Sales"
          value={store._count.orders.toLocaleString('en-ZA')}
          icon={ShoppingCart}
          trend={{ pct: analytics.orders.trendPct }}
          compact
          iconClassName={AZURE_ICON}
        />
        <StatCard
          label="Subscribers"
          value={store.followerCount.toLocaleString('en-ZA')}
          icon={Users}
          compact
          iconClassName={AZURE_ICON}
        />
        <StatCard
          label="Avg sale value"
          value={
            analytics.orders.count > 0
              ? formatZAR(Math.round(analytics.revenue.valueInCents / analytics.orders.count))
              : '—'
          }
          hint="Last 14 days"
          icon={TrendingUp}
          compact
          iconClassName={AZURE_ICON}
        />
        <StatCard
          label="Avg rating"
          value={store.averageRating > 0 ? store.averageRating.toFixed(1) : '—'}
          icon={Star}
          compact
          iconClassName={AZURE_ICON}
        />
      </div>

      {analytics.isSample && (
        <p className="-mt-2 text-xs text-muted-foreground">
          Trends and charts show sample data — live analytics arrive with the engine.
        </p>
      )}

      {/* Body */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Revenue + recent orders */}
        <div className="space-y-6 lg:col-span-2">
          {/* Revenue hero chart */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Revenue</CardTitle>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
                  {formatZAR(analytics.revenue.valueInCents)}
                </p>
                <p className="text-xs text-muted-foreground">Last 14 days</p>
              </div>
              <div className="flex items-center gap-2">
                {analytics.isSample && <Badge tone="brand">Sample</Badge>}
                <span
                  className={
                    analytics.revenue.trendPct < 0
                      ? 'inline-flex items-center gap-1 rounded-full bg-danger/10 px-2 py-0.5 text-xs font-medium text-danger'
                      : 'inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success'
                  }
                >
                  <TrendingUp size={12} />
                  {analytics.revenue.trendPct >= 0 ? '+' : ''}
                  {analytics.revenue.trendPct}%
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {/* Azure #0ea5e9 — matched to maya's merchant-dashboard hero (owner call). */}
              <RevenueChart data={analytics.revenue.series} color="#0ea5e9" />
            </CardContent>
          </Card>

          {/* Recent orders */}
          <Card>
            <CardHeader>
              <CardTitle>Recent sales</CardTitle>
              <Link
                href="/dashboard/orders"
                className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand/80"
              >
                View all <ArrowRight size={14} />
              </Link>
            </CardHeader>
            <CardContent className="pt-2">
              <RecentOrders
                orders={ordersQuery.data?.orders}
                isLoading={ordersQuery.isPending}
                isError={ordersQuery.isError}
              />
            </CardContent>
          </Card>
        </div>

        {/* Low-stock alerts + Top products */}
        <div className="space-y-6">
          <LowStockCard storeId={store.id} />
          <Card>
            <CardHeader>
              <CardTitle>Top products</CardTitle>
              <span className="text-xs text-muted-foreground">Last 14 days</span>
            </CardHeader>
            <CardContent>
              {analytics.topProducts.length > 0 ? (
                <ul className="space-y-3">
                  {analytics.topProducts.map((p, rank) => (
                    <li key={p.productId} className="flex items-center gap-3">
                      <span className="w-4 text-xs font-medium tabular-nums text-muted-foreground">
                        {rank + 1}
                      </span>
                      <div className="size-10 shrink-0 overflow-hidden rounded-md bg-muted">
                        {p.imageUrl && (
                          <CldImage
                            src={p.imageUrl}
                            {...INVENTORY_THUMB_200_RECIPE}
                            alt={p.title}
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{p.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.unitsSold} sold
                        </p>
                      </div>
                      <span className="text-sm font-semibold tabular-nums text-foreground">
                        {formatZAR(p.revenueInCents)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                  <span className="grid size-11 place-items-center rounded-xl bg-brand-subtle text-brand">
                    <Sparkles size={20} />
                  </span>
                  <p className="text-sm text-muted-foreground">
                    No sales in the last 14 days yet — your best sellers will rank here.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick actions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 pt-2 md:grid-cols-3">
          <QuickAction
            href="/dashboard/collections"
            icon={FolderTree}
            title="Curate collections"
            sub="Group products into stories"
          />
          <QuickAction
            href="/dashboard/team"
            icon={Users}
            title="Manage team"
            sub="Invite people to help run the store"
          />
          <QuickAction
            href="#section-locations"
            icon={MapPin}
            title="Locations"
            sub="Where your brand is based"
          />
        </CardContent>
      </Card>

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

function QuickAction({
  href,
  icon: Icon,
  title,
  sub,
}: {
  href: string
  icon: React.ComponentType<{ size?: number }>
  title: string
  sub: string
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:border-brand hover:bg-brand-subtle"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-subtle text-brand transition-colors group-hover:bg-brand group-hover:text-brand-foreground">
        <Icon size={17} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-foreground">{title}</span>
        <span className="block text-xs text-muted-foreground">{sub}</span>
      </span>
      <ArrowRight
        size={15}
        className="text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-brand"
      />
    </Link>
  )
}

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
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
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="size-9 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <p className="py-4 text-sm text-muted-foreground">
        Couldn&apos;t load sales right now. Refresh to try again.
      </p>
    )
  }

  if (!orders || orders.length === 0) {
    return (
      <p className="py-4 text-sm text-muted-foreground">
        No sales yet — they&apos;ll show up here the moment a buyer checks out.
      </p>
    )
  }

  return (
    <ul className="divide-y divide-border">
      {orders.map((order) => {
        const s = ORDER_STATUS[order.status]
        return (
          <li key={order.id} className="flex items-center gap-3 py-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-subtle text-xs font-semibold text-brand">
              {initials(order.buyerName)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{order.buyerName}</p>
              <p className="truncate text-xs text-muted-foreground">
                {order.orderNumber} · {order.itemCount}{' '}
                {order.itemCount === 1 ? 'item' : 'items'}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-sm font-semibold tabular-nums text-foreground">
                {formatZAR(order.totalInCents)}
              </span>
              <Badge tone={s.tone} dot>
                {s.label}
              </Badge>
            </div>
          </li>
        )
      })}
    </ul>
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
        className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-brand"
      />
    </div>
  )
}

function ErrorState() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
      <h2 className="text-lg font-semibold text-foreground">
        Couldn&apos;t load your store
      </h2>
      <p className="text-sm text-muted-foreground">
        Something went wrong on our side. Refresh the page to try again.
      </p>
    </div>
  )
}
