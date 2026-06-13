import { NextRequest, NextResponse } from 'next/server'
import { API_URL } from '@/lib/server-config'

// GET /stores/:id/orders/:orderId/shipping-label — waybill PDF passthrough.
// Binary response, so this proxy streams instead of using backendFetch
// (which JSON-parses).

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

  const upstream = await fetch(`${API_URL}/stores/${id}/orders/${orderId}/shipping-label`, {
    method: 'GET',
    headers: { Authorization: authorization },
  })

  if (!upstream.ok) {
    const data = await upstream.json().catch(() => ({
      statusCode: upstream.status,
      message: 'Label not available',
    }))
    return NextResponse.json(data, { status: upstream.status })
  }

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('Content-Type') ?? 'application/pdf',
      'Content-Disposition':
        upstream.headers.get('Content-Disposition') ??
        `attachment; filename="waybill-${orderId}.pdf"`,
    },
  })
}
