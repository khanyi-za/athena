import type { OrderStatus } from '@/lib/schemas/order'
import type { BadgeTone } from '@/components/ui/badge'

// SINGLE SOURCE OF TRUTH for order-status label + badge tone (YIIVA redesign).
// Replaces the two divergent maps the audit found (orders/page.tsx STATUS_CONFIG
// vs active-store.tsx ORDER_STATUS_CHIP). Every screen imports this.

export const ORDER_STATUS: Record<OrderStatus, { label: string; tone: BadgeTone }> = {
  PENDING: { label: 'Pending', tone: 'neutral' },
  CONFIRMED: { label: 'Confirmed', tone: 'info' },
  PROCESSING: { label: 'Processing', tone: 'info' },
  READY_FOR_DISPATCH: { label: 'Ready', tone: 'brand' },
  DISPATCHED: { label: 'Dispatched', tone: 'brand' },
  IN_TRANSIT: { label: 'In transit', tone: 'brand' },
  DELIVERED: { label: 'Delivered', tone: 'success' },
  CANCELLED: { label: 'Cancelled', tone: 'danger' },
  REFUND_REQUESTED: { label: 'Refund requested', tone: 'warning' },
  REFUNDED: { label: 'Refunded', tone: 'danger' },
}
