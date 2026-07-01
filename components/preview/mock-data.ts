// Mock data for the dashboard-overview design prototype (/overview-preview).
// Shapes mirror the real app (store from /stores/me, orders from the
// merchant-orders proxy) so this slice is close to real wiring. NOT used by any
// live screen. All amounts are integer ZAR cents, matching the backend.

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'READY_FOR_DISPATCH'
  | 'DISPATCHED'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUND_REQUESTED'
  | 'REFUNDED'

export interface MockOrder {
  id: string
  orderNumber: string
  buyerName: string
  itemCount: number
  totalInCents: number
  status: OrderStatus
  placedAt: string
}

export const mockStore = {
  displayName: 'SAKANYA',
  slug: 'sakanya',
  followerCount: 1284,
  averageRating: 4.8,
  _count: { orders: 342, products: 19 },
  activeProducts: 17,
}

export const mockOrders: MockOrder[] = [
  { id: '1', orderNumber: 'YV-2026-W4413', buyerName: 'Khanyi Mthamo', itemCount: 3, totalInCents: 279500, status: 'DELIVERED', placedAt: '2026-06-29T10:12:00Z' },
  { id: '2', orderNumber: 'YV-2026-W4410', buyerName: 'Aphiwe Dube', itemCount: 1, totalInCents: 89900, status: 'IN_TRANSIT', placedAt: '2026-06-29T08:40:00Z' },
  { id: '3', orderNumber: 'YV-2026-W4402', buyerName: 'Sipho Ndlovu', itemCount: 2, totalInCents: 154000, status: 'PROCESSING', placedAt: '2026-06-28T19:05:00Z' },
  { id: '4', orderNumber: 'YV-2026-W4398', buyerName: 'Lerato Molefe', itemCount: 4, totalInCents: 412000, status: 'CONFIRMED', placedAt: '2026-06-28T14:22:00Z' },
  { id: '5', orderNumber: 'YV-2026-W4391', buyerName: 'Thabo Khumalo', itemCount: 1, totalInCents: 64900, status: 'PENDING', placedAt: '2026-06-28T09:15:00Z' },
]

// 14-day series for the revenue hero chart + stat sparklines (rands).
export const revenueSeries = [
  { d: 'Jun 16', v: 2100 }, { d: 'Jun 17', v: 2680 }, { d: 'Jun 18', v: 1980 },
  { d: 'Jun 19', v: 3120 }, { d: 'Jun 20', v: 4050 }, { d: 'Jun 21', v: 3640 },
  { d: 'Jun 22', v: 2890 }, { d: 'Jun 23', v: 3380 }, { d: 'Jun 24', v: 4210 },
  { d: 'Jun 25', v: 3960 }, { d: 'Jun 26', v: 5120 }, { d: 'Jun 27', v: 4680 },
  { d: 'Jun 28', v: 5340 }, { d: 'Jun 29', v: 6180 },
]

export const ordersSpark = [12, 15, 11, 18, 22, 19, 17, 21, 24, 20, 27, 25, 29, 34].map((v, i) => ({ i, v }))
export const followersSpark = [1180, 1195, 1204, 1221, 1230, 1238, 1246, 1251, 1259, 1263, 1268, 1274, 1279, 1284].map((v, i) => ({ i, v }))
export const ratingSpark = [4.6, 4.6, 4.7, 4.7, 4.7, 4.8, 4.8, 4.7, 4.8, 4.8, 4.8, 4.9, 4.8, 4.8].map((v, i) => ({ i, v }))

export const stats = {
  revenueInCents: 5_218_000,
  revenueTrendPct: 12.4,
  orders: mockStore._count.orders,
  ordersTrendPct: 8.1,
  followers: mockStore.followerCount,
  followersTrendPct: 3.2,
  rating: mockStore.averageRating,
  ratingTrendPct: -0.3,
}
