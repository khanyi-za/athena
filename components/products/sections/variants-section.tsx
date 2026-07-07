'use client'

import { useState } from 'react'

import { Alert } from '@/components/ui/alert'
import { useInvalidateProduct } from '@/hooks/use-product'
import {
  createProductVariant,
  deleteProductVariant,
  updateProductVariant,
} from '@/lib/api/products'
import { formatZAR } from '@/lib/format-money'
import { cn } from '@/lib/utils'
import type { Product, ProductVariant, UpdateVariantBody } from '@/lib/schemas/product'

// Variants section of the product editor (shipped 2026-07; previously the
// M6-deferred gap). Independent-SKU stock model: once a product has variants,
// carts/checkout sell from variant stock and the product's bare totalStock is
// ignored — the section says so, loudly, because it changes what the Basics
// stock field means.
//
// Price override semantics: variant priceInCents null → inherits base price.
// Leaving the price field empty on create/edit means "inherit"; editing a
// variant that HAD an override to an empty field clears it (PATCH null).

interface VariantsSectionProps {
  storeId: string
  product: Product
}

interface VariantFormState {
  name: string
  sku: string
  priceRands: string // '' = inherit base price
  stock: string
  size: string
  color: string
  material: string
}

function emptyForm(): VariantFormState {
  return { name: '', sku: '', priceRands: '', stock: '0', size: '', color: '', material: '' }
}

function variantToForm(v: ProductVariant): VariantFormState {
  return {
    name: v.name,
    sku: v.sku ?? '',
    priceRands: v.priceInCents === null ? '' : (v.priceInCents / 100).toFixed(2),
    stock: String(v.stock),
    size: v.size ?? '',
    color: v.color ?? '',
    material: v.material ?? '',
  }
}

function parsePriceCents(priceRands: string): number | null {
  const trimmed = priceRands.trim()
  if (!trimmed) return null
  const cents = Math.round(parseFloat(trimmed) * 100)
  return Number.isFinite(cents) && cents >= 0 ? cents : NaN as unknown as number
}

export function VariantsSection({ storeId, product }: VariantsSectionProps) {
  const invalidateProduct = useInvalidateProduct()

  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isArchived = product.status === 'ARCHIVED'
  const variants = [...product.variants].sort((a, b) => a.sortOrder - b.sortOrder)

  function refresh() {
    invalidateProduct(storeId, product.id)
  }

  async function handleCreate(form: VariantFormState) {
    setBusy(true)
    setError(null)
    try {
      const priceInCents = parsePriceCents(form.priceRands)
      await createProductVariant(storeId, product.id, {
        name: form.name.trim(),
        stock: parseInt(form.stock, 10) || 0,
        ...(form.sku.trim() ? { sku: form.sku.trim() } : {}),
        ...(priceInCents !== null ? { priceInCents } : {}),
        ...(form.size.trim() ? { size: form.size.trim() } : {}),
        ...(form.color.trim() ? { color: form.color.trim() } : {}),
        ...(form.material.trim() ? { material: form.material.trim() } : {}),
      })
      setAdding(false)
      refresh()
    } catch (err) {
      setError((err as Error).message || 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function handleUpdate(variant: ProductVariant, form: VariantFormState) {
    setBusy(true)
    setError(null)
    try {
      const priceInCents = parsePriceCents(form.priceRands)
      const body: UpdateVariantBody = {
        name: form.name.trim(),
        stock: parseInt(form.stock, 10) || 0,
        sku: form.sku.trim() || undefined,
        size: form.size.trim() || undefined,
        color: form.color.trim() || undefined,
        material: form.material.trim() || undefined,
      }
      // Only send priceInCents when it changed: a number sets the override,
      // null clears an existing one (PATCH treats absent as "leave alone").
      if (priceInCents !== variant.priceInCents) {
        body.priceInCents = priceInCents
      }
      await updateProductVariant(storeId, product.id, variant.id, body)
      setEditingId(null)
      refresh()
    } catch (err) {
      setError((err as Error).message || 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(variantId: string) {
    setBusy(true)
    setError(null)
    try {
      await deleteProductVariant(storeId, product.id, variantId)
      setDeletingId(null)
      refresh()
    } catch (err) {
      setError((err as Error).message || 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section id="section-variants" className="flex flex-col gap-6 scroll-mt-6">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <h2 className="text-lg font-semibold text-foreground">
          Variants{' '}
          <span className="text-sm font-normal text-muted-foreground">({variants.length})</span>
        </h2>
        {!isArchived && !adding && (
          <button
            type="button"
            onClick={() => {
              setAdding(true)
              setEditingId(null)
              setError(null)
            }}
            className="text-sm font-medium text-foreground underline-offset-2 hover:underline"
          >
            + Add variant
          </button>
        )}
      </header>

      {error && <Alert variant="error">{error}</Alert>}

      {adding && (
        <VariantForm
          title="New variant"
          initial={emptyForm()}
          basePriceInCents={product.priceInCents}
          busy={busy}
          submitLabel="Add variant"
          onSubmit={handleCreate}
          onCancel={() => setAdding(false)}
        />
      )}

      {variants.length === 0 && !adding ? (
        <div className="rounded-lg border border-dashed border-border bg-muted p-6 text-center">
          <p className="text-sm text-muted-foreground">
            No variants — this product sells as a single item using its base stock.
          </p>
          {!isArchived && (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="mt-3 text-sm font-medium text-foreground underline-offset-2 hover:underline"
            >
              + Add variant
            </button>
          )}
        </div>
      ) : variants.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {variants.map((variant) => (
            <li key={variant.id}>
              {editingId === variant.id ? (
                <VariantForm
                  title={`Edit ${variant.name}`}
                  initial={variantToForm(variant)}
                  basePriceInCents={product.priceInCents}
                  busy={busy}
                  submitLabel="Save variant"
                  onSubmit={(form) => handleUpdate(variant, form)}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <VariantRow
                  variant={variant}
                  basePriceInCents={product.priceInCents}
                  disabled={isArchived}
                  confirmingDelete={deletingId === variant.id}
                  busy={busy}
                  onEdit={() => {
                    setEditingId(variant.id)
                    setAdding(false)
                    setDeletingId(null)
                    setError(null)
                  }}
                  onDeleteStart={() => setDeletingId(variant.id)}
                  onDeleteCancel={() => setDeletingId(null)}
                  onDeleteConfirm={() => void handleDelete(variant.id)}
                />
              )}
            </li>
          ))}
        </ul>
      ) : null}

      <p className="text-xs text-muted-foreground">
        Once a product has variants, buyers must pick one and stock is tracked per
        variant — the base stock in Basics is ignored. Leave the price blank to sell a
        variant at the product&apos;s base price.
      </p>
    </section>
  )
}

// ----------------------------------------------------------------------------
// Row
// ----------------------------------------------------------------------------

function VariantRow({
  variant,
  basePriceInCents,
  disabled,
  confirmingDelete,
  busy,
  onEdit,
  onDeleteStart,
  onDeleteCancel,
  onDeleteConfirm,
}: {
  variant: ProductVariant
  basePriceInCents: number
  disabled: boolean
  confirmingDelete: boolean
  busy: boolean
  onEdit: () => void
  onDeleteStart: () => void
  onDeleteCancel: () => void
  onDeleteConfirm: () => void
}) {
  const available = Math.max(0, variant.stock - variant.reservedStock)
  const options = [variant.size, variant.color, variant.material].filter(Boolean).join(' · ')

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-border bg-card px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {variant.name}
          {options && <span className="ml-2 font-normal text-muted-foreground">{options}</span>}
        </p>
        <p className="text-xs text-muted-foreground">
          {variant.sku ? `SKU ${variant.sku} · ` : ''}
          {variant.priceInCents === null
            ? `${formatZAR(basePriceInCents)} (base price)`
            : formatZAR(variant.priceInCents)}
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm tabular-nums text-foreground">{variant.stock} in stock</p>
        <p className="text-xs tabular-nums text-muted-foreground">
          {variant.reservedStock > 0
            ? `${available} available (${variant.reservedStock} reserved)`
            : `${available} available`}
        </p>
      </div>
      {!disabled && (
        <div className="flex items-center gap-2">
          {confirmingDelete ? (
            <>
              <button
                type="button"
                onClick={onDeleteConfirm}
                disabled={busy}
                className="rounded-lg bg-danger px-3 py-1.5 text-sm font-medium text-danger-foreground transition-colors hover:bg-danger/90 disabled:opacity-50"
              >
                {busy ? 'Deleting…' : 'Confirm'}
              </button>
              <button
                type="button"
                onClick={onDeleteCancel}
                disabled={busy}
                className="px-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Keep
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onEdit}
                className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={onDeleteStart}
                className="px-2 text-sm text-muted-foreground transition-colors hover:text-danger"
              >
                Delete
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ----------------------------------------------------------------------------
// Add/Edit form
// ----------------------------------------------------------------------------

function VariantForm({
  title,
  initial,
  basePriceInCents,
  busy,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  title: string
  initial: VariantFormState
  basePriceInCents: number
  busy: boolean
  submitLabel: string
  onSubmit: (form: VariantFormState) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState<VariantFormState>(initial)

  const set =
    (key: keyof VariantFormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }))

  const nameValid = form.name.trim().length >= 2 && form.name.trim().length <= 80
  const stockValid = /^\d+$/.test(form.stock.trim())
  const priceValid =
    form.priceRands.trim() === '' ||
    (Number.isFinite(parseFloat(form.priceRands)) && parseFloat(form.priceRands) >= 0)
  const canSubmit = nameValid && stockValid && priceValid && !busy

  const input =
    'h-9 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring'

  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Name *</span>
          <input
            type="text"
            value={form.name}
            onChange={set('name')}
            placeholder="e.g. Medium / Black"
            maxLength={80}
            className={input}
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Stock *</span>
          <input type="number" min="0" step="1" value={form.stock} onChange={set('stock')} className={input} />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground">
            Price (R) — blank inherits {formatZAR(basePriceInCents)}
          </span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.priceRands}
            onChange={set('priceRands')}
            placeholder="Base price"
            className={input}
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground">SKU</span>
          <input type="text" value={form.sku} onChange={set('sku')} maxLength={80} className={input} />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Size</span>
          <input type="text" value={form.size} onChange={set('size')} placeholder="e.g. M" className={input} />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Colour</span>
          <input type="text" value={form.color} onChange={set('color')} placeholder="e.g. Black" className={input} />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Material</span>
          <input
            type="text"
            value={form.material}
            onChange={set('material')}
            placeholder="e.g. Cotton"
            className={input}
          />
        </label>
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => onSubmit(form)}
          disabled={!canSubmit}
          className={cn(
            'inline-flex h-9 items-center rounded-lg bg-brand px-4 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand/90 disabled:opacity-50',
          )}
        >
          {busy ? 'Saving…' : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="px-4 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
