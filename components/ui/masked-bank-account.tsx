'use client'

import { useEffect, useRef, useState } from 'react'

// Masked bank-account input per docs/Api-frontend-contracts/store-frontend-flows §8
// ("Bank details masking and confirm-on-edit"). Three behaviours combined:
//
// 1. Masked display by default — show last 4 (`•••• 5678`)
// 2. Click-to-reveal via a "Show" link. Re-masks on focus loss (NOT on a timer —
//    merchants often compare with their bank app and a timer feels surveillance-y)
// 3. Confirm-on-edit — explicit "Edit" click required before the field becomes
//    typable. Prevents accidental edits when the user only wanted to verify.
//
// Empty state caveat: when the field has no value yet, the confirm-on-edit
// pattern provides zero protection (nothing to overwrite) but adds real friction
// — the small "Add" button is easy to miss. So empty fields render as a plain
// input. Once the user enters a value and blurs, the masked + Edit pattern
// takes over for any subsequent change.

interface MaskedBankAccountProps {
  id: string
  label: string
  value: string
  onCommit: (next: string) => void
  helperText?: string
  placeholder?: string
  error?: string
  disabled?: boolean
}

export function MaskedBankAccount({
  id,
  label,
  value,
  onCommit,
  helperText,
  placeholder = 'Not set',
  error,
  disabled,
}: MaskedBankAccountProps) {
  const [editing, setEditing] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  // Re-mask if the window or any field outside this component takes focus.
  useEffect(() => {
    if (!revealed) return
    const handler = () => setRevealed(false)
    window.addEventListener('blur', handler)
    return () => window.removeEventListener('blur', handler)
  }, [revealed])

  function startEditing() {
    setDraft(value)
    setEditing(true)
    setRevealed(false)
  }

  function commit() {
    const next = draft.trim()
    setEditing(false)
    if (next !== value) onCommit(next)
  }

  function cancel() {
    setDraft(value)
    setEditing(false)
  }

  const isEmpty = !value
  const showInput = editing || isEmpty
  const displayed = revealed ? value : isEmpty ? '' : maskValue(value)

  const inputClassName = [
    'w-full rounded-lg border bg-card px-3 py-2.5 font-mono text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground',
    error
      ? 'border-danger/30 ring-1 ring-danger/30 focus:border-danger focus:ring-danger'
      : 'border-border focus:border-ring focus:ring-1 focus:ring-ring',
  ].join(' ')

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>

      {showInput ? (
        <input
          // Only attach the ref for the editing path — empty-state inputs
          // shouldn't autofocus on mount (would steal focus on form render).
          ref={editing ? inputRef : undefined}
          id={id}
          // type="text" with inputMode="numeric" gives a numeric keypad on
          // mobile without enabling browser-native number stepper UI (which
          // doesn't make sense for an account number).
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={editing ? draft : value}
          onChange={(e) => {
            // Bank account numbers are digits only. Strip anything else so
            // pasted spaces/dashes/letters can't sneak in either.
            const digits = e.target.value.replace(/\D/g, '')
            if (editing) {
              setDraft(digits)
            } else {
              // Empty state: typing transitions us into the edit lifecycle so
              // the existing commit-on-blur / Enter / Escape flow takes over.
              setDraft(digits)
              setEditing(true)
            }
          }}
          onBlur={editing ? commit : undefined}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              if (editing) commit()
            } else if (e.key === 'Escape') {
              e.preventDefault()
              if (editing) cancel()
            }
          }}
          disabled={disabled}
          placeholder={placeholder}
          className={inputClassName}
        />
      ) : (
        <div className="flex items-center gap-2">
          <div
            id={id}
            className="flex-1 rounded-lg border border-border bg-muted px-3 py-2.5 font-mono text-sm text-foreground"
          >
            {displayed}
          </div>
          <button
            type="button"
            onClick={() => setRevealed((r) => !r)}
            disabled={disabled}
            className="text-xs font-medium text-foreground transition-colors hover:text-brand disabled:opacity-50"
          >
            {revealed ? 'Hide' : 'Show'}
          </button>
          <button
            type="button"
            onClick={startEditing}
            disabled={disabled}
            className="text-xs font-medium text-foreground transition-colors hover:text-brand disabled:opacity-50"
          >
            Edit
          </button>
        </div>
      )}

      {error ? (
        <p className="text-xs text-danger">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      ) : null}
    </div>
  )
}

function maskValue(value: string): string {
  if (value.length <= 4) return value
  const last4 = value.slice(-4)
  const hiddenCount = Math.min(value.length - 4, 12)
  return `${'•'.repeat(hiddenCount)} ${last4}`
}
