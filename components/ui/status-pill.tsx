import type { StoreStatus } from '@/types/auth'
import { storeStatusLabel } from '@/lib/store-status-labels'
import type { ProductStatus } from '@/lib/schemas/product'

// Color scheme follows docs/Api-frontend-contracts/store-frontend-flows.md and
// product-frontend-flows.md §2 — green for live, amber for review states, blue
// for "approved but not yet live", red for suspension, muted for terminal/closed.

type Tone = 'neutral' | 'amber' | 'blue' | 'green' | 'red' | 'muted'

const STORE_STATUS_TONES: Record<StoreStatus, Tone> = {
  DRAFT: 'neutral',
  PENDING_REVIEW: 'amber',
  APPROVED: 'blue',
  PENDING_GO_LIVE: 'amber',
  ACTIVE: 'green',
  SUSPENDED: 'red',
  CLOSED: 'muted',
}

const TONE_CLASSES: Record<Tone, string> = {
  neutral: 'bg-zinc-100 text-zinc-700',
  amber: 'bg-amber-100 text-amber-800',
  blue: 'bg-blue-100 text-blue-800',
  green: 'bg-emerald-100 text-emerald-800',
  red: 'bg-red-100 text-red-800',
  muted: 'bg-zinc-100 text-zinc-500 italic',
}

interface StatusPillProps {
  status: StoreStatus
  className?: string
}

export function StatusPill({ status, className = '' }: StatusPillProps) {
  const tone = STORE_STATUS_TONES[status]
  const label = storeStatusLabel(status)
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TONE_CLASSES[tone]} ${className}`}
    >
      {label}
    </span>
  )
}

/**
 * Lower-level variant accepting an explicit label + tone. Useful for ad-hoc
 * status displays that don't map to one of the typed pills below.
 */
export function GenericStatusPill({
  label,
  tone,
  className = '',
}: {
  label: string
  tone: Tone
  className?: string
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TONE_CLASSES[tone]} ${className}`}
    >
      {label}
    </span>
  )
}

// Per docs/Api-frontend-contracts/product-frontend-flows.md §2 — colour mapping
// for product statuses. ACTIVE green; OUT_OF_STOCK amber/yellow; DRAFT neutral;
// ARCHIVED muted/italic.

const PRODUCT_STATUS_TONES: Record<ProductStatus, Tone> = {
  DRAFT: 'neutral',
  ACTIVE: 'green',
  OUT_OF_STOCK: 'amber',
  ARCHIVED: 'muted',
}

const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  DRAFT: 'Draft',
  ACTIVE: 'Active',
  OUT_OF_STOCK: 'Out of stock',
  ARCHIVED: 'Archived',
}

export function ProductStatusPill({
  status,
  className = '',
}: {
  status: ProductStatus
  className?: string
}) {
  return (
    <GenericStatusPill
      label={PRODUCT_STATUS_LABELS[status]}
      tone={PRODUCT_STATUS_TONES[status]}
      className={className}
    />
  )
}
