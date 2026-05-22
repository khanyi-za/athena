import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-client'

// POST   /stores/:id/products/:productId/categories/:categoryId — link
// DELETE /stores/:id/products/:productId/categories/:categoryId — unlink
//
// POST is idempotent (returns existing link silently on duplicate).
// DELETE enforces the last-category-on-ACTIVE rule with 409.

type Params = {
  params: Promise<{ id: string; productId: string; categoryId: string }>
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id, productId, categoryId } = await params
  const authorization = req.headers.get('Authorization')

  if (!authorization) {
    return NextResponse.json(
      { statusCode: 401, message: 'Authentication required', error: 'Unauthorized' },
      { status: 401 },
    )
  }

  const { status, data } = await backendFetch(
    `/stores/${id}/products/${productId}/categories/${categoryId}`,
    {
      method: 'POST',
      headers: { Authorization: authorization },
    },
  )

  return NextResponse.json(data, { status })
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id, productId, categoryId } = await params
  const authorization = req.headers.get('Authorization')

  if (!authorization) {
    return NextResponse.json(
      { statusCode: 401, message: 'Authentication required', error: 'Unauthorized' },
      { status: 401 },
    )
  }

  const { status, data } = await backendFetch(
    `/stores/${id}/products/${productId}/categories/${categoryId}`,
    {
      method: 'DELETE',
      headers: { Authorization: authorization },
    },
  )

  return NextResponse.json(data, { status })
}
