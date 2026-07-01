import { useMemo } from 'react'
import type { StoreMe } from '@/lib/schemas/store'

// ============================================================================
// Store analytics contract — the shape the PHALO engine will provide
// (backed by phalo.store_stats_daily / product_stats_daily, surfaced through a
// nuwa endpoint like GET /stores/:id/analytics).
//
// Until Phalo ships, `useStoreAnalytics` returns SAMPLE data (`isSample: true`):
// real KPI *values* (from the already-cached /stores/me) dressed with
// illustrative trend deltas + sparklines + a revenue series, so the dashboard
// can be designed and demoed exactly as it will look once analytics is live.
//
// ▶ PHALO SWAP POINT: replace the body of `useStoreAnalytics` with a real query
//   hook. The `StoreAnalytics` shape below is the contract — keep it identical
//   and NO dashboard UI changes are needed. Set `isSample: false` and the
//   "Sample" badges disappear automatically.
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
  /** True while served from the mock; drives the "Sample" badges. */
  isSample: boolean
  revenue: {
    valueInCents: number
    trendPct: number
    series: RevenueSeriesPoint[]
  }
  orders: MetricTrend
  followers: MetricTrend
  activeProducts: MetricTrend
  rating: MetricTrend
}

// ---------------------------------------------------------------------------
// Sample fixtures (deterministic — no Date/Math.random, so SSR/hydration match).
// ---------------------------------------------------------------------------

const REVENUE_SERIES_RANDS = [
  2100, 2680, 1980, 3120, 4050, 3640, 2890, 3380, 4210, 3960, 5120, 4680, 5340, 6180,
]
const SERIES_LABELS = REVENUE_SERIES_RANDS.map((_, i) => `D${i + 1}`)

const spark = (nums: number[]): MetricPoint[] => nums.map((value) => ({ value }))

const ORDERS_SPARK = spark([12, 15, 11, 18, 22, 19, 17, 21, 24, 20, 27, 25, 29, 34])
const FOLLOWERS_SPARK = spark([1180, 1195, 1204, 1221, 1230, 1238, 1246, 1251, 1259, 1263, 1268, 1274, 1279, 1284])
const PRODUCTS_SPARK = spark([9, 10, 10, 11, 12, 12, 13, 13, 14, 14, 15, 16, 16, 17])
const RATING_SPARK = spark([46, 46, 47, 47, 47, 48, 48, 47, 48, 48, 48, 49, 48, 48])

/**
 * SAMPLE store analytics. `store` supplies the real KPI values; the trends,
 * sparklines, and revenue series are illustrative until Phalo is wired.
 */
export function useStoreAnalytics(store?: StoreMe | null): StoreAnalytics {
  return useMemo(() => {
    const revenueInCents = REVENUE_SERIES_RANDS.reduce((sum, r) => sum + r, 0) * 100
    return {
      isSample: true,
      revenue: {
        valueInCents: revenueInCents,
        trendPct: 12.4,
        series: REVENUE_SERIES_RANDS.map((valueInRands, i) => ({
          label: SERIES_LABELS[i],
          valueInRands,
        })),
      },
      orders: { trendPct: 8.1, spark: ORDERS_SPARK },
      followers: { trendPct: 3.2, spark: FOLLOWERS_SPARK },
      activeProducts: { trendPct: 5.6, spark: PRODUCTS_SPARK },
      rating: { trendPct: -0.3, spark: RATING_SPARK },
    }
    // store?.id is the key the real (Phalo) query will depend on — kept now so
    // wiring the live hook is a drop-in with no dependency churn. The sample
    // itself is static, hence the disable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store?.id])
}
