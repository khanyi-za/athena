import { NextRequest, NextResponse } from 'next/server'
import { backendFetch } from '@/lib/backend-client'

// PATCH — mark the conversation read for the merchant side.

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; conversationId: string }> },
) {
  const { id, conversationId } = await params
  const authorization = req.headers.get('Authorization')

  if (!authorization) {
    return NextResponse.json(
      { statusCode: 401, message: 'Authentication required', error: 'Unauthorized' },
      { status: 401 },
    )
  }

  const { status, data } = await backendFetch(
    `/stores/${id}/conversations/${conversationId}/read`,
    { method: 'PATCH', headers: { Authorization: authorization } },
  )

  return NextResponse.json(data, { status })
}
