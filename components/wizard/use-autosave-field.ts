'use client'

import { useEffect, useRef } from 'react'
import { updateStore } from '@/lib/api/store'
import type { Store, UpdateStoreBody } from '@/lib/schemas/store'
import type { AutosaveState } from '@/components/ui/autosave-indicator'

// Per-field autosave for the setup wizard. Watches a single field's value,
// debounces changes, and fires PATCH /stores/:id. Reports state changes back
// to the parent section via setState so the per-section AutosaveIndicator can
// render "Saving…" → "Saved Xs ago" / "Save failed".
//
// The hook is intentionally per-field (instead of per-section) so debounces
// can differ — short fields use shorter debounce, long textareas use 800ms.

interface UseAutosaveFieldOptions {
  storeId: string
  fieldName: keyof UpdateStoreBody
  value: string | undefined
  initialValue: string | null | undefined
  debounceMs: number
  /** Stable setter from the section's useState. */
  setState: (next: AutosaveState) => void
  /**
   * Called with the freshly-PATCHed store on success. The wizard uses this to
   * invalidate /stores/me so rejectionReason auto-clears reflect immediately.
   */
  onSaved?: (store: Store) => void
}

export function useAutosaveField({
  storeId,
  fieldName,
  value,
  initialValue,
  debounceMs,
  setState,
  onSaved,
}: UseAutosaveFieldOptions) {
  // Track the last value the backend has seen so we skip redundant PATCHes
  // (each render fires the effect — without this we'd save on every keystroke).
  const lastSavedRef = useRef<string>(normalise(initialValue))

  useEffect(() => {
    if (value === undefined) return // form not yet hydrated
    const normalised = normalise(value)
    if (normalised === lastSavedRef.current) return

    setState({ state: 'saving' })

    const timer = setTimeout(async () => {
      try {
        // Dynamic key: TS can't narrow Partial<UpdateStoreBody> from a computed
        // property name. fieldName is constrained to keyof UpdateStoreBody so
        // the cast is safe in practice.
        const body = { [fieldName]: value } as UpdateStoreBody
        const updated = await updateStore(storeId, body)
        lastSavedRef.current = normalised
        setState({ state: 'saved', savedAt: Date.now() })
        onSaved?.(updated)
      } catch {
        setState({ state: 'error' })
      }
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [value, fieldName, storeId, debounceMs, setState, onSaved])
}

function normalise(value: string | null | undefined): string {
  return (value ?? '').trim()
}
