import type { UserStore } from '@/types/auth'

// MERCHANT + PENDING_GO_LIVE view per store-frontend-flows.md §2.7. Read-only
// waiting state mirroring the first-review wait — admin approval is detected
// automatically via useAuthMeRefresh on tab focus, the matrix re-evaluates,
// and the screen swaps in place.
//
// Visual: a checkmark in an emerald-tinted circle. The first-review wait uses
// a neutral zinc tone ("we got it"); this one steps up to emerald to signal
// "you're almost live" — same icon family, more colour.

export function UnderReviewGoLiveScreen({ store }: { store: UserStore }) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 py-10 text-center">
      <div
        aria-hidden
        className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10"
      >
        <CheckIcon />
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-foreground">Your store is in final review</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          We&apos;re checking that your store is ready to be seen by buyers. Reviews
          usually take 2–3 business days. As soon as we approve, your store will go live.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          {store.displayName} · awaiting final approval
        </p>
      </div>
    </div>
  )
}

function CheckIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-success"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}
