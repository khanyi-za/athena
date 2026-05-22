import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-client'

// POST /stores/:id/products/:productId/activate — DRAFT/OUT_OF_STOCK → ACTIVE.
// On 400, `message` is an array of strings (multi-error format).

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

  const { status, data } = await backendFetch(
    `/stores/${id}/products/${productId}/activate`,
    {
      method: 'POST',
      headers: { Authorization: authorization },
    },
  )

  return NextResponse.json(data, { status })
}
