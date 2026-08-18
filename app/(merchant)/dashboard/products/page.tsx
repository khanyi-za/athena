'use client'

import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Search } from 'lucide-react'

import { CreateProductModal } from '@/components/products/create-product-modal'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { useStoreMe } from '@/hooks/use-store-me'
import { useProducts } from '@/hooks/use-products'
import { useAuthStore } from '@/store/auth-store'
import { formatZAR } from '@/lib/format-money'
import { cn } from '@/lib/utils'
import { PRODUCT_STATUS } from '@/lib/product-status'
import type {
  ProductListItem,
  ProductListStatusFilter,
  ProductSortBy,
} from '@/lib/schemas/product'

// Inventory list for MERCHANT in APPROVED+ states — YIIVA redesign (token-driven
// Cards + unified status Badges). Paginated, filterable, sortable, per
// product-frontend-flows §2.
//
// Status gate: anyone whose role isn't MERCHANT, or whose store isn't in
// APPROVED / PENDING_GO_LIVE / ACTIVE, is redirected to /dashboard so the
// matrix sends them to the right phase screen.

const PRODUCTS_PER_PAGE = 20

const STATUS_TABS: { value: ProductListStatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'OUT_OF_STOCK', label: 'Out of stock' },
  { value: 'ARCHIVED', label: 'Archived' },
]

const SORT_OPTIONS: { value: ProductSortBy; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'nameAsc', label: 'Name A–Z' },
  { value: 'nameDesc', label: 'Name Z–A' },
  { value: 'priceAsc', label: 'Price low → high' },
  { value: 'priceDesc', label: 'Price high → low' },
  { value: 'stockAsc', label: 'Stock low → high' },
]

const inputCls =
  'h-9 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring'

export default function ProductsPage() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const isInitializing = useAuthStore((s) => s.isInitializing)
  const { data: store } = useStoreMe()

  const [statusFilter, setStatusFilter] = useState<ProductListStatusFilter>('all')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<ProductSortBy>('newest')
  const [page, setPage] = useState(1)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  // Gate access: only MERCHANTs with APPROVED+ stores belong here.
  useEffect(() => {
    if (isInitializing || !user) return
    // PENDING_REVIEW admitted (2026-08-18): catalogue management stays open
    // while the store is under review — the user is still role BUYER then
    // (merchant upgrade fires at approval), so gate on store status alone.
    const status = user.store?.status
    if (
      status !== 'PENDING_REVIEW' &&
      status !== 'APPROVED' &&
      status !== 'PENDING_GO_LIVE' &&
      status !== 'ACTIVE'
    ) {
      router.replace('/dashboard')
    }
  }, [isInitializing, user, router])

  // Filter setters reset pagination back to page 1 — avoids the "setState in
  // effect cascade" pattern by handling the dependency inline.
  function changeStatusFilter(value: ProductListStatusFilter) {
    setStatusFilter(value)
    setPage(1)
  }

  function changeSearch(e: ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value)
    setPage(1)
  }

  function changeSortBy(e: ChangeEvent<HTMLSelectElement>) {
    setSortBy(e.target.value as ProductSortBy)
    setPage(1)
  }

  function clearFilters() {
    setStatusFilter('all')
    setSearch('')
    setPage(1)
  }

  const filters = useMemo(
    () => ({
      page,
      limit: PRODUCTS_PER_PAGE,
      status: statusFilter,
      search: search.trim() || undefined,
      sortBy,
    }),
    [page, statusFilter, search, sortBy],
  )

  const { data: productsResponse, isLoading, isError } = useProducts(store?.id, filters)

  if (isInitializing || !user || user.role !== 'MERCHANT') {
    return <InlineLoader />
  }

  const products = productsResponse?.data ?? []
  const meta = productsResponse?.meta

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your catalog. You need at least 7 active products to go live.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand/90"
        >
          <Plus size={16} /> Add product
        </button>
      </header>

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map((tab) => {
            const isActive = statusFilter === tab.value
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => changeStatusFilter(tab.value)}
                className={cn(
                  'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand text-brand-foreground'
                    : 'border border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative sm:flex-1">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="search"
              placeholder="Search by title or SKU…"
              value={search}
              onChange={changeSearch}
              className={cn(inputCls, 'pl-9')}
            />
          </div>
          <select value={sortBy} onChange={changeSortBy} className={cn(inputCls, 'sm:w-56')}>
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <InlineLoader />
      ) : isError ? (
        <ListErrorState />
      ) : products.length === 0 ? (
        <EmptyState
          filtered={statusFilter !== 'all' || !!search}
          onAdd={() => setIsCreateOpen(true)}
          onClearFilters={clearFilters}
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {products.map((product) => (
            <li key={product.id}>
              <ProductRow product={product} />
            </li>
          ))}
        </ul>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border pt-4 text-sm text-muted-foreground">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={meta.page === 1}
            className="rounded-lg border border-border bg-card px-3 py-1.5 font-medium text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            ← Previous
          </button>
          <span>
            Page {meta.page} of {meta.totalPages}
            <span className="ml-2 text-muted-foreground/70">({meta.total} total)</span>
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
            disabled={meta.page === meta.totalPages}
            className="rounded-lg border border-border bg-card px-3 py-1.5 font-medium text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next →
          </button>
        </div>
      )}

      {store && isCreateOpen && (
        <CreateProductModal storeId={store.id} onClose={() => setIsCreateOpen(false)} />
      )}
    </div>
  )
}

// ----------------------------------------------------------------------------
// Product row
// ----------------------------------------------------------------------------

function ProductRow({ product }: { product: ProductListItem }) {
  const primaryImage = product.images[0]
  const hasComparePrice =
    product.comparePriceInCents !== null && product.comparePriceInCents > product.priceInCents
  const s = PRODUCT_STATUS[product.status]

  return (
    <Card className="flex flex-wrap items-center gap-4 p-4 transition-colors hover:border-brand/40">
      {/* Thumbnail */}
      <div className="flex size-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
        {primaryImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={primaryImage.url}
            alt={primaryImage.altText ?? product.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-xs text-muted-foreground">No image</span>
        )}
      </div>

      {/* Title + status */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate text-sm font-medium text-foreground">{product.title}</h3>
          <Badge tone={s.tone} dot>
            {s.label}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span>
            {product.totalStock} in stock · {product._count.variants}{' '}
            {product._count.variants === 1 ? 'variant' : 'variants'} · {product._count.categories}{' '}
            {product._count.categories === 1 ? 'category' : 'categories'}
          </span>
        </div>
      </div>

      {/* Price */}
      <div className="flex flex-col items-end text-sm">
        <span className="font-semibold tabular-nums text-foreground">
          {formatZAR(product.priceInCents)}
        </span>
        {hasComparePrice && (
          <span className="text-xs tabular-nums text-muted-foreground line-through">
            {formatZAR(product.comparePriceInCents)}
          </span>
        )}
      </div>

      {/* Action */}
      <Link
        href={`/dashboard/products/${product.id}`}
        className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
      >
        {product.status === 'ARCHIVED' ? 'View' : 'Edit'}
      </Link>
    </Card>
  )
}

// ----------------------------------------------------------------------------
// Empty / error states
// ----------------------------------------------------------------------------

function EmptyState({
  filtered,
  onAdd,
  onClearFilters,
}: {
  filtered: boolean
  onAdd: () => void
  onClearFilters: () => void
}) {
  if (filtered) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center">
        <p className="text-sm text-muted-foreground">No products match your filters.</p>
        <button
          type="button"
          onClick={onClearFilters}
          className="mt-3 text-sm font-medium text-brand underline-offset-2 hover:underline"
        >
          Clear filters
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/30 p-12 text-center">
      <h2 className="text-base font-semibold text-foreground">Add your first product</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        You need at least 7 active products to go live. Start by creating your first one — you
        can save it as a draft and come back later.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand/90"
      >
        <Plus size={16} /> Add your first product
      </button>
    </div>
  )
}

function ListErrorState() {
  return (
    <Card className="p-8 text-center">
      <p className="text-sm text-muted-foreground">
        Couldn&apos;t load your products. Refresh the page to try again.
      </p>
    </Card>
  )
}

function InlineLoader() {
  return (
    <div className="flex items-center justify-center py-12">
      <div
        aria-hidden
        className="size-6 animate-spin rounded-full border-2 border-border border-t-brand"
      />
    </div>
  )
}
