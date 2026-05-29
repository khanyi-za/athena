import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-client'

// DELETE /stores/:id/banner-media/:mediaId — remove a single item. Backend
// reassigns cover + renumbers sortOrder. Blocks removing the last item when
// the store is PENDING_GO_LIVE or ACTIVE (400).

type Params = { params: Promise<{ id: string; mediaId: string }> }

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id, mediaId } = await params
  const authorization = req.headers.get('Authorization')

  if (!authorization) {
    return NextResponse.json(
      { statusCode: 401, message: 'Authentication required', error: 'Unauthorized' },
      { status: 401 },
    )
  }

  const { status, data } = await backendFetch(
    `/stores/${id}/banner-media/${mediaId}`,
    {
      method: 'DELETE',
      headers: { Authorization: authorization },
    },
  )

  return NextResponse.json(data, { status })
}
