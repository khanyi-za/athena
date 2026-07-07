import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-client'

// PATCH  /stores/:id/products/:productId/variants/:variantId — partial update
//        (priceInCents: null clears the override → variant inherits base price).
// DELETE /stores/:id/products/:productId/variants/:variantId — remove; nuwa
//        renumbers the remaining variants' sortOrder.

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; productId: string; variantId: string }> },
) {
  const { id, productId, variantId } = await params
  const authorization = req.headers.get('Authorization')

  if (!authorization) {
    return NextResponse.json(
      { statusCode: 401, message: 'Authentication required', error: 'Unauthorized' },
      { status: 401 },
    )
  }

  const body = await req.json()
  const { status, data } = await backendFetch(
    `/stores/${id}/products/${productId}/variants/${variantId}`,
    {
      method: 'PATCH',
      headers: { Authorization: authorization },
      body: JSON.stringify(body),
    },
  )

  return NextResponse.json(data, { status })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; productId: string; variantId: string }> },
) {
  const { id, productId, variantId } = await params
  const authorization = req.headers.get('Authorization')

  if (!authorization) {
    return NextResponse.json(
      { statusCode: 401, message: 'Authentication required', error: 'Unauthorized' },
      { status: 401 },
    )
  }

  const { status, data } = await backendFetch(
    `/stores/${id}/products/${productId}/variants/${variantId}`,
    {
      method: 'DELETE',
      headers: { Authorization: authorization },
    },
  )

  return NextResponse.json(data, { status })
}
