'use client'

// Prototype of the unified app shell (kills the audit's "4 separate layout
// shells" finding). Sidebar + topbar, token-driven, brand-accent active state.
// Nav is visual-only in the prototype.

import * as React from 'react'
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  FolderTree,
  MessageSquare,
  BarChart3,
  Users,
  Settings,
  Search,
  Bell,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from './ui'
import { ThemeToggle } from './theme-toggle'

const NAV = [
  { label: 'Overview', icon: LayoutDashboard, active: true },
  { label: 'Orders', icon: ShoppingBag, badge: '5' },
  { label: 'Products', icon: Package },
  { label: 'Collections', icon: FolderTree },
  { label: 'Messages', icon: MessageSquare, badge: '2' },
  { label: 'Analytics', icon: BarChart3 },
  { label: 'Team', icon: Users },
  { label: 'Settings', icon: Settings },
]

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-[1400px]">
        {/* Sidebar */}
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-card px-3 py-5 lg:flex">
          <div className="flex items-center gap-2 px-2 pb-6">
            <span className="grid size-8 place-items-center rounded-lg bg-brand text-sm font-bold text-brand-foreground">
              Y
            </span>
            <span className="text-sm font-bold tracking-[0.18em] text-foreground">YIIVA</span>
          </div>

          <nav className="flex flex-1 flex-col gap-1">
            {NAV.map((item) => (
              <button
                key={item.label}
                className={cn(
                  'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  item.active
                    ? 'bg-brand-subtle text-brand'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                <item.icon size={17} />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <span
                    className={cn(
                      'rounded-full px-1.5 text-[11px] font-semibold',
                      item.active ? 'bg-brand text-brand-foreground' : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>

          <div className="mt-4 flex items-center gap-2 rounded-lg border border-border p-2">
            <span className="grid size-8 shrink-0 place-items-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
              SK
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-foreground">SAKANYA</p>
              <p className="truncate text-[11px] text-muted-foreground">Active store</p>
            </div>
          </div>
        </aside>

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Topbar */}
          <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur sm:px-6">
            <div className="flex items-center gap-2 lg:hidden">
              <span className="grid size-7 place-items-center rounded-lg bg-brand text-xs font-bold text-brand-foreground">
                Y
              </span>
            </div>

            <button className="flex h-9 flex-1 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm text-muted-foreground transition-colors hover:bg-accent sm:max-w-xs">
              <Search size={15} />
              <span className="flex-1 text-left">Search…</span>
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                ⌘K
              </kbd>
            </button>

            <div className="flex items-center gap-1">
              <button className="relative grid size-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                <Bell size={18} />
                <span className="absolute right-2 top-2 size-2 rounded-full bg-brand ring-2 ring-background" />
              </button>
              <ThemeToggle />
              <span className="ml-1 grid size-9 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                K
              </span>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  )
}

export { Badge }
