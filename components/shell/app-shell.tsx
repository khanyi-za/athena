'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  Package,
  Layers,
  ShoppingCart,
  Mail,
  TrendingUp,
  Users,
  Settings,
  Bell,
  Search,
  BadgeCheck,
  DollarSign,
  Tag,
  RotateCcw,
  Menu,
  X,
} from 'lucide-react'

import { useBodyScrollLock } from '@/lib/use-body-scroll-lock'
import { useAuthStore } from '@/store/auth-store'
import { LogoutButton } from '@/components/logout-button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { cn } from '@/lib/utils'
import type { StoreMe } from '@/lib/schemas/store'

// Unified merchant operating shell (YIIVA redesign — replaces LegacyDashboardShell).
// Floating-inset chrome: a full-width rounded topbar spans the dashboard, with the
// sidebar starting below it. Both panels sit on the deep-violet `sidebar` tokens,
// deliberately distinct from the content canvas. Same data contract as before:
// real store identity, real nav, LogoutButton (which owns the careful
// cookie-clearing logout).

const NAV = [
  { name: 'Overview', href: '/dashboard', icon: BarChart3 },
  { name: 'Products', href: '/dashboard/products', icon: Package },
  { name: 'Collections', href: '/dashboard/collections', icon: Layers },
  { name: 'Sales', href: '/dashboard/orders', icon: ShoppingCart },
  { name: 'Returns', href: '/dashboard/returns', icon: RotateCcw },
  { name: 'Earnings', href: '/dashboard/earnings', icon: DollarSign },
  { name: 'Promotions', href: '/dashboard/promotions', icon: Tag },
  { name: 'Messages', href: '/dashboard/messages', icon: Mail },
  { name: 'Analytics', href: '/dashboard/analytics', icon: TrendingUp },
  { name: 'Team', href: '/dashboard/team', icon: Users },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

function isActivePath(pathname: string, href: string): boolean {
  return href === '/dashboard'
    ? pathname === '/dashboard'
    : pathname === href || pathname.startsWith(href + '/')
}

// Nav list shared by the desktop sidebar and the mobile drawer so the two can
// never drift. onNavigate lets the drawer close itself on link tap.
function NavList({
  pathname,
  onNavigate,
}: {
  pathname: string
  onNavigate?: () => void
}) {
  return (
    <ul className="space-y-1">
      {NAV.map((item) => {
        const active = isActivePath(pathname, item.href)
        const Icon = item.icon
        return (
          <li key={item.name}>
            <Link
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-sidebar-active text-brand'
                  : 'text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground',
              )}
            >
              <Icon size={17} />
              {item.name}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

// Theme-preference row — footer of both the sidebar and the mobile drawer.
function ThemeRow() {
  return (
    <div className="m-3 flex items-center justify-between rounded-lg border border-sidebar-border p-2">
      <span className="pl-1 text-xs font-medium text-sidebar-muted">Theme</span>
      <ThemeToggle className="text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground" />
    </div>
  )
}

// Below lg the sidebar is hidden, so the hamburger opens this slide-over —
// same sidebar tokens and nav, plus the theme row that otherwise lives in the
// hidden sidebar footer.
function MobileNavDrawer({
  pathname,
  onClose,
}: {
  pathname: string
  onClose: () => void
}) {
  useBodyScrollLock()

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal
      aria-label="Navigation"
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden"
      onClick={onClose}
    >
      <div
        className="flex h-full w-72 max-w-[85%] flex-col overflow-hidden rounded-r-2xl border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex h-14 items-center justify-between pl-6 pr-3">
          <span className="text-sm font-bold tracking-[0.18em]">YIIVA</span>
          <button
            aria-label="Close navigation"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-lg text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <X size={18} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          <NavList pathname={pathname} onNavigate={onClose} />
        </nav>
        <ThemeRow />
      </div>
    </div>
  )
}

export function AppShell({
  store,
  children,
}: {
  store: StoreMe
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)
  const [navOpen, setNavOpen] = useState(false)

  // Any navigation closes the drawer (covers back/forward too, not just taps).
  useEffect(() => {
    setNavOpen(false)
  }, [pathname])

  return (
    <div className="flex min-h-screen flex-col bg-background p-3 text-foreground">
      {/* Topbar — full-width panel, joined to the sidebar below (square
          bottom-left corner meets the sidebar's square top; rounded elsewhere) */}
      <header className="sticky top-3 z-10 flex h-14 items-center gap-3 rounded-t-2xl rounded-br-2xl border border-topbar-border bg-topbar px-4 text-topbar-foreground shadow-sm sm:px-6">
        <button
          aria-label="Open navigation"
          onClick={() => setNavOpen(true)}
          className="grid size-9 shrink-0 place-items-center rounded-lg text-topbar-foreground transition-colors hover:bg-topbar-accent lg:hidden"
        >
          <Menu size={18} />
        </button>

        <Link href="/dashboard" className="flex items-center">
          <span className="text-sm font-bold tracking-[0.18em] text-topbar-foreground">
            YIIVA
          </span>
        </Link>

        <button
          className="ml-3 flex h-10 flex-1 items-center gap-2.5 rounded-xl border border-topbar-border bg-background px-3.5 text-sm text-muted-foreground shadow-sm transition-colors hover:border-brand/50 sm:max-w-md"
          title="Search — coming soon"
        >
          <Search size={16} />
          <span className="flex-1 text-left">Search…</span>
          <kbd className="hidden rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline">
            ⌘K
          </kbd>
        </button>

        <div className="ml-auto flex items-center gap-2">
          <button
            className="hidden size-9 cursor-default place-items-center rounded-lg text-topbar-muted/70 sm:grid"
            title="Notifications — coming soon"
          >
            <Bell size={18} />
          </button>

          {/* Brand identity — the merchant's store logo + name */}
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-topbar-accent"
          >
            {/* Logo coin per maya's Avatar variant="logo" convention: contain-fit
                with inner padding on an always-white circle, hairline border,
                never cover-cropped; ink initial fallback. */}
            <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-full border border-black/10 bg-white">
              {store.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={store.logoUrl}
                  alt={store.displayName}
                  className="size-full object-contain p-1"
                />
              ) : (
                <span className="text-xs font-bold text-black">
                  {store.displayName.charAt(0).toUpperCase()}
                </span>
              )}
            </span>
            <span className="hidden max-w-40 truncate text-sm font-medium text-topbar-foreground sm:inline">
              {store.displayName}
            </span>
            <BadgeCheck size={14} className="shrink-0 text-topbar-foreground/80" />
          </Link>

          {user && (
            <span
              className="grid size-9 shrink-0 place-items-center rounded-full bg-black text-xs font-semibold text-white"
              title={`${user.firstName} ${user.lastName}`.trim()}
            >
              {(user.firstName?.charAt(0) || user.email.charAt(0)).toUpperCase()}
            </span>
          )}

          {user && (
            <LogoutButton className="border-topbar-border text-topbar-foreground hover:bg-topbar-accent" />
          )}
        </div>
      </header>

      {navOpen && (
        <MobileNavDrawer pathname={pathname} onClose={() => setNavOpen(false)} />
      )}

      {/* Body row: sidebar joined under the topbar + content */}
      <div className="flex flex-1 gap-3">
        {/* Sidebar — continues seamlessly from the topbar (no gap; the topbar's
            bottom border is the seam). top-[4.25rem] = canvas inset (12px) +
            topbar h-14 (56px). */}
        <aside className="sticky top-[4.25rem] hidden h-[calc(100vh-5rem)] w-64 shrink-0 flex-col overflow-hidden rounded-b-2xl border border-t-0 border-sidebar-border bg-sidebar text-sidebar-foreground shadow-sm lg:flex">
          <nav className="flex-1 overflow-y-auto px-3 py-3">
            <NavList pathname={pathname} />
          </nav>

          {/* Sidebar footer — theme preference */}
          <ThemeRow />
        </aside>

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col">
          <main className="flex-1 px-1 py-3 sm:px-2">{children}</main>
        </div>
      </div>
    </div>
  )
}
