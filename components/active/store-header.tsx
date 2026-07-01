'use client'

import { useState } from 'react'
import { CldImage } from 'next-cloudinary'

import { StatusPill } from '@/components/ui/status-pill'
import { STORE_LOGO_RECIPE } from '@/lib/cloudinary-transforms'
import type { StoreMe } from '@/lib/schemas/store'

// Active-store header per store-frontend-flows §2.8: prominent display name +
// ACTIVE pill + public URL with Copy-link button. Logo on the left as the
// brand anchor.

interface StoreHeaderProps {
  store: StoreMe
}

export function StoreHeader({ store }: StoreHeaderProps) {
  const publicUrlBase = process.env.NEXT_PUBLIC_PUBLIC_STORE_URL_BASE ?? ''
  const publicUrl = `${publicUrlBase}/${store.slug}`

  const [copied, setCopied] = useState(false)

  async function copyLink() {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return
    try {
      await navigator.clipboard.writeText(publicUrl)
      setCopied(true)
      // Reset after 2s. The button's text reverts; no toast needed.
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard write can fail in non-secure contexts. Silent — the URL is
      // still selectable from the displayed text.
    }
  }

  return (
    <header className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6 sm:flex-row sm:items-center">
      <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
        {store.logoUrl ? (
          <CldImage
            src={store.logoUrl}
            {...STORE_LOGO_RECIPE}
            alt={`${store.displayName} logo`}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-xs text-muted-foreground">No logo</span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="truncate text-2xl font-semibold text-foreground">
            {store.displayName}
          </h1>
          <StatusPill status={store.status} />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate text-sm text-muted-foreground underline-offset-2 hover:underline"
          >
            {publicUrl}
          </a>
          <button
            type="button"
            onClick={copyLink}
            className="flex-shrink-0 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-accent"
          >
            {copied ? 'Copied!' : 'Copy link'}
          </button>
        </div>
      </div>
    </header>
  )
}
