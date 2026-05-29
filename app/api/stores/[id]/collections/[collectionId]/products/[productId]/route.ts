import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-client'

// POST /stores/:id/collections/:collectionId/products/:productId — link a
//   product to a collection. Idempotent: backend returns the existing record
//   on duplicate.
// DELETE /stores/:id/collections/:collectionId/products/:productId — unlink.
//   Backend enforces the "last collection on ACTIVE product" rule with 400.

type Params = {
  params: Promise<{ id: string; collectionId: string; productId: string }>
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id, collectionId, productId } = await params
  const authorization = req.headers.get('Authorization')

  if (!authorization) {
    return NextResponse.json(
      { statusCode: 401, message: 'Authentication required', error: 'Unauthorized' },
      { status: 401 },
    )
  }

  const { status, data } = await backendFetch(
    `/stores/${id}/collections/${collectionId}/products/${productId}`,
    {
      method: 'POST',
      headers: { Authorization: authorization },
    },
  )

  return NextResponse.json(data, { status })
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id, collectionId, productId } = await params
  const authorization = req.headers.get('Authorization')

  if (!authorization) {
    return NextResponse.json(
      { statusCode: 401, message: 'Authentication required', error: 'Unauthorized' },
      { status: 401 },
    )
  }

  const { status, data } = await backendFetch(
    `/stores/${id}/collections/${collectionId}/products/${productId}`,
    {
      method: 'DELETE',
      headers: { Authorization: authorization },
    },
  )

  return NextResponse.json(data, { status })
}
