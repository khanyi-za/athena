'use client'

import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { ProductStatusPill } from '@/components/ui/status-pill'
import { CreateProductModal } from '@/components/products/create-product-modal'
import { useStoreMe } from '@/hooks/use-store-me'
import { useProducts } from '@/hooks/use-products'
import { useAuthStore } from '@/store/auth-store'
import { formatZAR } from '@/lib/format-money'
import type {
  ProductListItem,
  ProductListStatusFilter,
  ProductSortBy,
} from '@/lib/schemas/product'

// Inventory list for MERCHANT in APPROVED+ states. Paginated, filterable,
// sortable. Per product-frontend-flows §2.
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
    if (user.role !== 'MERCHANT') {
      router.replace('/dashboard')
      return
    }
    const status = user.store?.status
    if (status !== 'APPROVED' && status !== 'PENDING_GO_LIVE' && status !== 'ACTIVE') {
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
          <h1 className="text-2xl font-semibold text-zinc-950">Products</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Manage your catalog. You need at least 7 active products to go live.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center justify-center rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
        >
          + Add product
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
                className={[
                  'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-zinc-950 text-white'
                    : 'bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-50',
                ].join(' ')}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="search"
            placeholder="Search by title or SKU…"
            value={search}
            onChange={changeSearch}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 sm:flex-1"
          />
          <select
            value={sortBy}
            onChange={changeSortBy}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none transition-colors focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 sm:w-56"
          >
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
        <div className="flex items-center justify-between border-t border-zinc-200 pt-4 text-sm text-zinc-600">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={meta.page === 1}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            ← Previous
          </button>
          <span>
            Page {meta.page} of {meta.totalPages}
            <span className="ml-2 text-zinc-400">({meta.total} total)</span>
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
            disabled={meta.page === meta.totalPages}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next →
          </button>
        </div>
      )}

      {store && isCreateOpen && (
        <CreateProductModal
          storeId={store.id}
          onClose={() => setIsCreateOpen(false)}
        />
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

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border border-zinc-200 bg-white p-4">
      {/* Thumbnail */}
      <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
        {primaryImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={primaryImage.url}
            alt={primaryImage.altText ?? product.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-xs text-zinc-400">No image</span>
        )}
      </div>

      {/* Title + status */}
      <div className="flex flex-1 flex-col gap-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-medium text-zinc-950 truncate">{product.title}</h3>
          <ProductStatusPill status={product.status} />
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
          <span>
            {product.totalStock} in stock · {product._count.variants}{' '}
            {product._count.variants === 1 ? 'variant' : 'variants'} · {product._count.categories}{' '}
            {product._count.categories === 1 ? 'category' : 'categories'}
          </span>
        </div>
      </div>

      {/* Price */}
      <div className="flex flex-col items-end text-sm">
        <span className="font-semibold text-zinc-950">{formatZAR(product.priceInCents)}</span>
        {hasComparePrice && (
          <span className="text-xs text-zinc-400 line-through">
            {formatZAR(product.comparePriceInCents)}
          </span>
        )}
      </div>

      {/* Action */}
      <Link
        href={`/dashboard/products/${product.id}`}
        className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
      >
        {product.status === 'ARCHIVED' ? 'View' : 'Edit'}
      </Link>
    </div>
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
      <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center">
        <p className="text-sm text-zinc-600">No products match your filters.</p>
        <button
          type="button"
          onClick={onClearFilters}
          className="mt-3 text-sm font-medium text-zinc-950 underline-offset-2 hover:underline"
        >
          Clear filters
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-12 text-center">
      <h2 className="text-base font-semibold text-zinc-950">Add your first product</h2>
      <p className="mt-2 text-sm text-zinc-600">
        You need at least 7 active products to go live. Start by creating your first one — you
        can save it as a draft and come back later.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-5 inline-flex items-center justify-center rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
      >
        + Add your first product
      </button>
    </div>
  )
}

function ListErrorState() {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center">
      <p className="text-sm text-zinc-600">
        Couldn&apos;t load your products. Refresh the page to try again.
      </p>
    </div>
  )
}

function InlineLoader() {
  return (
    <div className="flex items-center justify-center py-12">
      <div
        aria-hidden
        className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-950"
      />
    </div>
  )
}
