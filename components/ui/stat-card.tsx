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
  compact,
  iconClassName,
}: {
  label: string
  value: string
  hint?: string
  icon: LucideIcon
  trend?: { pct: number }
  spark?: { value: number }[]
  sparkColor?: string
  /** Tighter padding + smaller value type for dense KPI rows. */
  compact?: boolean
  /** Overrides the icon chip's color classes (default: brand violet). */
  iconClassName?: string
}) {
  const up = trend ? trend.pct >= 0 : false
  return (
    <Card className={compact ? 'p-3' : 'p-5'}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <span
            className={cn(
              'grid place-items-center rounded-lg',
              compact ? 'size-6' : 'size-7',
              iconClassName ?? 'bg-brand-subtle text-brand',
            )}
          >
            <Icon size={compact ? 13 : 15} />
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

      <p
        className={cn(
          'font-semibold tabular-nums text-foreground',
          compact ? 'mt-1.5 text-lg' : 'mt-3 text-2xl',
        )}
      >
        {value}
      </p>

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
