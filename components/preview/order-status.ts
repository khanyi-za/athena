// Single source of truth for order-status label + tone (prototype of the
// real lib/order-status.ts). Fixes the audit finding where status colors were
// defined twice, differently (orders/page.tsx vs active-store.tsx).

import type { OrderStatus } from './mock-data'

type Tone = 'neutral' | 'info' | 'brand' | 'success' | 'warning' | 'danger'

export const ORDER_STATUS: Record<OrderStatus, { label: string; tone: Tone }> = {
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
