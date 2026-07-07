import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-client'

// GET /admin/orders — cross-store admin order list (cursor-paginated; optional
// storeId / status / search / buyerEmail / take / cursor query params). Proxy
// forwards the query string and Authorization verbatim; nuwa enforces ADMIN.

export async function GET(req: NextRequest) {
  const authorization = req.headers.get('Authorization')

  if (!authorization) {
    return NextResponse.json(
      { statusCode: 401, message: 'Authentication required', error: 'Unauthorized' },
      { status: 401 },
    )
  }

  const search = req.nextUrl.search
  const { status, data } = await backendFetch(`/admin/orders${search}`, {
    method: 'GET',
    headers: { Authorization: authorization },
  })

  return NextResponse.json(data, { status })
}
