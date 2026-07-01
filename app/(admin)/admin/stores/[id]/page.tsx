'use client'

import { use, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { ReviewStoreDetail } from '@/components/admin/review-store-detail'
import { ApproveStoreModal } from '@/components/admin/approve-store-modal'
import { RejectStoreModal } from '@/components/admin/reject-store-modal'
import { reviewStore } from '@/lib/api/store'
import { useAdminPendingStores } from '@/hooks/use-admin-pending-stores'
import { useInvalidateAdminQueues } from '@/hooks/use-invalidate-admin-queues'

// First-review detail page. Per spec §6.2's v1 limitation: there's no
// GET /stores/admin/:id endpoint, so we read from the queue cache. Direct-URL
// access (refresh / shared link) falls back to a "not in queue" UI with a
// back-to-queue link.

type Modal = { kind: 'none' } | { kind: 'approving' } | { kind: 'rejecting' }

interface PageProps {
  params: Promise<{ id: string }>
}

export default function AdminFirstReviewDetailPage({ params }: PageProps) {
  const { id: storeId } = use(params)
  const router = useRouter()
  const invalidateQueues = useInvalidateAdminQueues()

  // Read from the queue cache. We don't pass filters because the user might
  // have come from any sort order — RQ caches each filter combination
  // separately, but the latest queue fetch should be the most relevant.
  // For v1, hit the default-sorted queue and find the store there.
  const { data, isLoading, isError } = useAdminPendingStores({
    page: 1,
    limit: 50,
    sortOrder: 'asc',
  })

  // Locate the store in the latest cached queue.
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
      await reviewStore(store.id, {
        decision: 'APPROVE',
        reason: welcomeNote,
      })
      invalidateQueues()
      // Close modal explicitly before navigation so the UI responds
      // immediately, even if the route transition takes a beat.
      setModal({ kind: 'none' })
      router.push('/admin')
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
      await reviewStore(store.id, {
        decision: 'REJECT',
        reason,
      })
      invalidateQueues()
      setModal({ kind: 'none' })
      router.push('/admin')
    } catch (err) {
      handleDecisionError(err)
    } finally {
      setLoading(false)
    }
  }

  function handleDecisionError(err: unknown) {
    const error = err as { status?: number; data?: { message?: string | string[] } }
    const status = error.status
    const message = typeof error.data?.message === 'string' ? error.data.message : ''

    if (status === 404) {
      setError('This store no longer exists.')
      // After the user dismisses, they'll be sent back to the queue.
      return
    }

    if (status === 400 && /already been reviewed|pending_review/i.test(message)) {
      // Already approved/rejected by another admin in a different tab.
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
          href="/admin"
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Back to queue
        </Link>
      </div>

      <header className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold text-foreground">
          Review · {store.displayName}
        </h1>
        <span className="inline-flex items-center rounded-full bg-warning/10 px-2.5 py-0.5 text-xs font-medium text-warning">
          PENDING_REVIEW
        </span>
      </header>

      <ReviewStoreDetail store={store} />

      {/* Sticky action bar at the bottom */}
      <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-end gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
        <Button
          type="button"
          variant="ghost"
          fullWidth={false}
          onClick={() => {
            setError(null)
            setModal({ kind: 'rejecting' })
          }}
        >
          Reject application
        </Button>
        <Button
          type="button"
          fullWidth={false}
          onClick={() => {
            setError(null)
            setModal({ kind: 'approving' })
          }}
        >
          Approve
        </Button>
      </div>

      {modal.kind === 'approving' && (
        <ApproveStoreModal
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
        className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-brand"
      />
    </div>
  )
}

function NotInQueueState({ reason }: { reason: 'error' | 'not-found' }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
      <h2 className="text-lg font-semibold text-foreground">
        {reason === 'error' ? "Couldn't load the queue" : 'Not in the queue'}
      </h2>
      <p className="text-sm text-muted-foreground">
        {reason === 'error'
          ? 'Refresh the page to try again.'
          : "This store may have already been reviewed by another admin, or the URL is wrong."}
      </p>
      <Link
        href="/admin"
        className="mt-2 inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand/90"
      >
        Back to queue
      </Link>
    </div>
  )
}
