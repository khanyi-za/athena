'use client'

import type { ProductStatus } from '@/lib/schemas/product'

// Side-nav action area for the product lifecycle. Status-aware:
//
//   DRAFT          → Delete product (only DRAFTs can be hard-deleted)
//   ACTIVE / OUT_OF_STOCK → Archive product (one-way)
//   ARCHIVED       → nothing (terminal state)
//
// Activation lives in the readiness panel itself, not here.

interface ProductLifecycleActionsProps {
  status: ProductStatus
  onArchive: () => void
  onDelete: () => void
}

export function ProductLifecycleActions({
  status,
  onArchive,
  onDelete,
}: ProductLifecycleActionsProps) {
  if (status === 'ARCHIVED') return null

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Actions</p>
      <div className="mt-3 flex flex-col gap-2">
        {status === 'DRAFT' && (
          <button
            type="button"
            onClick={onDelete}
            className="text-left text-sm font-medium text-danger transition-colors hover:text-danger/80"
          >
            Delete product
          </button>
        )}
        {(status === 'ACTIVE' || status === 'OUT_OF_STOCK') && (
          <button
            type="button"
            onClick={onArchive}
            className="text-left text-sm font-medium text-foreground transition-colors hover:text-foreground"
          >
            Archive product
          </button>
        )}
      </div>
    </div>
  )
}
