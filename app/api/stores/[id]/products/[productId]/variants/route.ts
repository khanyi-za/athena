import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-client'

// POST /stores/:id/products/:productId/variants — create a variant. nuwa
// enforces canManageStore + store-status (APPROVED/PENDING_GO_LIVE/ACTIVE)
// and rejects archived products with 409.

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; productId: string }> },
) {
  const { id, productId } = await params
  const authorization = req.headers.get('Authorization')

  if (!authorization) {
    return NextResponse.json(
      { statusCode: 401, message: 'Authentication required', error: 'Unauthorized' },
      { status: 401 },
    )
  }

  const body = await req.json()
  const { status, data } = await backendFetch(
    `/stores/${id}/products/${productId}/variants`,
    {
      method: 'POST',
      headers: { Authorization: authorization },
      body: JSON.stringify(body),
    },
  )

  return NextResponse.json(data, { status })
}
