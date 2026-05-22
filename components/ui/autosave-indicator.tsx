'use client'

import { useEffect, useState } from 'react'

export type AutosaveState =
  | { state: 'idle' }
  | { state: 'saving' }
  | { state: 'saved'; savedAt: number }
  | { state: 'error'; onRetry?: () => void }

interface AutosaveIndicatorProps {
  autosave: AutosaveState
}

// Three-state autosave indicator per docs/Api-frontend-contracts/store-frontend-flows §2.2
// ("Save behaviour — autosave per section"). Renders nothing when idle.

export function AutosaveIndicator({ autosave }: AutosaveIndicatorProps) {
  // Re-render every 10s so "Saved Xs ago" stays fresh while the saved state lingers.
  const [, setTick] = useState(0)
  useEffect(() => {
    if (autosave.state !== 'saved') return
    const interval = setInterval(() => setTick((n) => n + 1), 10_000)
    return () => clearInterval(interval)
  }, [autosave.state])

  if (autosave.state === 'idle') return null

  if (autosave.state === 'saving') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500">
        <span
          aria-hidden
          className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-400"
        />
        Saving…
      </span>
    )
  }

  if (autosave.state === 'saved') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700">
        <CheckIcon />
        {formatRelativeTime(autosave.savedAt)}
      </span>
    )
  }

  // error
  return (
    <span className="inline-flex items-center gap-2 text-xs text-red-600">
      Save failed
      {autosave.onRetry && (
        <button
          type="button"
          onClick={autosave.onRetry}
          className="font-medium underline hover:text-red-700"
        >
          Retry
        </button>
      )}
    </span>
  )
}

function CheckIcon() {
  return (
    <svg
      width="12"
      height="12"
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
  )
}

function formatRelativeTime(timestamp: number): string {
  const elapsed = Math.max(0, Date.now() - timestamp)
  const seconds = Math.floor(elapsed / 1000)
  if (seconds < 5) return 'Saved'
  if (seconds < 60) return `Saved ${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `Saved ${minutes}m ago`
  return 'Saved'
}
