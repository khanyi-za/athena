import type { UserStore } from '@/types/auth'

// Stub for the BUYER + PENDING_REVIEW view. Real screen lands in Milestone 3 —
// see docs/Api-frontend-contracts/store-frontend-flows.md §2.4. Read-only display
// of submitted info plus the 2–3-business-days expectation copy.

export function UnderReviewFirstScreen({ store }: { store: UserStore }) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 py-10 text-center">
      <div
        aria-hidden
        className="h-12 w-12 rounded-full border-2 border-zinc-300 border-t-zinc-950 animate-spin"
      />
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-zinc-950">Your store is under review</h1>
        <p className="text-sm text-zinc-600 leading-relaxed">
          We&apos;re checking that everything is in order. Reviews usually take 2–3
          business days. We&apos;ll email you as soon as we have an answer.
        </p>
        <p className="mt-2 text-xs text-zinc-500">
          {store.displayName} · submitted to YIIVA
        </p>
      </div>
    </div>
  )
}
