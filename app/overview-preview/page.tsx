'use client'

// ============================================================================
// DESIGN PROTOTYPE — Dashboard Overview (athena redesign vertical slice).
// Standalone route, mock data, no auth/backend. Nothing here is wired to a live
// screen; it exists to preview the shadcn/ui + YIIVA-token target aesthetic.
// See docs/athena-redesign/. Revert = delete app/overview-preview + components/preview.
// ============================================================================

import {
  Package,
  Plus,
  ShoppingBag,
  Star,
  TrendingUp,
  Users,
  FolderTree,
  MapPin,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import { formatZAR } from '@/lib/format-money'
import { Shell } from '@/components/preview/shell'
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/preview/ui'
import { StatCard } from '@/components/preview/stat-card'
import { RevenueChart } from '@/components/preview/charts'
import { RecentOrders } from '@/components/preview/recent-orders'
import {
  mockOrders,
  revenueSeries,
  ordersSpark,
  followersSpark,
  ratingSpark,
  stats,
} from '@/components/preview/mock-data'

export default function OverviewPreviewPage() {
  return (
    <Shell>
      <div className="mx-auto max-w-6xl space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                  Good morning, Khanyi
                </h1>
                <Badge tone="brand">Prototype</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Here&apos;s what&apos;s happening with SAKANYA today.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="default">
                <Package size={16} /> Manage products
              </Button>
              <Button variant="brand" size="default">
                <Plus size={16} /> Add product
              </Button>
            </div>
          </div>

          {/* Stat grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Revenue"
              value={formatZAR(stats.revenueInCents)}
              trendPct={stats.revenueTrendPct}
              icon={TrendingUp}
              spark={revenueSeries.map((r) => ({ v: r.v }))}
            />
            <StatCard
              label="Orders"
              value={stats.orders.toLocaleString('en-ZA')}
              trendPct={stats.ordersTrendPct}
              icon={ShoppingBag}
              spark={ordersSpark}
              sparkColor="var(--chart-2)"
            />
            <StatCard
              label="Followers"
              value={stats.followers.toLocaleString('en-ZA')}
              trendPct={stats.followersTrendPct}
              icon={Users}
              spark={followersSpark}
              sparkColor="var(--chart-3)"
            />
            <StatCard
              label="Avg rating"
              value={stats.rating.toFixed(1)}
              trendPct={stats.ratingTrendPct}
              icon={Star}
              spark={ratingSpark}
              sparkColor="var(--chart-4)"
            />
          </div>

          {/* Two-column body */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              {/* Revenue hero chart */}
              <Card>
                <CardHeader>
                  <div>
                    <CardTitle>Revenue</CardTitle>
                    <p className="mt-0.5 text-xs text-muted-foreground">Last 14 days</p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                    <TrendingUp size={12} /> +{stats.revenueTrendPct}%
                  </span>
                </CardHeader>
                <CardContent>
                  <RevenueChart data={revenueSeries} />
                </CardContent>
              </Card>

              <RecentOrders orders={mockOrders} />
            </div>

            {/* Right rail */}
            <div className="space-y-6">
              {/* Quick actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick actions</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2 pt-2">
                  {[
                    { icon: FolderTree, title: 'Curate collections', sub: 'Group products into stories' },
                    { icon: Users, title: 'Manage team', sub: 'Invite people to help run the store' },
                    { icon: MapPin, title: 'Locations', sub: 'Where your brand is based' },
                  ].map((a) => (
                    <button
                      key={a.title}
                      className="group flex items-center gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:border-brand hover:bg-brand-subtle"
                    >
                      <span className="grid size-9 place-items-center rounded-lg bg-brand-subtle text-brand transition-colors group-hover:bg-brand group-hover:text-brand-foreground">
                        <a.icon size={17} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-foreground">{a.title}</span>
                        <span className="block text-xs text-muted-foreground">{a.sub}</span>
                      </span>
                      <ArrowRight size={15} className="text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-brand" />
                    </button>
                  ))}
                </CardContent>
              </Card>

              {/* Top products — Phalo placeholder, restyled */}
              <Card>
                <CardHeader>
                  <CardTitle>Top products</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center gap-3 py-6 text-center">
                    <span className="grid size-11 place-items-center rounded-xl bg-brand-subtle text-brand">
                      <Sparkles size={20} />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-foreground">Insights are on the way</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Product performance rankings arrive with the analytics engine.
                      </p>
                    </div>
                    <Badge tone="neutral">Coming soon</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <p className="pt-2 text-center text-xs text-muted-foreground">
            Design prototype · mock data · <span className="font-mono">/overview-preview</span>
          </p>
      </div>
    </Shell>
  )
}
