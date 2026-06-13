import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-client'

// GET /stores/:id/orders/:orderId — full merchant order detail.

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; orderId: string }> },
) {
  const { id, orderId } = await params
  const authorization = req.headers.get('Authorization')

  if (!authorization) {
    return NextResponse.json(
      { statusCode: 401, message: 'Authentication required', error: 'Unauthorized' },
      { status: 401 },
    )
  }

  const { status, data } = await backendFetch(`/stores/${id}/orders/${orderId}`, {
    method: 'GET',
    headers: { Authorization: authorization },
  })

  return NextResponse.json(data, { status })
}
