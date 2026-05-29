import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-client'

// POST /stores/:id/banner-media — add a media item to the store's banner
// gallery. Auth required (store owner or active accepted employee per backend).

type Params = { params: Promise<{ id: string }> }

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
  const { status, data } = await backendFetch(
    `/stores/${id}/banner-media`,
    {
      method: 'POST',
      headers: { Authorization: authorization },
      body: JSON.stringify(body),
    },
  )

  return NextResponse.json(data, { status })
}
