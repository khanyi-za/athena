import type { UserStore } from '@/types/auth'

// Stub for the MERCHANT + PENDING_GO_LIVE view. Real screen lands in Milestone 5 —
// see docs/Api-frontend-contracts/store-frontend-flows.md §2.7. Same pattern as
// the first-review wait, with "final review" framing.

export function UnderReviewGoLiveScreen({ store }: { store: UserStore }) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 py-10 text-center">
      <div
        aria-hidden
        className="h-12 w-12 rounded-full border-2 border-zinc-300 border-t-zinc-950 animate-spin"
      />
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-zinc-950">Your store is in final review</h1>
        <p className="text-sm text-zinc-600 leading-relaxed">
          We&apos;re checking that your store is ready to be seen by buyers. Reviews
          usually take 2–3 business days. As soon as we approve, your store will go live.
        </p>
        <p className="mt-2 text-xs text-zinc-500">
          {store.displayName} · awaiting final approval
        </p>
      </div>
    </div>
  )
}
