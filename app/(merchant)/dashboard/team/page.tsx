'use client'

import Link from 'next/link'

import { useStoreMe } from '@/hooks/use-store-me'
import { useAuthStore } from '@/store/auth-store'
import { TeamSection } from '@/components/active/team-section'

// Team management page per store-frontend-flows §4. Owner-only actions are
// gated by comparing currentUser.id with store.ownerId. The team-section
// component itself enforces the visual gating; this page determines the
// boolean and provides the page chrome.

export default function TeamPage() {
  const { data: store, isLoading, isError } = useStoreMe()
  const user = useAuthStore((s) => s.user)

  if (isLoading) return <LoadingState />
  if (isError) return <ErrorState reason="error" />
  if (!store) return <ErrorState reason="no-store" />

  const isOwnerView = !!user && user.id === store.ownerId

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/dashboard"
          className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-950"
        >
          ← Back to dashboard
        </Link>
      </div>

      <TeamSection storeId={store.id} isOwnerView={isOwnerView} />
    </div>
  )
}

// ----------------------------------------------------------------------------
// States
// ----------------------------------------------------------------------------

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-16">
      <div
        aria-hidden
        className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-950"
      />
    </div>
  )
}

function ErrorState({ reason }: { reason: 'error' | 'no-store' }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
      <h2 className="text-lg font-semibold text-zinc-950">
        {reason === 'no-store' ? 'No store yet' : "Couldn't load your team"}
      </h2>
      <p className="text-sm text-zinc-500">
        {reason === 'no-store'
          ? 'Set up your store first, then invite teammates.'
          : 'Refresh the page to try again.'}
      </p>
      <Link
        href="/dashboard"
        className="mt-2 inline-flex items-center justify-center rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
      >
        Back to dashboard
      </Link>
    </div>
  )
}
