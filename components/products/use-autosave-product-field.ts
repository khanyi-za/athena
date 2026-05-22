'use client'

import { useEffect, useRef } from 'react'
import { updateProduct } from '@/lib/api/products'
import type { Product, UpdateProductBody } from '@/lib/schemas/product'
import type { AutosaveState } from '@/components/ui/autosave-indicator'

// Per-field autosave for the product editor. Watches a single field's value,
// debounces changes, and fires PATCH /stores/:storeId/products/:productId.
//
// Generic over the field's saved value type — works for string fields (title,
// description, sku) AND numeric fields (priceInCents, comparePriceInCents,
// totalStock). Comparison uses JSON.stringify so the cross-type equality is
// safe without branching on typeof.
//
// Pass `undefined` for the value to skip a save (e.g. when the user-entered
// string isn't parseable as a number yet — we don't want to PATCH garbage).

interface UseAutosaveProductFieldOptions<K extends keyof UpdateProductBody> {
  storeId: string
  productId: string
  fieldName: K
  value: UpdateProductBody[K] | undefined
  initialValue: UpdateProductBody[K] | null | undefined
  debounceMs: number
  /** Stable setter from the section's useState. */
  setState: (next: AutosaveState) => void
  /** Called with the freshly-PATCHed product on success — wizard uses this to
   *  invalidate the React Query product cache. */
  onSaved?: (product: Product) => void
  /** When true, skip all PATCH attempts (e.g. ARCHIVED product is read-only). */
  disabled?: boolean
}

export function useAutosaveProductField<K extends keyof UpdateProductBody>(
  options: UseAutosaveProductFieldOptions<K>,
) {
  const {
    storeId,
    productId,
    fieldName,
    value,
    initialValue,
    debounceMs,
    setState,
    onSaved,
    disabled,
  } = options

  // JSON.stringify-based comparison handles both strings and numbers cleanly.
  const lastSavedRef = useRef<string>(JSON.stringify(initialValue ?? null))

  useEffect(() => {
    if (disabled) return
    if (value === undefined) return // skip when not yet parseable
    const serialised = JSON.stringify(value)
    if (serialised === lastSavedRef.current) return

    setState({ state: 'saving' })

    const timer = setTimeout(async () => {
      try {
        const body = { [fieldName]: value } as UpdateProductBody
        const updated = await updateProduct(storeId, productId, body)
        lastSavedRef.current = serialised
        setState({ state: 'saved', savedAt: Date.now() })
        onSaved?.(updated)
      } catch {
        setState({ state: 'error' })
      }
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [value, fieldName, storeId, productId, debounceMs, setState, onSaved, disabled])
}
