import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-client'

// POST /admin/orders/:orderId/cancel — admin cancel from any non-terminal
// state (reason required; notes appended for OTHER).

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

  const body = await req.json()
  const { status, data } = await backendFetch(`/admin/orders/${orderId}/cancel`, {
    method: 'POST',
    headers: { Authorization: authorization },
    body: JSON.stringify(body),
  })

  return NextResponse.json(data, { status })
}
