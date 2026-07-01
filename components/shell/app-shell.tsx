'use client'

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
  Plus,
  Search,
  BadgeCheck,
  Camera,
  MessageCircle,
} from 'lucide-react'

import { useAuthStore } from '@/store/auth-store'
import { LogoutButton } from '@/components/logout-button'
import { cn } from '@/lib/utils'
import type { StoreMe } from '@/lib/schemas/store'

// Unified merchant operating shell (YIIVA redesign — replaces LegacyDashboardShell).
// Full-height token-driven sidebar with brand-accent active state + sticky topbar.
// Same data contract as before: real store identity, real nav, LogoutButton
// (which owns the careful cookie-clearing logout). Dark-mode toggle is
// intentionally NOT surfaced yet — unmigrated page bodies still hard-code light
// colors; it ships once screen coverage is complete.

const NAV = [
  { name: 'Overview', href: '/dashboard', icon: BarChart3 },
  { name: 'Products', href: '/dashboard/products', icon: Package },
  { name: 'Collections', href: '/dashboard/collections', icon: Layers },
  { name: 'Orders', href: '/dashboard/orders', icon: ShoppingCart },
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

export function AppShell({
  store,
  children,
}: {
  store: StoreMe
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-card lg:flex">
        <div className="flex items-center gap-2 px-5 py-5">
          <span className="grid size-8 place-items-center rounded-lg bg-brand text-sm font-bold text-brand-foreground">
            Y
          </span>
          <span className="text-sm font-bold tracking-[0.18em] text-foreground">YIIVA</span>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-2">
          <ul className="space-y-1">
            {NAV.map((item) => {
              const active = isActivePath(pathname, item.href)
              const Icon = item.icon
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      active
                        ? 'bg-brand-subtle text-brand'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                    )}
                  >
                    <Icon size={17} />
                    {item.name}
                  </Link>
                </li>
              )
            })}
          </ul>

          {/* Quick actions */}
          <div className="mt-6 border-t border-border pt-4">
            <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Quick actions
            </p>
            <Link
              href="/dashboard/products"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              <Plus size={16} /> Add product
            </Link>
            <span
              className="flex cursor-default items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground/70"
              title="Coming soon"
            >
              <Camera size={16} /> Import from Instagram
              <span className="ml-auto text-[10px] uppercase tracking-wide">soon</span>
            </span>
            <span
              className="flex cursor-default items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground/70"
              title="Coming soon"
            >
              <MessageCircle size={16} /> Support
              <span className="ml-auto text-[10px] uppercase tracking-wide">soon</span>
            </span>
          </div>
        </nav>

        {/* Store identity */}
        <Link
          href="/dashboard/settings"
          className="m-3 flex items-center gap-2 rounded-lg border border-border p-2 transition-colors hover:border-brand hover:bg-brand-subtle"
        >
          {store.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={store.logoUrl}
              alt={store.displayName}
              className="size-8 shrink-0 rounded-md object-cover"
            />
          ) : (
            <span className="grid size-8 shrink-0 place-items-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
              {store.displayName.charAt(0).toUpperCase()}
            </span>
          )}
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1">
              <span className="truncate text-xs font-semibold text-foreground">
                {store.displayName}
              </span>
              <BadgeCheck size={13} className="shrink-0 text-brand" />
            </span>
            <span className="block text-[11px] text-muted-foreground">Active store</span>
          </span>
        </Link>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur sm:px-6">
          {/* Mobile logo (sidebar hidden < lg) */}
          <Link href="/dashboard" className="flex items-center gap-2 lg:hidden">
            <span className="grid size-7 place-items-center rounded-lg bg-brand text-xs font-bold text-brand-foreground">
              Y
            </span>
          </Link>

          <button
            className="flex h-9 flex-1 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm text-muted-foreground transition-colors hover:bg-accent sm:max-w-xs"
            title="Search — coming soon"
          >
            <Search size={15} />
            <span className="flex-1 text-left">Search…</span>
            <kbd className="hidden rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline">
              ⌘K
            </kbd>
          </button>

          <div className="flex items-center gap-1">
            <button
              className="grid size-9 cursor-default place-items-center rounded-lg text-muted-foreground/70"
              title="Notifications — coming soon"
            >
              <Bell size={18} />
            </button>
            {user && (
              <div className="flex items-center gap-2 pl-1">
                <span className="hidden text-sm text-muted-foreground sm:inline">
                  {user.firstName}
                </span>
                <LogoutButton />
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  )
}
