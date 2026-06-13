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
  Camera,
  MessageCircle,
} from 'lucide-react'

import { useAuthStore } from '@/store/auth-store'
import { LogoutButton } from '@/components/logout-button'
import type { StoreMe } from '@/lib/schemas/store'

// The merchant operating shell for ACTIVE stores — ported from
// dashboard-legacy/layout.tsx (the design target), adapted to real data:
// the header shows the signed-in user's actual store (no mock merchant
// switcher) and keeps logout reachable. Nav points at the real /dashboard
// routes; screens are wired phase-by-phase (orders → messages → analytics).

const navigation = [
  {
    name: 'Overview',
    href: '/dashboard',
    icon: BarChart3,
    description: 'Sales metrics and quick stats',
  },
  {
    name: 'Products',
    href: '/dashboard/products',
    icon: Package,
    description: 'Manage your fashion catalog',
  },
  {
    name: 'Collections',
    href: '/dashboard/collections',
    icon: Layers,
    description: 'Curate product collections',
  },
  {
    name: 'Orders',
    href: '/dashboard/orders',
    icon: ShoppingCart,
    description: 'Process and fulfill orders',
  },
  {
    name: 'Messages',
    href: '/dashboard/messages',
    icon: Mail,
    description: 'Customer communications',
  },
  {
    name: 'Analytics',
    href: '/dashboard/analytics',
    icon: TrendingUp,
    description: 'Performance insights',
  },
  {
    name: 'Team',
    href: '/dashboard/team',
    icon: Users,
    description: 'Employees and invites',
  },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    description: 'Business and account settings',
  },
]

export function LegacyDashboardShell({
  store,
  children,
}: {
  store: StoreMe
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center">
                <img src="/ICON_BLACK.png" alt="Yiiva" className="h-8 w-auto" />
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <button
                className="p-2 text-gray-400 cursor-default"
                title="Notifications — coming soon"
              >
                <Bell size={20} />
              </button>

              {/* Store identity */}
              <Link
                href="/dashboard/settings"
                className="flex items-center space-x-3 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:border-black transition-colors"
              >
                {store.logoUrl ? (
                  <img
                    src={store.logoUrl}
                    alt={store.displayName}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-600">
                    {store.displayName.charAt(0).toUpperCase()}
                  </span>
                )}
                <div className="text-left">
                  <div className="flex items-center space-x-1">
                    <span className="text-sm font-semibold text-gray-900">
                      {store.displayName}
                    </span>
                    <svg
                      className="w-4 h-4 text-blue-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              </Link>

              {user && (
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600">{user.firstName}</span>
                  <LogoutButton />
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex overflow-hidden">
        {/* Sidebar */}
        <nav className="w-64 bg-white shadow-sm min-h-screen border-r border-gray-200 flex-shrink-0">
          <div className="px-3 py-6">
            <ul className="space-y-1">
              {navigation.map((item) => {
                const isActive =
                  item.href === '/dashboard'
                    ? pathname === '/dashboard'
                    : pathname === item.href || pathname.startsWith(item.href + '/')
                const IconComponent = item.icon

                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        isActive
                          ? 'bg-black text-white'
                          : 'text-gray-700 hover:text-black hover:bg-gray-50'
                      }`}
                    >
                      <IconComponent size={18} className="mr-3" />
                      <div className="flex-1">
                        <div>{item.name}</div>
                        <div
                          className={`text-xs ${isActive ? 'text-gray-300' : 'text-gray-500'} group-hover:text-gray-600`}
                        >
                          {item.description}
                        </div>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Quick Actions */}
          <div className="px-3 py-6 border-t border-gray-200">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <Link
                href="/dashboard/products"
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-black rounded-lg flex items-center transition-colors"
              >
                <Plus size={16} className="mr-2" />
                Add Product
              </Link>
              <button
                className="w-full text-left px-3 py-2 text-sm text-gray-400 rounded-lg flex items-center cursor-default"
                title="Coming soon"
              >
                <Camera size={16} className="mr-2" />
                Import from Instagram
                <span className="ml-auto text-[10px] uppercase tracking-wide">soon</span>
              </button>
              <button
                className="w-full text-left px-3 py-2 text-sm text-gray-400 rounded-lg flex items-center cursor-default"
                title="Coming soon"
              >
                <MessageCircle size={16} className="mr-2" />
                Customer Support
                <span className="ml-auto text-[10px] uppercase tracking-wide">soon</span>
              </button>
            </div>
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-full">{children}</div>
        </main>
      </div>
    </div>
  )
}
