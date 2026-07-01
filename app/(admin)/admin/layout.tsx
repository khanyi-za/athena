'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

import { useAuthStore } from '@/store/auth-store'
import { LogoutButton } from '@/components/logout-button'
import { useAuthMeRefresh } from '@/hooks/use-auth-me-refresh'
import { Splash } from '@/components/ui/splash'

// Admin chrome — distinct from the merchant dashboard layout but uses the same
// color palette + components. Per admin-journey.md, the admin tool is an
// internal-tool surface: information density welcome, canonical status names
// in the body content, but the shell itself stays simple.
//
// Access gate: only ADMIN users see this. Anyone else is soft-redirected to
// /dashboard (the matrix takes them to the right place) with a query param
// that future surfaces can use to show a toast.

const ADMIN_NAV_ITEMS = [
  { href: '/admin', label: 'Queue' },
  { href: '/admin/go-live', label: 'Launch' },
  { href: '/admin/categories', label: 'Categories' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  useAuthMeRefresh()

  const router = useRouter()
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)
  const isInitializing = useAuthStore((s) => s.isInitializing)

  // Soft-redirect non-ADMINs to /dashboard with a reason hint (a future toast
  // surface can read ?reason=admin-only and explain).
  useEffect(() => {
    if (isInitializing || !user) return
    if (user.role !== 'ADMIN') {
      router.replace('/dashboard?reason=admin-only')
    }
  }, [isInitializing, user, router])

  if (isInitializing || !user || user.role !== 'ADMIN') {
    return <Splash />
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="bg-card border-b border-border">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <Link
              href="/admin"
              className="text-sm font-bold tracking-[0.2em] text-foreground"
            >
              YIIVA
              <span className="ml-2 text-xs font-medium tracking-wide text-muted-foreground">
                ADMIN
              </span>
            </Link>
            <nav className="flex items-center gap-1">
              {ADMIN_NAV_ITEMS.map((item) => {
                // The Queue tab (`/admin`) also claims first-review detail
                // (`/admin/stores/*`). Other tabs match their own prefix with a
                // `/` boundary so `/admin/go-live-anything` couldn't false-match
                // Go-Live.
                const isActive =
                  item.href === '/admin'
                    ? pathname === '/admin' ||
                      pathname.startsWith('/admin/stores/')
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
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user.firstName}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
