import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-client'

// PATCH /stores/:id/orders/:orderId/status — advance fulfilment status
// (CONFIRMED → PROCESSING → READY_FOR_DISPATCH; backend enforces transitions).

export async function PATCH(
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
  const { status, data } = await backendFetch(`/stores/${id}/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: { Authorization: authorization },
    body: JSON.stringify(body),
  })

  return NextResponse.json(data, { status })
}
