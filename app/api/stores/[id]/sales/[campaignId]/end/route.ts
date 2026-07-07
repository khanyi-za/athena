import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-client'

// POST /stores/:id/sales/:campaignId/end — end now; nuwa restores original
// prices (hand-edited prices are left alone).

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; campaignId: string }> },
) {
  const { id, campaignId } = await params
  const authorization = req.headers.get('Authorization')

  if (!authorization) {
    return NextResponse.json(
      { statusCode: 401, message: 'Authentication required', error: 'Unauthorized' },
      { status: 401 },
    )
  }

  const { status, data } = await backendFetch(
    `/stores/${id}/sales/${campaignId}/end`,
    {
      method: 'POST',
      headers: { Authorization: authorization },
    },
  )

  return NextResponse.json(data, { status })
}
