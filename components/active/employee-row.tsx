'use client'

import { GenericStatusPill } from '@/components/ui/status-pill'
import {
  employeeVisualState,
  type Employee,
} from '@/lib/schemas/employee'

// Single employee row per store-frontend-flows §4.2. Three visual states
// driven by acceptedAt + isActive (see employeeVisualState helper).
//
// Owner-only actions: Resend / Cancel / Deactivate / Reactivate / Remove.
// For non-owners (active accepted employees), the actions cluster is hidden
// entirely per the spec — no disabled buttons.

interface EmployeeRowProps {
  employee: Employee
  isOwnerView: boolean
  onResend?: (employee: Employee) => void
  onDeactivate?: (employee: Employee) => void
  onReactivate?: (employee: Employee) => void
  onRemove?: (employee: Employee) => void
  /** When set, this row gets a brief highlight ring (used after an
   *  already-pending 409 fires from the invite modal). */
  highlighted?: boolean
}

export function EmployeeRow({
  employee,
  isOwnerView,
  onResend,
  onDeactivate,
  onReactivate,
  onRemove,
  highlighted,
}: EmployeeRowProps) {
  const state = employeeVisualState(employee)
  const u = employee.user

  // Display name + secondary line vary per state.
  const primaryLine = u
    ? `${u.firstName} ${u.lastName}`
    : `${prettyEmailLocalPart(employee.email)} (pending)`

  return (
    <div
      data-employee-id={employee.id}
      className={[
        'flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4 transition-shadow',
        state === 'deactivated' ? 'bg-zinc-50' : 'bg-white',
        highlighted ? 'border-zinc-950 ring-2 ring-zinc-200' : 'border-zinc-200',
      ].join(' ')}
    >
      <div className="flex flex-col gap-0.5 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p
            className={[
              'text-sm font-medium',
              state === 'deactivated' ? 'text-zinc-500' : 'text-zinc-950',
              state === 'pending' ? 'italic' : '',
            ].join(' ')}
          >
            {primaryLine}
          </p>
          {employee.employeeNumber && (
            <span className="font-mono text-xs text-zinc-500">
              {employee.employeeNumber}
            </span>
          )}
          <StatePill state={state} />
        </div>
        <p className="truncate text-xs text-zinc-500">
          {employee.email} · {secondaryLine(employee, state)}
        </p>
      </div>

      {isOwnerView && (
        <div className="flex flex-shrink-0 items-center gap-2">
          {state === 'pending' && (
            <>
              <RowButton onClick={() => onResend?.(employee)}>Resend</RowButton>
              <RowButton onClick={() => onRemove?.(employee)} tone="muted">
                Cancel
              </RowButton>
            </>
          )}
          {state === 'active' && (
            <>
              <RowButton onClick={() => onDeactivate?.(employee)}>
                Deactivate
              </RowButton>
              <RowButton onClick={() => onRemove?.(employee)} tone="danger">
                Remove
              </RowButton>
            </>
          )}
          {state === 'deactivated' && (
            <>
              <RowButton onClick={() => onReactivate?.(employee)}>
                Reactivate
              </RowButton>
              <RowButton onClick={() => onRemove?.(employee)} tone="danger">
                Remove
              </RowButton>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ----------------------------------------------------------------------------
// Sub-components
// ----------------------------------------------------------------------------

function StatePill({ state }: { state: ReturnType<typeof employeeVisualState> }) {
  if (state === 'pending') {
    return <GenericStatusPill label="Pending" tone="amber" />
  }
  if (state === 'active') {
    return <GenericStatusPill label="Active" tone="green" />
  }
  return <GenericStatusPill label="Deactivated" tone="muted" />
}

function RowButton({
  children,
  onClick,
  tone = 'default',
}: {
  children: React.ReactNode
  onClick: () => void
  tone?: 'default' | 'muted' | 'danger'
}) {
  const colorMap: Record<typeof tone, string> = {
    default: 'text-zinc-700 hover:text-zinc-950',
    muted: 'text-zinc-500 hover:text-zinc-700',
    danger: 'text-zinc-500 hover:text-red-600',
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-sm font-medium transition-colors ${colorMap[tone]}`}
    >
      {children}
    </button>
  )
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function secondaryLine(
  employee: Employee,
  state: ReturnType<typeof employeeVisualState>,
): string {
  if (state === 'pending') {
    return `Invited ${formatDate(employee.createdAt)}`
  }
  if (employee.acceptedAt) {
    return `Joined ${formatDate(employee.acceptedAt)}`
  }
  return formatDate(employee.createdAt)
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// Fall back to a friendlier label when we have no user record yet ("pending"
// rows have no name on file, just the email).
function prettyEmailLocalPart(email: string): string {
  const at = email.indexOf('@')
  if (at <= 0) return email
  return email.slice(0, at)
}
