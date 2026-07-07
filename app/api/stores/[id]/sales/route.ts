import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-client'

// GET  /stores/:id/sales — list sale campaigns.
// POST /stores/:id/sales — create + apply a campaign (discounts live prices).

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const authorization = req.headers.get('Authorization')

  if (!authorization) {
    return NextResponse.json(
      { statusCode: 401, message: 'Authentication required', error: 'Unauthorized' },
      { status: 401 },
    )
  }

  const { status, data } = await backendFetch(`/stores/${id}/sales`, {
    method: 'GET',
    headers: { Authorization: authorization },
  })

  return NextResponse.json(data, { status })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const authorization = req.headers.get('Authorization')

  if (!authorization) {
    return NextResponse.json(
      { statusCode: 401, message: 'Authentication required', error: 'Unauthorized' },
      { status: 401 },
    )
  }

  const body = await req.json()
  const { status, data } = await backendFetch(`/stores/${id}/sales`, {
    method: 'POST',
    headers: { Authorization: authorization },
    body: JSON.stringify(body),
  })

  return NextResponse.json(data, { status })
}
