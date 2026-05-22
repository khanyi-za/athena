import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-client'

// GET /stores/admin/pending-go-live — go-live queue (admin only). Response
// includes addresses + _count.products (active-only) per contract.

export async function GET(req: NextRequest) {
  const authorization = req.headers.get('Authorization')

  if (!authorization) {
    return NextResponse.json(
      { statusCode: 401, message: 'Authentication required', error: 'Unauthorized' },
      { status: 401 },
    )
  }

  const search = req.nextUrl.search
  const { status, data } = await backendFetch(
    `/stores/admin/pending-go-live${search}`,
    {
      method: 'GET',
      headers: { Authorization: authorization },
    },
  )

  return NextResponse.json(data, { status })
}
