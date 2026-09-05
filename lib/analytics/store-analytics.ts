'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

import { getStoreAnalytics } from '@/lib/api/analytics'
import type { StoreAnalyticsResponse } from '@/lib/schemas/store-analytics'
import type { StoreMe } from '@/lib/schemas/store'

// ============================================================================
// Store analytics — LIVE (2026-07). The former "▶ PHALO SWAP POINT" swap has
// happened: `useStoreAnalytics` now queries nuwa's live-computed
// GET /stores/:id/analytics (revenue/orders from Order rows over a 14-day
// window; followers/products/rating snapshots with flat sparks until history
// accumulates). When Phalo Phase 3 ships store_stats_daily, only nuwa's
// internals change — the wire shape and this hook stay put.
//
// The `StoreAnalytics` shape below is unchanged from the sample era, so no
// dashboard UI changed in the swap. While the query is loading (or if the
// endpoint errors, e.g. against an older backend) the hook falls back to the
// deterministic sample with `isSample: true` — the "Sample" badges reappear
// rather than the dashboard breaking.
// ============================================================================

export interface MetricPoint {
  value: number
}

export interface MetricTrend {
  /** Period-over-period % change. */
  trendPct: number
  /** Recent series for the sparkline (oldest → newest). */
  spark: MetricPoint[]
}

export interface RevenueSeriesPoint {
  label: string
  valueInRands: number
}

export interface StoreAnalytics {
  /** True while served from the fallback sample; drives the "Sample" badges. */
  isSample: boolean
  revenue: {
    valueInCents: number
    trendPct: number
    series: RevenueSeriesPoint[]
  }
  orders: MetricTrend & { count: number }
  followers: MetricTrend
  activeProducts: MetricTrend
  rating: MetricTrend
  topProducts: {
    productId: string
    title: string
    imageUrl: string | null
    unitsSold: number
    revenueInCents: number
  }[]
}

// ---------------------------------------------------------------------------
// Live hook
// ---------------------------------------------------------------------------

export function useStoreAnalytics(store?: StoreMe | null): StoreAnalytics {
  const query = useQuery({
    queryKey: ['store-analytics', store?.id],
    queryFn: () => getStoreAnalytics(store!.id),
    enabled: !!store?.id,
    staleTime: 60 * 1000,
  })

  return useMemo(
    () => (query.data ? mapResponse(query.data) : SAMPLE_ANALYTICS),
    [query.data],
  )
}

function mapResponse(data: StoreAnalyticsResponse): StoreAnalytics {
  return {
    isSample: false,
    revenue: {
      valueInCents: data.revenue.valueInCents,
      trendPct: data.revenue.trendPct,
      series: data.revenue.series.map((p) => ({
        label: dayLabel(p.date),
        valueInRands: p.valueInCents / 100,
      })),
    },
    orders: { ...toTrend(data.orders), count: data.orders.count },
    followers: toTrend(data.followers),
    activeProducts: toTrend(data.activeProducts),
    rating: { trendPct: data.rating.trendPct, spark: spark(data.rating.spark) },
    topProducts: data.topProducts,
  }
}

function toTrend(block: { trendPct: number; spark: number[] }): MetricTrend {
  return { trendPct: block.trendPct, spark: spark(block.spark) }
}

function spark(nums: number[]): MetricPoint[] {
  return nums.map((value) => ({ value }))
}

/** "2026-07-06" → "6 Jul" (UTC-pinned so SSR and client render identically). */
function dayLabel(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00Z`)
  return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', timeZone: 'UTC' })
}

// ---------------------------------------------------------------------------
// Fallback sample (deterministic — no Date/Math.random, so SSR/hydration match).
// Served while loading and when the analytics endpoint is unavailable.
// ---------------------------------------------------------------------------

const REVENUE_SERIES_RANDS = [
  2100, 2680, 1980, 3120, 4050, 3640, 2890, 3380, 4210, 3960, 5120, 4680, 5340, 6180,
]

const ORDERS_SPARK = spark([12, 15, 11, 18, 22, 19, 17, 21, 24, 20, 27, 25, 29, 34])
const FOLLOWERS_SPARK = spark([1180, 1195, 1204, 1221, 1230, 1238, 1246, 1251, 1259, 1263, 1268, 1274, 1279, 1284])
const PRODUCTS_SPARK = spark([9, 10, 10, 11, 12, 12, 13, 13, 14, 14, 15, 16, 16, 17])
const RATING_SPARK = spark([46, 46, 47, 47, 47, 48, 48, 47, 48, 48, 48, 49, 48, 48])

const SAMPLE_ANALYTICS: StoreAnalytics = {
  isSample: true,
  revenue: {
    valueInCents: REVENUE_SERIES_RANDS.reduce((sum, r) => sum + r, 0) * 100,
    trendPct: 12.4,
    series: REVENUE_SERIES_RANDS.map((valueInRands, i) => ({
      label: `D${i + 1}`,
      valueInRands,
    })),
  },
  orders: { trendPct: 8.1, spark: ORDERS_SPARK, count: 294 },
  followers: { trendPct: 3.2, spark: FOLLOWERS_SPARK },
  activeProducts: { trendPct: 5.6, spark: PRODUCTS_SPARK },
  rating: { trendPct: -0.3, spark: RATING_SPARK },
  topProducts: [],
}
