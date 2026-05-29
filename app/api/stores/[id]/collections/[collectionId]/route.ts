import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-client'

// PATCH /stores/:id/collections/:collectionId — update a collection.
// DELETE /stores/:id/collections/:collectionId — remove the collection
// (products themselves remain; only the grouping is deleted).

type Params = { params: Promise<{ id: string; collectionId: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id, collectionId } = await params
  const authorization = req.headers.get('Authorization')

  if (!authorization) {
    return NextResponse.json(
      { statusCode: 401, message: 'Authentication required', error: 'Unauthorized' },
      { status: 401 },
    )
  }

  const body = await req.json()
  const { status, data } = await backendFetch(
    `/stores/${id}/collections/${collectionId}`,
    {
      method: 'PATCH',
      headers: { Authorization: authorization },
      body: JSON.stringify(body),
    },
  )

  return NextResponse.json(data, { status })
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id, collectionId } = await params
  const authorization = req.headers.get('Authorization')

  if (!authorization) {
    return NextResponse.json(
      { statusCode: 401, message: 'Authentication required', error: 'Unauthorized' },
      { status: 401 },
    )
  }

  const { status, data } = await backendFetch(
    `/stores/${id}/collections/${collectionId}`,
    {
      method: 'DELETE',
      headers: { Authorization: authorization },
    },
  )

  return NextResponse.json(data, { status })
}
