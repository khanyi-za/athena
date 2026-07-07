import { z } from 'zod'

// Wire shape of nuwa GET /stores/:storeId/analytics (live-computed v1).
// When Phalo Phase 3 lands, nuwa swaps its internals to phalo.store_stats_daily
// behind the SAME shape — this schema is the contract lock on our side.

const metricBlockSchema = z.object({
  count: z.coerce.number(),
  trendPct: z.coerce.number(),
  spark: z.array(z.coerce.number()),
})

export const storeAnalyticsResponseSchema = z.object({
  window: z.object({
    days: z.coerce.number(),
    from: z.string(),
    to: z.string(),
  }),
  revenue: z.object({
    valueInCents: z.coerce.number(),
    trendPct: z.coerce.number(),
    series: z.array(
      z.object({
        date: z.string(),
        valueInCents: z.coerce.number(),
      }),
    ),
  }),
  orders: metricBlockSchema,
  followers: metricBlockSchema,
  activeProducts: metricBlockSchema,
  rating: z.object({
    value: z.coerce.number(),
    trendPct: z.coerce.number(),
    spark: z.array(z.coerce.number()),
  }),
})

export type StoreAnalyticsResponse = z.infer<typeof storeAnalyticsResponseSchema>
