'use client'

import type { LucideIcon } from 'lucide-react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from './ui'
import { Sparkline } from './charts'

export function StatCard({
  label,
  value,
  trendPct,
  icon: Icon,
  spark,
  sparkColor,
}: {
  label: string
  value: string
  trendPct: number
  icon: LucideIcon
  spark: { v: number }[]
  sparkColor?: string
}) {
  const up = trendPct >= 0
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <span className="grid size-7 place-items-center rounded-lg bg-brand-subtle text-brand">
            <Icon size={15} />
          </span>
          {label}
        </div>
        <span
          className={cn(
            'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium',
            up ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger',
          )}
        >
          {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {Math.abs(trendPct)}%
        </span>
      </div>

      <p className="mt-3 text-2xl font-semibold tabular-nums text-foreground">{value}</p>

      <div className="mt-2 -mx-1">
        <Sparkline data={spark} color={sparkColor} />
      </div>
    </Card>
  )
}
