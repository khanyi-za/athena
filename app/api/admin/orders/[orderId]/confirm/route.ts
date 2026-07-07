import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-client'

// POST /admin/orders/:orderId/confirm — force-confirm a PENDING order after
// manual payment verification.

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params
  const authorization = req.headers.get('Authorization')

  if (!authorization) {
    return NextResponse.json(
      { statusCode: 401, message: 'Authentication required', error: 'Unauthorized' },
      { status: 401 },
    )
  }

  const { status, data } = await backendFetch(`/admin/orders/${orderId}/confirm`, {
    method: 'POST',
    headers: { Authorization: authorization },
  })

  return NextResponse.json(data, { status })
}
