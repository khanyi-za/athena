import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-client'

// PATCH /stores/:id/products/:productId/images/:imageId/primary — set primary.
// Backend automatically demotes the previously primary image.

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; productId: string; imageId: string }> },
) {
  const { id, productId, imageId } = await params
  const authorization = req.headers.get('Authorization')

  if (!authorization) {
    return NextResponse.json(
      { statusCode: 401, message: 'Authentication required', error: 'Unauthorized' },
      { status: 401 },
    )
  }

  const { status, data } = await backendFetch(
    `/stores/${id}/products/${productId}/images/${imageId}/primary`,
    {
      method: 'PATCH',
      headers: { Authorization: authorization },
    },
  )

  return NextResponse.json(data, { status })
}
