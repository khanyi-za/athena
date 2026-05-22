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
  const displayed = revealed ? value : isEmpty ? '' : maskValue(value)

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-zinc-700">
        {label}
      </label>

      {editing ? (
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              commit()
            } else if (e.key === 'Escape') {
              e.preventDefault()
              cancel()
            }
          }}
          disabled={disabled}
          placeholder={placeholder}
          className={[
            'w-full rounded-lg border bg-white px-3 py-2.5 font-mono text-sm text-zinc-950 outline-none transition-colors placeholder:text-zinc-400',
            error
              ? 'border-red-400 ring-1 ring-red-400 focus:border-red-500 focus:ring-red-500'
              : 'border-zinc-300 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950',
          ].join(' ')}
        />
      ) : (
        <div className="flex items-center gap-2">
          <div
            id={id}
            className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 font-mono text-sm text-zinc-700"
          >
            {isEmpty ? <span className="text-zinc-400">{placeholder}</span> : displayed}
          </div>
          {!isEmpty && (
            <button
              type="button"
              onClick={() => setRevealed((r) => !r)}
              disabled={disabled}
              className="text-xs font-medium text-zinc-700 transition-colors hover:text-zinc-950 disabled:opacity-50"
            >
              {revealed ? 'Hide' : 'Show'}
            </button>
          )}
          <button
            type="button"
            onClick={startEditing}
            disabled={disabled}
            className="text-xs font-medium text-zinc-700 transition-colors hover:text-zinc-950 disabled:opacity-50"
          >
            {isEmpty ? 'Add' : 'Edit'}
          </button>
        </div>
      )}

      {error ? (
        <p className="text-xs text-red-600">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-zinc-500">{helperText}</p>
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
