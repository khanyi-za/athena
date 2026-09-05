'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import { LogoutButton } from '@/components/logout-button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { useAuthMeRefresh } from '@/hooks/use-auth-me-refresh'
import { useStoreMe } from '@/hooks/use-store-me'
import { AppShell } from '@/components/shell/app-shell'
import { StatusPill } from '@/components/ui/status-pill'

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

  // PENDING_REVIEW users are still role BUYER (the merchant upgrade fires at
  // approval), but review runs in parallel with setup (Paystack model) — so
  // nav keys off store status too, not role alone. Team stays merchant-only.
  const underReview = user?.store?.status === 'PENDING_REVIEW'
  const showMerchantNav = user?.role === 'MERCHANT' || underReview
  const navItems = underReview
    ? MERCHANT_NAV_ITEMS.filter((item) => item.label !== 'Team')
    : MERCHANT_NAV_ITEMS

  if (user?.role === 'MERCHANT' && store?.status === 'ACTIVE') {
    return <AppShell store={store}>{children}</AppShell>
  }

  return (
    <div className="flex min-h-screen flex-col bg-background p-3">
      <header className="rounded-2xl border border-topbar-border bg-topbar text-topbar-foreground shadow-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <Link
              href="/dashboard"
              className="text-sm font-bold tracking-[0.2em] text-topbar-foreground"
            >
              YIIVA
            </Link>
            {showMerchantNav && (
              <nav className="flex items-center gap-1">
                {navItems.map((item) => {
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
                          ? 'bg-topbar-active text-topbar-foreground'
                          : 'text-topbar-muted hover:bg-topbar-accent hover:text-topbar-foreground',
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
            {underReview && <StatusPill status="PENDING_REVIEW" />}
            <ThemeToggle className="text-topbar-muted hover:bg-topbar-accent hover:text-topbar-foreground" />
            {user ? (
              <>
                <span className="text-sm text-topbar-muted">{user.firstName}</span>
                <LogoutButton className="border-topbar-border text-topbar-foreground hover:bg-topbar-accent" />
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
