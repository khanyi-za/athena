import type { AccountStatus, StoreStatus } from '@/types/auth'

// User-facing copy for the enum values surfaced in /auth/me. Never render the raw
// enum strings — per docs/Api-frontend-contracts/merchant-journey.md §1, the merchant
// is non-technical and "DRAFT" / "PENDING_REVIEW" mean nothing to them.

const STORE_STATUS_LABELS: Record<StoreStatus, string> = {
  DRAFT: 'Setting up',
  PENDING_REVIEW: 'Under review',
  APPROVED: 'Approved · not yet live',
  PENDING_GO_LIVE: 'Final review',
  ACTIVE: 'Live',
  SUSPENDED: 'Suspended',
  CLOSED: 'Closed',
}

const ACCOUNT_STATUS_LABELS: Record<AccountStatus, string> = {
  ACTIVE: 'Active',
  SUSPENDED: 'Suspended',
  DEACTIVATED: 'Deactivated',
  PENDING_VERIFICATION: 'Pending verification',
}

export function storeStatusLabel(status: StoreStatus): string {
  return STORE_STATUS_LABELS[status]
}

export function accountStatusLabel(status: AccountStatus): string {
  return ACCOUNT_STATUS_LABELS[status]
}
