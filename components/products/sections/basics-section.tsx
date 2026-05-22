'use client'

import { useState } from 'react'
import { Controller, useWatch, type Control } from 'react-hook-form'

import { Input } from '@/components/ui/input'
import {
  AutosaveIndicator,
  type AutosaveState,
} from '@/components/ui/autosave-indicator'
import { useAutosaveProductField } from '@/components/products/use-autosave-product-field'
import { formatPriceForInput, type ProductEditorFormValues } from '@/components/products/product-form-values'
import { parseZAR } from '@/lib/format-money'
import type { Product } from '@/lib/schemas/product'

// Basics section of the product editor. Title, description, prices, sku, stock.
// Per-field autosave with appropriate debounce. Disabled when ARCHIVED.

interface BasicsSectionProps {
  control: Control<ProductEditorFormValues>
  storeId: string
  product: Product
  onSavedRemote?: (product: Product) => void
}

export function BasicsSection({
  control,
  storeId,
  product,
  onSavedRemote,
}: BasicsSectionProps) {
  const [autosave, setAutosave] = useState<AutosaveState>({ state: 'idle' })
  const isArchived = product.status === 'ARCHIVED'

  const title = useWatch({ control, name: 'title' })
  const description = useWatch({ control, name: 'description' })
  const sku = useWatch({ control, name: 'sku' })
  const priceInput = useWatch({ control, name: 'priceInput' })
  const comparePriceInput = useWatch({ control, name: 'comparePriceInput' })
  const totalStockInput = useWatch({ control, name: 'totalStockInput' })

  // Parse numeric inputs to their saved shape. Returning undefined skips the
  // autosave (e.g. while the user is mid-typing an invalid number).
  const priceCents = priceInput !== undefined ? (parseZAR(priceInput) ?? undefined) : undefined
  const compareCents =
    comparePriceInput !== undefined && comparePriceInput !== ''
      ? (parseZAR(comparePriceInput) ?? undefined)
      : undefined
  const totalStock =
    totalStockInput !== undefined && totalStockInput !== '' ? parseStock(totalStockInput) : undefined

  // Short fields: 400ms. Long textarea (description): 800ms.
  useAutosaveProductField({
    storeId,
    productId: product.id,
    fieldName: 'title',
    value: title,
    initialValue: product.title,
    debounceMs: 400,
    setState: setAutosave,
    onSaved: onSavedRemote,
    disabled: isArchived,
  })
  useAutosaveProductField({
    storeId,
    productId: product.id,
    fieldName: 'description',
    value: description,
    initialValue: product.description,
    debounceMs: 800,
    setState: setAutosave,
    onSaved: onSavedRemote,
    disabled: isArchived,
  })
  useAutosaveProductField({
    storeId,
    productId: product.id,
    fieldName: 'sku',
    value: sku,
    initialValue: product.sku,
    debounceMs: 400,
    setState: setAutosave,
    onSaved: onSavedRemote,
    disabled: isArchived,
  })
  useAutosaveProductField({
    storeId,
    productId: product.id,
    fieldName: 'priceInCents',
    value: priceCents,
    initialValue: product.priceInCents,
    debounceMs: 400,
    setState: setAutosave,
    onSaved: onSavedRemote,
    disabled: isArchived,
  })
  useAutosaveProductField({
    storeId,
    productId: product.id,
    fieldName: 'comparePriceInCents',
    value: compareCents,
    initialValue: product.comparePriceInCents,
    debounceMs: 400,
    setState: setAutosave,
    onSaved: onSavedRemote,
    disabled: isArchived,
  })
  useAutosaveProductField({
    storeId,
    productId: product.id,
    fieldName: 'totalStock',
    value: totalStock,
    initialValue: product.totalStock,
    debounceMs: 400,
    setState: setAutosave,
    onSaved: onSavedRemote,
    disabled: isArchived,
  })

  return (
    <section id="section-basics" className="scroll-mt-6 flex flex-col gap-6">
      <header className="flex items-center justify-between gap-3 border-b border-zinc-200 pb-3">
        <h2 className="text-lg font-semibold text-zinc-950">Basics</h2>
        <AutosaveIndicator autosave={autosave} />
      </header>

      <Controller
        control={control}
        name="title"
        render={({ field, fieldState }) => (
          <Input
            id="title"
            label="Title"
            placeholder="e.g. Vintage Tee"
            {...field}
            error={fieldState.error?.message}
            disabled={isArchived}
          />
        )}
      />

      <Controller
        control={control}
        name="description"
        render={({ field, fieldState }) => (
          <DescriptionField
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            disabled={isArchived}
          />
        )}
      />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Controller
          control={control}
          name="priceInput"
          render={({ field, fieldState }) => (
            <ZARField
              id="priceInput"
              label="Price (ZAR)"
              placeholder="249.00"
              value={field.value}
              onChange={field.onChange}
              onBlurFormat
              error={fieldState.error?.message}
              disabled={isArchived}
              helperText="Activation requires a price greater than zero."
            />
          )}
        />

        <Controller
          control={control}
          name="comparePriceInput"
          render={({ field, fieldState }) => (
            <ZARField
              id="comparePriceInput"
              label="Compare price (optional)"
              placeholder="350.00"
              value={field.value}
              onChange={field.onChange}
              onBlurFormat
              error={fieldState.error?.message}
              disabled={isArchived}
              helperText="Original price shown with a strikethrough next to the sale price."
            />
          )}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Controller
          control={control}
          name="sku"
          render={({ field, fieldState }) => (
            <div className="flex flex-col gap-1.5">
              <Input
                id="sku"
                label="SKU (optional)"
                placeholder="vt-001"
                {...field}
                error={fieldState.error?.message}
                disabled={isArchived}
              />
              <p className="text-xs text-zinc-500">
                Internal identifier. We don&apos;t show this to buyers.
              </p>
            </div>
          )}
        />

        <Controller
          control={control}
          name="totalStockInput"
          render={({ field, fieldState }) => (
            <div className="flex flex-col gap-1.5">
              <Input
                id="totalStockInput"
                label="Total stock"
                type="text"
                inputMode="numeric"
                placeholder="0"
                {...field}
                error={fieldState.error?.message}
                disabled={isArchived}
              />
              <p className="text-xs text-zinc-500">
                Once you add variants, stock is managed per variant instead.
              </p>
            </div>
          )}
        />
      </div>
    </section>
  )
}

// ----------------------------------------------------------------------------
// Sub-components
// ----------------------------------------------------------------------------

function DescriptionField({
  value,
  onChange,
  onBlur,
  error,
  disabled,
}: {
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onBlur: () => void
  error?: string
  disabled?: boolean
}) {
  const maxLength = 5000
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor="description" className="text-sm font-medium text-zinc-700">
          Description
        </label>
        <span className="text-xs text-zinc-400">
          {value?.length ?? 0} / {maxLength}
        </span>
      </div>
      <textarea
        id="description"
        rows={5}
        maxLength={maxLength}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        placeholder="Materials, sizing, care instructions — anything that helps buyers decide…"
        className={[
          'w-full resize-y rounded-lg border bg-white px-3 py-2.5 text-sm text-zinc-950 outline-none transition-colors placeholder:text-zinc-400 disabled:bg-zinc-50 disabled:text-zinc-500',
          error
            ? 'border-red-400 ring-1 ring-red-400 focus:border-red-500 focus:ring-red-500'
            : 'border-zinc-300 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950',
        ].join(' ')}
      />
      {error ? (
        <p className="text-xs text-red-600">{error}</p>
      ) : (
        <p className="text-xs text-zinc-500">
          Tell buyers about this product. Materials, sizing notes, care instructions.
        </p>
      )}
    </div>
  )
}

function ZARField({
  id,
  label,
  value,
  onChange,
  onBlurFormat,
  placeholder,
  error,
  disabled,
  helperText,
}: {
  id: string
  label: string
  value: string
  onChange: (next: string) => void
  onBlurFormat: boolean
  placeholder?: string
  error?: string
  disabled?: boolean
  helperText?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-zinc-700">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <span className="text-sm text-zinc-500">R</span>
        <input
          id={id}
          type="text"
          inputMode="decimal"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => {
            if (!onBlurFormat) return
            const cents = parseZAR(value)
            if (cents !== null) onChange(formatPriceForInput(cents))
          }}
          disabled={disabled}
          className={[
            'w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-zinc-950 outline-none transition-colors placeholder:text-zinc-400 disabled:bg-zinc-50 disabled:text-zinc-500',
            error
              ? 'border-red-400 ring-1 ring-red-400 focus:border-red-500 focus:ring-red-500'
              : 'border-zinc-300 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950',
          ].join(' ')}
        />
      </div>
      {error ? (
        <p className="text-xs text-red-600">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-zinc-500">{helperText}</p>
      ) : null}
    </div>
  )
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function parseStock(input: string): number | undefined {
  const n = Number(input.trim())
  if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) return undefined
  return n
}
