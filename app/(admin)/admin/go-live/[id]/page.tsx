'use client'

import { use, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { ReviewGoLiveDetail } from '@/components/admin/review-go-live-detail'
import { ApproveStoreModal } from '@/components/admin/approve-store-modal'
import { RejectStoreModal } from '@/components/admin/reject-store-modal'
import { reviewGoLive } from '@/lib/api/store'
import { useAdminPendingGoLiveStores } from '@/hooks/use-admin-pending-go-live-stores'
import { useInvalidateAdminQueues } from '@/hooks/use-invalidate-admin-queues'

// Go-live review detail. Mirrors the first-review detail page but reads from
// the go-live queue cache and hits reviewGoLive on approve/reject. Per spec
// §6.6's v1 limitation, there's no GET /stores/admin/:id/go-live endpoint, so
// direct-URL access (refresh / shared link) falls back to a "not in queue" UI.

type Modal = { kind: 'none' } | { kind: 'approving' } | { kind: 'rejecting' }

interface PageProps {
  params: Promise<{ id: string }>
}

export default function AdminGoLiveDetailPage({ params }: PageProps) {
  const { id: storeId } = use(params)
  const router = useRouter()
  const invalidateQueues = useInvalidateAdminQueues()

  const { data, isLoading, isError } = useAdminPendingGoLiveStores({
    page: 1,
    limit: 50,
    sortOrder: 'asc',
  })

  const store = useMemo(
    () => data?.data.find((s) => s.id === storeId) ?? null,
    [data, storeId],
  )

  const [modal, setModal] = useState<Modal>({ kind: 'none' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function closeModal() {
    if (loading) return
    setModal({ kind: 'none' })
    setError(null)
  }

  async function handleApprove(welcomeNote?: string) {
    if (!store) return
    setLoading(true)
    setError(null)
    try {
      await reviewGoLive(store.id, {
        decision: 'APPROVE',
        reason: welcomeNote,
      })
      invalidateQueues()
      router.push('/admin/go-live')
    } catch (err) {
      handleDecisionError(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleReject(reason: string) {
    if (!store) return
    setLoading(true)
    setError(null)
    try {
      await reviewGoLive(store.id, {
        decision: 'REJECT',
        reason,
      })
      invalidateQueues()
      router.push('/admin/go-live')
    } catch (err) {
      handleDecisionError(err)
    } finally {
      setLoading(false)
    }
  }

  function handleDecisionError(err: unknown) {
    const e = err as { status?: number; data?: { message?: string | string[] } }
    const status = e.status
    const message = typeof e.data?.message === 'string' ? e.data.message : ''

    if (status === 404) {
      setError('This store no longer exists.')
      return
    }

    if (
      status === 400 &&
      /already been reviewed|pending_go_live|not pending/i.test(message)
    ) {
      setError('This store has already been reviewed.')
      invalidateQueues()
      return
    }

    setError('Something went wrong. Please try again.')
  }

  if (isLoading) return <LoadingState />
  if (isError) return <NotInQueueState reason="error" />
  if (!store) return <NotInQueueState reason="not-found" />

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/go-live"
          className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-950"
        >
          ← Back to go-live queue
        </Link>
      </div>

      <header className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold text-zinc-950">
          Go-live review · {store.displayName}
        </h1>
        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
          PENDING_GO_LIVE
        </span>
      </header>

      <ReviewGoLiveDetail store={store} />

      {/* Sticky action bar */}
      <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-end gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <Button
          type="button"
          variant="ghost"
          fullWidth={false}
          onClick={() => {
            setError(null)
            setModal({ kind: 'rejecting' })
          }}
        >
          Reject go-live
        </Button>
        <Button
          type="button"
          fullWidth={false}
          onClick={() => {
            setError(null)
            setModal({ kind: 'approving' })
          }}
        >
          Approve & go live
        </Button>
      </div>

      {modal.kind === 'approving' && (
        <ApproveStoreModal
          variant="go-live"
          storeDisplayName={store.displayName}
          ownerFirstName={store.owner.firstName}
          onCancel={closeModal}
          onConfirm={handleApprove}
          loading={loading}
          error={error}
        />
      )}

      {modal.kind === 'rejecting' && (
        <RejectStoreModal
          variant="go-live"
          storeDisplayName={store.displayName}
          ownerFirstName={store.owner.firstName}
          onCancel={closeModal}
          onConfirm={handleReject}
          loading={loading}
          error={error}
        />
      )}
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

function NotInQueueState({ reason }: { reason: 'error' | 'not-found' }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
      <h2 className="text-lg font-semibold text-zinc-950">
        {reason === 'error' ? "Couldn't load the queue" : 'Not in the queue'}
      </h2>
      <p className="text-sm text-zinc-500">
        {reason === 'error'
          ? 'Refresh the page to try again.'
          : "This store may have already been reviewed by another admin, or the URL is wrong."}
      </p>
      <Link
        href="/admin/go-live"
        className="mt-2 inline-flex items-center justify-center rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
      >
        Back to go-live queue
      </Link>
    </div>
  )
}
