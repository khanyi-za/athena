import type { UserStore } from '@/types/auth'

// Stub for the MERCHANT + SUSPENDED view. Reachability note: no admin endpoint
// currently transitions a store to SUSPENDED (see store-frontend-flows.md §2.9 —
// "reserved for a future moderation feature"). UI is still worth designing.

export function SuspendedScreen({ store }: { store: UserStore }) {
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? 'support@yiiva.co.za'

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 py-10">
      <h1 className="text-2xl font-semibold text-zinc-950">Your store is suspended</h1>
      <p className="text-sm text-zinc-600 leading-relaxed">
        {store.displayName} has been temporarily suspended by YIIVA. While suspended,
        your store isn&apos;t visible to buyers and you can&apos;t make changes.
      </p>
      <p className="text-sm text-zinc-600 leading-relaxed">
        If you think this is a mistake or want to resolve the issue, please contact{' '}
        <a className="font-medium text-zinc-950 hover:underline" href={`mailto:${supportEmail}`}>
          {supportEmail}
        </a>
        .
      </p>
    </div>
  )
}
