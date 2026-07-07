'use client'

import Link from 'next/link'
import { AlertTriangle, PackageCheck } from 'lucide-react'

import { useLowStock } from '@/hooks/use-low-stock'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

// Low-stock alert card for the Overview. Variant-aware + reservation-aware
// (items in buyers' carts already count as gone). Rows deep-link into the
// product editor. Quiet by design when everything is healthy.

const MAX_ROWS = 5

export function LowStockCard({ storeId }: { storeId: string }) {
  const lowStockQuery = useLowStock(storeId)

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="inline-flex items-center gap-2">
            Stock alerts
            {(lowStockQuery.data?.count ?? 0) > 0 && (
              <Badge tone="warning">{lowStockQuery.data!.count}</Badge>
            )}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {lowStockQuery.isPending ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : lowStockQuery.isError ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Couldn&apos;t check stock levels.
          </p>
        ) : lowStockQuery.data.count === 0 ? (
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <span className="grid size-10 place-items-center rounded-xl bg-success/10 text-success">
              <PackageCheck size={18} />
            </span>
            <p className="text-sm text-muted-foreground">All stock levels healthy.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {lowStockQuery.data.items.slice(0, MAX_ROWS).map((item) => (
              <Link
                key={item.productId}
                href={`/dashboard/products/${item.productId}`}
                className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-accent"
              >
                <span
                  className={
                    item.availableStock === 0
                      ? 'grid size-8 shrink-0 place-items-center rounded-lg bg-danger/10 text-danger'
                      : 'grid size-8 shrink-0 place-items-center rounded-lg bg-warning/15 text-warning'
                  }
                >
                  <AlertTriangle size={14} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">
                    {item.title}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {item.hasVariants
                      ? `${item.lowVariants.length} size${item.lowVariants.length === 1 ? '' : 's'} low (${item.lowVariants
                          .slice(0, 3)
                          .map((v) => `${v.name}: ${v.availableStock}`)
                          .join(', ')})`
                      : item.availableStock === 0
                        ? 'Sold out'
                        : `${item.availableStock} left`}
                  </span>
                </span>
              </Link>
            ))}
            {lowStockQuery.data.count > MAX_ROWS && (
              <p className="px-2 pt-1 text-xs text-muted-foreground">
                +{lowStockQuery.data.count - MAX_ROWS} more low-stock item
                {lowStockQuery.data.count - MAX_ROWS === 1 ? '' : 's'}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
