'use client'

import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'

// One-time celebration modal per store-frontend-flows §2.8. Fires the first
// time a merchant lands on the dashboard after their store transitions to
// ACTIVE. Parent owns the visibility decision (localStorage flag); this
// component is pure presentation.
//
// Tone: celebratory but brief. The merchant is excited; don't slow them down
// with anything more than a confirmation + share-link nudge.

interface GoLiveCelebrationModalProps {
  storeDisplayName: string
  publicUrl: string
  onDismiss: () => void
}

export function GoLiveCelebrationModal({
  storeDisplayName,
  publicUrl,
  onDismiss,
}: GoLiveCelebrationModalProps) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onDismiss()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onDismiss])

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  async function copyLink() {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return
    try {
      await navigator.clipboard.writeText(publicUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Silent — URL is visible in the modal body as fallback.
    }
  }

  return (
    <div
      role="dialog"
      aria-modal
      aria-labelledby="go-live-celebration-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 p-4"
      onClick={onDismiss}
    >
      <div
        className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center">
          <div
            aria-hidden
            className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-2xl"
          >
            🎉
          </div>
          <h2
            id="go-live-celebration-title"
            className="mt-4 text-xl font-semibold text-zinc-950"
          >
            Your store is live
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600">
            Buyers can now find {storeDisplayName} on YIIVA. Share your URL to
            start bringing them in.
          </p>
        </div>

        <div className="mt-5 flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
          <span className="flex-1 truncate font-mono text-sm text-zinc-700">
            {publicUrl}
          </span>
          <button
            type="button"
            onClick={copyLink}
            className="flex-shrink-0 rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
          >
            {copied ? 'Copied!' : 'Copy link'}
          </button>
        </div>

        <div className="mt-6 flex justify-end">
          <Button type="button" fullWidth={false} onClick={onDismiss}>
            Got it
          </Button>
        </div>
      </div>
    </div>
  )
}
