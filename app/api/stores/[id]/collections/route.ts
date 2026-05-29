import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-client'

// GET /stores/:id/collections — list the store's collections (with
//   _count.products). Auth required.
// POST /stores/:id/collections — create a merchant collection. Auth required.

type Params = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params
  const authorization = req.headers.get('Authorization')

  if (!authorization) {
    return NextResponse.json(
      { statusCode: 401, message: 'Authentication required', error: 'Unauthorized' },
      { status: 401 },
    )
  }

  const { status, data } = await backendFetch(`/stores/${id}/collections`, {
    method: 'GET',
    headers: { Authorization: authorization },
  })

  return NextResponse.json(data, { status })
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params
  const authorization = req.headers.get('Authorization')

  if (!authorization) {
    return NextResponse.json(
      { statusCode: 401, message: 'Authentication required', error: 'Unauthorized' },
      { status: 401 },
    )
  }

  const body = await req.json()
  const { status, data } = await backendFetch(`/stores/${id}/collections`, {
    method: 'POST',
    headers: { Authorization: authorization },
    body: JSON.stringify(body),
  })

  return NextResponse.json(data, { status })
}
