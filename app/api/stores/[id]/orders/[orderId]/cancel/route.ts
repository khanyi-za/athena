import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-client'

// POST /stores/:id/orders/:orderId/cancel — merchant cancel (CONFIRMED or
// PROCESSING; reason required).

export async function POST(
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

  const body = await req.json()
  const { status, data } = await backendFetch(`/stores/${id}/orders/${orderId}/cancel`, {
    method: 'POST',
    headers: { Authorization: authorization },
    body: JSON.stringify(body),
  })

  return NextResponse.json(data, { status })
}
