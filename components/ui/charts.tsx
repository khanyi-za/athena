'use client'

// Shared Recharts primitives (YIIVA redesign). Series colors come from the token
// vars (--chart-1 = YIIVA Violet), so charts are theme-aware. Used by the
// dashboard Overview; ready for the Phalo-backed analytics screens.

import {
  Area,
  AreaChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatZAR } from '@/lib/format-money'

/* Tiny inline sparkline for stat cards (no axes, no grid). */
export function Sparkline({
  data,
  color = 'var(--chart-1)',
}: {
  data: { value: number }[]
  color?: string
}) {
  return (
    <ResponsiveContainer width="100%" height={40}>
      <LineChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

/* Revenue hero area chart with gradient fill + themed tooltip. */
export function RevenueChart({
  data,
  color = 'var(--chart-1)',
}: {
  data: { label: string; valueInRands: number }[]
  color?: string
}) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
        <defs>
          <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
          tickLine={false}
          axisLine={false}
          interval={2}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
          tickLine={false}
          axisLine={false}
          width={44}
          tickFormatter={(v: number) => `R${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip
          cursor={{ stroke: 'var(--border)' }}
          contentStyle={{
            background: 'var(--popover)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            fontSize: 12,
            color: 'var(--popover-foreground)',
          }}
          labelStyle={{ color: 'var(--muted-foreground)' }}
          formatter={(v) => [formatZAR(Number(v) * 100), 'Revenue']}
        />
        <Area
          type="monotone"
          dataKey="valueInRands"
          stroke={color}
          strokeWidth={2}
          fill="url(#revFill)"
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
