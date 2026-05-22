import type { StoreStatus } from '@/types/auth'

// Encodes the asymmetric DRAFT/APPROVED rejection-banner rule from
// docs/Api-frontend-contracts/store-frontend-flows.md §7.2 and merchant-journey.md §10.4.
//
//   DRAFT + rejectionReason
//     → headline: "Your application needs changes"
//     → auto-clears when the merchant edits any field (caller wires that — banner
//       reads from the live store record and disappears when rejectionReason is null)
//
//   APPROVED + rejectionReason
//     → headline: "Your store wasn't quite ready to go live"
//     → persists until POST /stores/:id/request-go-live runs again
//     → copy explicitly tells the merchant how to clear the banner

interface RejectionBannerProps {
  storeStatus: StoreStatus
  rejectionReason: string | null
  // Optional secondary action — e.g., open a "View original feedback" pop on DRAFT
  // after the merchant edits and the banner auto-clears (per §2.4 edge note).
  secondaryAction?: React.ReactNode
}

export function RejectionBanner({ storeStatus, rejectionReason, secondaryAction }: RejectionBannerProps) {
  if (!rejectionReason) return null

  const isGoLiveRejection = storeStatus === 'APPROVED'

  const headline = isGoLiveRejection
    ? "Your store wasn't quite ready to go live"
    : 'Your application needs changes'

  const feedbackLabel = isGoLiveRejection ? 'Feedback from our team' : 'Why we couldn’t approve it yet'

  const closingHint = isGoLiveRejection
    ? 'This message will go away when you request go-live again.'
    : 'Make the changes below and resubmit.'

  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900"
    >
      <div className="flex items-start gap-3">
        <WarningIcon className="mt-0.5 flex-shrink-0 text-amber-700" />
        <div className="flex flex-1 flex-col gap-2">
          <h2 className="text-sm font-semibold">{headline}</h2>
          <div className="flex flex-col gap-1 text-sm">
            <span className="text-xs font-medium uppercase tracking-wide text-amber-700">
              {feedbackLabel}
            </span>
            <p className="leading-relaxed text-amber-900">&ldquo;{rejectionReason}&rdquo;</p>
          </div>
          <p className="text-sm text-amber-800">{closingHint}</p>
        </div>
      </div>
      {secondaryAction ? <div className="ml-8">{secondaryAction}</div> : null}
    </div>
  )
}

function WarningIcon({ className }: { className?: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}
