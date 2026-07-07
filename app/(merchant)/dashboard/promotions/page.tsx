'use client'

import { useMemo, useState } from 'react'
import { Search, Tag, X } from 'lucide-react'

import { useStoreMe } from '@/hooks/use-store-me'
import { useProducts } from '@/hooks/use-products'
import {
  useCreateSaleCampaign,
  useEndSaleCampaign,
  useSaleCampaign,
  useSaleCampaigns,
} from '@/hooks/use-sales'
import { formatZAR } from '@/lib/format-money'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { SaleCampaignSummary, SaleDiscountType } from '@/lib/schemas/sales'

// Promotions — catalogue sale campaigns. Creating a campaign discounts the
// selected products' live prices immediately (original parked on
// comparePriceInCents → strikethrough on the buyer app); ending restores
// originals. One active sale per product; discounts can't price below R1.
// Checkout promo codes are a separate future feature.

const btnBrand =
  'inline-flex h-9 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand/90 disabled:opacity-50'
const btnOutline =
  'inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50'
const inputBase =
  'h-9 rounded-lg border border-border bg-card px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring'

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' })
}

function discountLabel(c: Pick<SaleCampaignSummary, 'discountType' | 'discountValue'>): string {
  return c.discountType === 'PERCENTAGE'
    ? `${c.discountValue}% off`
    : `${formatZAR(c.discountValue)} off`
}

export default function PromotionsPage() {
  const { data: store } = useStoreMe()
  const [creating, setCreating] = useState(false)
  const [viewingId, setViewingId] = useState<string | null>(null)

  const campaignsQuery = useSaleCampaigns(store?.id)
  const endCampaign = useEndSaleCampaign(store?.id)

  const campaigns = campaignsQuery.data ?? []
  const active = campaigns.filter((c) => c.status === 'ACTIVE')
  const ended = campaigns.filter((c) => c.status === 'ENDED')

  return (
    <div className="max-w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Promotions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Run a sale — discounted prices go live on the buyer app instantly, with the
            original shown struck through.
          </p>
        </div>
        {!creating && (
          <button onClick={() => setCreating(true)} className={btnBrand}>
            <Tag size={16} /> Run a sale
          </button>
        )}
      </div>

      {creating && store && (
        <CreateSaleForm storeId={store.id} onDone={() => setCreating(false)} />
      )}

      {/* Campaigns */}
      {campaignsQuery.isPending ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : campaignsQuery.isError ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Couldn&apos;t load promotions.{' '}
            <button onClick={() => campaignsQuery.refetch()} className="font-medium text-brand hover:underline">
              Retry
            </button>
          </CardContent>
        </Card>
      ) : campaigns.length === 0 && !creating ? (
        <Card>
          <CardContent className="py-12 text-center">
            <span className="mx-auto mb-3 grid size-11 place-items-center rounded-xl bg-brand-subtle text-brand">
              <Tag size={20} />
            </span>
            <p className="font-medium text-foreground">No promotions yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Sales are the fastest way to move stock — run your first one.
            </p>
            <button onClick={() => setCreating(true)} className={cn(btnBrand, 'mt-4')}>
              Run a sale
            </button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {active.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Live now
              </h2>
              {active.map((c) => (
                <CampaignRow
                  key={c.id}
                  campaign={c}
                  onView={() => setViewingId(viewingId === c.id ? null : c.id)}
                  viewing={viewingId === c.id}
                  onEnd={() => endCampaign.mutate({ campaignId: c.id })}
                  ending={endCampaign.isPending && endCampaign.variables?.campaignId === c.id}
                  storeId={store?.id}
                />
              ))}
            </section>
          )}
          {ended.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Past sales
              </h2>
              {ended.map((c) => (
                <CampaignRow
                  key={c.id}
                  campaign={c}
                  onView={() => setViewingId(viewingId === c.id ? null : c.id)}
                  viewing={viewingId === c.id}
                  storeId={store?.id}
                />
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  )
}

// ----------------------------------------------------------------------------
// Campaign row + expandable detail
// ----------------------------------------------------------------------------

function CampaignRow({
  campaign,
  viewing,
  onView,
  onEnd,
  ending,
  storeId,
}: {
  campaign: SaleCampaignSummary
  viewing: boolean
  onView: () => void
  onEnd?: () => void
  ending?: boolean
  storeId?: string
}) {
  const isActive = campaign.status === 'ACTIVE'
  return (
    <Card>
      <CardContent className="space-y-4 py-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-semibold text-foreground">{campaign.name}</p>
              <Badge tone={isActive ? 'success' : 'neutral'} dot>
                {isActive ? 'Live' : 'Ended'}
              </Badge>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {discountLabel(campaign)} · {campaign.productCount} product
              {campaign.productCount === 1 ? '' : 's'} · started {formatDate(campaign.startsAt)}
              {campaign.endsAt && isActive && ` · ends ${formatDate(campaign.endsAt)}`}
              {campaign.endedAt && !isActive && ` · ended ${formatDate(campaign.endedAt)}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onView} className={btnOutline}>
              {viewing ? 'Hide products' : 'View products'}
            </button>
            {isActive && onEnd && (
              <button
                onClick={onEnd}
                disabled={ending}
                className="inline-flex h-9 items-center rounded-lg border border-danger/30 px-4 text-sm font-medium text-danger transition-colors hover:bg-danger/10 disabled:opacity-50"
              >
                {ending ? 'Ending…' : 'End sale'}
              </button>
            )}
          </div>
        </div>
        {viewing && storeId && <CampaignProducts storeId={storeId} campaignId={campaign.id} />}
      </CardContent>
    </Card>
  )
}

function CampaignProducts({ storeId, campaignId }: { storeId: string; campaignId: string }) {
  const detailQuery = useSaleCampaign(storeId, campaignId)

  if (detailQuery.isPending) return <Skeleton className="h-16 w-full" />
  if (detailQuery.isError || !detailQuery.data)
    return <p className="text-sm text-muted-foreground">Couldn&apos;t load products.</p>

  return (
    <div className="divide-y divide-border rounded-lg border border-border">
      {detailQuery.data.products.map((p) => (
        <div key={p.productId} className="flex items-center justify-between gap-3 px-4 py-2.5">
          <p className="min-w-0 flex-1 truncate text-sm text-foreground">{p.title}</p>
          <p className="text-sm tabular-nums">
            <span className="text-muted-foreground line-through">
              {formatZAR(p.originalPriceInCents)}
            </span>{' '}
            <span className="font-semibold text-foreground">{formatZAR(p.salePriceInCents)}</span>
          </p>
        </div>
      ))}
    </div>
  )
}

// ----------------------------------------------------------------------------
// Create form (with product picker)
// ----------------------------------------------------------------------------

function CreateSaleForm({ storeId, onDone }: { storeId: string; onDone: () => void }) {
  const create = useCreateSaleCampaign(storeId)
  const [name, setName] = useState('')
  const [discountType, setDiscountType] = useState<SaleDiscountType>('PERCENTAGE')
  const [discountValue, setDiscountValue] = useState('20')
  const [endsAt, setEndsAt] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')

  // ACTIVE products only — nuwa rejects anything else.
  const productsQuery = useProducts(storeId, { status: 'ACTIVE', limit: 100 })
  const products = useMemo(() => {
    const all = productsQuery.data?.data ?? []
    const q = search.trim().toLowerCase()
    return q ? all.filter((p) => p.title.toLowerCase().includes(q)) : all
  }, [productsQuery.data, search])

  const valueNum = parseInt(discountValue, 10)
  const valueValid =
    Number.isFinite(valueNum) &&
    valueNum >= 1 &&
    (discountType === 'PERCENTAGE' ? valueNum <= 90 : true)
  const canSubmit =
    name.trim().length >= 2 && valueValid && selected.size > 0 && !create.isPending

  function toggle(productId: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(productId)) next.delete(productId)
      else next.add(productId)
      return next
    })
  }

  function submit() {
    create.mutate(
      {
        name: name.trim(),
        discountType,
        // FIXED_AMOUNT is entered in rands, sent in cents.
        discountValue: discountType === 'FIXED_AMOUNT' ? valueNum * 100 : valueNum,
        ...(endsAt ? { endsAt: new Date(`${endsAt}T23:59:59`).toISOString() } : {}),
        productIds: [...selected],
      },
      { onSuccess: onDone },
    )
  }

  return (
    <Card className="border-brand/40">
      <CardContent className="space-y-4 py-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">New sale</p>
          <button
            onClick={onDone}
            className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X size={16} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="space-y-1 lg:col-span-2">
            <span className="text-xs font-medium text-muted-foreground">Sale name *</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Winter Sale"
              maxLength={80}
              className={cn(inputBase, 'w-full')}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Discount</span>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                max={discountType === 'PERCENTAGE' ? 90 : undefined}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                className={cn(inputBase, 'w-20')}
              />
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as SaleDiscountType)}
                className={cn(inputBase, 'flex-1')}
              >
                <option value="PERCENTAGE">% off</option>
                <option value="FIXED_AMOUNT">R off</option>
              </select>
            </div>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Ends (optional)</span>
            <input
              type="date"
              value={endsAt}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setEndsAt(e.target.value)}
              className={cn(inputBase, 'w-full')}
            />
          </label>
        </div>

        {/* Product picker */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Products on sale * ({selected.size} selected)
            </span>
            <div className="relative">
              <Search
                size={14}
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter products…"
                className={cn(inputBase, 'h-8 w-56 pl-8')}
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto rounded-lg border border-border">
            {productsQuery.isPending ? (
              <div className="space-y-2 p-3">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-9 w-full" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">
                No active products{search ? ' match your filter' : ' to put on sale'}.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {products.map((p) => {
                  const checked = selected.has(p.id)
                  const preview =
                    valueValid && checked
                      ? discountType === 'PERCENTAGE'
                        ? Math.round(p.priceInCents * (1 - valueNum / 100))
                        : p.priceInCents - valueNum * 100
                      : null
                  return (
                    <li key={p.id}>
                      <label className="flex cursor-pointer items-center gap-3 px-3 py-2 transition-colors hover:bg-accent">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggle(p.id)}
                          className="size-4 accent-[var(--brand)]"
                        />
                        {p.images[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.images[0].url}
                            alt=""
                            className="h-10 w-8 rounded bg-muted object-cover"
                          />
                        ) : (
                          <div className="h-10 w-8 rounded bg-muted" />
                        )}
                        <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                          {p.title}
                        </span>
                        <span className="text-sm tabular-nums text-muted-foreground">
                          {preview !== null ? (
                            <>
                              <span className="line-through">{formatZAR(p.priceInCents)}</span>{' '}
                              <span className={cn('font-medium', preview < 100 ? 'text-danger' : 'text-foreground')}>
                                {formatZAR(Math.max(0, preview))}
                              </span>
                            </>
                          ) : (
                            formatZAR(p.priceInCents)
                          )}
                        </span>
                      </label>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>

        {create.isError && (
          <p className="text-sm text-danger">{(create.error as Error).message}</p>
        )}

        <div className="flex gap-3">
          <button onClick={submit} disabled={!canSubmit} className={btnBrand}>
            {create.isPending ? 'Starting sale…' : 'Start sale now'}
          </button>
          <button
            onClick={onDone}
            className="px-4 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Cancel
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Prices change immediately and revert automatically when the sale ends. A product
          can only be in one live sale at a time.
        </p>
      </CardContent>
    </Card>
  )
}
