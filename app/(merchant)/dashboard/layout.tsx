'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import { LogoutButton } from '@/components/logout-button'
import { useAuthMeRefresh } from '@/hooks/use-auth-me-refresh'

// Thin dashboard shell — header (logo + conditional MERCHANT nav + user info)
// and main content area. Phase screens that need more chrome bring their own.
//
// Mounts useAuthMeRefresh so every phase screen inherits the focus-refresh
// behaviour without having to opt in individually.

const MERCHANT_NAV_ITEMS = [
  { href: '/dashboard', label: 'Home' },
  { href: '/dashboard/products', label: 'Products' },
  { href: '/dashboard/settings', label: 'Settings' },
  { href: '/dashboard/team', label: 'Team' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  useAuthMeRefresh()

  const user = useAuthStore((s) => s.user)
  const pathname = usePathname()

  const showMerchantNav = user?.role === 'MERCHANT'

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
