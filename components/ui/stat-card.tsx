'use client'

import type { LucideIcon } from 'lucide-react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from './card'
import { Sparkline } from './charts'

// KPI stat card (YIIVA redesign). `trend` and `spark` are optional — the value
// is always real; trend deltas + sparklines come from the analytics contract
// (sample until Phalo is live). Falls back to `hint` text when no sparkline.

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  trend,
  spark,
  sparkColor,
}: {
  label: string
  value: string
  hint?: string
  icon: LucideIcon
  trend?: { pct: number }
  spark?: { value: number }[]
  sparkColor?: string
}) {
  const up = trend ? trend.pct >= 0 : false
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <span className="grid size-7 place-items-center rounded-lg bg-brand-subtle text-brand">
            <Icon size={15} />
          </span>
          {label}
        </div>
        {trend && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium',
              up ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger',
            )}
          >
            {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(trend.pct)}%
          </span>
        )}
      </div>

      <p className="mt-3 text-2xl font-semibold tabular-nums text-foreground">{value}</p>

      {spark ? (
        <div className="mt-2 -mx-1">
          <Sparkline data={spark} color={sparkColor} />
        </div>
      ) : (
        hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      )}
    </Card>
  )
}
