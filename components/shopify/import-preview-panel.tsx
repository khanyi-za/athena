'use client'

import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatZAR } from '@/lib/format-money'
import { cn } from '@/lib/utils'
import type { GenderType, ShopifyImportPreview } from '@/lib/schemas/shopify'

// "Here's what we'll import" — counts, warnings, gender default, sample.

interface Props {
  preview: ShopifyImportPreview
  defaultGenderType: GenderType
  onGenderChange: (g: GenderType) => void
  onStartImport: () => void
  starting: boolean
  startError: string | null
  compact?: boolean // settings surface: skip the sample table
}

const GENDER_OPTIONS: { value: GenderType; label: string; hint: string }[] = [
  { value: 'WOMEN', label: 'Women', hint: 'Womenswear brand' },
  { value: 'MEN', label: 'Men', hint: 'Menswear brand' },
  { value: 'UNISEX', label: 'Unisex', hint: 'Mixed or everyone' },
]

export function ImportPreviewPanel({
  preview,
  defaultGenderType,
  onGenderChange,
  onStartImport,
  starting,
  startError,
  compact = false,
}: Props) {
  const { counts, genders, warnings, sample } = preview

  const warningLines = [
    warnings.productsWithoutImages > 0 &&
      `${warnings.productsWithoutImages} product${warnings.productsWithoutImages === 1 ? ' has' : 's have'} no images — these will be skipped (products on YIIVA need at least one photo).`,
    warnings.productsWithoutCategory > 0 &&
      `${warnings.productsWithoutCategory} product${warnings.productsWithoutCategory === 1 ? '' : 's'} couldn't be matched to a YIIVA category — you can categorise them after import.`,
    warnings.productsWithUntrackedStock > 0 &&
      `${warnings.productsWithUntrackedStock} product${warnings.productsWithUntrackedStock === 1 ? " doesn't" : "s don't"} track stock on Shopify — they'll be listed as available.`,
    warnings.productsOutOfStock > 0 &&
      `${warnings.productsOutOfStock} product${warnings.productsOutOfStock === 1 ? ' is' : 's are'} out of stock — they'll import but won't be sellable until restocked.`,
  ].filter((w): w is string => Boolean(w))

  const stats: { label: string; value: number }[] = [
    { label: 'Products', value: counts.products },
    { label: 'Variants', value: counts.variants },
    { label: 'Images', value: counts.images },
    { label: 'Collections', value: counts.collections },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-card p-4">
            <p className="text-2xl font-semibold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {warningLines.length > 0 && (
        <div className="flex flex-col gap-2">
          {warningLines.map((w) => (
            <Alert key={w} variant="info">
              {w}
            </Alert>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Default gender for unclassified products
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Most Shopify catalogues don&apos;t specify a gender. Products we
            couldn&apos;t classify from their tags and titles will be listed
            under this default — buyers browse YIIVA by Women / Men tabs.
            Currently classified: {genders.WOMEN} women / {genders.MEN} men /{' '}
            {genders.UNISEX} unisex or unclassified.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {GENDER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onGenderChange(opt.value)}
              className={cn(
                'flex flex-col items-start gap-0.5 rounded-lg border p-3 text-left transition-colors',
                defaultGenderType === opt.value
                  ? 'border-brand bg-brand/5'
                  : 'border-border hover:border-brand/50',
              )}
            >
              <span className="text-sm font-medium text-foreground">{opt.label}</span>
              <span className="text-xs text-muted-foreground">{opt.hint}</span>
            </button>
          ))}
        </div>
      </div>

      {!compact && sample.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-xs text-muted-foreground">
                <th className="px-3 py-2 font-medium">Product</th>
                <th className="px-3 py-2 font-medium">Price</th>
                <th className="px-3 py-2 font-medium">Gender</th>
                <th className="px-3 py-2 font-medium">Category</th>
                <th className="px-3 py-2 text-right font-medium">Images</th>
                <th className="px-3 py-2 text-right font-medium">Variants</th>
                <th className="px-3 py-2 text-right font-medium">Stock</th>
              </tr>
            </thead>
            <tbody>
              {sample.map((p) => (
                <tr key={p.title} className="border-b border-border last:border-0">
                  <td className="max-w-[220px] truncate px-3 py-2 text-foreground">{p.title}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-foreground">
                    {formatZAR(p.priceInCents)}
                  </td>
                  <td className="px-3 py-2">
                    <Badge tone="neutral">{p.genderType.toLowerCase()}</Badge>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {p.suggestedCategorySlug ?? '—'}
                  </td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{p.imageCount}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{p.variantCount}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{p.stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {startError && <Alert variant="error">{startError}</Alert>}

      <Button onClick={onStartImport} loading={starting} fullWidth={false} className="self-start">
        {starting ? 'Starting import…' : `Import ${counts.products} product${counts.products === 1 ? '' : 's'}`}
      </Button>
    </div>
  )
}
