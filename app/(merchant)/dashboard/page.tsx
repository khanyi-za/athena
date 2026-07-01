'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'

import { useAuthStore } from '@/store/auth-store'
import { resolveDashboardView } from '@/lib/routing-matrix'
import { Splash } from '@/components/ui/splash'
import { WizardDraftScreen } from '@/components/phase-screens/wizard-draft'
import { UnderReviewFirstScreen } from '@/components/phase-screens/under-review-first'
import { ApprovedReadinessScreen } from '@/components/phase-screens/approved-readiness'
import { UnderReviewGoLiveScreen } from '@/components/phase-screens/under-review-go-live'
import { ActiveStoreScreen } from '@/components/phase-screens/active-store'
import { SuspendedScreen } from '@/components/phase-screens/suspended'
import { ClosedScreen } from '@/components/phase-screens/closed'
import { InvalidStateScreen } from '@/components/phase-screens/invalid-state'
import { getEmployees } from '@/lib/api/employees'
import {
  getEmployeeStores,
  removeEmployeeStore,
  touchEmployeeStore,
  type EmployeeStoreEntry,
} from '@/lib/employee-stores-cache'

export default function DashboardPage() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const isInitializing = useAuthStore((s) => s.isInitializing)

  const view = user ? resolveDashboardView(user) : null

  // ADMIN cross-segment redirect.
  useEffect(() => {
    if (view?.kind === 'admin') router.replace('/admin')
  }, [view?.kind, router])

  if (isInitializing || !user || !view || view.kind === 'admin') {
    return <Splash />
  }

  // Employee fallback per employee-journey.md §7. BUYER with no store is the
  // matrix's "onboarding-intent" path — but the user may actually be an
  // accepted employee whose own store record is null. Check the localStorage
  // cache + verify before routing them to onboarding.
  if (view.kind === 'onboarding-intent') {
    return <EmployeeFallbackGate userId={user.id} />
  }

  switch (view.kind) {
    case 'wizard-draft':
      return <WizardDraftScreen />
    case 'under-review-first':
      return <UnderReviewFirstScreen store={view.store} />
    case 'approved-readiness':
      return <ApprovedReadinessScreen />
    case 'under-review-go-live':
      return <UnderReviewGoLiveScreen store={view.store} />
    case 'active-store':
      return <ActiveStoreScreen />
    case 'suspended':
      return <SuspendedScreen store={view.store} />
    case 'closed':
      return <ClosedScreen store={view.store} />
    case 'invalid-state':
      return <InvalidStateScreen reason={view.reason} />
  }
}

// ----------------------------------------------------------------------------
// Employee fallback gate — consulted only when the matrix returned
// 'onboarding-intent'. Reads the localStorage cache + verifies the most
// recently accessed employment. On verified: render the v1 employee welcome
// (a full employee dashboard ships when /auth/me exposes employments). On no
// cache or 403: redirect to /onboarding (the BUYER matrix's default).
// ----------------------------------------------------------------------------

type EmployeeFallbackResult =
  | { kind: 'verified'; store: EmployeeStoreEntry }
  | { kind: 'none' }

const EMPLOYEE_FALLBACK_KEY = 'employee-fallback' as const

function useEmployeeFallback(userId: string) {
  return useQuery<EmployeeFallbackResult>({
    queryKey: [EMPLOYEE_FALLBACK_KEY, userId],
    queryFn: async () => {
      const entries = getEmployeeStores(userId)
      if (entries.length === 0) return { kind: 'none' }

      // Most recently accessed wins. Multi-store picker is deferred — at scale
      // we'd render a "Which store today?" screen instead of auto-routing.
      const target = [...entries].sort((a, b) =>
        b.lastAccessedAt.localeCompare(a.lastAccessedAt),
      )[0]

      try {
        await getEmployees(target.id)
        touchEmployeeStore(userId, target.id)
        return { kind: 'verified', store: target }
      } catch (err) {
        const e = err as { status?: number }
        // 403 = removed/deactivated for THIS store. Prune the entry and let
        // the caller re-route via the buyer matrix.
        if (e.status === 403) {
          removeEmployeeStore(userId, target.id)
        }
        return { kind: 'none' }
      }
    },
    staleTime: Infinity, // run once per session — re-mounts are cheap
    retry: false,
  })
}

function EmployeeFallbackGate({ userId }: { userId: string }) {
  const router = useRouter()
  const { data, isLoading } = useEmployeeFallback(userId)

  useEffect(() => {
    if (data?.kind === 'none') {
      router.replace('/onboarding')
    }
  }, [data?.kind, router])

  if (isLoading || !data || data.kind === 'none') {
    return <Splash />
  }

  return <EmployeeWelcomeScreen store={data.store} />
}

// Placeholder per the v1 limitation called out in
// auth-frontend-flows.md §2.9: the merchant web app currently lacks an
// employee-side dashboard because /auth/me doesn't expose employments. The
// localStorage workaround gets the user *here* — a real dashboard ships when
// the backend adds an employments endpoint.
//
// The merchant layout chrome wraps this (no nav for BUYER role, but the YIIVA
// logo + first name + LogoutButton are visible top-right), so the user can
// always sign out without action affordances here.
function EmployeeWelcomeScreen({ store }: { store: EmployeeStoreEntry }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-5 py-16 text-center">
      <div
        aria-hidden
        className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-2xl"
      >
        ✓
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold text-foreground">
          You&apos;re set up at {store.displayName}.
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Your access is registered. The dedicated employee dashboard is on
          its way — for now, the store owner can collaborate with you directly
          on changes, products, and orders.
        </p>
      </div>
    </div>
  )
}
