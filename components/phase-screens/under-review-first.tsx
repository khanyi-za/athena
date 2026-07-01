import type { UserStore } from '@/types/auth'

// BUYER + PENDING_REVIEW view per store-frontend-flows.md §2.4. Read-only
// waiting state. No interactive surface — the merchant simply waits for
// admin approval, which is detected automatically via useAuthMeRefresh on
// tab focus and re-evaluated through the routing matrix.
//
// Visual: a neutral checkmark-in-a-circle (not the loud emerald success
// treatment) — communicates "we got it" without claiming approval, since
// approval is the next gate.

export function UnderReviewFirstScreen({ store }: { store: UserStore }) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 py-10 text-center">
      <div
        aria-hidden
        className="flex h-16 w-16 items-center justify-center rounded-full bg-muted"
      >
        <CheckIcon />
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-foreground">Your store is under review</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          We&apos;ve received your submission and are checking everything over.
          Reviews usually take 2–3 business days. We&apos;ll email you as soon
          as we have an answer.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          {store.displayName} · submitted to YIIVA
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
      className="text-foreground"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}
