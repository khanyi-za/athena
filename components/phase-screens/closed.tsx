import type { UserStore } from '@/types/auth'

// Stub for the MERCHANT + CLOSED view. Same reachability caveat as SUSPENDED —
// no backend endpoint sets this state in v1.

export function ClosedScreen({ store }: { store: UserStore }) {
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? 'support@yiiva.co.za'

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 py-10">
      <h1 className="text-2xl font-semibold text-foreground">This store has been closed</h1>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {store.displayName} has been closed. If you&apos;d like to reopen it or start
        fresh, please contact{' '}
        <a className="font-medium text-foreground hover:underline" href={`mailto:${supportEmail}`}>
          {supportEmail}
        </a>
        .
      </p>
    </div>
  )
}
