'use client'

import { useState } from 'react'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { EmployeeRow } from '@/components/active/employee-row'
import { InviteEmployeeModal } from '@/components/active/invite-employee-modal'
import { RemoveEmployeeModal } from '@/components/active/remove-employee-modal'
import {
  deactivateEmployee,
  inviteEmployee,
  reactivateEmployee,
  removeEmployee,
  resendInvite,
} from '@/lib/api/employees'
import {
  useStoreEmployees,
  useInvalidateStoreEmployees,
} from '@/hooks/use-store-employees'
import type { Employee } from '@/lib/schemas/employee'

// Team management section per store-frontend-flows §4. Owner sees full
// management UX; active accepted employees see the list but no action buttons
// (the row component hides the cluster when isOwnerView=false).
//
// Modal state is a discriminated union — mirrors the M6/M7 modal patterns.

type Modal =
  | { kind: 'none' }
  | { kind: 'inviting' }
  | { kind: 'removing'; employee: Employee }

interface TeamSectionProps {
  storeId: string
  isOwnerView: boolean
}

export function TeamSection({ storeId, isOwnerView }: TeamSectionProps) {
  const { data, isLoading, isError } = useStoreEmployees(storeId)
  const invalidateEmployees = useInvalidateStoreEmployees()

  const employees = data?.data ?? []

  const [modal, setModal] = useState<Modal>({ kind: 'none' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [existingInviteEmail, setExistingInviteEmail] = useState<string | null>(
    null,
  )
  const [highlightedRowId, setHighlightedRowId] = useState<string | null>(null)

  function closeModal() {
    if (loading) return
    setModal({ kind: 'none' })
    setError(null)
    setExistingInviteEmail(null)
  }

  function clearHighlightSoon() {
    setTimeout(() => setHighlightedRowId(null), 2500)
  }

  // --------------------------------------------------------------------------
  // Invite
  // --------------------------------------------------------------------------

  async function handleInvite(email: string) {
    setLoading(true)
    setError(null)
    setExistingInviteEmail(null)
    try {
      await inviteEmployee(storeId, { email })
      await invalidateEmployees(storeId)
      setModal({ kind: 'none' })
    } catch (err) {
      handleInviteError(err, email)
    } finally {
      setLoading(false)
    }
  }

  function handleInviteError(err: unknown, attemptedEmail: string) {
    const e = err as { status?: number; data?: { message?: string | string[] } }
    const message = typeof e.data?.message === 'string' ? e.data.message : ''

    if (e.status === 409 && /already.*employee/i.test(message)) {
      setError("They're already on your team.")
      return
    }
    if (e.status === 409 && /invite.*already.*sent/i.test(message)) {
      setError(
        "You've already sent an invite to this email. Use 'Resend' on the team list if it didn't arrive.",
      )
      setExistingInviteEmail(attemptedEmail)
      // Refetch in case the existing row isn't in our local copy.
      void invalidateEmployees(storeId)
      return
    }
    if (e.status === 400 && /approved/i.test(message)) {
      setError(
        'Your store needs to be approved before you can invite teammates.',
      )
      return
    }
    if (e.status === 403) {
      setError('You no longer have permission to invite teammates.')
      void invalidateEmployees(storeId)
      return
    }
    if (e.status === 400 && message) {
      setError(message)
      return
    }
    setError('Something went wrong. Please try again.')
  }

  function pivotToExistingInvite() {
    const target = employees.find(
      (em) => em.email.toLowerCase() === existingInviteEmail?.toLowerCase(),
    )
    setModal({ kind: 'none' })
    setExistingInviteEmail(null)
    setError(null)
    if (target) {
      setHighlightedRowId(target.id)
      // Scroll after the modal unmount completes.
      setTimeout(() => {
        const el = document.querySelector(
          `[data-employee-id="${target.id}"]`,
        ) as HTMLElement | null
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 80)
      clearHighlightSoon()
    }
  }

  // --------------------------------------------------------------------------
  // Resend (single-tap, no confirm modal)
  // --------------------------------------------------------------------------

  async function handleResend(employee: Employee) {
    try {
      await resendInvite(storeId, employee.id)
      await invalidateEmployees(storeId)
      setHighlightedRowId(employee.id)
      clearHighlightSoon()
    } catch (err) {
      // Stale state — refetch and let the row re-render in its new shape.
      const e = err as { status?: number; data?: { message?: string | string[] } }
      if (e.status === 404 || e.status === 400) {
        await invalidateEmployees(storeId)
      }
    }
  }

  // --------------------------------------------------------------------------
  // Deactivate / reactivate (Reactivate is single-tap; Deactivate currently
  // also single-tap to keep the surface lean — confirm modal possible later)
  // --------------------------------------------------------------------------

  async function handleDeactivate(employee: Employee) {
    try {
      await deactivateEmployee(storeId, employee.id)
      await invalidateEmployees(storeId)
    } catch (err) {
      const e = err as { status?: number }
      if (e.status === 404 || e.status === 400) {
        await invalidateEmployees(storeId)
      }
    }
  }

  async function handleReactivate(employee: Employee) {
    try {
      await reactivateEmployee(storeId, employee.id)
      await invalidateEmployees(storeId)
    } catch (err) {
      const e = err as { status?: number }
      if (e.status === 404 || e.status === 400) {
        await invalidateEmployees(storeId)
      }
    }
  }

  // --------------------------------------------------------------------------
  // Remove (with deactivate-instead pivot for accepted employees)
  // --------------------------------------------------------------------------

  function openRemove(employee: Employee) {
    setError(null)
    setModal({ kind: 'removing', employee })
  }

  async function handleConfirmRemove() {
    if (modal.kind !== 'removing') return
    setLoading(true)
    setError(null)
    try {
      await removeEmployee(storeId, modal.employee.id)
      await invalidateEmployees(storeId)
      setModal({ kind: 'none' })
    } catch (err) {
      const e = err as { status?: number; data?: { message?: string | string[] } }
      if (e.status === 404) {
        // Already gone — refetch and close.
        await invalidateEmployees(storeId)
        setModal({ kind: 'none' })
        return
      }
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDeactivateInstead() {
    if (modal.kind !== 'removing') return
    setLoading(true)
    setError(null)
    try {
      await deactivateEmployee(storeId, modal.employee.id)
      await invalidateEmployees(storeId)
      setModal({ kind: 'none' })
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-zinc-950">Team</h2>
          <p className="mt-1 text-sm text-zinc-500">
            People with access to your store. Owners can invite + manage.
          </p>
        </div>
        {isOwnerView && (
          <Button
            type="button"
            fullWidth={false}
            onClick={() => {
              setError(null)
              setExistingInviteEmail(null)
              setModal({ kind: 'inviting' })
            }}
          >
            + Invite teammate
          </Button>
        )}
      </header>

      {isLoading ? (
        <InlineLoader />
      ) : isError ? (
        <Alert variant="error">
          Couldn&apos;t load the team. Refresh the page to try again.
        </Alert>
      ) : employees.length === 0 ? (
        <EmptyState
          isOwnerView={isOwnerView}
          onInvite={() => setModal({ kind: 'inviting' })}
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {employees.map((employee) => (
            <li key={employee.id}>
              <EmployeeRow
                employee={employee}
                isOwnerView={isOwnerView}
                onResend={handleResend}
                onDeactivate={handleDeactivate}
                onReactivate={handleReactivate}
                onRemove={openRemove}
                highlighted={highlightedRowId === employee.id}
              />
            </li>
          ))}
        </ul>
      )}

      {modal.kind === 'inviting' && (
        <InviteEmployeeModal
          onCancel={closeModal}
          onConfirm={handleInvite}
          loading={loading}
          error={error}
          onShowExistingInvite={pivotToExistingInvite}
          showExistingInviteLink={!!existingInviteEmail}
        />
      )}

      {modal.kind === 'removing' && (
        <RemoveEmployeeModal
          employee={modal.employee}
          onCancel={closeModal}
          onConfirmRemove={handleConfirmRemove}
          onDeactivateInstead={
            // Only show the pivot for accepted (non-pending) employees who
            // are currently active. Pending rows go straight to remove (=
            // cancel invite); deactivated rows are already deactivated.
            modal.employee.acceptedAt !== null && modal.employee.isActive
              ? handleDeactivateInstead
              : undefined
          }
          loading={loading}
          error={error}
        />
      )}
    </section>
  )
}

// ----------------------------------------------------------------------------
// Empty + loading states
// ----------------------------------------------------------------------------

function EmptyState({
  isOwnerView,
  onInvite,
}: {
  isOwnerView: boolean
  onInvite: () => void
}) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-12 text-center">
      <h3 className="text-base font-semibold text-zinc-950">Build your team</h3>
      <p className="mt-2 text-sm text-zinc-600">
        {isOwnerView
          ? 'Invite teammates to help you manage your store — add products, edit your story, respond to orders.'
          : 'No teammates yet. Ask the store owner to send you an invite.'}
      </p>
      {isOwnerView && (
        <div className="mt-4 flex justify-center">
          <Button type="button" fullWidth={false} onClick={onInvite}>
            Invite teammate
          </Button>
        </div>
      )}
    </div>
  )
}

function InlineLoader() {
  return (
    <div className="flex items-center justify-center py-12">
      <div
        aria-hidden
        className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-950"
      />
    </div>
  )
}
