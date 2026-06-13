import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-client'

// GET /stores/:id/orders — merchant order list (cursor-paginated; optional
// status / search / take / cursor query params). Proxy forwards the query
// string and Authorization verbatim.

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

  const search = req.nextUrl.search
  const { status, data } = await backendFetch(`/stores/${id}/orders${search}`, {
    method: 'GET',
    headers: { Authorization: authorization },
  })

  return NextResponse.json(data, { status })
}
