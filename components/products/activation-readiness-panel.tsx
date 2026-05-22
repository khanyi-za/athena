'use client'

import { parseZAR } from '@/lib/format-money'
import type { Product } from '@/lib/schemas/product'
import type { ProductEditorFormValues } from '@/components/products/product-form-values'

// The 5-requirement activation contract from product-frontend-flows §5.1.
// Computed from a mix of:
// - current FORM values (immediate feedback as the merchant edits title/price)
// - product cache (sub-resources we don't form-edit: images, categories, variants)
//
// The button is rendered here but disabled in C — the actual onClick lands in
// Checkpoint E.

interface ActivationReadinessPanelProps {
  product: Product
  formValues: Partial<ProductEditorFormValues>
  onActivate?: () => void
  isActivating?: boolean
}

interface ReadinessState {
  title: boolean
  price: boolean
  image: boolean
  category: boolean
  variantPrices: boolean
}

const REQUIREMENT_LABELS: Record<keyof ReadinessState, string> = {
  title: 'Has a title',
  price: 'Has a price greater than zero',
  image: 'At least one image',
  category: 'At least one category',
  variantPrices: 'All variant prices > zero (or inherit)',
}

export function ActivationReadinessPanel({
  product,
  formValues,
  onActivate,
  isActivating,
}: ActivationReadinessPanelProps) {
  const state = computeReadiness(product, formValues)
  const completed = Object.values(state).filter(Boolean).length
  const total = Object.keys(state).length
  const allReady = completed === total

  // If the product is already ACTIVE, render a different state — they don't
  // need to activate again. Activation is the moving-to-ACTIVE action only.
  if (product.status === 'ACTIVE') {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm">
        <p className="font-semibold text-emerald-900">Active — visible to buyers</p>
        {product.publishedAt && (
          <p className="mt-1 text-xs text-emerald-700">
            Published {new Date(product.publishedAt).toLocaleDateString()}
          </p>
        )}
      </div>
    )
  }

  if (product.status === 'ARCHIVED') {
    return (
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
        <p className="font-semibold text-zinc-700">Archived</p>
        <p className="mt-1 text-xs">
          To bring this back, create a new product. Archived items can&apos;t be reactivated.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <header className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-950">Activation readiness</h3>
        <span
          className={`text-xs font-medium ${allReady ? 'text-emerald-700' : 'text-zinc-500'}`}
        >
          {completed} / {total}
        </span>
      </header>

      <ul className="mt-3 flex flex-col gap-1.5">
        {(Object.keys(state) as (keyof ReadinessState)[]).map((key) => (
          <ReadinessItem key={key} checked={state[key]} label={REQUIREMENT_LABELS[key]} />
        ))}
      </ul>

      <button
        type="button"
        disabled={!allReady || !!isActivating || !onActivate}
        onClick={onActivate}
        title={
          !onActivate
            ? 'Coming next'
            : allReady
              ? 'Ready to activate'
              : 'Fix the missing items above'
        }
        className="mt-4 w-full rounded-lg bg-zinc-950 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isActivating ? 'Activating…' : 'Activate this product'}
      </button>
    </div>
  )
}

function ReadinessItem({ checked, label }: { checked: boolean; label: string }) {
  return (
    <li className="flex items-start gap-2 text-xs">
      <span
        aria-hidden
        className={[
          'mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded',
          checked ? 'bg-emerald-500 text-white' : 'border border-zinc-300 bg-white',
        ].join(' ')}
      >
        {checked && (
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        )}
      </span>
      <span className={checked ? 'text-zinc-500' : 'text-zinc-700'}>{label}</span>
    </li>
  )
}

// ----------------------------------------------------------------------------
// Derivation
// ----------------------------------------------------------------------------

function computeReadiness(
  product: Product,
  formValues: Partial<ProductEditorFormValues>,
): ReadinessState {
  // Title and price come from the form (immediate feedback as the merchant edits).
  // Sub-resources (image, category, variants) come from the cached product.
  const title = formValues.title ?? product.title
  const priceCents = formValues.priceInput
    ? parseZAR(formValues.priceInput)
    : product.priceInCents

  return {
    title: title.trim().length >= 2,
    price: typeof priceCents === 'number' && priceCents > 0,
    image: product.images.some((i) => i.mediaType === 'IMAGE'),
    category: product.categories.length >= 1,
    variantPrices: product.variants.every(
      (v) => v.priceInCents === null || v.priceInCents > 0,
    ),
  }
}
