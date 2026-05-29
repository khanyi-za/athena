'use client'

import { useEffect } from 'react'
import { useBodyScrollLock } from "@/lib/use-body-scroll-lock"

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { employeeVisualState, type Employee } from '@/lib/schemas/employee'

// Remove/cancel modal per store-frontend-flows §4.5. Three buttons for
// accepted employees: Deactivate instead / Cancel / Remove. For pending
// invites, just Cancel / Confirm cancel (DELETE is the same call).

interface RemoveEmployeeModalProps {
  employee: Employee
  onCancel: () => void
  onConfirmRemove: () => void
  onDeactivateInstead?: () => void
  loading: boolean
  error?: string | null
}

export function RemoveEmployeeModal({
  employee,
  onCancel,
  onConfirmRemove,
  onDeactivateInstead,
  loading,
  error,
}: RemoveEmployeeModalProps) {
  const state = employeeVisualState(employee)
  const isPending = state === 'pending'

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !loading) onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [loading, onCancel])

  useBodyScrollLock()

  const displayName = employee.user
    ? `${employee.user.firstName} ${employee.user.lastName}`
    : employee.email

  const title = isPending
    ? `Cancel invite to ${employee.email}?`
    : `Remove ${displayName} from your team?`

  const body = isPending
    ? `The invite link will stop working. You can send a new invite later.`
    : `This permanently deletes their team record. If they had access, they'll lose it immediately. If you might want to restore access later, deactivate them instead.`

  const confirmLabel = isPending ? 'Cancel invite' : 'Remove'

  return (
    <div
      role="dialog"
      aria-modal
      aria-labelledby="remove-employee-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 p-4"
      onClick={() => {
        if (!loading) onCancel()
      }}
    >
      <div
        className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="remove-employee-title" className="text-lg font-semibold text-zinc-950">
          {title}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-zinc-600">{body}</p>

        {error && (
          <div className="mt-4">
            <Alert variant="error">{error}</Alert>
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end sm:flex-wrap">
          {!isPending && onDeactivateInstead && (
            <Button
              type="button"
              variant="ghost"
              fullWidth={false}
              onClick={onDeactivateInstead}
              disabled={loading}
            >
              Deactivate instead
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            fullWidth={false}
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            fullWidth={false}
            onClick={onConfirmRemove}
            loading={loading}
            className="!bg-red-600 hover:!bg-red-700"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
