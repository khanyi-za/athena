import type { User, UserStore } from '@/types/auth'

// Encodes the post-login routing matrix from
// docs/Api-frontend-contracts/auth-frontend-flows.md §3.1.
//
// Re-evaluated on every app init and after any state-changing action.
// Pure function — no React, no fetch — so it's trivially testable.

export type DashboardView =
  | { kind: 'onboarding-intent' }
  | { kind: 'wizard-draft'; store: UserStore }
  | { kind: 'under-review-first'; store: UserStore }
  | { kind: 'approved-readiness'; store: UserStore }
  | { kind: 'under-review-go-live'; store: UserStore }
  | { kind: 'active-store'; store: UserStore }
  | { kind: 'suspended'; store: UserStore }
  | { kind: 'closed'; store: UserStore }
  | { kind: 'admin' }
  | { kind: 'invalid-state'; reason: string }

export function resolveDashboardView(user: User | null): DashboardView {
  if (!user) {
    return { kind: 'invalid-state', reason: 'No authenticated user' }
  }

  // Admin ignores the store field entirely per §3.1.
  if (user.role === 'ADMIN') {
    return { kind: 'admin' }
  }

  const { store, role } = user

  // BUYER paths
  if (role === 'BUYER') {
    if (store === null) {
      return { kind: 'onboarding-intent' }
    }

    switch (store.status) {
      case 'DRAFT':
        return { kind: 'wizard-draft', store }
      case 'PENDING_REVIEW':
        return { kind: 'under-review-first', store }
      // BUYER should never reach these — role upgrade fires at first APPROVED.
      case 'APPROVED':
      case 'PENDING_GO_LIVE':
      case 'ACTIVE':
        return {
          kind: 'invalid-state',
          reason: `BUYER with store.status=${store.status} — role upgrade did not fire`,
        }
      case 'SUSPENDED':
      case 'CLOSED':
        // A buyer can't have transitioned to these without first being MERCHANT.
        return {
          kind: 'invalid-state',
          reason: `BUYER with store.status=${store.status} — only MERCHANTS reach this state`,
        }
    }
  }

  // MERCHANT paths
  if (role === 'MERCHANT') {
    if (store === null) {
      // Schema invariant: deleting a store cascade-requires deleting the user,
      // so a MERCHANT without a store means the data is corrupt.
      return {
        kind: 'invalid-state',
        reason: 'MERCHANT with no store — data invariant violated',
      }
    }

    switch (store.status) {
      case 'APPROVED':
        return { kind: 'approved-readiness', store }
      case 'PENDING_GO_LIVE':
        return { kind: 'under-review-go-live', store }
      case 'ACTIVE':
        return { kind: 'active-store', store }
      case 'SUSPENDED':
        return { kind: 'suspended', store }
      case 'CLOSED':
        return { kind: 'closed', store }
      // The role upgrade is one-way and only fires when a store first reaches APPROVED.
      // There's no path back to these for an upgraded user.
      case 'DRAFT':
      case 'PENDING_REVIEW':
        return {
          kind: 'invalid-state',
          reason: `MERCHANT with store.status=${store.status} — role upgrade is one-way`,
        }
    }
  }

  return { kind: 'invalid-state', reason: `Unknown role: ${role as string}` }
}

// Where does a given view live, URL-wise?
// Used by login + verify-email + the dashboard/onboarding cross-redirect guards.
export function pathForView(view: DashboardView): string {
  switch (view.kind) {
    case 'onboarding-intent':
      return '/onboarding'
    case 'admin':
      return '/admin'
    default:
      return '/dashboard'
  }
}
