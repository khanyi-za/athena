import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-client'

// PATCH /stores/:id/banner-media/reorder — full-gallery reorder. The ids
// array must contain the exact set of current item ids in the desired order.
// Index 0 becomes the cover (isPrimary: true). Backend rejects miscounts,
// duplicates, or unknown ids with 400.

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
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
    `/stores/${id}/banner-media/reorder`,
    {
      method: 'PATCH',
      headers: { Authorization: authorization },
      body: JSON.stringify(body),
    },
  )

  return NextResponse.json(data, { status })
}
