import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-client'

// DELETE /stores/:id/products/:productId/images/:imageId — remove an image.
// On ACTIVE products the backend enforces the last-image rule and returns 409.

export async function DELETE(
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
    `/stores/${id}/products/${productId}/images/${imageId}`,
    {
      method: 'DELETE',
      headers: { Authorization: authorization },
    },
  )

  return NextResponse.json(data, { status })
}
