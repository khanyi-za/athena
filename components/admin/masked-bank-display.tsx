'use client'

import { useEffect, useState } from 'react'

// Read-only masked bank account display for the admin detail screen. Show
// last-4 by default; "Show" link reveals the full value, re-masks on focus
// loss. No edit affordance — admins can't modify merchant data.
//
// Per admin-journey.md §"Bank account number masked by default", even admins
// shouldn't see account numbers in casual view. Reveal is an explicit action.

interface MaskedBankDisplayProps {
  value: string | null
}

export function MaskedBankDisplay({ value }: MaskedBankDisplayProps) {
  const [revealed, setRevealed] = useState(false)

  // Re-mask if the window or any other field takes focus.
  useEffect(() => {
    if (!revealed) return
    const handler = () => setRevealed(false)
    window.addEventListener('blur', handler)
    return () => window.removeEventListener('blur', handler)
  }, [revealed])

  if (!value) {
    return <span className="text-sm text-zinc-400">Not provided</span>
  }

  return (
    <div className="inline-flex items-center gap-3">
      <span className="font-mono text-sm text-zinc-950">
        {revealed ? value : maskValue(value)}
      </span>
      <button
        type="button"
        onClick={() => setRevealed((r) => !r)}
        onBlur={() => setRevealed(false)}
        className="text-xs font-medium text-zinc-700 transition-colors hover:text-zinc-950"
      >
        {revealed ? 'Hide' : 'Show'}
      </button>
    </div>
  )
}

function maskValue(value: string): string {
  if (value.length <= 4) return value
  const last4 = value.slice(-4)
  const hiddenCount = Math.min(value.length - 4, 12)
  return `${'•'.repeat(hiddenCount)} ${last4}`
}
