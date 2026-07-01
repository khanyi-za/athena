'use client'

import { ArrowRight } from 'lucide-react'
import { formatZAR } from '@/lib/format-money'
import { cn } from '@/lib/utils'
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from './ui'
import { ORDER_STATUS } from './order-status'
import type { MockOrder } from './mock-data'

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function RecentOrders({ orders }: { orders: MockOrder[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent orders</CardTitle>
        <Button variant="ghost" size="sm">
          View all <ArrowRight size={14} />
        </Button>
      </CardHeader>
      <CardContent className="pt-2">
        <ul className="divide-y divide-border">
          {orders.map((order) => {
            const s = ORDER_STATUS[order.status]
            return (
              <li key={order.id} className="flex items-center gap-3 py-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-subtle text-xs font-semibold text-brand">
                  {initials(order.buyerName)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{order.buyerName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {order.orderNumber} · {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-sm font-semibold tabular-nums text-foreground">
                    {formatZAR(order.totalInCents)}
                  </span>
                  <Badge tone={s.tone} dot className={cn('capitalize')}>
                    {s.label}
                  </Badge>
                </div>
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}
