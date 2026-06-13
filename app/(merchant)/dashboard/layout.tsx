'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import { LogoutButton } from '@/components/logout-button'
import { useAuthMeRefresh } from '@/hooks/use-auth-me-refresh'
import { useStoreMe } from '@/hooks/use-store-me'
import { LegacyDashboardShell } from '@/components/legacy-shell/legacy-dashboard-shell'

// Dashboard chrome. Two modes:
// - ACTIVE store → the full operating shell (sidebar nav, ported from the
//   dashboard-legacy design target) via LegacyDashboardShell.
// - Everything else (wizard, review states, suspended, admins-in-transit) →
//   the thin header below; phase screens bring their own chrome.
//
// Mounts useAuthMeRefresh so every phase screen inherits the focus-refresh
// behaviour without having to opt in individually.

const MERCHANT_NAV_ITEMS = [
  { href: '/dashboard', label: 'Home' },
  { href: '/dashboard/products', label: 'Products' },
  { href: '/dashboard/collections', label: 'Collections' },
  { href: '/dashboard/settings', label: 'Settings' },
  { href: '/dashboard/team', label: 'Team' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  useAuthMeRefresh()

  const user = useAuthStore((s) => s.user)
  const pathname = usePathname()
  const { data: store } = useStoreMe()

  const showMerchantNav = user?.role === 'MERCHANT'

  if (user?.role === 'MERCHANT' && store?.status === 'ACTIVE') {
    return <LegacyDashboardShell store={store}>{children}</LegacyDashboardShell>
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <Link
              href="/dashboard"
              className="text-sm font-bold tracking-[0.2em] text-zinc-950"
            >
              YIIVA
            </Link>
            {showMerchantNav && (
              <nav className="flex items-center gap-1">
                {MERCHANT_NAV_ITEMS.map((item) => {
                  // Home matches only the exact /dashboard path; other tabs
                  // claim their full subtree with a `/` boundary so a
                  // hypothetical /dashboard/teamish couldn't false-match Team.
                  const isActive =
                    item.href === '/dashboard'
                      ? pathname === '/dashboard'
                      : pathname === item.href ||
                        pathname.startsWith(item.href + '/')
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={[
                        'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-zinc-100 text-zinc-950'
                          : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950',
                      ].join(' ')}
                    >
                      {item.label}
                    </Link>
                  )
                })}
              </nav>
            )}
          </div>
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-zinc-600">{user.firstName}</span>
              <LogoutButton />
            </div>
          ) : null}
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
