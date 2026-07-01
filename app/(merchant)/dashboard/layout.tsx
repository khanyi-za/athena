'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import { LogoutButton } from '@/components/logout-button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { useAuthMeRefresh } from '@/hooks/use-auth-me-refresh'
import { useStoreMe } from '@/hooks/use-store-me'
import { AppShell } from '@/components/shell/app-shell'

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
    return <AppShell store={store}>{children}</AppShell>
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <Link
              href="/dashboard"
              className="text-sm font-bold tracking-[0.2em] text-foreground"
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
                          ? 'bg-brand-subtle text-brand'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                      ].join(' ')}
                    >
                      {item.label}
                    </Link>
                  )
                })}
              </nav>
            )}
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {user ? (
              <>
                <span className="text-sm text-muted-foreground">{user.firstName}</span>
                <LogoutButton />
              </>
            ) : null}
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
